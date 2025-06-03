import React, { useState, useEffect } from 'react';
import ReportSection from './ReportSection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, Info, Sprout, Leaf } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ammoniumNitrateFerts } from '@/fertilizerProducts';

interface Nutrient {
  name: string;
  current: number;
  ideal: number;
  unit: string;
  status: 'low' | 'optimal' | 'high';
}

interface Fertilizer {
  name: string;
  nutrientContent: Record<string, number>;
  applicationRate: number;
  cost: number;
  recommended: boolean;
  contains?: string[];
  notRecommendedReason?: string;
  limitingWarning?: string;
}

interface SoilAmendmentsProps {
  nutrients: Nutrient[];
  selectedFertilizers: Record<string, string[]>;
  setSelectedFertilizers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  fertilizerRates: Record<string, number>;
  setFertilizerRates: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  allowedExcessPercent: number;
  setAllowedExcessPercent: React.Dispatch<React.SetStateAction<number>>;
  onSummaryChange?: (summary: any[]) => void;
}

// Add this mapping at the top of the file
const unifiedToGeneric = {
  'Nitrate-N (KCl)': 'Nitrate',
  'Ammonium-N (KCl)': 'Ammonium',
  'Phosphorus (Mehlich III)': 'Phosphorus',
  'Calcium (Mehlich III)': 'Calcium',
  'Magnesium (Mehlich III)': 'Magnesium',
  'Potassium (Mehlich III)': 'Potassium',
  'Sodium (Mehlich III)': 'Sodium',
  'Sulfur (KCl)': 'Sulphur',
  'Aluminium': 'Aluminium',
  'Silicon (CaCl2)': 'Silicon',
  'Boron (Hot CaCl2)': 'Boron',
  'Iron (DTPA)': 'Iron',
  'Manganese (DTPA)': 'Manganese',
  'Copper (DTPA)': 'Copper',
  'Zinc (DTPA)': 'Zinc',
};

const fertilizers: Record<string, Fertilizer[]> = {
  Nitrogen: [
    { name: 'Urea (Source locally)', nutrientContent: { Ammonium: 46 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium'] },
    { name: 'Calcium Nitrate (Source locally)', nutrientContent: { Nitrate: 15.5, Calcium: 19 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrate', 'Calcium'] },
    { name: 'MAP (Source locally)', nutrientContent: { Ammonium: 10, Phosphorus: 22 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Phosphorus'] },
    { name: 'DAP (Source locally)', nutrientContent: { Ammonium: 18, Phosphorus: 20 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Phosphorus'] },
    { name: 'Ammonium Sulfate (Source locally)', nutrientContent: { Ammonium: 21, Sulphur: 24 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Sulphur'] },
    { name: 'Potassium Nitrate (Source locally)', nutrientContent: { Nitrate: 13, Potassium: 44 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrate', 'Potassium'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Ammonium: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] },
    { name: 'Worm Juice (Source locally)', nutrientContent: { Ammonium: 1.5, Sulphur: 0.5, Magnesium: 0.2, Calcium: 1, Zinc: 0.5, Iron: 0.3 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Sulphur', 'Magnesium', 'Calcium', 'Zinc', 'Iron'] }
  ],
  Phosphorus: [
    { name: 'MAP (Source locally)', nutrientContent: { Ammonium: 10, Phosphorus: 22 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Phosphorus'] },
    { name: 'DAP (Source locally)', nutrientContent: { Ammonium: 18, Phosphorus: 20 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Phosphorus'] },
    { name: 'MKP (Source locally)', nutrientContent: { Phosphorus: 22.7, Potassium: 28.7 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Phosphorus', 'Potassium'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Ammonium: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] }
  ],
  Potassium: [
    { name: 'Potassium Sulfate (Source locally)', nutrientContent: { Sulphur: 17, Potassium: 50 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Potassium'] },
    { name: 'MKP (Source locally)', nutrientContent: { Phosphorus: 22.7, Potassium: 28.7 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Phosphorus', 'Potassium'] },
    { name: 'Potassium Nitrate (Source locally)', nutrientContent: { Nitrate: 13, Potassium: 44 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrate', 'Potassium'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Ammonium: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] }
  ],
  Sulphur: [
    { name: 'Potassium Sulfate (Source locally)', nutrientContent: { Sulphur: 17, Potassium: 50 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Potassium'] },
    { name: 'Magnesium Sulfate (Source locally)', nutrientContent: { Sulphur: 13, Magnesium: 9.8 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Magnesium'] },
    { name: 'Ammonium Sulfate (Source locally)', nutrientContent: { Ammonium: 21, Sulphur: 24 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Sulphur'] },
    { name: 'Iron Sulfate (Source locally)', nutrientContent: { Sulphur: 11.4, Iron: 19.7 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Iron'] },
    { name: 'Manganese Sulfate (Source locally)', nutrientContent: { Sulphur: 18, Manganese: 31 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Manganese'] },
    { name: 'Copper Sulfate (Source locally)', nutrientContent: { Sulphur: 12.8, Copper: 25 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Copper'] },
    { name: 'Zinc Sulfate (Source locally)', nutrientContent: { Sulphur: 17.9, Zinc: 23 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Zinc'] },
    { name: 'Elemental Sulfur (Source locally)', nutrientContent: { Sulphur: 90 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Ammonium: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] },
    { name: 'Worm Juice (Source locally)', nutrientContent: { Ammonium: 1.5, Sulphur: 0.5, Magnesium: 0.2, Calcium: 1, Zinc: 0.5, Iron: 0.3 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Ammonium', 'Sulphur', 'Magnesium', 'Calcium', 'Zinc', 'Iron'] }
  ],
  Calcium: [
    { name: 'Calcium Nitrate (Source locally)', nutrientContent: { Nitrogen: 15.5, Calcium: 19 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Calcium'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Nitrogen: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] },
    { name: 'Worm Juice (Source locally)', nutrientContent: { Nitrogen: 1.5, Sulphur: 0.5, Magnesium: 0.2, Calcium: 1, Zinc: 0.5, Iron: 0.3 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Magnesium', 'Calcium', 'Zinc', 'Iron'] },
    { name: 'Dolomite (Source locally)', nutrientContent: { Magnesium: 22, Calcium: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Magnesium', 'Calcium'] },
    { name: 'Lime (Source locally)', nutrientContent: { Calcium: 38 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Calcium'] },
    { name: 'Gypsum (Source locally)', nutrientContent: { Sulphur: 17, Calcium: 22 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Calcium'] }
  ],
  Magnesium: [
    { name: 'Magnesium Sulfate (Source locally)', nutrientContent: { Sulphur: 13, Magnesium: 9.8 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Magnesium'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Nitrogen: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] },
    { name: 'Worm Juice (Source locally)', nutrientContent: { Nitrogen: 1.5, Sulphur: 0.5, Magnesium: 0.2, Calcium: 1, Zinc: 0.5, Iron: 0.3 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Magnesium', 'Calcium', 'Zinc', 'Iron'] },
    { name: 'Dolomite (Source locally)', nutrientContent: { Magnesium: 22, Calcium: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Magnesium', 'Calcium'] },
    { name: 'Magnesite (Source locally)', nutrientContent: { Magnesium: 47.8 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Magnesium'] },
    { name: 'Magnesium Oxide (Source locally)', nutrientContent: { Magnesium: 60 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Magnesium'] }
  ],
  Iron: [
    { name: 'Iron Sulfate (Source locally)', nutrientContent: { Sulphur: 11.4, Iron: 19.7 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Iron'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Nitrogen: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] },
    { name: 'Worm Juice (Source locally)', nutrientContent: { Nitrogen: 1.5, Sulphur: 0.5, Magnesium: 0.2, Calcium: 1, Zinc: 0.5, Iron: 0.3 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Magnesium', 'Calcium', 'Zinc', 'Iron'] }
  ],
  Manganese: [
    { name: 'Manganese Sulfate (Source locally)', nutrientContent: { Sulphur: 18, Manganese: 31 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Manganese'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Nitrogen: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] }
  ],
  Copper: [
    { name: 'Copper Sulfate (Source locally)', nutrientContent: { Sulphur: 12.8, Copper: 25 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Copper'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Nitrogen: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] }
  ],
  Zinc: [
    { name: 'Zinc Sulfate (Source locally)', nutrientContent: { Sulphur: 17.9, Zinc: 23 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Sulphur', 'Zinc'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Nitrogen: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] },
    { name: 'Worm Juice (Source locally)', nutrientContent: { Nitrogen: 1.5, Sulphur: 0.5, Magnesium: 0.2, Calcium: 1, Zinc: 0.5, Iron: 0.3 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Magnesium', 'Calcium', 'Zinc', 'Iron'] }
  ],
  Boron: [
    { name: 'Soluble Boron (Source locally)', nutrientContent: { Boron: 20 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Boron'] },
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Nitrogen: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] },
    { name: 'Borax (Source locally)', nutrientContent: { Boron: 11.3 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Boron'] }
  ],
  Molybdenum: [
    { name: 'Sodium Molybdate (Source locally)', nutrientContent: {}, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Molybdenum'] }
  ],
  Carbon: [
    { name: 'Chicken Manure (Source locally)', nutrientContent: { Nitrogen: 2, Sulphur: 0.5, Boron: 0.05, Magnesium: 0.6, Calcium: 8, Copper: 0.2, Phosphorus: 1.8, Zinc: 0.35, Iron: 0.7, Potassium: 1.2, Manganese: 0.5, Carbon: 30 }, applicationRate: 100, cost: 1.0, recommended: true, contains: ['Nitrogen', 'Sulphur', 'Boron', 'Magnesium', 'Calcium', 'Copper', 'Phosphorus', 'Zinc', 'Iron', 'Potassium', 'Manganese', 'Carbon'] }
  ]
};

const SoilAmendments: React.FC<SoilAmendmentsProps> = ({ nutrients, selectedFertilizers, setSelectedFertilizers, fertilizerRates, setFertilizerRates, allowedExcessPercent, setAllowedExcessPercent, onSummaryChange }) => {
  // Debug: Log nutrients and deficient nutrients
  console.log('SoilAmendments nutrients prop:', nutrients);
  // Define a default nutrient for fallback
  const defaultNutrient: Nutrient = { name: '', current: 0, ideal: 0, unit: '', status: 'low' };

  // Only show cards for deficient nutrients
  const allowedNutrientNames = Object.keys(unifiedToGeneric);
  const deficientNutrients = nutrients.filter(n => n.status === 'low' && allowedNutrientNames.includes(n.name));
  console.log('SoilAmendments deficientNutrients:', deficientNutrients);

  // Define main and secondary nutrient names
  const mainNutrientNames = ['Calcium', 'Magnesium', 'Potassium', 'Phosphorus', 'Sulphur'];
  const mainDeficientNutrients = deficientNutrients.filter(n => mainNutrientNames.includes(n.name));
  const secondaryDeficientNutrients = deficientNutrients.filter(n => !mainNutrientNames.includes(n.name));

  // Calculate the required fertilizer rate to reach the target for a given fertilizer
  const calculateRequirement = (nutrient: Nutrient, fertilizer: Fertilizer | undefined) => {
    if (!fertilizer || !fertilizer.nutrientContent) return { cappedValue: 0, capSentence: '', limitingWarning: '' };

    // Calculate how much of this nutrient has already been added by other selected fertilizers (excluding this fertilizer)
    let alreadyAdded = 0;
    Object.entries(selectedFertilizers).forEach(([otherNutrient, fertList]) => {
      if (!Array.isArray(fertList)) return;
      fertList.forEach(fertName2 => {
        if (fertName2 === fertilizer.name && otherNutrient === nutrient.name) return;
        const fertObj2 = fertilizers[otherNutrient]?.find(f => f.name === fertName2);
        if (fertObj2 && fertObj2.nutrientContent[nutrient.name]) {
          const percent2 = fertObj2.nutrientContent[nutrient.name];
          const rate2 = fertilizerRates[fertName2] !== undefined ? fertilizerRates[fertName2] : 0;
          alreadyAdded += (rate2 * percent2) / 100;
        }
      });
    });
    const requirementPpm = Math.max(nutrient.ideal - (nutrient.current + alreadyAdded), 0);
    const requirementKgHa = requirementPpm * 2.4;
    const percent = fertilizer.nutrientContent[nutrient.name] || 0;
    const uncapped = percent > 0 ? Number(((requirementKgHa * 100) / percent).toFixed(1)) : 0;
    // Capped value logic
    let cappedValue = uncapped;
    let capSentence = '';
    let limitingNutrient = '';
    if (percent === 0 || requirementKgHa <= 0) {
      return { cappedValue: 0, capSentence: '', limitingWarning: '' };
    }
    if (fertilizer.contains && fertilizer.contains.length > 1) {
      let minRate = uncapped;
      for (const n of fertilizer.contains) {
        const nObj = nutrients.find(nu => nu.name === n);
        const nPercent = fertilizer.nutrientContent[n] || 0;
        if (nObj && nPercent > 0) {
          const maxN = nObj.ideal * 2.4 * (1 + allowedExcessPercent / 100); // convert to kg/ha
          const allowedNAdd = maxN - nObj.current * 2.4;
          const maxRate = allowedNAdd > 0 ? (allowedNAdd * 100) / nPercent : 0;
          if (maxRate < minRate) {
            minRate = maxRate;
            limitingNutrient = n;
          }
        }
      }
      cappedValue = Number(minRate.toFixed(1));
      if (cappedValue < uncapped) {
        capSentence = `(${uncapped} kg/ha, capped at ${cappedValue} kg/ha)`;
      }
    }
    // Always default the application rate field to the capped value
    let limitingWarning = '';
    if (fertilizer.limitingWarning) {
      limitingWarning = fertilizer.limitingWarning;
    }
    return { cappedValue, capSentence, limitingWarning };
  };

  // Helper to get the current value for a nutrient after applying all previous fertilizers (up to a given index)
  const getCurrentValueAfterPreviousFerts = (nutrient: Nutrient, selectedFertilizerList: string[], fertIdx: number) => {
    let totalAdded = 0;
    for (let i = 0; i < fertIdx; i++) {
      const fertName = selectedFertilizerList[i];
      const fertObj = fertilizers[nutrient.name]?.find(f => f.name === fertName);
      if (fertObj && fertObj.nutrientContent[nutrient.name]) {
        const percent = fertObj.nutrientContent[nutrient.name];
        const rate = fertilizerRates[fertName] !== undefined ? fertilizerRates[fertName] : calculateRequirement(nutrient, fertObj).cappedValue;
        totalAdded += (rate * percent) / 100;
      }
    }
    return nutrient.current + totalAdded;
  };

  const handleFertilizerSelect = (nutrientName: string, fertilizerName: string, fertIdx?: number, selectedFertilizerListOverride?: string[]) => {
    setSelectedFertilizers(prevFerts => {
      const prevList = prevFerts[nutrientName] || [];
      const list = selectedFertilizerListOverride || prevList;
      // Remove any existing entry for this fertilizer
      const filtered = list.filter(f => f !== fertilizerName);
      // Insert at correct index if provided
      let newList = [...filtered, fertilizerName];
      if (typeof fertIdx === 'number') {
        newList = [...list];
        newList[fertIdx] = fertilizerName;
      }
      // Update fertilizerRates in the same tick
      setFertilizerRates(prevRates => {
        if (prevRates[fertilizerName] !== undefined) return prevRates;
        // Find the correct current value after previous fertilizers for this dropdown
        const nutrient = nutrients.find(n => n.name === nutrientName) || defaultNutrient;
        const fertList = selectedFertilizerListOverride || (prevFerts[nutrientName] || []);
        let fertIdxToUse = fertIdx;
        if (typeof fertIdxToUse !== 'number') fertIdxToUse = fertList.length;
        const currentValueForThisDropdown = getCurrentValueAfterPreviousFerts(nutrient, fertList, fertIdxToUse);
        const fertObj = (fertilizers[nutrient.name] || []).find(f => f.name === fertilizerName);
        if (!fertObj) return prevRates; // Only set if fertilizer found
        const tempNutrient = { ...nutrient, current: currentValueForThisDropdown };
        const { cappedValue, capSentence, limitingWarning } = calculateRequirement(tempNutrient, fertObj);
        return { ...prevRates, [fertilizerName]: cappedValue };
      });
      return {
        ...prevFerts,
        [nutrientName]: newList
      };
    });
  };

  const handleRateChange = (fertilizerName: string, newRate: number) => {
    setFertilizerRates(prev => ({ ...prev, [fertilizerName]: newRate }));
  };

  const calculateTotalNewValue = (nutrient: Nutrient) => {
    let totalAdded = 0;
    Object.entries(selectedFertilizers).forEach(([selectedFor, fertList]) => {
      if (!Array.isArray(fertList)) return;
      fertList.forEach(fertName => {
        const fertObj = fertilizers[selectedFor]?.find(f => f.name === fertName);
        if (fertObj && fertObj.contains && fertObj.contains.includes(nutrient.name)) {
          const percent = fertObj.nutrientContent[nutrient.name] || 0;
          let rate = fertilizerRates[fertName];
          if (rate === undefined) {
            // Use capped value if not set
            const nObj = nutrients.find(n => n.name === selectedFor) || defaultNutrient;
            rate = calculateRequirement(nObj, fertObj).cappedValue;
          }
          totalAdded += (rate * percent) / 100;
        }
      });
    });
    // Convert totalAdded (kg/ha) to ppm before adding to current (ppm)
    return nutrient.current + (totalAdded / 2.4);
  };

  // Build a summary for all nutrients contributed by all selected fertilizers
  const selectedFertilizerDetails = [];
  Object.entries(selectedFertilizers).forEach(([nutrient, fertList]) => {
    if (!Array.isArray(fertList)) return;
    fertList.forEach((fertName) => {
      const fertObj = (fertilizers[nutrient] || []).find(f => f.name === fertName);
      if (!fertObj) return; // Only push valid fertilizer objects
      let rate = fertilizerRates[fertName];
      if (rate === undefined) {
        const nObj = nutrients.find(n => n.name === nutrient) || defaultNutrient;
        rate = calculateRequirement(nObj, fertObj).cappedValue;
      }
      // For every nutrient this fertilizer contains, add an entry
      (fertObj.contains || []).forEach(containedNutrient => {
        const percent = fertObj.nutrientContent[containedNutrient] || 0;
        const actualNutrientApplied = (rate * percent) / 100;
        // Only push if fertObj is valid and has recommended property
        if (fertObj && fertObj.recommended) {
          selectedFertilizerDetails.push({
            fertilizer: fertObj.name,
            nutrient: containedNutrient,
            rate, // product rate applied (kg/ha)
            actualNutrientApplied, // kg/ha of this nutrient
            unit: 'kg/ha',
            contains: fertObj.contains,
            recommended: fertObj.recommended,
            nutrientsFor: [nutrient],
          });
        }
      });
    });
  });

  const ppmToKgHa = (ppm: number) => (ppm * 2.4).toFixed(1); // Updated to match app-wide conversion

  useEffect(() => {
    if (onSummaryChange) {
      console.log('SoilAmendments summary sent to parent:', selectedFertilizerDetails);
      onSummaryChange(selectedFertilizerDetails);
    }
  }, [JSON.stringify(selectedFertilizers), JSON.stringify(fertilizerRates)]);

  // Add state for max allowed excess after application
  const [maxPostAppExcessPercent, setMaxPostAppExcessPercent] = useState(20);

  // Instead of {(() => { ... })()}, just call the function and render its result directly
  const renderFertilizerSummaryCards = () => {
    // Map fertilizer name to the item with the highest rate
    const fertMap = new Map();
    for (const item of selectedFertilizerDetails) {
      if (!item || typeof item !== 'object' || typeof item.recommended !== 'boolean') continue;
      const prev = fertMap.get(item.fertilizer);
      if (!prev || (typeof item.rate === 'number' && item.rate > prev.rate)) {
        fertMap.set(item.fertilizer, item);
      }
    }
    const uniqueFertilizers = Array.from(fertMap.values());
    if (uniqueFertilizers.length === 0) return null;
    return (
      <div className="space-y-2 mt-8">
        <h4 className="font-medium text-black text-lg mb-2">Selected Fertilizers</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueFertilizers.map((item, idx) => (
            <div key={idx} className={`flex items-center p-4 rounded-lg border-l-4 ${item.recommended ? 'border-[#8B5E3C] bg-[#F5EBDD]' : 'border-yellow-700 bg-yellow-100'}`}>
              <div>
                <div className="font-semibold text-black">{item.fertilizer || ''}</div>
                <div className="text-sm text-gray-700">Rate: <span className="font-medium">{typeof item.rate !== 'undefined' ? item.rate : ''} {item.unit || ''}</span></div>
                {Array.isArray(item.contains) && <div className="text-xs text-gray-500">Contains: {item.contains.join(', ')}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <ReportSection title="Soil Amendments">
        <Card className="bg-white">
          <CardContent>
            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-4 mb-2">
                <label htmlFor="allowed-excess" className="text-sm font-medium text-gray-700">Max allowed excess for other nutrients:</label>
                <input
                  id="allowed-excess"
                  type="range"
                  min={0}
                  max={100}
                  value={allowedExcessPercent}
                  onChange={e => setAllowedExcessPercent(Number(e.target.value))}
                  className="w-40 accent-cyan-600"
                />
                <span className="text-sm text-cyan-700 font-semibold w-12">{allowedExcessPercent}%</span>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <label htmlFor="max-post-app-excess" className="text-sm font-medium text-gray-700">Max allowed excess for any nutrient after application:</label>
                <input
                  id="max-post-app-excess"
                  type="range"
                  min={0}
                  max={100}
                  value={maxPostAppExcessPercent}
                  onChange={e => setMaxPostAppExcessPercent(Number(e.target.value))}
                  className="w-40 accent-cyan-600"
                />
                <span className="text-sm text-cyan-700 font-semibold w-12">{maxPostAppExcessPercent}%</span>
              </div>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-800">
                    Depending on the selected fertiliser, the current nutrient value will be updated and become the "New", 
                    showing both to know how much it is increasing. When you select a fertilizer, the progress bar will turn green, 
                    showing the current value (original), the new value (after fertiliser quantity) and target.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </ReportSection>

      {/* Main and Secondary Nutrients as separate cards below, with margin for background separation */}
      <div className="mt-8 space-y-8">
        {mainDeficientNutrients.length > 0 && (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-black mb-2 mt-4">Main Nutrients</h3>
              {mainDeficientNutrients.map((nutrient, idx) => {
                let availableFertilizers = fertilizers[nutrient.name] || [];
                if (nutrient.name === 'Nitrate') {
                  availableFertilizers = ammoniumNitrateFerts.filter(f => f.n_form.includes('Nitrate')).map(f => ({
                    name: f.name,
                    nutrientContent: {
                      Nitrate: f.nitrate || 0,
                      Ammonium: f.ammonium || 0,
                      P2O5: f.P2O5 || 0,
                      K2O: f.K2O || 0,
                      Ca: f.Ca || 0,
                      S: f.S || 0,
                      Na: f.Na || 0,
                      Cl: f.Cl || 0
                    },
                    applicationRate: 100,
                    cost: 1,
                    recommended: true,
                    contains: Object.entries({
                      Nitrate: f.nitrate,
                      Ammonium: f.ammonium,
                      P2O5: f.P2O5,
                      K2O: f.K2O,
                      Ca: f.Ca,
                      S: f.S,
                      Na: f.Na,
                      Cl: f.Cl
                    }).filter(([k, v]) => v && v > 0).map(([k]) => k),
                    description: f.description
                  }));
                }
                if (nutrient.name === 'Ammonium') {
                  availableFertilizers = ammoniumNitrateFerts.filter(f => f.n_form.includes('Ammonium')).map(f => ({
                    name: f.name,
                    nutrientContent: {
                      Nitrate: f.nitrate || 0,
                      Ammonium: f.ammonium || 0,
                      P2O5: f.P2O5 || 0,
                      K2O: f.K2O || 0,
                      Ca: f.Ca || 0,
                      S: f.S || 0,
                      Na: f.Na || 0,
                      Cl: f.Cl || 0
                    },
                    applicationRate: 100,
                    cost: 1,
                    recommended: true,
                    contains: Object.entries({
                      Nitrate: f.nitrate,
                      Ammonium: f.ammonium,
                      P2O5: f.P2O5,
                      K2O: f.K2O,
                      Ca: f.Ca,
                      S: f.S,
                      Na: f.Na,
                      Cl: f.Cl
                    }).filter(([k, v]) => v && v > 0).map(([k]) => k),
                    description: f.description
                  }));
                }
                const selectedFertilizerList = selectedFertilizers[nutrient.name] || [];
                const isSelected = selectedFertilizerList.length > 0;

                // Find all nutrients (in order) that have selected this fertilizer
                let duplicateFertilizerNutrient: string | null = null;
                let duplicateFertilizerRate: number | null = null;
                let isFirstOccurrence = true;
                if (isSelected) {
                  const nutrientsWithThisFert = selectedFertilizerList.map(f => f);
                  if (nutrientsWithThisFert.length > 1) {
                    isFirstOccurrence = nutrientsWithThisFert[0] === nutrient.name;
                    if (!isFirstOccurrence) {
                      duplicateFertilizerNutrient = nutrientsWithThisFert[0];
                      duplicateFertilizerRate = fertilizerRates[nutrientsWithThisFert[0]] || 0;
                    }
                  }
                }

                // Use the rate from the first selection if duplicate, otherwise use this nutrient's rate
                const currentRate = duplicateFertilizerRate != null
                  ? duplicateFertilizerRate
                  : (fertilizerRates[selectedFertilizerList[0]] || 0);
                const newValue = calculateTotalNewValue(nutrient);
                const requirement = nutrient.ideal - nutrient.current;

                // In the dropdown, show a warning if the main nutrient requirement is not fully met due to any cap
                let limitingWarning = '';
                if (selectedFertilizerList.length > 0) {
                  const lastFertName = selectedFertilizerList[selectedFertilizerList.length - 1];
                  const lastFertObj = availableFertilizers.find(f => f.name === lastFertName);
                  if (lastFertObj && lastFertObj.limitingWarning) {
                    limitingWarning = lastFertObj.limitingWarning;
                  }
                }

                // If there are no available fertilizers, show a message
                if (availableFertilizers.length === 0) {
                  return (
                    <Card key={nutrient.name} className="bg-white border-gray-200">
                      <CardContent className="p-4">
                        <div className="mb-2 text-sm text-gray-700">
                          <strong>{nutrient.name}:</strong> Current: {nutrient.current} {nutrient.unit}, Target: {nutrient.ideal} {nutrient.unit}.<br />
                          <span className="text-red-600 font-semibold">No fertilizer recommendation available for this nutrient.</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <Card key={nutrient.name} className="bg-white border-gray-200">
                    <CardContent className="p-4">
                      <div className="mb-2 text-sm text-gray-700">
                        <strong>{nutrient.name}:</strong> Current: {nutrient.current} {nutrient.unit}, Target: {nutrient.ideal} {nutrient.unit}, Needed: {requirement > 0 ? requirement.toFixed(1) : 0} {nutrient.unit}.<br />
                        Select a fertilizer below to fulfill this nutrient requirement.<br />
                        {(() => {
                          const deviation = newValue - nutrient.ideal;
                          const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                          const deviationKgHa = (Number(ppmToKgHa(newValue)) - Number(ppmToKgHa(nutrient.ideal))).toFixed(1);
                          let deviationColor = 'text-green-700 font-semibold';
                          if (percentDiff < -25) deviationColor = 'text-red-600 font-semibold';
                          else if (percentDiff > 25) deviationColor = 'text-blue-700 font-bold';
                          return (
                            <span className={`text-xs ${deviationColor}`}>
                              Deviation: {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}% (
                                {deviation >= 0 ? '+' : ''}{deviation.toFixed(1)} {nutrient.unit}, {deviationKgHa} kg/ha)
                            </span>
                          );
                        })()}
                        {(() => {
                          // Check if this nutrient was affected by another fertilizer selection
                          let explanation = '';
                          Object.entries(selectedFertilizers).forEach(([otherNutrient, fertList]) => {
                            if (otherNutrient !== nutrient.name) {
                              fertList.forEach(fertName => {
                                const fertObj = fertilizers[otherNutrient]?.find(f => f.name === fertName);
                                if (fertObj && fertObj.contains && fertObj.contains.includes(nutrient.name)) {
                                  const percent = fertObj.nutrientContent[nutrient.name] || 0;
                                  const rate = fertilizerRates[fertName];
                                  if (rate) {
                                    const added = (rate * percent) / 100;
                                    if (added > 0) {
                                      explanation += `The value for ${nutrient.name} increased by ${added.toFixed(1)} ${nutrient.unit} because ${otherNutrient} was treated with ${fertObj.name}, which also contains ${nutrient.name}. `;
                                    }
                                  }
                                }
                              });
                            }
                          });
                          if (explanation) {
                            return <div className="text-xs text-blue-700 mt-1">{explanation}</div>;
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-black">{nutrient.name}</h4>
                        <span className="text-sm font-medium text-blue-600">
                          New: {newValue.toFixed(1)}{nutrient.unit}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Original</span>
                            <Progress value={Math.min((nutrient.current / nutrient.ideal) * 100, 100)} className="h-2 [&>div]:bg-gray-400 flex-1" />
                            <span className="text-xs ml-2">{nutrient.current.toFixed(1)} {nutrient.unit} ({ppmToKgHa(nutrient.current)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">New</span>
                            <Progress
                              value={Math.min((newValue / nutrient.ideal) * 100, 100)}
                              className={`h-2 flex-1 ${(() => {
                                const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                                if (percentDiff > 25) return '[&>div]:bg-blue-600';
                                if (percentDiff < -25) return '[&>div]:bg-red-600';
                                return '[&>div]:bg-green-500';
                              })()}`}
                            />
                            <span className="text-xs ml-2">{newValue.toFixed(1)} {nutrient.unit} ({ppmToKgHa(newValue)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Requirement</span>
                            <Progress value={Math.max(((nutrient.ideal - newValue) / nutrient.ideal) * 100, 0)} className="h-2 [&>div]:bg-cyan-400 flex-1" />
                            <span className="text-xs ml-2">{Math.max(nutrient.ideal - newValue, 0).toFixed(1)} {nutrient.unit} ({ppmToKgHa(Math.max(nutrient.ideal - newValue, 0))} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Target</span>
                            <Progress value={100} className="h-2 [&>div]:bg-green-600 flex-1" />
                            <span className="text-xs ml-2">{nutrient.ideal} {nutrient.unit} ({ppmToKgHa(nutrient.ideal)} kg/ha)</span>
                          </div>
                        </div>
                        {newValue > nutrient.ideal * 1.5 && (
                          <div className="mt-1 text-xs text-blue-700 font-semibold">Excessive: Value is more than 50% above target!</div>
                        )}
                      </div>
                      
                      <div className="flex flex-row gap-4 items-end w-full">
                        <div className="flex flex-col flex-[2_2_0%] min-w-0">
                          <Label className="block text-sm font-medium text-black mb-1">Select Fertilizer:</Label>
                          {selectedFertilizerList.map((fertName, fertIdx) => {
                            const fertObj = availableFertilizers.find(f => f.name === fertName);
                            // Calculate the current value after previous fertilizers for this nutrient
                            const currentValueForThisDropdown = getCurrentValueAfterPreviousFerts(nutrient, selectedFertilizerList, fertIdx);
                            const { cappedValue, capSentence, limitingWarning } = calculateRequirement(nutrient, fertObj);
                            // Calculate how much of this nutrient has already been added by other selected fertilizers (excluding this fertilizer)
                            let alreadyAdded = 0;
                            Object.entries(selectedFertilizers).forEach(([otherNutrient, fertList]) => {
                              if (!Array.isArray(fertList)) return;
                              fertList.forEach(fertName2 => {
                                if (fertName2 === fertName && otherNutrient === nutrient.name) return;
                                const fertObj2 = fertilizers[otherNutrient]?.find(f => f.name === fertName2);
                                if (fertObj2 && fertObj2.nutrientContent[nutrient.name]) {
                                  const percent2 = fertObj2.nutrientContent[nutrient.name];
                                  const rate2 = fertilizerRates[fertName2] !== undefined ? fertilizerRates[fertName2] : 0;
                                  alreadyAdded += (rate2 * percent2) / 100;
                                }
                              });
                            });
                            const requirement = Math.max(nutrient.ideal - (nutrient.current + alreadyAdded), 0);
                            const percent = fertObj && fertObj.nutrientContent ? fertObj.nutrientContent[nutrient.name] || 0 : 0;
                            const uncapped = percent > 0 ? Number(((requirement * 100) / percent).toFixed(1)) : 0;
                            // Warnings
                            let overageWarning = '';
                            if (fertObj && fertObj.recommended && fertObj.contains && fertObj.contains.length > 1) {
                              fertObj.contains.forEach(cont => {
                                if (cont !== nutrient.name) {
                                  const nObj = nutrients.find(nu => nu.name === cont);
                                  if (nObj) {
                                    const added = (requirement * percent) / 100;
                                    const newValue = nObj.current + added;
                                    const percentOver = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                    if (percentOver > 20) {
                                      overageWarning += `Using this rate will exceed ${cont} target by ${percentOver.toFixed(1)}%. `;
                                    }
                                  }
                                }
                              });
                            }

                            // --- FIX: Move dropdown options logic outside JSX ---
                            const sortedFertilizers = [...availableFertilizers].sort((a, b) => {
                              const aPct = typeof a.nutrientContent[nutrient.name] === 'number' ? a.nutrientContent[nutrient.name] : 0;
                              const bPct = typeof b.nutrientContent[nutrient.name] === 'number' ? b.nutrientContent[nutrient.name] : 0;
                              return bPct - aPct;
                            });
                            const fertilizerOptions = sortedFertilizers.map(fert => {
                              if (!Array.isArray(fert.contains)) return null;
                              // Simulate selection for preview:
                              const simulatedSelectedFertilizerList = selectedFertilizerList.includes(fert.name)
                                ? selectedFertilizerList
                                : [...selectedFertilizerList, fert.name];
                              const currentValueForThisDropdown = getCurrentValueAfterPreviousFerts(nutrient, simulatedSelectedFertilizerList, simulatedSelectedFertilizerList.length - 1);
                              const tempNutrient = { ...nutrient, current: currentValueForThisDropdown };
                              const { cappedValue, capSentence } = calculateRequirement(tempNutrient, fert);
                              // Find limiting nutrient for this fertilizer
                              let limitingNutrient = '';
                              if (fert.contains && fert.contains.length > 1) {
                                let minRate = cappedValue;
                                for (const n of fert.contains) {
                                  const nObj = nutrients.find(nu => nu.name === n);
                                  const nPercent = fert.nutrientContent[n] || 0;
                                  if (nObj && nPercent > 0) {
                                    const maxN = nObj.ideal * 2.4 * (1 + allowedExcessPercent / 100); // convert to kg/ha
                                    const allowedNAdd = maxN - nObj.current * 2.4;
                                    const maxRate = allowedNAdd > 0 ? (allowedNAdd * 100) / nPercent : 0;
                                    if (maxRate < minRate) {
                                      minRate = maxRate;
                                      limitingNutrient = n;
                                    }
                                  }
                                }
                              }
                              // Check if any contained nutrient would exceed the threshold
                              const excessNutrients = fert.contains.map(n => {
                                const nObj = nutrients.find(nu => nu.name === n);
                                if (!nObj) return null;
                                const percent = typeof fert.nutrientContent[n] === 'number' ? fert.nutrientContent[n] : 0;
                                const added = (cappedValue * percent) / 100;
                                const newValue = nObj.current + added;
                                if (newValue > nObj.ideal * (1 + maxPostAppExcessPercent / 100)) {
                                  const percentOver = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                  return { name: n, newValue, ideal: nObj.ideal, percentOver };
                                }
                                return null;
                              }).filter(Boolean);
                              const hasExcess = excessNutrients.length > 0;
                              // Calculate uncapped for display
                              let alreadyAdded = 0;
                              Object.entries(selectedFertilizers).forEach(([otherNutrient, fertList]) => {
                                if (!Array.isArray(fertList)) return;
                                fertList.forEach(fertName2 => {
                                  if (fertName2 === fert.name && otherNutrient === nutrient.name) return;
                                  const fertObj2 = fertilizers[otherNutrient]?.find(f => f.name === fertName2);
                                  if (fertObj2 && fertObj2.nutrientContent[nutrient.name]) {
                                    const percent2 = fertObj2.nutrientContent[nutrient.name];
                                    const rate2 = fertilizerRates[fertName2] !== undefined ? fertilizerRates[fertName2] : 0;
                                    alreadyAdded += (rate2 * percent2) / 100;
                                  }
                                });
                              });
                              const requirement = Math.max(nutrient.ideal - (nutrient.current + alreadyAdded), 0);
                              const percent = fert && fert.nutrientContent ? fert.nutrientContent[nutrient.name] || 0 : 0;
                              const uncapped = percent > 0 ? Number(((requirement * 100) / percent).toFixed(1)) : 0;
                              // Warnings
                              let overageWarning = '';
                              if (fert && fert.recommended && fert.contains && fert.contains.length > 1) {
                                fert.contains.forEach(cont => {
                                  if (cont !== nutrient.name) {
                                    const nObj = nutrients.find(nu => nu.name === cont);
                                    if (nObj) {
                                      const added = (requirement * percent) / 100;
                                      const newValue = nObj.current + added;
                                      const percentOver = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                      if (percentOver > 20) {
                                        overageWarning += `Using this rate will exceed ${cont} target by ${percentOver.toFixed(1)}%. `;
                                      }
                                    }
                                  }
                                });
                              }
                              return (
                                <SelectItem key={fert.name} value={fert.name}>
                                  <div className={`flex flex-col gap-0.5 ${hasExcess ? 'text-yellow-700' : ''}`}>
                                    <div className="flex items-center gap-2">
                                      {hasExcess ? (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <span className="flex items-center cursor-pointer"><AlertTriangle className="h-4 w-4 text-yellow-500" /></span>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80 z-50">
                                            <div className="text-sm text-yellow-800 font-semibold mb-1">Warning: This fertilizer may push some nutrients above the allowed excess after application.</div>
                                            <ul className="text-xs text-yellow-800 list-disc ml-4">
                                              {excessNutrients.map(en => (
                                                <li key={en.name}>{en.name}: New value {en.newValue.toFixed(2)} (target {en.ideal}), {en.percentOver.toFixed(1)}% above target</li>
                                              ))}
                                            </ul>
                                            <div className="text-xs text-yellow-700 mt-2">You can still select this fertilizer, but use caution.</div>
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        fert && fert.recommended ? (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                        )
                                      )}
                                      <span className={fert && fert.recommended && !hasExcess ? 'font-medium' : ''}>
                                        <a
                                          href={`https://www.nutri-tech.com.au/products/${fert.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={hasExcess ? 'text-yellow-700' : 'text-blue-600 hover:underline'}
                                        >
                                          {fert.name} {fert && fert.nutrientContent && ` [${Object.entries(fert.nutrientContent).map(([n, p]) => `${n} ${p}%`).join(', ')}]`}
                                        </a>
                                        {uncapped > 0 && cappedValue < uncapped
                                          ? ` (${uncapped} kg/ha, capped at ${cappedValue} kg/ha)`
                                          : uncapped > 0
                                            ? ` (${cappedValue} kg/ha)`
                                            : ''}
                                      </span>
                                    </div>
                                    {capSentence && !hasExcess && (
                                      <span className="text-xs text-yellow-600">{capSentence}</span>
                                    )}
                                    {cappedValue < uncapped && limitingNutrient && !hasExcess && (
                                      <span className="text-xs text-yellow-600">Rate capped due to {limitingNutrient} excess</span>
                                    )}
                                    <div className="text-xs text-gray-600">{fert.limitingWarning}</div>
                                    {overageWarning && !hasExcess && (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="ghost" size="sm" className="p-0 h-4 w-4 ml-1" title="Nutrient overage warning">
                                            <Info className="h-3 w-3 text-blue-500" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 z-50">
                                          <p className="text-sm text-blue-700 font-semibold">{overageWarning}</p>
                                        </PopoverContent>
                                      </Popover>
                                    )}
                                    {!hasExcess && (
                                      <div className="text-xs text-cyan-700 font-semibold mt-0.5">Recommended rate: {cappedValue} kg/ha</div>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            });
                            // --- END FIX ---

                            return (
                              <div key={fertName || fertIdx} className="flex items-end gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <Select
                                    value={fertName}
                                    onValueChange={value => {
                                      if (selectedFertilizerList.includes(value)) return;
                                      handleFertilizerSelect(nutrient.name, value, fertIdx, selectedFertilizerList);
                                    }}
                                  >
                                    <SelectTrigger className="bg-white w-full h-10">
                                      <SelectValue placeholder="Choose fertilizer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No fertilizer</SelectItem>
                                      {fertilizerOptions}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="w-32 flex flex-col">
                                  <Label className="block text-xs font-medium text-gray-700 mb-0.5">Application Rate (kg/ha)</Label>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      value={(() => {
                                        if (!fertName || !fertObj) return '';
                                        const capped = calculateRequirement(nutrient, fertObj).cappedValue;
                                        // Always use capped value as default, even if user previously changed it
                                        return capped;
                                      })()}
                                      onChange={e => handleRateChange(fertName, Number(e.target.value))}
                                      placeholder="Enter rate"
                                      className="bg-white h-10 w-20"
                                      disabled={!isFirstOccurrence && fertIdx === 0}
                                    />
                                  </div>
                                </div>
                                {selectedFertilizerList.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 text-red-500"
                                    onClick={() => {
                                      setSelectedFertilizers(prev => {
                                        const arr = [...selectedFertilizerList];
                                        arr.splice(fertIdx, 1);
                                        return { ...prev, [nutrient.name]: arr };
                                      });
                                    }}
                                  >Remove</Button>
                                )}
                              </div>
                            );
                          })}
                          {selectedFertilizerList.length < 4 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 bg-[#8cb43a] hover:bg-[#7ca32e] text-white"
                              onClick={() => {
                                setSelectedFertilizers(prev => ({
                                  ...prev,
                                  [nutrient.name]: [...selectedFertilizerList, '']
                                }));
                              }}
                            >
                              Add Product
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 ml-2"
                            onClick={() => {
                              setSelectedFertilizers(prev => {
                                const updated = { ...prev };
                                delete updated[nutrient.name];
                                return updated;
                              });
                              setFertilizerRates(prev => {
                                const updated = { ...prev };
                                (selectedFertilizerList || []).forEach(f => { delete updated[f]; });
                                return updated;
                              });
                            }}
                          >Reset</Button>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-4 p-3 bg-green-100 rounded-lg">
                          <div className="text-sm text-green-800 space-y-1">
                            {/* List each selected fertilizer and its contributions */}
                            {selectedFertilizerList.map((fertName, idx) => {
                              const fertObj = availableFertilizers.find(f => f.name === fertName);
                              if (!fertObj) return null;
                              const rate = fertilizerRates[fertName] !== undefined ? fertilizerRates[fertName] : calculateRequirement(nutrient, fertObj).cappedValue;
                              // Main nutrient contribution
                              const mainPercent = fertObj.nutrientContent[nutrient.name] || 0;
                              const mainAdded = (rate * mainPercent) / 100;
                              return (
                                <div key={fertName} className="mb-1">
                                  <span className="font-medium">{`Applying ${Math.round(rate)} kg/ha of ${fertName}`}</span>
                                  {mainPercent > 0 && (
                                    <span>{` adds ${mainAdded.toFixed(1)} ${nutrient.unit} of ${nutrient.name}`}</span>
                                  )}
                                  {fertObj.contains && fertObj.contains.length > 1 && (
                                    <>
                                      <span> (also adds: </span>
                                      {fertObj.contains.filter(n => n !== nutrient.name).map((other, i) => {
                                        const nObj = nutrients.find(nu => nu.name === other);
                                        const unit = nObj ? nObj.unit : '';
                                        const percent = typeof fertObj.nutrientContent[other] === 'number' ? fertObj.nutrientContent[other] : 0;
                                        const added = (rate * percent) / 100;
                                        return (
                                          <span key={other}>
                                            {other}: {added.toFixed(1)} {unit}{i < fertObj.contains.filter(n => n !== nutrient.name).length - 1 ? ', ' : ''}
                                          </span>
                                        );
                                      })}
                                      <span>)</span>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                            {/* Total summary */}
                            <div className="mt-2">
                              <span>
                                Total new value: <span className="font-semibold">{newValue.toFixed(1)} {nutrient.unit}</span> (target: {nutrient.ideal} {nutrient.unit})
                              </span>
                              {(() => {
                                const deviation = newValue - nutrient.ideal;
                                const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                                const deviationKgHa = (Number(ppmToKgHa(newValue)) - Number(ppmToKgHa(nutrient.ideal))).toFixed(1);
                                let deviationColor = 'text-green-700 font-semibold';
                                if (percentDiff < -25) deviationColor = 'text-red-600 font-semibold';
                                else if (percentDiff > 25) deviationColor = 'text-blue-700 font-bold';
                                return (
                                  <span className={`text-xs ${deviationColor}`}>
                                    Deviation: {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}% (
                                      {deviation >= 0 ? '+' : ''}{deviation.toFixed(1)} {nutrient.unit}, {deviationKgHa} kg/ha)
                                  </span>
                                );
                              })()}
                              <br />
                              <span>
                                Still needed to reach target: {(nutrient.ideal - newValue).toFixed(1)} {nutrient.unit}.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}
        {secondaryDeficientNutrients.length > 0 && (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-black mb-2 mt-4">Secondary Nutrients</h3>
              {secondaryDeficientNutrients.map((nutrient, idx) => {
                let availableFertilizers = fertilizers[nutrient.name] || [];
                if (nutrient.name === 'Nitrate') {
                  availableFertilizers = ammoniumNitrateFerts.filter(f => f.n_form.includes('Nitrate')).map(f => ({
                    name: f.name,
                    nutrientContent: {
                      Nitrate: f.nitrate || 0,
                      Ammonium: f.ammonium || 0,
                      P2O5: f.P2O5 || 0,
                      K2O: f.K2O || 0,
                      Ca: f.Ca || 0,
                      S: f.S || 0,
                      Na: f.Na || 0,
                      Cl: f.Cl || 0
                    },
                    applicationRate: 100,
                    cost: 1,
                    recommended: true,
                    contains: Object.entries({
                      Nitrate: f.nitrate,
                      Ammonium: f.ammonium,
                      P2O5: f.P2O5,
                      K2O: f.K2O,
                      Ca: f.Ca,
                      S: f.S,
                      Na: f.Na,
                      Cl: f.Cl
                    }).filter(([k, v]) => v && v > 0).map(([k]) => k),
                    description: f.description
                  }));
                }
                if (nutrient.name === 'Ammonium') {
                  availableFertilizers = ammoniumNitrateFerts.filter(f => f.n_form.includes('Ammonium')).map(f => ({
                    name: f.name,
                    nutrientContent: {
                      Nitrate: f.nitrate || 0,
                      Ammonium: f.ammonium || 0,
                      P2O5: f.P2O5 || 0,
                      K2O: f.K2O || 0,
                      Ca: f.Ca || 0,
                      S: f.S || 0,
                      Na: f.Na || 0,
                      Cl: f.Cl || 0
                    },
                    applicationRate: 100,
                    cost: 1,
                    recommended: true,
                    contains: Object.entries({
                      Nitrate: f.nitrate,
                      Ammonium: f.ammonium,
                      P2O5: f.P2O5,
                      K2O: f.K2O,
                      Ca: f.Ca,
                      S: f.S,
                      Na: f.Na,
                      Cl: f.Cl
                    }).filter(([k, v]) => v && v > 0).map(([k]) => k),
                    description: f.description
                  }));
                }
                const selectedFertilizerList = selectedFertilizers[nutrient.name] || [];
                const isSelected = selectedFertilizerList.length > 0;

                // Find all nutrients (in order) that have selected this fertilizer
                let duplicateFertilizerNutrient: string | null = null;
                let duplicateFertilizerRate: number | null = null;
                let isFirstOccurrence = true;
                if (isSelected) {
                  const nutrientsWithThisFert = selectedFertilizerList.map(f => f);
                  if (nutrientsWithThisFert.length > 1) {
                    isFirstOccurrence = nutrientsWithThisFert[0] === nutrient.name;
                    if (!isFirstOccurrence) {
                      duplicateFertilizerNutrient = nutrientsWithThisFert[0];
                      duplicateFertilizerRate = fertilizerRates[nutrientsWithThisFert[0]] || 0;
                    }
                  }
                }

                // Use the rate from the first selection if duplicate, otherwise use this nutrient's rate
                const currentRate = duplicateFertilizerRate != null
                  ? duplicateFertilizerRate
                  : (fertilizerRates[selectedFertilizerList[0]] || 0);
                const newValue = calculateTotalNewValue(nutrient);
                const requirement = nutrient.ideal - nutrient.current;

                // In the dropdown, show a warning if the main nutrient requirement is not fully met due to any cap
                let limitingWarning = '';
                if (selectedFertilizerList.length > 0) {
                  const lastFertName = selectedFertilizerList[selectedFertilizerList.length - 1];
                  const lastFertObj = availableFertilizers.find(f => f.name === lastFertName);
                  if (lastFertObj && lastFertObj.limitingWarning) {
                    limitingWarning = lastFertObj.limitingWarning;
                  }
                }

                // If there are no available fertilizers, show a message
                if (availableFertilizers.length === 0) {
                  return (
                    <Card key={nutrient.name} className="bg-white border-gray-200">
                      <CardContent className="p-4">
                        <div className="mb-2 text-sm text-gray-700">
                          <strong>{nutrient.name}:</strong> Current: {nutrient.current} {nutrient.unit}, Target: {nutrient.ideal} {nutrient.unit}.<br />
                          <span className="text-red-600 font-semibold">No fertilizer recommendation available for this nutrient.</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <Card key={nutrient.name} className="bg-white border-gray-200">
                    <CardContent className="p-4">
                      <div className="mb-2 text-sm text-gray-700">
                        <strong>{nutrient.name}:</strong> Current: {nutrient.current} {nutrient.unit}, Target: {nutrient.ideal} {nutrient.unit}, Needed: {requirement > 0 ? requirement.toFixed(1) : 0} {nutrient.unit}.<br />
                        Select a fertilizer below to fulfill this nutrient requirement.<br />
                        {(() => {
                          const deviation = newValue - nutrient.ideal;
                          const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                          const deviationKgHa = (Number(ppmToKgHa(newValue)) - Number(ppmToKgHa(nutrient.ideal))).toFixed(1);
                          let deviationColor = 'text-green-700 font-semibold';
                          if (percentDiff < -25) deviationColor = 'text-red-600 font-semibold';
                          else if (percentDiff > 25) deviationColor = 'text-blue-700 font-bold';
                          return (
                            <span className={`text-xs ${deviationColor}`}>
                              Deviation: {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}% (
                                {deviation >= 0 ? '+' : ''}{deviation.toFixed(1)} {nutrient.unit}, {deviationKgHa} kg/ha)
                            </span>
                          );
                        })()}
                        {(() => {
                          // Check if this nutrient was affected by another fertilizer selection
                          let explanation = '';
                          Object.entries(selectedFertilizers).forEach(([otherNutrient, fertList]) => {
                            if (otherNutrient !== nutrient.name) {
                              fertList.forEach(fertName => {
                                const fertObj = fertilizers[otherNutrient]?.find(f => f.name === fertName);
                                if (fertObj && fertObj.contains && fertObj.contains.includes(nutrient.name)) {
                                  const percent = fertObj.nutrientContent[nutrient.name] || 0;
                                  const rate = fertilizerRates[fertName];
                                  if (rate) {
                                    const added = (rate * percent) / 100;
                                    if (added > 0) {
                                      explanation += `The value for ${nutrient.name} increased by ${added.toFixed(1)} ${nutrient.unit} because ${otherNutrient} was treated with ${fertObj.name}, which also contains ${nutrient.name}. `;
                                    }
                                  }
                                }
                              });
                            }
                          });
                          if (explanation) {
                            return <div className="text-xs text-blue-700 mt-1">{explanation}</div>;
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-black">{nutrient.name}</h4>
                        <span className="text-sm font-medium text-blue-600">
                          New: {newValue.toFixed(1)}{nutrient.unit}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Original</span>
                            <Progress value={Math.min((nutrient.current / nutrient.ideal) * 100, 100)} className="h-2 [&>div]:bg-gray-400 flex-1" />
                            <span className="text-xs ml-2">{nutrient.current.toFixed(1)} {nutrient.unit} ({ppmToKgHa(nutrient.current)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">New</span>
                            <Progress
                              value={Math.min((newValue / nutrient.ideal) * 100, 100)}
                              className={`h-2 flex-1 ${(() => {
                                const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                                if (percentDiff > 25) return '[&>div]:bg-blue-600';
                                if (percentDiff < -25) return '[&>div]:bg-red-600';
                                return '[&>div]:bg-green-500';
                              })()}`}
                            />
                            <span className="text-xs ml-2">{newValue.toFixed(1)} {nutrient.unit} ({ppmToKgHa(newValue)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Requirement</span>
                            <Progress value={Math.max(((nutrient.ideal - newValue) / nutrient.ideal) * 100, 0)} className="h-2 [&>div]:bg-cyan-400 flex-1" />
                            <span className="text-xs ml-2">{Math.max(nutrient.ideal - newValue, 0).toFixed(1)} {nutrient.unit} ({ppmToKgHa(Math.max(nutrient.ideal - newValue, 0))} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Target</span>
                            <Progress value={100} className="h-2 [&>div]:bg-green-600 flex-1" />
                            <span className="text-xs ml-2">{nutrient.ideal} {nutrient.unit} ({ppmToKgHa(nutrient.ideal)} kg/ha)</span>
                          </div>
                        </div>
                        {newValue > nutrient.ideal * 1.5 && (
                          <div className="mt-1 text-xs text-blue-700 font-semibold">Excessive: Value is more than 50% above target!</div>
                        )}
                      </div>
                      
                      <div className="flex flex-row gap-4 items-end w-full">
                        <div className="flex flex-col flex-[2_2_0%] min-w-0">
                          <Label className="block text-sm font-medium text-black mb-1">Select Fertilizer:</Label>
                          {selectedFertilizerList.map((fertName, fertIdx) => {
                            const fertObj = availableFertilizers.find(f => f.name === fertName);
                            // Calculate the current value after previous fertilizers for this nutrient
                            const currentValueForThisDropdown = getCurrentValueAfterPreviousFerts(nutrient, selectedFertilizerList, fertIdx);
                            const { cappedValue, capSentence, limitingWarning } = calculateRequirement(nutrient, fertObj);
                            // Calculate how much of this nutrient has already been added by other selected fertilizers (excluding this fertilizer)
                            let alreadyAdded = 0;
                            Object.entries(selectedFertilizers).forEach(([otherNutrient, fertList]) => {
                              if (!Array.isArray(fertList)) return;
                              fertList.forEach(fertName2 => {
                                if (fertName2 === fertName && otherNutrient === nutrient.name) return;
                                const fertObj2 = fertilizers[otherNutrient]?.find(f => f.name === fertName2);
                                if (fertObj2 && fertObj2.nutrientContent[nutrient.name]) {
                                  const percent2 = fertObj2.nutrientContent[nutrient.name];
                                  const rate2 = fertilizerRates[fertName2] !== undefined ? fertilizerRates[fertName2] : 0;
                                  alreadyAdded += (rate2 * percent2) / 100;
                                }
                              });
                            });
                            const requirement = Math.max(nutrient.ideal - (nutrient.current + alreadyAdded), 0);
                            const percent = fertObj && fertObj.nutrientContent ? fertObj.nutrientContent[nutrient.name] || 0 : 0;
                            const uncapped = percent > 0 ? Number(((requirement * 100) / percent).toFixed(1)) : 0;
                            // Warnings
                            let overageWarning = '';
                            if (fertObj && fertObj.recommended && fertObj.contains && fertObj.contains.length > 1) {
                              fertObj.contains.forEach(cont => {
                                if (cont !== nutrient.name) {
                                  const nObj = nutrients.find(nu => nu.name === cont);
                                  if (nObj) {
                                    const added = (requirement * percent) / 100;
                                    const newValue = nObj.current + added;
                                    const percentOver = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                    if (percentOver > 20) {
                                      overageWarning += `Using this rate will exceed ${cont} target by ${percentOver.toFixed(1)}%. `;
                                    }
                                  }
                                }
                              });
                            }

                            // --- FIX: Move dropdown options logic outside JSX ---
                            const sortedFertilizers = [...availableFertilizers].sort((a, b) => {
                              const aPct = typeof a.nutrientContent[nutrient.name] === 'number' ? a.nutrientContent[nutrient.name] : 0;
                              const bPct = typeof b.nutrientContent[nutrient.name] === 'number' ? b.nutrientContent[nutrient.name] : 0;
                              return bPct - aPct;
                            });
                            const fertilizerOptions = sortedFertilizers.map(fert => {
                              if (!Array.isArray(fert.contains)) return null;
                              // Simulate selection for preview:
                              const simulatedSelectedFertilizerList = selectedFertilizerList.includes(fert.name)
                                ? selectedFertilizerList
                                : [...selectedFertilizerList, fert.name];
                              const currentValueForThisDropdown = getCurrentValueAfterPreviousFerts(nutrient, simulatedSelectedFertilizerList, simulatedSelectedFertilizerList.length - 1);
                              const tempNutrient = { ...nutrient, current: currentValueForThisDropdown };
                              const { cappedValue, capSentence } = calculateRequirement(tempNutrient, fert);
                              // Find limiting nutrient for this fertilizer
                              let limitingNutrient = '';
                              if (fert.contains && fert.contains.length > 1) {
                                let minRate = cappedValue;
                                for (const n of fert.contains) {
                                  const nObj = nutrients.find(nu => nu.name === n);
                                  const nPercent = fert.nutrientContent[n] || 0;
                                  if (nObj && nPercent > 0) {
                                    const maxN = nObj.ideal * 2.4 * (1 + allowedExcessPercent / 100); // convert to kg/ha
                                    const allowedNAdd = maxN - nObj.current * 2.4;
                                    const maxRate = allowedNAdd > 0 ? (allowedNAdd * 100) / nPercent : 0;
                                    if (maxRate < minRate) {
                                      minRate = maxRate;
                                      limitingNutrient = n;
                                    }
                                  }
                                }
                              }
                              // Check if any contained nutrient would exceed the threshold
                              const excessNutrients = fert.contains.map(n => {
                                const nObj = nutrients.find(nu => nu.name === n);
                                if (!nObj) return null;
                                const percent = typeof fert.nutrientContent[n] === 'number' ? fert.nutrientContent[n] : 0;
                                const added = (cappedValue * percent) / 100;
                                const newValue = nObj.current + added;
                                if (newValue > nObj.ideal * (1 + maxPostAppExcessPercent / 100)) {
                                  const percentOver = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                  return { name: n, newValue, ideal: nObj.ideal, percentOver };
                                }
                                return null;
                              }).filter(Boolean);
                              const hasExcess = excessNutrients.length > 0;
                              // Calculate uncapped for display
                              let alreadyAdded = 0;
                              Object.entries(selectedFertilizers).forEach(([otherNutrient, fertList]) => {
                                if (!Array.isArray(fertList)) return;
                                fertList.forEach(fertName2 => {
                                  if (fertName2 === fert.name && otherNutrient === nutrient.name) return;
                                  const fertObj2 = fertilizers[otherNutrient]?.find(f => f.name === fertName2);
                                  if (fertObj2 && fertObj2.nutrientContent[nutrient.name]) {
                                    const percent2 = fertObj2.nutrientContent[nutrient.name];
                                    const rate2 = fertilizerRates[fertName2] !== undefined ? fertilizerRates[fertName2] : 0;
                                    alreadyAdded += (rate2 * percent2) / 100;
                                  }
                                });
                              });
                              const requirement = Math.max(nutrient.ideal - (nutrient.current + alreadyAdded), 0);
                              const percent = fert && fert.nutrientContent ? fert.nutrientContent[nutrient.name] || 0 : 0;
                              const uncapped = percent > 0 ? Number(((requirement * 100) / percent).toFixed(1)) : 0;
                              // Warnings
                              let overageWarning = '';
                              if (fert && fert.recommended && fert.contains && fert.contains.length > 1) {
                                fert.contains.forEach(cont => {
                                  if (cont !== nutrient.name) {
                                    const nObj = nutrients.find(nu => nu.name === cont);
                                    if (nObj) {
                                      const added = (requirement * percent) / 100;
                                      const newValue = nObj.current + added;
                                      const percentOver = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                      if (percentOver > 20) {
                                        overageWarning += `Using this rate will exceed ${cont} target by ${percentOver.toFixed(1)}%. `;
                                      }
                                    }
                                  }
                                });
                              }
                              return (
                                <SelectItem key={fert.name} value={fert.name}>
                                  <div className={`flex flex-col gap-0.5 ${hasExcess ? 'text-yellow-700' : ''}`}>
                                    <div className="flex items-center gap-2">
                                      {hasExcess ? (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <span className="flex items-center cursor-pointer"><AlertTriangle className="h-4 w-4 text-yellow-500" /></span>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80 z-50">
                                            <div className="text-sm text-yellow-800 font-semibold mb-1">Warning: This fertilizer may push some nutrients above the allowed excess after application.</div>
                                            <ul className="text-xs text-yellow-800 list-disc ml-4">
                                              {excessNutrients.map(en => (
                                                <li key={en.name}>{en.name}: New value {en.newValue.toFixed(2)} (target {en.ideal}), {en.percentOver.toFixed(1)}% above target</li>
                                              ))}
                                            </ul>
                                            <div className="text-xs text-yellow-700 mt-2">You can still select this fertilizer, but use caution.</div>
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        fert && fert.recommended ? (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                        )
                                      )}
                                      <span className={fert && fert.recommended && !hasExcess ? 'font-medium' : ''}>
                                        <a
                                          href={`https://www.nutri-tech.com.au/products/${fert.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={hasExcess ? 'text-yellow-700' : 'text-blue-600 hover:underline'}
                                        >
                                          {fert.name} {fert && fert.nutrientContent && ` [${Object.entries(fert.nutrientContent).map(([n, p]) => `${n} ${p}%`).join(', ')}]`}
                                        </a>
                                        {uncapped > 0 && cappedValue < uncapped
                                          ? ` (${uncapped} kg/ha, capped at ${cappedValue} kg/ha)`
                                          : uncapped > 0
                                            ? ` (${cappedValue} kg/ha)`
                                            : ''}
                                      </span>
                                    </div>
                                    {capSentence && !hasExcess && (
                                      <span className="text-xs text-yellow-600">{capSentence}</span>
                                    )}
                                    {cappedValue < uncapped && limitingNutrient && !hasExcess && (
                                      <span className="text-xs text-yellow-600">Rate capped due to {limitingNutrient} excess</span>
                                    )}
                                    <div className="text-xs text-gray-600">{fert.limitingWarning}</div>
                                    {overageWarning && !hasExcess && (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="ghost" size="sm" className="p-0 h-4 w-4 ml-1" title="Nutrient overage warning">
                                            <Info className="h-3 w-3 text-blue-500" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 z-50">
                                          <p className="text-sm text-blue-700 font-semibold">{overageWarning}</p>
                                        </PopoverContent>
                                      </Popover>
                                    )}
                                    {!hasExcess && (
                                      <div className="text-xs text-cyan-700 font-semibold mt-0.5">Recommended rate: {cappedValue} kg/ha</div>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            });
                            // --- END FIX ---

                            return (
                              <div key={fertName || fertIdx} className="flex items-end gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <Select
                                    value={fertName}
                                    onValueChange={value => {
                                      if (selectedFertilizerList.includes(value)) return;
                                      handleFertilizerSelect(nutrient.name, value, fertIdx, selectedFertilizerList);
                                    }}
                                  >
                                    <SelectTrigger className="bg-white w-full h-10">
                                      <SelectValue placeholder="Choose fertilizer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No fertilizer</SelectItem>
                                      {fertilizerOptions}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="w-32 flex flex-col">
                                  <Label className="block text-xs font-medium text-gray-700 mb-0.5">Application Rate (kg/ha)</Label>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      value={(() => {
                                        if (!fertName || !fertObj) return '';
                                        const capped = calculateRequirement(nutrient, fertObj).cappedValue;
                                        // Always use capped value as default, even if user previously changed it
                                        return capped;
                                      })()}
                                      onChange={e => handleRateChange(fertName, Number(e.target.value))}
                                      placeholder="Enter rate"
                                      className="bg-white h-10 w-20"
                                      disabled={!isFirstOccurrence && fertIdx === 0}
                                    />
                                  </div>
                                </div>
                                {selectedFertilizerList.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 text-red-500"
                                    onClick={() => {
                                      setSelectedFertilizers(prev => {
                                        const arr = [...selectedFertilizerList];
                                        arr.splice(fertIdx, 1);
                                        return { ...prev, [nutrient.name]: arr };
                                      });
                                    }}
                                  >Remove</Button>
                                )}
                              </div>
                            );
                          })}
                          {selectedFertilizerList.length < 4 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 bg-[#8cb43a] hover:bg-[#7ca32e] text-white"
                              onClick={() => {
                                setSelectedFertilizers(prev => ({
                                  ...prev,
                                  [nutrient.name]: [...selectedFertilizerList, '']
                                }));
                              }}
                            >
                              Add Product
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 ml-2"
                            onClick={() => {
                              setSelectedFertilizers(prev => {
                                const updated = { ...prev };
                                delete updated[nutrient.name];
                                return updated;
                              });
                              setFertilizerRates(prev => {
                                const updated = { ...prev };
                                (selectedFertilizerList || []).forEach(f => { delete updated[f]; });
                                return updated;
                              });
                            }}
                          >Reset</Button>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="mt-4 p-3 bg-green-100 rounded-lg">
                          <div className="text-sm text-green-800 space-y-1">
                            {/* List each selected fertilizer and its contributions */}
                            {selectedFertilizerList.map((fertName, idx) => {
                              const fertObj = availableFertilizers.find(f => f.name === fertName);
                              if (!fertObj) return null;
                              const rate = fertilizerRates[fertName] !== undefined ? fertilizerRates[fertName] : calculateRequirement(nutrient, fertObj).cappedValue;
                              // Main nutrient contribution
                              const mainPercent = fertObj.nutrientContent[nutrient.name] || 0;
                              const mainAdded = (rate * mainPercent) / 100;
                              return (
                                <div key={fertName} className="mb-1">
                                  <span className="font-medium">{`Applying ${Math.round(rate)} kg/ha of ${fertName}`}</span>
                                  {mainPercent > 0 && (
                                    <span>{` adds ${mainAdded.toFixed(1)} ${nutrient.unit} of ${nutrient.name}`}</span>
                                  )}
                                  {fertObj.contains && fertObj.contains.length > 1 && (
                                    <>
                                      <span> (also adds: </span>
                                      {fertObj.contains.filter(n => n !== nutrient.name).map((other, i) => {
                                        const nObj = nutrients.find(nu => nu.name === other);
                                        const unit = nObj ? nObj.unit : '';
                                        const percent = typeof fertObj.nutrientContent[other] === 'number' ? fertObj.nutrientContent[other] : 0;
                                        const added = (rate * percent) / 100;
                                        return (
                                          <span key={other}>
                                            {other}: {added.toFixed(1)} {unit}{i < fertObj.contains.filter(n => n !== nutrient.name).length - 1 ? ', ' : ''}
                                          </span>
                                        );
                                      })}
                                      <span>)</span>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                            {/* Total summary */}
                            <div className="mt-2">
                              <span>
                                Total new value: <span className="font-semibold">{newValue.toFixed(1)} {nutrient.unit}</span> (target: {nutrient.ideal} {nutrient.unit})
                              </span>
                              {(() => {
                                const deviation = newValue - nutrient.ideal;
                                const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                                const deviationKgHa = (Number(ppmToKgHa(newValue)) - Number(ppmToKgHa(nutrient.ideal))).toFixed(1);
                                let deviationColor = 'text-green-700 font-semibold';
                                if (percentDiff < -25) deviationColor = 'text-red-600 font-semibold';
                                else if (percentDiff > 25) deviationColor = 'text-blue-700 font-bold';
                                return (
                                  <span className={`text-xs ${deviationColor}`}>
                                    Deviation: {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}% (
                                      {deviation >= 0 ? '+' : ''}{deviation.toFixed(1)} {nutrient.unit}, {deviationKgHa} kg/ha)
                                  </span>
                                );
                              })()}
                              <br />
                              <span>
                                Still needed to reach target: {(nutrient.ideal - newValue).toFixed(1)} {nutrient.unit}.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
      {renderFertilizerSummaryCards()}
    </>
  );
};

export default SoilAmendments;