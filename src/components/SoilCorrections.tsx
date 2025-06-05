import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import ReportSection from './ReportSection';
import { CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

// Fertilizer definitions (should match those in SoilReportGenerator)
const fertilizerDefs = [
  { label: 'Agricultural Limestone (CaCO₃)', nutrientContent: { Calcium: 38 } },
  { label: 'Gypsum (Calcium Sulfate)', nutrientContent: { Calcium: 23, Sulphur: 18 } },
  { label: 'Calcium Nitrate', nutrientContent: { Calcium: 19, Nitrate: 12 } },
  { label: 'Dolomitic Lime', nutrientContent: { Calcium: 21, Magnesium: 11 } },
  { label: 'Kieserite (Magnesium Sulfate Monohydrate)', nutrientContent: { Magnesium: 16, Sulphur: 22 } },
  { label: 'Epsom Salt (Magnesium Sulfate Heptahydrate)', nutrientContent: { Magnesium: 10, Sulphur: 13 } },
  { label: 'Muriate of Potash (Potassium Chloride)', nutrientContent: { Potassium: 60 } },
  { label: 'Sulfate of Potash (Potassium Sulfate)', nutrientContent: { Potassium: 50, Sulphur: 17 } },
  { label: 'Potassium Nitrate', nutrientContent: { Potassium: 44, Nitrate: 13 } },
  { label: 'Triple Superphosphate', nutrientContent: { Phosphorus: 45, Calcium: 19 } },
  { label: 'Monoammonium Phosphate (MAP)', nutrientContent: { Phosphorus: 22, Ammonium: 11 } },
  { label: 'Diammonium Phosphate (DAP)', nutrientContent: { Phosphorus: 20, Ammonium: 18 } },
  { label: 'Rock Phosphate', nutrientContent: { Phosphorus: 25, Calcium: 30 } },
  { label: 'Elemental Sulfur', nutrientContent: { Sulphur: 90 } },
  { label: 'Ammonium Sulfate', nutrientContent: { Ammonium: 21, Sulphur: 24 } },
  { label: 'Zinc Sulfate (ZnSO₄)', nutrientContent: { Zinc: 23, Sulphur: 17.9 } },
  { label: 'Copper Sulfate (CuSO₄)', nutrientContent: { Copper: 25, Sulphur: 12.8 } },
  { label: 'Manganese Sulfate (MnSO₄)', nutrientContent: { Manganese: 31, Sulphur: 18 } },
  { label: 'Iron Sulfate (FeSO₄)', nutrientContent: { Iron: 19.7, Sulphur: 11.4 } },
  { label: 'Borax', nutrientContent: { Boron: 11.3 } },
  { label: 'Soluble Boron', nutrientContent: { Boron: 20 } },
  { label: 'Sodium Molybdate', nutrientContent: { Molybdenum: 39 } },
  // Add more as needed
];

function getFertilizersForNutrient(nutrient) {
  // Return only fertilizers that contain this nutrient
  return fertilizerDefs.filter(f => f.nutrientContent && Object.keys(f.nutrientContent).includes(nutrient));
}

function ppmToKgHa(ppm) {
  return (Number(ppm) * 2.4).toFixed(1);
}

const SoilCorrections = ({ nutrients, soilAmendmentsSummary, setSoilAmendmentsSummary }) => {
  // For each nutrient with status 'low', show a correction card
  const deficientNutrients = nutrients.filter(
    n => n.status === 'low' &&
      n.category !== 'lamotte_reams' &&
      n.category !== 'tae' &&
      n.category !== 'base_saturation' &&
      ![
        'paramagnetism',
        'organic_matter_calc',
        'organic_carbon_leco',
        'conductivity_1_5_water',
        'ca_mg_ratio'
      ].includes((n.name || '').toLowerCase())
  );

  // Main nutrient names and order
  const mainNutrientOrder = ['calcium', 'magnesium', 'potassium', 'phosphorus', 'sulphur'];
  // Split into main and secondary
  const mainDeficientNutrients = mainNutrientOrder
    .map(main => deficientNutrients.find(n => (n.genericName || n.name || '').toLowerCase() === main))
    .filter(Boolean);
  const secondaryDeficientNutrients = deficientNutrients.filter(
    n => !mainNutrientOrder.includes((n.genericName || n.name || '').toLowerCase())
  );

  // Local state for selected fertilizer and rate per nutrient
  const [fertSelections, setFertSelections] = useState({}); // { [nutrientName]: { fertLabel, rate } }
  // State for max allowed excess percentage
  const [maxAllowedExcess, setMaxAllowedExcess] = useState(25);

  // Helper: get total applied for a nutrient from summary
  function getTotalApplied(nutrient) {
    return soilAmendmentsSummary
      .filter(item => item.nutrient === nutrient)
      .reduce((sum, item) => sum + (item.actualNutrientApplied || 0), 0);
  }

  // Handler for fertilizer selection and rate
  function handleApplyFertilizer(nutrient, fertLabel, rate) {
    const fert = fertilizerDefs.find(f => f.label === fertLabel);
    if (!fert) return;
    const percent = fert.nutrientContent[nutrient] || 0;
    const actualNutrientApplied = (rate * percent) / 100;
    // Remove previous applications for this nutrient/fertilizer
    const filtered = soilAmendmentsSummary.filter(item => !(item.nutrient === nutrient && item.fertilizer === fertLabel));
    setSoilAmendmentsSummary([
      ...filtered,
      {
        fertilizer: fertLabel,
        nutrient,
        rate,
        actualNutrientApplied,
        unit: 'kg/ha',
        contains: Object.keys(fert.nutrientContent),
        recommended: true,
        nutrientsFor: [nutrient],
      },
    ]);
    // Clear selection for this nutrient
    setFertSelections(prev => ({ ...prev, [nutrient]: { fertLabel: '', rate: 100 } }));
  }

  return (
    <ReportSection title="Soil Corrections" infoContent="Apply corrections for deficient nutrients using the latest soil data. This section is always in sync with the main report.">
      <div className="flex justify-end items-center mb-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-full hover:bg-gray-200" title="Adjust max allowed excess">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="mb-2 font-semibold text-gray-800">Max Allowed Excess (%)</div>
            <input
              type="range"
              min={5}
              max={50}
              value={maxAllowedExcess}
              onChange={e => setMaxAllowedExcess(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
            <div className="text-center text-cyan-700 font-semibold mt-1">{maxAllowedExcess}%</div>
            <div className="text-xs text-gray-500 mt-2">Fertilizers will not be recommended if any nutrient exceeds its target by more than this percentage.</div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-6 mt-6">
        {mainDeficientNutrients.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-black mb-2">Main Soil Corrections</h3>
            {mainDeficientNutrients.map(nutrient => {
              const totalApplied = getTotalApplied(nutrient.name);
              const newValue = nutrient.current + (totalApplied / 2.4);
              const availableFerts = getFertilizersForNutrient(nutrient.genericName || nutrient.name);
              const selection = fertSelections[nutrient.name] || { fertLabel: '', rate: 100 };
              return (
                <Card key={nutrient.name} className="bg-white border-gray-200 mb-4">
                  <CardHeader>
                    <CardTitle className="text-black text-lg">{nutrient.genericName || nutrient.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* No duplicate current/target display, only summary below */}

                    {/* --- Deviation and Requirement Summary --- */}
                    {(function() {
                      // Sum all added from all selected fertilizers for ALL nutrients
                      let totalAdded = 0;
                      Object.keys(fertSelections).forEach(nutrKey => {
                        const selections = fertSelections[nutrKey] || [];
                        selections.forEach(sel => {
                          if (sel.fertLabel && sel.fertLabel !== 'none') {
                            // Find the fertilizer in the full list (not just availableFerts)
                            const fert = fertilizerDefs.find(f => f.label === sel.fertLabel);
                            if (fert) {
                              const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              totalAdded += (sel.rate * percent) / 100 / 2.4;
                            }
                          }
                        });
                      });
                      const newValue = nutrient.current + totalAdded;
                      const deviation = newValue - nutrient.ideal;
                      const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                      const requirement = Math.max(nutrient.ideal - newValue, 0);
                      const deviationKgHa = (Number(ppmToKgHa(newValue)) - Number(ppmToKgHa(nutrient.ideal))).toFixed(1);
                      const requirementKgHa = ppmToKgHa(requirement);
                      let deviationColor = 'text-green-700 font-semibold';
                      if (percentDiff < -25 || percentDiff > 25) deviationColor = 'text-red-600 font-semibold';
                      return (
                        <div className="mb-1">
                          <span className="font-semibold">{nutrient.genericName || nutrient.name}:</span>
                          <span> Current: {nutrient.current} {nutrient.unit}, Target: {nutrient.ideal} {nutrient.unit}, Needed: {requirement.toFixed(1)} {nutrient.unit}.</span>
                          <br />
                          <span className={deviationColor}>
                            Deviation: {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}% ({deviation >= 0 ? '+' : ''}{deviation.toFixed(1)} {nutrient.unit}, {deviationKgHa} kg/ha)
                          </span>
                        </div>
                      );
                    })()}

                    {/* --- Progress Bars (restored) --- */}
                    {(function() {
                      // Sum all added from all selected fertilizers for ALL nutrients
                      let totalAdded = 0;
                      Object.keys(fertSelections).forEach(nutrKey => {
                        const selections = fertSelections[nutrKey] || [];
                        selections.forEach(sel => {
                          if (sel.fertLabel && sel.fertLabel !== 'none') {
                            // Find the fertilizer in the full list (not just availableFerts)
                            const fert = fertilizerDefs.find(f => f.label === sel.fertLabel);
                            if (fert) {
                              const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              totalAdded += (sel.rate * percent) / 100 / 2.4;
                            }
                          }
                        });
                      });
                      const newValue = nutrient.current + totalAdded;
                      const requirement = Math.max(nutrient.ideal - newValue, 0);
                      // Bar values (all as % of target)
                      const originalPct = Math.min((nutrient.current / nutrient.ideal) * 100, 100);
                      const newPct = Math.min((newValue / nutrient.ideal) * 100, 100);
                      const reqPct = Math.min((requirement / nutrient.ideal) * 100, 100);
                      // Bar color for 'New'
                      const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                      const newBarColor = (percentDiff < -25 || percentDiff > 25) ? '[&>div]:bg-red-600' : '[&>div]:bg-green-500';
                      return (
                        <div className="space-y-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Original</span>
                            <Progress value={originalPct} className="h-2 [&>div]:bg-gray-400 flex-1" />
                            <span className="text-xs ml-2">{nutrient.current.toFixed(1)} {nutrient.unit} ({ppmToKgHa(nutrient.current)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">New</span>
                            <Progress value={newPct} className={`h-2 flex-1 ${newBarColor}`} />
                            <span className="text-xs ml-2">{newValue.toFixed(1)} {nutrient.unit} ({ppmToKgHa(newValue)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Requirement</span>
                            <Progress value={reqPct} className="h-2 [&>div]:bg-cyan-400 flex-1" />
                            <span className="text-xs ml-2">{requirement.toFixed(1)} {nutrient.unit} ({ppmToKgHa(requirement)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Target</span>
                            <Progress value={100} className="h-2 [&>div]:bg-green-600 flex-1" />
                            <span className="text-xs ml-2">{nutrient.ideal} {nutrient.unit} ({ppmToKgHa(nutrient.ideal)} kg/ha)</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* --- Total Recommended Value --- */}
                    {(function() {
                      // Sum all added from all selected fertilizers for ALL nutrients
                      let totalAddedPpm = 0;
                      Object.keys(fertSelections).forEach(nutrKey => {
                        const selections = fertSelections[nutrKey] || [];
                        selections.forEach(sel => {
                          if (sel.fertLabel && sel.fertLabel !== 'none') {
                            const fert = fertilizerDefs.find(f => f.label === sel.fertLabel);
                            if (fert) {
                              const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              totalAddedPpm += (sel.rate * percent) / 100 / 2.4;
                            }
                          }
                        });
                      });
                      const totalAddedKgHa = (totalAddedPpm * 2.4).toFixed(1);
                      return (
                        <>
                          <div className="mb-2 text-sm text-blue-800 font-semibold">
                            Total Recommended: {totalAddedPpm.toFixed(1)} ppm ({totalAddedKgHa} kg/ha)
                          </div>
                          {/* --- Breakdown of sources --- */}
                          <div className="mb-2 text-xs text-gray-700">
                            <strong>Source breakdown:</strong>
                            <ul className="list-disc ml-5">
                              {Object.keys(fertSelections).map(nutrKey => {
                                const selections = fertSelections[nutrKey] || [];
                                return selections.map((sel, idx) => {
                                  if (sel.fertLabel && sel.fertLabel !== 'none') {
                                    const fert = fertilizerDefs.find(f => f.label === sel.fertLabel);
                                    if (fert) {
                                      const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                      if (percent > 0) {
                                        const addedPpm = (sel.rate * percent) / 100 / 2.4;
                                        const addedKgHa = (addedPpm * 2.4).toFixed(1);
                                        return (
                                          <li key={nutrKey + '-' + idx}>
                                            {fert.label}: {addedPpm.toFixed(2)} ppm ({addedKgHa} kg/ha)
                                          </li>
                                        );
                                      }
                                    }
                                  }
                                  return null;
                                });
                              })}
                            </ul>
                          </div>
                        </>
                      );
                    })()}

                    {/* --- Multiple Fertilizer Selectors --- */}
                    {(fertSelections[nutrient.name] || []).map((sel, idx) => {
                      // Calculate recommended rate for this fertilizer
                      const fert = availableFerts.find(f => f.label === sel.fertLabel);
                      let recommendedRate = sel.rate;
                      if (fert) {
                        const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                        // Calculate requirement left after previous selectors for main nutrient
                        let prevAdded = 0;
                        (fertSelections[nutrient.name] || []).forEach((s, i) => {
                          if (i < idx && s.fertLabel && s.fertLabel !== 'none') {
                            const f = availableFerts.find(ff => ff.label === s.fertLabel);
                            if (f) {
                              const pct = f.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              prevAdded += (s.rate * pct) / 100 / 2.4;
                            }
                          }
                        });
                        const needed = Math.max(nutrient.ideal - (nutrient.current + prevAdded), 0);
                        const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                        // Now, for each other nutrient in the fertilizer, calculate the max rate that keeps it <= 115% of target
                        let cappedRate = uncappedRate;
                        let limitingNutrient = null;
                        let limitingReason = '';
                        Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                          if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                          // Find the nutrient object
                          const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                          if (!nObj) return;
                          // Calculate total added from all other selected fertilizers for this nutrient
                          let alreadyAdded = 0;
                          Object.keys(fertSelections).forEach(nutrKey => {
                            const selections = fertSelections[nutrKey] || [];
                            selections.forEach(sel => {
                              if (sel.fertLabel && sel.fertLabel !== 'none') {
                                const f2 = fertilizerDefs.find(f => f.label === sel.fertLabel);
                                if (f2) {
                                  const pct2 = f2.nutrientContent[otherNutrient] || 0;
                                  alreadyAdded += (sel.rate * pct2) / 100 / 2.4;
                                }
                              }
                            });
                          });
                          // Allow up to 15% above target if this nutrient is also deficient, else do not exceed 15% above target
                          const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                          const maxToAdd = maxAllowed - (nObj.current + alreadyAdded);
                          const maxRate = pct > 0 ? ((maxToAdd * 100 * 2.4) / pct) : Infinity;
                          if (maxRate < cappedRate) {
                            cappedRate = Math.max(0, Number(maxRate.toFixed(1)));
                            limitingNutrient = otherNutrient;
                            limitingReason = `Full rate to reach target is ${uncappedRate} kg/ha, but capped at ${cappedRate} kg/ha due to ${otherNutrient} exceeding target by more than ${maxAllowedExcess}%`;
                          }
                        });
                        recommendedRate = cappedRate;
                        // Store uncapped/capped/limitingReason for display
                        sel._uncappedRate = uncappedRate;
                        sel._cappedRate = cappedRate;
                        sel._limitingNutrient = limitingNutrient;
                        sel._limitingReason = limitingReason;
                      }
                      // Check if this fertilizer would cause any nutrient to exceed maxAllowedExcess
                      let wouldExceed = false;
                      let exceedNutrient = '';
                      let exceedAmount = 0;
                      Object.entries(fert ? fert.nutrientContent : {}).forEach(([otherNutrient, pct]) => {
                        if (!pct) return;
                        const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                        if (!nObj) return;
                        // Calculate total added from all other selected fertilizers for this nutrient, plus this one at recommendedRate
                        let alreadyAdded = 0;
                        Object.keys(fertSelections).forEach(nutrKey => {
                          const selections = fertSelections[nutrKey] || [];
                          selections.forEach(sel => {
                            if (sel.fertLabel && sel.fertLabel !== 'none') {
                              const f2 = fertilizerDefs.find(f => f.label === sel.fertLabel);
                              if (f2) {
                                const pct2 = f2.nutrientContent[otherNutrient] || 0;
                                alreadyAdded += (sel.rate * pct2) / 100 / 2.4;
                              }
                            }
                          });
                        });
                        const addedByThis = (recommendedRate * pct) / 100 / 2.4;
                        const newValue = nObj.current + alreadyAdded + addedByThis;
                        const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                        if (newValue > maxAllowed) {
                          wouldExceed = true;
                          exceedNutrient = otherNutrient;
                          exceedAmount = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                        }
                      });
                      return (
                        <div key={idx} className="flex gap-4 items-end mb-2">
                          <div className="flex-1">
                            <Select
                              value={sel.fertLabel}
                              onValueChange={fertLabel => {
                                // When fertilizer changes, set recommended rate
                                let rate = sel.rate;
                                const fert = availableFerts.find(f => f.label === fertLabel);
                                if (fert) {
                                  const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                  // Calculate requirement left after previous selectors for main nutrient
                                  let prevAdded = 0;
                                  (fertSelections[nutrient.name] || []).forEach((s, i) => {
                                    if (i < idx && s.fertLabel && s.fertLabel !== 'none') {
                                      const f = availableFerts.find(ff => ff.label === s.fertLabel);
                                      if (f) {
                                        const pct = f.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                        prevAdded += (s.rate * pct) / 100 / 2.4;
                                      }
                                    }
                                  });
                                  const needed = Math.max(nutrient.ideal - (nutrient.current + prevAdded), 0);
                                  const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                                  let cappedRate = uncappedRate;
                                  let limitingNutrient = null;
                                  Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                    if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                                    const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                    if (!nObj) return;
                                    const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                    const maxToAdd = maxAllowed - nObj.current;
                                    const maxRate = pct > 0 ? ((maxToAdd * 100 * 2.4) / pct) : Infinity;
                                    if (maxRate < cappedRate) {
                                      cappedRate = Math.max(0, Number(maxRate.toFixed(1)));
                                      limitingNutrient = otherNutrient;
                                    }
                                  });
                                  rate = cappedRate;
                                }
                                setFertSelections(prev => {
                                  const arr = [...(prev[nutrient.name] || [])];
                                  arr[idx] = { fertLabel, rate };
                                  return { ...prev, [nutrient.name]: arr };
                                });
                              }}
                            >
                              <SelectTrigger className="bg-white w-full h-10">
                                <SelectValue placeholder="Choose fertilizer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem key="none" value="none">
                                  <span>No fertilizer</span>
                                </SelectItem>
                                {availableFerts.map(fert => {
                                  const isRecommended = true;
                                  const isLowContent = (fert.nutrientContent[nutrient.genericName || nutrient.name] || 0) < 1;
                                  const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                  const contentString = Object.entries(fert.nutrientContent)
                                    .map(([k, v]) => `${k} ${v}%`).join(', ');
                                  // --- Calculate recommended rate for this dropdown item ---
                                  const needed = Math.max(nutrient.ideal - nutrient.current, 0);
                                  const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                                  let cappedRate = uncappedRate;
                                  let limitingNutrient = null;
                                  Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                    if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                                    const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                    if (!nObj) return;
                                    const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                    const maxToAdd = maxAllowed - nObj.current;
                                    const maxRate = pct > 0 ? ((maxToAdd * 100 * 2.4) / pct) : Infinity;
                                    if (maxRate < cappedRate) {
                                      cappedRate = Math.max(0, Number(maxRate.toFixed(1)));
                                      limitingNutrient = otherNutrient;
                                    }
                                  });
                                  const recommendedRate = cappedRate;
                                  // Check if this fertilizer would cause any nutrient to exceed maxAllowedExcess
                                  let wouldExceed = false;
                                  let exceedNutrient = '';
                                  let exceedAmount = 0;
                                  Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                    if (!pct) return;
                                    const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                    if (!nObj) return;
                                    const addedByThis = (recommendedRate * pct) / 100 / 2.4;
                                    const newValue = nObj.current + addedByThis;
                                    const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                    if (newValue > maxAllowed) {
                                      wouldExceed = true;
                                      exceedNutrient = otherNutrient;
                                      exceedAmount = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                    }
                                  });
                                  return (
                                    <SelectItem key={fert.label} value={fert.label} /* never disabled */>
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                          {wouldExceed ? (
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                          ) : isRecommended && !isLowContent ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                          ) : (
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                          )}
                                          <a
                                            href={`https://www.nutri-tech.com.au/products/${fert.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={wouldExceed ? "text-yellow-700 hover:underline font-medium" : "text-blue-700 hover:underline font-medium"}
                                          >
                                            {fert.label}
                                          </a>
                                          <span className="text-xs text-gray-700 ml-1">[{contentString}]</span>
                                          <span className={wouldExceed ? "text-xs text-yellow-700 ml-2" : "text-xs text-green-700 ml-2"}>
                                            {uncappedRate === cappedRate
                                              ? `(${uncappedRate} kg/ha)`
                                              : `(needed: ${uncappedRate} kg/ha, capped: ${cappedRate} kg/ha due to ${limitingNutrient})`}
                                          </span>
                                        </div>
                                        {wouldExceed && (
                                          <span className="text-xs text-yellow-700">Warning: would push {exceedNutrient} to {exceedAmount.toFixed(1)}% above target (limit: {maxAllowedExcess}%)</span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32 flex flex-col">
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Application Rate (kg/ha)</label>
                            <Input
                              type="number"
                              min={0}
                              value={sel.rate}
                              onChange={e => {
                                const rate = Number(e.target.value);
                                setFertSelections(prev => {
                                  const arr = [...(prev[nutrient.name] || [])];
                                  arr[idx] = { ...arr[idx], rate };
                                  return { ...prev, [nutrient.name]: arr };
                                });
                              }}
                              className="bg-white h-10 w-20"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 text-red-500"
                            onClick={() => {
                              setFertSelections(prev => {
                                const arr = [...(prev[nutrient.name] || [])];
                                arr.splice(idx, 1);
                                return { ...prev, [nutrient.name]: arr };
                              });
                            }}
                          >Remove</Button>
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-[#8cb43a] hover:bg-[#7ca32e] text-white"
                      onClick={() => {
                        setFertSelections(prev => ({
                          ...prev,
                          [nutrient.name]: [...(prev[nutrient.name] || []), { fertLabel: '', rate: 100 }]
                        }));
                      }}
                    >Add Fertilizer</Button>

                    {/* --- Show selected fertilizers summary --- */}
                    {(fertSelections[nutrient.name] || []).length > 0 && (
                      <div className="mt-2 text-xs text-gray-700">
                        <strong>Selected Fertilizers:</strong>
                        <ul className="list-disc ml-5">
                          {(fertSelections[nutrient.name] || []).map((sel, idx) => sel.fertLabel && sel.fertLabel !== 'none' ? (
                            <li key={idx}>{sel.fertLabel} ({sel.rate} kg/ha)</li>
                          ) : null)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {secondaryDeficientNutrients.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-black mb-2">Secondary Soil Corrections</h3>
            {secondaryDeficientNutrients.map(nutrient => {
              const totalApplied = getTotalApplied(nutrient.name);
              const newValue = nutrient.current + (totalApplied / 2.4);
              const availableFerts = getFertilizersForNutrient(nutrient.genericName || nutrient.name);
              const selection = fertSelections[nutrient.name] || { fertLabel: '', rate: 100 };
              return (
                <Card key={nutrient.name} className="bg-white border-gray-200 mb-4">
                  <CardHeader>
                    <CardTitle className="text-black text-lg">{nutrient.genericName || nutrient.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* No duplicate current/target display, only summary below */}

                    {/* --- Deviation and Requirement Summary --- */}
                    {(function() {
                      // Sum all added from all selected fertilizers for ALL nutrients
                      let totalAdded = 0;
                      Object.keys(fertSelections).forEach(nutrKey => {
                        const selections = fertSelections[nutrKey] || [];
                        selections.forEach(sel => {
                          if (sel.fertLabel && sel.fertLabel !== 'none') {
                            // Find the fertilizer in the full list (not just availableFerts)
                            const fert = fertilizerDefs.find(f => f.label === sel.fertLabel);
                            if (fert) {
                              const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              totalAdded += (sel.rate * percent) / 100 / 2.4;
                            }
                          }
                        });
                      });
                      const newValue = nutrient.current + totalAdded;
                      const deviation = newValue - nutrient.ideal;
                      const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                      const requirement = Math.max(nutrient.ideal - newValue, 0);
                      const deviationKgHa = (Number(ppmToKgHa(newValue)) - Number(ppmToKgHa(nutrient.ideal))).toFixed(1);
                      const requirementKgHa = ppmToKgHa(requirement);
                      let deviationColor = 'text-green-700 font-semibold';
                      if (percentDiff < -25 || percentDiff > 25) deviationColor = 'text-red-600 font-semibold';
                      return (
                        <div className="mb-1">
                          <span className="font-semibold">{nutrient.genericName || nutrient.name}:</span>
                          <span> Current: {nutrient.current} {nutrient.unit}, Target: {nutrient.ideal} {nutrient.unit}, Needed: {requirement.toFixed(1)} {nutrient.unit}.</span>
                          <br />
                          <span className={deviationColor}>
                            Deviation: {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}% ({deviation >= 0 ? '+' : ''}{deviation.toFixed(1)} {nutrient.unit}, {deviationKgHa} kg/ha)
                          </span>
                        </div>
                      );
                    })()}

                    {/* --- Progress Bars (restored) --- */}
                    {(function() {
                      // Sum all added from all selected fertilizers for ALL nutrients
                      let totalAdded = 0;
                      Object.keys(fertSelections).forEach(nutrKey => {
                        const selections = fertSelections[nutrKey] || [];
                        selections.forEach(sel => {
                          if (sel.fertLabel && sel.fertLabel !== 'none') {
                            // Find the fertilizer in the full list (not just availableFerts)
                            const fert = fertilizerDefs.find(f => f.label === sel.fertLabel);
                            if (fert) {
                              const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              totalAdded += (sel.rate * percent) / 100 / 2.4;
                            }
                          }
                        });
                      });
                      const newValue = nutrient.current + totalAdded;
                      const requirement = Math.max(nutrient.ideal - newValue, 0);
                      // Bar values (all as % of target)
                      const originalPct = Math.min((nutrient.current / nutrient.ideal) * 100, 100);
                      const newPct = Math.min((newValue / nutrient.ideal) * 100, 100);
                      const reqPct = Math.min((requirement / nutrient.ideal) * 100, 100);
                      // Bar color for 'New'
                      const percentDiff = ((newValue - nutrient.ideal) / nutrient.ideal) * 100;
                      const newBarColor = (percentDiff < -25 || percentDiff > 25) ? '[&>div]:bg-red-600' : '[&>div]:bg-green-500';
                      return (
                        <div className="space-y-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Original</span>
                            <Progress value={originalPct} className="h-2 [&>div]:bg-gray-400 flex-1" />
                            <span className="text-xs ml-2">{nutrient.current.toFixed(1)} {nutrient.unit} ({ppmToKgHa(nutrient.current)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">New</span>
                            <Progress value={newPct} className={`h-2 flex-1 ${newBarColor}`} />
                            <span className="text-xs ml-2">{newValue.toFixed(1)} {nutrient.unit} ({ppmToKgHa(newValue)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Requirement</span>
                            <Progress value={reqPct} className="h-2 [&>div]:bg-cyan-400 flex-1" />
                            <span className="text-xs ml-2">{requirement.toFixed(1)} {nutrient.unit} ({ppmToKgHa(requirement)} kg/ha)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-24">Target</span>
                            <Progress value={100} className="h-2 [&>div]:bg-green-600 flex-1" />
                            <span className="text-xs ml-2">{nutrient.ideal} {nutrient.unit} ({ppmToKgHa(nutrient.ideal)} kg/ha)</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* --- Total Recommended Value --- */}
                    {(function() {
                      // Sum all added from all selected fertilizers for ALL nutrients
                      let totalAddedPpm = 0;
                      Object.keys(fertSelections).forEach(nutrKey => {
                        const selections = fertSelections[nutrKey] || [];
                        selections.forEach(sel => {
                          if (sel.fertLabel && sel.fertLabel !== 'none') {
                            const fert = fertilizerDefs.find(f => f.label === sel.fertLabel);
                            if (fert) {
                              const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              totalAddedPpm += (sel.rate * percent) / 100 / 2.4;
                            }
                          }
                        });
                      });
                      const totalAddedKgHa = (totalAddedPpm * 2.4).toFixed(1);
                      return (
                        <>
                          <div className="mb-2 text-sm text-blue-800 font-semibold">
                            Total Recommended: {totalAddedPpm.toFixed(1)} ppm ({totalAddedKgHa} kg/ha)
                          </div>
                          {/* --- Breakdown of sources --- */}
                          <div className="mb-2 text-xs text-gray-700">
                            <strong>Source breakdown:</strong>
                            <ul className="list-disc ml-5">
                              {Object.keys(fertSelections).map(nutrKey => {
                                const selections = fertSelections[nutrKey] || [];
                                return selections.map((sel, idx) => {
                                  if (sel.fertLabel && sel.fertLabel !== 'none') {
                                    const fert = fertilizerDefs.find(f => f.label === sel.fertLabel);
                                    if (fert) {
                                      const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                      if (percent > 0) {
                                        const addedPpm = (sel.rate * percent) / 100 / 2.4;
                                        const addedKgHa = (addedPpm * 2.4).toFixed(1);
                                        return (
                                          <li key={nutrKey + '-' + idx}>
                                            {fert.label}: {addedPpm.toFixed(2)} ppm ({addedKgHa} kg/ha)
                                          </li>
                                        );
                                      }
                                    }
                                  }
                                  return null;
                                });
                              })}
                            </ul>
                          </div>
                        </>
                      );
                    })()}

                    {/* --- Multiple Fertilizer Selectors --- */}
                    {(fertSelections[nutrient.name] || []).map((sel, idx) => {
                      // Calculate recommended rate for this fertilizer
                      const fert = availableFerts.find(f => f.label === sel.fertLabel);
                      let recommendedRate = sel.rate;
                      if (fert) {
                        const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                        // Calculate requirement left after previous selectors for main nutrient
                        let prevAdded = 0;
                        (fertSelections[nutrient.name] || []).forEach((s, i) => {
                          if (i < idx && s.fertLabel && s.fertLabel !== 'none') {
                            const f = availableFerts.find(ff => ff.label === s.fertLabel);
                            if (f) {
                              const pct = f.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                              prevAdded += (s.rate * pct) / 100 / 2.4;
                            }
                          }
                        });
                        const needed = Math.max(nutrient.ideal - (nutrient.current + prevAdded), 0);
                        const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                        // Now, for each other nutrient in the fertilizer, calculate the max rate that keeps it <= 115% of target
                        let cappedRate = uncappedRate;
                        let limitingNutrient = null;
                        let limitingReason = '';
                        Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                          if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                          // Find the nutrient object
                          const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                          if (!nObj) return;
                          // Calculate total added from all other selected fertilizers for this nutrient
                          let alreadyAdded = 0;
                          Object.keys(fertSelections).forEach(nutrKey => {
                            const selections = fertSelections[nutrKey] || [];
                            selections.forEach(sel => {
                              if (sel.fertLabel && sel.fertLabel !== 'none') {
                                const f2 = fertilizerDefs.find(f => f.label === sel.fertLabel);
                                if (f2) {
                                  const pct2 = f2.nutrientContent[otherNutrient] || 0;
                                  alreadyAdded += (sel.rate * pct2) / 100 / 2.4;
                                }
                              }
                            });
                          });
                          // Allow up to 15% above target if this nutrient is also deficient, else do not exceed 15% above target
                          const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                          const maxToAdd = maxAllowed - (nObj.current + alreadyAdded);
                          const maxRate = pct > 0 ? ((maxToAdd * 100 * 2.4) / pct) : Infinity;
                          if (maxRate < cappedRate) {
                            cappedRate = Math.max(0, Number(maxRate.toFixed(1)));
                            limitingNutrient = otherNutrient;
                            limitingReason = `Full rate to reach target is ${uncappedRate} kg/ha, but capped at ${cappedRate} kg/ha due to ${otherNutrient} exceeding target by more than ${maxAllowedExcess}%`;
                          }
                        });
                        recommendedRate = cappedRate;
                        // Store uncapped/capped/limitingReason for display
                        sel._uncappedRate = uncappedRate;
                        sel._cappedRate = cappedRate;
                        sel._limitingNutrient = limitingNutrient;
                        sel._limitingReason = limitingReason;
                      }
                      // Check if this fertilizer would cause any nutrient to exceed maxAllowedExcess
                      let wouldExceed = false;
                      let exceedNutrient = '';
                      let exceedAmount = 0;
                      Object.entries(fert ? fert.nutrientContent : {}).forEach(([otherNutrient, pct]) => {
                        if (!pct) return;
                        const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                        if (!nObj) return;
                        // Calculate total added from all other selected fertilizers for this nutrient, plus this one at recommendedRate
                        let alreadyAdded = 0;
                        Object.keys(fertSelections).forEach(nutrKey => {
                          const selections = fertSelections[nutrKey] || [];
                          selections.forEach(sel => {
                            if (sel.fertLabel && sel.fertLabel !== 'none') {
                              const f2 = fertilizerDefs.find(f => f.label === sel.fertLabel);
                              if (f2) {
                                const pct2 = f2.nutrientContent[otherNutrient] || 0;
                                alreadyAdded += (sel.rate * pct2) / 100 / 2.4;
                              }
                            }
                          });
                        });
                        const addedByThis = (recommendedRate * pct) / 100 / 2.4;
                        const newValue = nObj.current + alreadyAdded + addedByThis;
                        const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                        if (newValue > maxAllowed) {
                          wouldExceed = true;
                          exceedNutrient = otherNutrient;
                          exceedAmount = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                        }
                      });
                      return (
                        <div key={idx} className="flex gap-4 items-end mb-2">
                          <div className="flex-1">
                            <Select
                              value={sel.fertLabel}
                              onValueChange={fertLabel => {
                                // When fertilizer changes, set recommended rate
                                let rate = sel.rate;
                                const fert = availableFerts.find(f => f.label === fertLabel);
                                if (fert) {
                                  const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                  // Calculate requirement left after previous selectors for main nutrient
                                  let prevAdded = 0;
                                  (fertSelections[nutrient.name] || []).forEach((s, i) => {
                                    if (i < idx && s.fertLabel && s.fertLabel !== 'none') {
                                      const f = availableFerts.find(ff => ff.label === s.fertLabel);
                                      if (f) {
                                        const pct = f.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                        prevAdded += (s.rate * pct) / 100 / 2.4;
                                      }
                                    }
                                  });
                                  const needed = Math.max(nutrient.ideal - (nutrient.current + prevAdded), 0);
                                  const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                                  let cappedRate = uncappedRate;
                                  let limitingNutrient = null;
                                  Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                    if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                                    const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                    if (!nObj) return;
                                    const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                    const maxToAdd = maxAllowed - nObj.current;
                                    const maxRate = pct > 0 ? ((maxToAdd * 100 * 2.4) / pct) : Infinity;
                                    if (maxRate < cappedRate) {
                                      cappedRate = Math.max(0, Number(maxRate.toFixed(1)));
                                      limitingNutrient = otherNutrient;
                                    }
                                  });
                                  rate = cappedRate;
                                }
                                setFertSelections(prev => {
                                  const arr = [...(prev[nutrient.name] || [])];
                                  arr[idx] = { fertLabel, rate };
                                  return { ...prev, [nutrient.name]: arr };
                                });
                              }}
                            >
                              <SelectTrigger className="bg-white w-full h-10">
                                <SelectValue placeholder="Choose fertilizer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem key="none" value="none">
                                  <span>No fertilizer</span>
                                </SelectItem>
                                {availableFerts.map(fert => {
                                  const isRecommended = true;
                                  const isLowContent = (fert.nutrientContent[nutrient.genericName || nutrient.name] || 0) < 1;
                                  const percent = fert.nutrientContent[nutrient.genericName || nutrient.name] || 0;
                                  const contentString = Object.entries(fert.nutrientContent)
                                    .map(([k, v]) => `${k} ${v}%`).join(', ');
                                  // --- Calculate recommended rate for this dropdown item ---
                                  const needed = Math.max(nutrient.ideal - nutrient.current, 0);
                                  const uncappedRate = percent > 0 ? Number(((needed * 100 * 2.4) / percent).toFixed(1)) : 0;
                                  let cappedRate = uncappedRate;
                                  let limitingNutrient = null;
                                  Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                    if (!pct || otherNutrient === (nutrient.genericName || nutrient.name)) return;
                                    const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                    if (!nObj) return;
                                    const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                    const maxToAdd = maxAllowed - nObj.current;
                                    const maxRate = pct > 0 ? ((maxToAdd * 100 * 2.4) / pct) : Infinity;
                                    if (maxRate < cappedRate) {
                                      cappedRate = Math.max(0, Number(maxRate.toFixed(1)));
                                      limitingNutrient = otherNutrient;
                                    }
                                  });
                                  const recommendedRate = cappedRate;
                                  // Check if this fertilizer would cause any nutrient to exceed maxAllowedExcess
                                  let wouldExceed = false;
                                  let exceedNutrient = '';
                                  let exceedAmount = 0;
                                  Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                    if (!pct) return;
                                    const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                    if (!nObj) return;
                                    const addedByThis = (recommendedRate * pct) / 100 / 2.4;
                                    const newValue = nObj.current + addedByThis;
                                    const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                    if (newValue > maxAllowed) {
                                      wouldExceed = true;
                                      exceedNutrient = otherNutrient;
                                      exceedAmount = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                    }
                                  });
                                  return (
                                    <SelectItem key={fert.label} value={fert.label} /* never disabled */>
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                          {wouldExceed ? (
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                          ) : isRecommended && !isLowContent ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                          ) : (
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                          )}
                                          <a
                                            href={`https://www.nutri-tech.com.au/products/${fert.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={wouldExceed ? "text-yellow-700 hover:underline font-medium" : "text-blue-700 hover:underline font-medium"}
                                          >
                                            {fert.label}
                                          </a>
                                          <span className="text-xs text-gray-700 ml-1">[{contentString}]</span>
                                          <span className={wouldExceed ? "text-xs text-yellow-700 ml-2" : "text-xs text-green-700 ml-2"}>
                                            {uncappedRate === cappedRate
                                              ? `(${uncappedRate} kg/ha)`
                                              : `(needed: ${uncappedRate} kg/ha, capped: ${cappedRate} kg/ha due to ${limitingNutrient})`}
                                          </span>
                                        </div>
                                        {wouldExceed && (
                                          <span className="text-xs text-yellow-700">Warning: would push {exceedNutrient} to {exceedAmount.toFixed(1)}% above target (limit: {maxAllowedExcess}%)</span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32 flex flex-col">
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Application Rate (kg/ha)</label>
                            <Input
                              type="number"
                              min={0}
                              value={sel.rate}
                              onChange={e => {
                                const rate = Number(e.target.value);
                                setFertSelections(prev => {
                                  const arr = [...(prev[nutrient.name] || [])];
                                  arr[idx] = { ...arr[idx], rate };
                                  return { ...prev, [nutrient.name]: arr };
                                });
                              }}
                              className="bg-white h-10 w-20"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 text-red-500"
                            onClick={() => {
                              setFertSelections(prev => {
                                const arr = [...(prev[nutrient.name] || [])];
                                arr.splice(idx, 1);
                                return { ...prev, [nutrient.name]: arr };
                              });
                            }}
                          >Remove</Button>
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-[#8cb43a] hover:bg-[#7ca32e] text-white"
                      onClick={() => {
                        setFertSelections(prev => ({
                          ...prev,
                          [nutrient.name]: [...(prev[nutrient.name] || []), { fertLabel: '', rate: 100 }]
                        }));
                      }}
                    >Add Fertilizer</Button>

                    {/* --- Show selected fertilizers summary --- */}
                    {(fertSelections[nutrient.name] || []).length > 0 && (
                      <div className="mt-2 text-xs text-gray-700">
                        <strong>Selected Fertilizers:</strong>
                        <ul className="list-disc ml-5">
                          {(fertSelections[nutrient.name] || []).map((sel, idx) => sel.fertLabel && sel.fertLabel !== 'none' ? (
                            <li key={idx}>{sel.fertLabel} ({sel.rate} kg/ha)</li>
                          ) : null)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {mainDeficientNutrients.length === 0 && secondaryDeficientNutrients.length === 0 && (
          <div className="text-green-700 font-semibold">No corrections needed. All nutrients are optimal!</div>
        )}
      </div>
    </ReportSection>
  );
};

export default SoilCorrections; 