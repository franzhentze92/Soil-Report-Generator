import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, LabelList, Cell } from 'recharts';

const ratioExplanations = {
  'Ca/Mg': 'The Ca/Mg ratio is the most important factor in high production fertility. When ideal levels are achieved, there will be maximum nutrient availability, optimum soil structure, and luxury levels of oxygen (the most important element of all in terms of microbe health).',
  'Mg/K': 'The Mg/K ratio indicates likely availability of both these important minerals, but it is also a guideline to phosphate uptake.',
  'K/Na': 'The K/Na ratio is indicative of potassium availability and sodium excesses. When this ratio is inverted, the plant will take up sodium instead of potassium.',
  'Ca/K': 'The Ca/K ratio relates to crop quality. When potassium is high in relation to calcium, the uptake of calcium is retarded, and vice versa.',
  'P/Zn': 'The P/Zn ratio relates to leaf size and plant sugar production. Each of these minerals is capable of retarding availability of the other if the 10:1 ratio is not maintained.',
  'Fe/Mn': 'The Fe/Mn ratio relates to chlorophyll management. If iron is slightly higher than manganese, both elements will be at maximum plant availability.'
};

function getNutrientValue(nutrients, name) {
  // Try exact match first
  let n = nutrients.find(n => n.name.toLowerCase() === name.toLowerCase());
  if (n) return n.current;
  // Try startsWith (for e.g. 'Iron (DTPA)')
  n = nutrients.find(n => n.name.toLowerCase().startsWith(name.toLowerCase()));
  if (n) return n.current;
  // Try contains
  n = nutrients.find(n => n.name.toLowerCase().includes(name.toLowerCase()));
  if (n) return n.current;
  // Special case for Fe/Mn: try both 'Iron (DTPA)' and 'Iron', 'Manganese (DTPA)' and 'Manganese'
  if (name.toLowerCase() === 'iron') {
    n = nutrients.find(n => n.name.toLowerCase().includes('iron'));
    if (n) return n.current;
  }
  if (name.toLowerCase() === 'manganese') {
    n = nutrients.find(n => n.name.toLowerCase().includes('manganese'));
    if (n) return n.current;
  }
  return null;
}

// Restore the fixed ratioDefs array
const ratioDefs = [
  { key: 'ca_mg', label: 'Ca/Mg', num: 'Calcium', denom: 'Magnesium', ideal: null, useInput: true },
  { key: 'mg_k', label: 'Mg/K', num: 'Magnesium', denom: 'Potassium', ideal: 7 },
  { key: 'k_na', label: 'K/Na', num: 'Potassium', denom: 'Sodium', ideal: 1 },
  { key: 'ca_k', label: 'Ca/K', num: 'Calcium', denom: 'Potassium', ideal: 5 },
  { key: 'p_zn', label: 'P/Zn', num: 'Phosphorus', denom: 'Zinc', ideal: 10 },
  { key: 'fe_mn', label: 'Fe/Mn', num: 'Iron', denom: 'Manganese', ideal: 1.1 },
];

const NutritionalRatios = ({ nutrients }) => {
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });
  // Prepare data for bar chart
  const data = ratioDefs.map(ratio => {
    let value = null;
    let ideal = ratio.ideal;
    if (ratio.label === 'Ca/Mg') {
      // Always use the input value for Ca/Mg Ratio (match both 'Ca/Mg Ratio' and 'Ca_Mg_Ratio', case-insensitive)
      const caMg = nutrients.find(n => /ca[\/_\- ]?mg[\/_\- ]?ratio/i.test(n.name));
      if (caMg && caMg.current !== undefined && caMg.ideal !== undefined && caMg.current !== null && caMg.ideal !== null) {
        value = caMg.current;
        ideal = caMg.ideal;
      } else {
        value = null;
        ideal = null;
      }
    } else {
      const num = getNutrientValue(nutrients, ratio.num);
      const denom = getNutrientValue(nutrients, ratio.denom);
      if (num !== null && denom !== null && denom !== 0) {
        value = num / denom;
      }
    }
    let deviation = 0;
    if (value !== null && ideal !== null && ideal !== 0) {
      deviation = ((value - ideal) / ideal) * 100;
    }
    let color = '#22c55e'; // green for optimal
    if (deviation < -25) color = '#ef4444'; // red for deficient
    else if (deviation > 25) color = '#2563eb'; // blue for excessive
    return {
      key: ratio.key,
      label: ratio.label,
      value: value !== null ? Number(value) : null,
      ideal: ideal !== null ? Number(ideal) : null,
      deviation,
      color,
      explanation: ratioExplanations[ratio.label] || '',
    };
  });
  // Sorting logic
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    const sorted = [...data].sort((a, b) => {
      if (a[sortConfig.key] == null) return 1;
      if (b[sortConfig.key] == null) return -1;
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);
  // Find min/max for axis
  const valueNumbers = sortedData.map(d => typeof d.value === 'number' && !isNaN(d.value) ? d.value : null).filter(v => v !== null);
  const idealNumbers = sortedData.map(d => typeof d.ideal === 'number' && !isNaN(d.ideal) ? d.ideal : null).filter(v => v !== null);
  const allNumbers = [...valueNumbers, ...idealNumbers];
  const minValue = allNumbers.length > 0 ? Math.min(...allNumbers) : 0;
  const maxValue = allNumbers.length > 0 ? Math.max(...allNumbers) : 1;
  // Prepare data for vertical grouped bar chart
  const chartData = sortedData.map(d => ({
    label: d.label,
    value: d.value,
    ideal: d.ideal,
    deviation: d.deviation,
    color: d.color,
    explanation: d.explanation,
  }));
  const chartHeight = Math.max(chartData.length * 48, 320);
  // Add clickable column headers for sorting
  const columns = [
    { key: 'label', label: 'Ratio' },
    { key: 'value', label: 'Actual' },
    { key: 'ideal', label: 'Ideal' },
    { key: 'deviation', label: 'Deviation (%)' },
  ];
  return (
    <Card className="bg-white mt-8">
      <CardHeader>
        <CardTitle className="text-black">Nutritional Ratios</CardTitle>
        <div className="flex gap-4 mt-2">
          {columns.map(col => (
            <span
              key={col.key}
              className="cursor-pointer text-sm font-semibold"
              onClick={() => setSortConfig(s => ({ key: col.key, direction: s.key === col.key && s.direction === 'asc' ? 'desc' : 'asc' }))}
            >
              {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 40, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={({ x, y, payload, index }) => {
                const d = chartData[index];
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={16} fontSize={14} fontWeight={600} textAnchor="middle" fill="#222">
                      {d.label}
                    </text>
                    <foreignObject x={18} y={2} width={24} height={24} style={{ overflow: 'visible' }}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                            <Info size={15} style={{ color: '#888', verticalAlign: 'middle' }} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="center">
                          <div className="text-sm text-gray-800 whitespace-pre-line max-w-xs">
                            {d.explanation}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </foreignObject>
                  </g>
                );
              }}
            />
            <YAxis type="number" tick={{ fontSize: 13 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length < 2) return null;
                const current = payload.find(p => p.dataKey === 'value');
                const ideal = payload.find(p => p.dataKey === 'ideal');
                return (
                  <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: 8, padding: 12, fontSize: 14 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                    {current && <div><span style={{ color: '#222', fontWeight: 500 }}>Current</span>: {current.value}</div>}
                    {ideal && <div><span style={{ color: '#888', fontWeight: 500 }}>Ideal</span>: {ideal.value}</div>}
                  </div>
                );
              }}
            />
            <Bar dataKey="ideal" name="Ideal" fill="#d1d5db" barSize={28} />
            <Bar dataKey="value" name="Actual" barSize={28}>
              <LabelList
                dataKey="deviation"
                position="top"
                formatter={v => v !== null ? `${v > 0 ? '+' : ''}${v.toFixed(1)}%` : ''}
                style={{ fontWeight: 600 }}
                content={({ x, y, width, height, value, index }) => {
                  const d = chartData[index];
                  let deviationColor = '#22c55e'; // green for optimal
                  if (d.deviation < -25) {
                    deviationColor = '#ef4444'; // red for deficient
                  } else if (d.deviation > 25) {
                    deviationColor = '#2563eb'; // blue for excessive
                  }
                  const labelX = Number(x) + Number(width) / 2;
                  const labelY = Number(y) - 8;
                  return (
                    <text x={labelX} y={labelY} fontSize="13" fontWeight="bold" fill={deviationColor} textAnchor="middle">
                      {d.deviation > 0 ? '+' : ''}{d.deviation.toFixed(1)}%
                    </text>
                  );
                }}
              />
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default NutritionalRatios; 