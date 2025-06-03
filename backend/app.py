from flask import Flask, request, jsonify
import pdfplumber
import os
import traceback
from pdf2image import convert_from_bytes
import pytesseract
from PIL import Image
from flask_cors import CORS
import re
import difflib

app = Flask(__name__)
CORS(app)

def extract_tables_with_pdfplumber(file):
    tables = []
    with pdfplumber.open(file) as pdf:
        for page_num, page in enumerate(pdf.pages):
            page_tables = page.extract_tables()
            app.logger.info(f'Page {page_num+1}: Found {len(page_tables)} tables')
            for t_idx, table in enumerate(page_tables):
                tables.append(table)
                app.logger.info(f'Table {t_idx+1} (first 3 rows): {table[:3]}')
    return tables

def extract_text_with_ocr(file):
    images = convert_from_bytes(file.read())
    all_lines = []
    for idx, image in enumerate(images):
        text = pytesseract.image_to_string(image)
        app.logger.info(f'OCR Page {idx+1} text (first 300 chars): {text[:300]}')
        lines = text.splitlines()
        all_lines.extend(lines)
    return all_lines

def parse_range(val):
    # Extract numbers from a string like "99 - 124 ppm" and return the midpoint
    nums = re.findall(r'\d+\.?\d*', val)
    if len(nums) == 2:
        return (float(nums[0]) + float(nums[1])) / 2
    elif len(nums) == 1:
        return float(nums[0])
    return None

# List of known nutrient names for matching
KNOWN_NUTRIENTS = [
    'Nitrate', 'Ammonium', 'Phosphorus', 'Potassium', 'Calcium', 'Magnesium', 'Sodium', 'Sulphur',
    'Iron', 'Copper', 'Manganese', 'Boron', 'Zinc', 'Cobalt', 'Molybdenum', 'Silica', 'Aluminium', 'Aluminum',
    'Ca/Mg Ratio', 'Ca/K', 'Mg/K', 'K/Na', 'P/Zn', 'Fe/Mn', 'Organic Matter', 'Organic Carbon', 'Conductivity',
    'Paramagnetism', 'Base Saturation', 'Other Bases', 'Silicon', 'Do (Hot CaCl2)', 'jum (Mehlich II!)', 'ium (Mehlich Ill)'
]

# Expanded custom mapping for common garbled OCR nutrient names
GARBLED_NUTRIENT_MAP = {
    'jum (Mehlich II!)': 'Calcium',
    'ium (Mehlich Ill)': 'Magnesium',  # Also used for Potassium, will handle below
    'Do (Hot CaCl2)': 'Sodium',
    'Silicon (CaCl2)': 'Silicon',
    '(KCl)': 'Potassium',
    # Add more mappings as needed based on OCR output
}

# Ordered list of expected nutrients (update as needed for your report)
ORDERED_NUTRIENTS = [
    'Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Phosphorus', 'Sulphur',
    'Iron', 'Copper', 'Manganese', 'Boron', 'Zinc', 'Cobalt', 'Molybdenum', 'Silica', 'Aluminium',
    # Add more if your report has more nutrients in a fixed order
]

# Nutrient order and mapping based on the provided soil report image
NUTRIENT_IMAGE_ORDER = [
    'Paramagnetism',
    'pH-level (1:5 water)',
    'Organic Matter (Calc)',
    'Organic Carbon (LECO)',
    'Conductivity (1:5 water)',
    'Ca/Mg Ratio',
    'Nitrate-N (KCl)',
    'Ammonium-N (KCl)',
    'Phosphorus (Mehlich III)',
    'Calcium (Mehlich III)',
    'Magnesium (Mehlich III)',
    'Potassium (Mehlich III)',
    'Sodium (Mehlich III)',
    'Sulfur (KCl)',
    'Aluminium',
    'Silicon (CaCl2)',
    'Boron (Hot CaCl2)',
    'Iron (DTPA)',
    'Manganese (DTPA)',
    'Copper (DTPA)',
    'Zinc (DTPA)'
]

@app.route('/extract-soil-report', methods=['POST'])
def extract_soil_report():
    try:
        if 'file' not in request.files:
            app.logger.error('No file uploaded')
            return jsonify({'error': 'No file uploaded'}), 400
        file = request.files['file']
        app.logger.info(f'Received file: {file.filename}')
        file.seek(0)
        tables = extract_tables_with_pdfplumber(file)
        app.logger.info(f'Extracted {len(tables)} tables from PDF')
        for idx, table in enumerate(tables):
            app.logger.info(f'Table {idx+1} content: {table}')
        file.seek(0)
        nutrients = []
        last_name = None

        # Try to extract nutrients from tables (text-based PDF)
        if tables:
            for table in tables:
                if not table or len(table) < 2:
                    continue
                # Find header row and map columns
                header_row = None
                header_idx = 0
                for i, row in enumerate(table):
                    if any(cell and isinstance(cell, str) and cell.strip().lower() in ['name', 'nutrient', 'your level', 'acceptable range', 'ideal level'] for cell in row):
                        header_row = row
                        header_idx = i
                        break
                if header_row:
                    header_map = {}
                    for idx, cell in enumerate(header_row):
                        if not cell:
                            continue
                        cell_l = cell.strip().lower()
                        if 'name' in cell_l or 'nutrient' in cell_l:
                            header_map['name'] = idx
                        elif 'your level' in cell_l or 'current' in cell_l:
                            header_map['current'] = idx
                        elif 'acceptable range' in cell_l or 'ideal level' in cell_l:
                            header_map['ideal'] = idx
                        elif 'unit' in cell_l:
                            header_map['unit'] = idx
                    app.logger.info(f'Detected header row: {header_row}')
                    app.logger.info(f'Header mapping: {header_map}')
                    # Parse data rows
                    for row in table[header_idx+1:]:
                        if not row or len(row) < 2:
                            continue
                        name = row[header_map.get('name', 0)].strip() if header_map.get('name', 0) < len(row) and row[header_map.get('name', 0)] else ''
                        current_raw = row[header_map.get('current', 1)].strip() if header_map.get('current', 1) < len(row) and row[header_map.get('current', 1)] else ''
                        ideal_raw = row[header_map.get('ideal', 2)].strip() if header_map.get('ideal', 2) < len(row) and row[header_map.get('ideal', 2)] else ''
                        unit = row[header_map.get('unit', -1)].strip() if header_map.get('unit', -1) >= 0 and header_map.get('unit', -1) < len(row) and row[header_map.get('unit', -1)] else ''
                        # Try to extract unit from current_raw or ideal_raw if not found
                        if not unit:
                            if 'ppm' in current_raw or 'ppm' in ideal_raw:
                                unit = 'ppm'
                            elif '%' in current_raw or '%' in ideal_raw:
                                unit = '%'
                        def parse_value(val):
                            if isinstance(val, str) and '<' in val:
                                return 0
                            try:
                                return float(val)
                            except Exception:
                                return 0
                        current = parse_value(current_raw)
                        ideal = parse_range(ideal_raw)
                        nutrient_row = {
                            'name': name,
                            'current': current,
                            'ideal': ideal,
                            'unit': unit
                        }
                        app.logger.info(f'Parsed nutrient row: {nutrient_row}')
                        nutrients.append(nutrient_row)
                else:
                    # Fallback: try to extract from all rows with at least 2 columns
                    app.logger.warning('No header row detected, using fallback extraction for this table.')
                    for row in table:
                        if not row or len(row) < 2:
                            continue
                        name = row[0].strip() if row[0] else ''
                        current_raw = row[1].strip() if row[1] else ''
                        ideal_raw = row[2].strip() if len(row) > 2 and row[2] else ''
                        unit = ''
                        if 'ppm' in current_raw or 'ppm' in ideal_raw:
                            unit = 'ppm'
                        elif '%' in current_raw or '%' in ideal_raw:
                            unit = '%'
                        def parse_value(val):
                            if isinstance(val, str) and '<' in val:
                                return 0
                            try:
                                return float(val)
                            except Exception:
                                return 0
                        current = parse_value(current_raw)
                        ideal = parse_range(ideal_raw)
                        nutrient_row = {
                            'name': name,
                            'current': current,
                            'ideal': ideal,
                            'unit': unit
                        }
                        app.logger.info(f'Fallback parsed nutrient row: {nutrient_row}')
                        nutrients.append(nutrient_row)
            if nutrients:
                app.logger.info(f'Final nutrients array: {nutrients}')
                return jsonify({'nutrients': nutrients})

        # If no tables found, try OCR
        app.logger.warning('No tables found with pdfplumber, trying OCR...')
        file.seek(0)
        ocr_lines = extract_text_with_ocr(file)
        app.logger.info("Original OCR lines for debug:\n" + "\n".join(ocr_lines))

        # Find the start marker for the nutrient table
        start_idx = 0
        for i, line in enumerate(ocr_lines):
            if 'albrecht your acceptable' in line.lower():
                start_idx = i + 1
                break
        # Extract nutrients in the exact order from the image
        nutrients_by_image_order = []
        for nutrient in NUTRIENT_IMAGE_ORDER:
            for line in ocr_lines[start_idx:]:
                if nutrient.lower() in line.lower():
                    # Extract value (first number after nutrient name)
                    value_match = re.search(r'([<]?\d+\.?\d*)\s*(ppm|%|mg/kg|mS/cm)?', line)
                    value = None
                    unit = ''
                    if value_match:
                        val = value_match.group(1)
                        unit = value_match.group(2) if value_match.group(2) else unit
                        if isinstance(val, str) and '<' in val:
                            value = 0
                        else:
                            try:
                                value = float(val)
                            except Exception:
                                value = 0
                    # Extract ideal (midpoint of range if present)
                    ideal = None
                    range_match = re.search(r'(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)', line)
                    if range_match:
                        ideal = (float(range_match.group(1)) + float(range_match.group(2))) / 2
                    nutrients_by_image_order.append({
                        'name': nutrient,
                        'current': value,
                        'ideal': ideal,
                        'unit': unit
                    })
                    app.logger.info(f'Nutrient: {nutrient} | Matched line: "{line}" | Extracted value: {value} | Ideal: {ideal} | Unit: {unit}')
                    break
        if nutrients_by_image_order:
            app.logger.info(f'Final nutrients array (by image order): {nutrients_by_image_order}')
            return jsonify({'nutrients': nutrients_by_image_order})

        app.logger.warning('No nutrients extracted from PDF (neither tables nor OCR).')
        return jsonify({'error': 'No nutrients extracted from PDF (neither tables nor OCR).'}), 400
    except Exception as e:
        app.logger.error('Exception during PDF extraction: ' + str(e))
        traceback.print_exc()
        return jsonify({'error': 'Exception during PDF extraction', 'details': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 