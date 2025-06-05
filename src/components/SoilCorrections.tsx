import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import ReportSection from './ReportSection';
import { CheckCircle, AlertTriangle, Settings, ShieldAlert, Gift } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

// Fertilizer definitions (should match those in SoilReportGenerator)
const fertilizerDefs = [
  { label: 'Agricultural Limestone (CaCO₃)', nutrientContent: { Calcium: 38 }, phLogic: { min_pH: null, max_pH: 6.5 }, releaseType: 'slow' },
  { label: 'Gypsum (Calcium Sulfate)', nutrientContent: { Calcium: 23, Sulphur: 18 }, phLogic: { min_pH: 5.8, max_pH: 7.5 }, releaseType: 'moderate' },
  { label: 'Calcium Nitrate', nutrientContent: { Calcium: 19, Nitrate: 12 }, phLogic: { min_pH: null, max_pH: 7.5 }, releaseType: 'fast' },
  { label: 'Dolomitic Lime', nutrientContent: { Calcium: 21, Magnesium: 11 }, phLogic: { min_pH: null, max_pH: 6.5 }, releaseType: 'slow' },
  { label: 'Kieserite (Magnesium Sulfate Monohydrate)', nutrientContent: { Magnesium: 16, Sulphur: 22 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Epsom Salt (Magnesium Sulfate Heptahydrate)', nutrientContent: { Magnesium: 10, Sulphur: 13 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Muriate of Potash (Potassium Chloride)', nutrientContent: { Potassium: 60 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Sulfate of Potash (Potassium Sulfate)', nutrientContent: { Potassium: 50, Sulphur: 17 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Potassium Nitrate', nutrientContent: { Potassium: 44, Nitrate: 13 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Triple Superphosphate', nutrientContent: { Phosphorus: 45, Calcium: 19 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Monoammonium Phosphate (MAP)', nutrientContent: { Phosphorus: 22, Ammonium: 11 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Diammonium Phosphate (DAP)', nutrientContent: { Phosphorus: 20, Ammonium: 18 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Rock Phosphate', nutrientContent: { Phosphorus: 25, Calcium: 30 }, phLogic: { min_pH: null, max_pH: 6.0 } },
  { label: 'Elemental Sulfur', nutrientContent: { Sulphur: 90 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Ammonium Sulfate', nutrientContent: { Ammonium: 21, Sulphur: 24 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Zinc Sulfate (ZnSO₄)', nutrientContent: { Zinc: 23, Sulphur: 17.9 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Copper Sulfate (CuSO₄)', nutrientContent: { Copper: 25, Sulphur: 12.8 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Manganese Sulfate (MnSO₄)', nutrientContent: { Manganese: 31, Sulphur: 18 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Iron Sulfate (FeSO₄)', nutrientContent: { Iron: 19.7, Sulphur: 11.4 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Borax', nutrientContent: { Boron: 11.3 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Soluble Boron', nutrientContent: { Boron: 20 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Sodium Molybdate', nutrientContent: { Molybdenum: 39 }, phLogic: { min_pH: null, max_pH: null } },
  { label: 'Calcium Chloride', nutrientContent: { Calcium: 27 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'fast' },
  { label: 'Calcium Phosphate', nutrientContent: { Calcium: 19, Phosphorus: 18 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'slow' },
  { label: 'Bone Meal', nutrientContent: { Calcium: 26, Phosphorus: 14 }, phLogic: { min_pH: null, max_pH: 7.0 }, releaseType: 'slow' },
  { label: 'Calcined Clay', nutrientContent: { Calcium: 8 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'slow' },
  { label: 'Wollastonite', nutrientContent: { Calcium: 17 }, phLogic: { min_pH: null, max_pH: null }, releaseType: 'very slow' },
  // Add more as needed
];

function getFertilizersForNutrient(nutrient) {
  if (!nutrient) return [];
  return fertilizerDefs.filter(f =>
    f.nutrientContent &&
    Object.keys(f.nutrientContent).some(
      k => k.toLowerCase() === nutrient.toLowerCase()
    )
  );
}

function ppmToKgHa(ppm) {
  return (Number(ppm) * 2.4).toFixed(1);
}

// Extract soil pH from nutrients array
function getSoilPh(nutrients) {
  const phNutrient = nutrients.find(n => n.name && n.name.toLowerCase().includes('ph'));
  return phNutrient ? Number(phNutrient.current) : null;
}

const SoilCorrections = ({ nutrients, soilAmendmentsSummary, setSoilAmendmentsSummary }) => {
  const soilPh = getSoilPh(nutrients);

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
  const mainNutrientOrder = ['calcium', 'magnesium', 'potassium', 'phosphorus', 'sulphur', 'nitrate', 'ammonium'];
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
    <ReportSection title="Soil Corrections" infoContent={
      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        <div className="mb-2 font-semibold text-gray-800">How to use the Soil Corrections section</div>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Purpose:</strong> This section helps you correct soil nutrient deficiencies by recommending fertilizers and application rates tailored to your soil test results. The goal is to bring each nutrient up to its optimal target value, while avoiding excessive application that could harm your soil or plants.</p>
          <p><strong>Nutrient Display:</strong> Nutrients are split into <span className="font-semibold">Main Soil Corrections</span> (the most important nutrients for plant growth, such as Calcium, Magnesium, Potassium, Phosphorus, and Sulphur) and <span className="font-semibold">Secondary Soil Corrections</span> (other essential nutrients). Only nutrients that are currently below their target (deficient) are shown here.</p>
          <p><strong>Fertilizer Selection:</strong> For each deficient nutrient, you can select one or more fertilizers from a dropdown menu. Each fertilizer option shows its nutrient content, a recommended application rate, and special icons/colors to help you choose safely:</p>
          <ul className="list-disc ml-6">
            <li><span className="inline-flex items-center"><CheckCircle className="inline h-4 w-4 text-green-500 mr-1" /> <span className="text-green-700 font-semibold">Green check:</span></span> Safe to use at the recommended rate.</li>
            <li><span className="inline-flex items-center"><Gift className="inline h-4 w-4 text-purple-600 mr-1" /> <span className="text-purple-700 font-semibold">Purple bonus:</span></span> This fertilizer fulfills the requirement for another nutrient and is capped to avoid excess. The rate shown is the maximum safe rate for all nutrients it contains.</li>
            <li><span className="inline-flex items-center"><ShieldAlert className="inline h-4 w-4 text-red-600 mr-1" /> <span className="text-red-700 font-semibold">Red risk:</span></span> No safe rate: any application would push a nutrient above its safe limit.</li>
          </ul>
          <p><strong>Application Rate:</strong> The recommended rate is calculated to bring the nutrient up to its target. If a fertilizer contains multiple nutrients, the rate may be <span className="font-semibold">capped</span> (limited) to avoid exceeding the safe limit for any nutrient. If capped, the dropdown will show which nutrient is limiting and why.</p>
          <p><strong>Progress Bars:</strong> Each nutrient card shows four progress bars:
            <ul className="list-disc ml-6">
              <li><span className="font-semibold">Original:</span> Your current soil value.</li>
              <li><span className="font-semibold">New:</span> The value after applying selected fertilizers.</li>
              <li><span className="font-semibold">Requirement:</span> The amount still needed to reach the target.</li>
              <li><span className="font-semibold">Target:</span> The optimal value for healthy plant growth.</li>
            </ul>
            The color of the "New" bar turns green if within ±25% of the target, or red if outside this range.
          </p>
          <p><strong>Adjustable Parameters:</strong> You can adjust the <span className="font-semibold">Max Allowed Excess (%)</span> using the settings button (gear icon) at the top right. This controls how much above the target value a nutrient is allowed to go when applying fertilizers. Lowering this value makes recommendations more conservative; raising it allows more flexibility but increases risk of excess.</p>
          <p><strong>Objectives:</strong> The main objective is to correct deficiencies without causing excess. The system automatically calculates safe rates and warns you if a fertilizer could cause a problem. You can add, remove, or adjust fertilizers and rates as needed.</p>
          <p><strong>Other Details:</strong> The section updates in real time as you make changes. You can see a breakdown of how much each fertilizer contributes to each nutrient, and a summary of selected fertilizers. If all nutrients are optimal, the section will let you know that no corrections are needed.</p>
          <p>If you are new to soil science or fertilizer management, don't worry! The icons, colors, and warnings are designed to guide you safely. Hover over icons or read the messages for more information. If in doubt, consult a local agronomist or soil expert.</p>
        </div>
      </div>
    }>
      <div className="flex justify-end items-center mb-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-full hover:bg-gray-200" title="Adjust max allowed excess">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <div className="mb-2 font-semibold text-gray-800">Max Allowed Excess (%)</div>
            <input
              type="range"
              min={5}
              max={100}
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
              const selection = Array.isArray(fertSelections[nutrient.name]) ? fertSelections[nutrient.name] : [];
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
                    {selection.length === 0 ? (
                      <div className="text-xs text-gray-500 mb-2">No fertilizers selected. Click "Add Fertilizer" to begin.</div>
                    ) : (
                      selection.map((sel, idx) => {
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
                            }
                          });
                          recommendedRate = cappedRate;
                          // Store uncapped/capped/limitingReason for display
                          sel._uncappedRate = uncappedRate;
                          sel._cappedRate = cappedRate;
                          sel._limitingNutrient = limitingNutrient;
                          sel._limitingReason = limitingNutrient ? `Full rate to reach target is ${uncappedRate} kg/ha, but capped at ${cappedRate} kg/ha due to ${limitingNutrient} exceeding target by more than ${maxAllowedExcess}%` : '';
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
                          const EPSILON = 1e-6;
                          if (newValue > maxAllowed + EPSILON) {
                            wouldExceed = true;
                            exceedNutrient = otherNutrient;
                            exceedAmount = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                          }
                        });
                        // ... existing code for rendering selector ...
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
                                  {availableFerts.length === 0 && (
                                    <SelectItem key="no-ferts" value="no-ferts" disabled>
                                      <span className="text-gray-400">No fertilizers available for this nutrient.</span>
                                    </SelectItem>
                                  )}
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
                                    const EPSILON = 1e-6;
                                    Object.entries(fert.nutrientContent).forEach(([otherNutrient, pct]) => {
                                      if (!pct) return;
                                      const nObj = nutrients.find(nu => (nu.genericName || nu.name) === otherNutrient);
                                      if (!nObj) return;
                                      const addedByThis = (recommendedRate * pct) / 100 / 2.4;
                                      const newValue = nObj.current + addedByThis;
                                      const maxAllowed = nObj.ideal * (1 + maxAllowedExcess / 100);
                                      if (newValue > maxAllowed + EPSILON) {
                                        wouldExceed = true;
                                        exceedNutrient = otherNutrient;
                                        exceedAmount = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                                      }
                                    });
                                    // --- Determine color and icon ---
                                    let icon, nameClass, rateClass, message;
                                    // pH recommendation logic
                                    let isPhRecommended = false;
                                    let isPhNotRecommended = false;
                                    if (fert.phLogic && soilPh !== null) {
                                      const { min_pH, max_pH } = fert.phLogic;
                                      if ((min_pH === null || soilPh >= min_pH) && (max_pH === null || soilPh <= max_pH)) {
                                        isPhRecommended = true;
                                      } else {
                                        isPhNotRecommended = true;
                                      }
                                    }
                                    if (isPhRecommended) {
                                      icon = <span title="Recommended for your soil pH"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.75l-6.172 3.247 1.179-6.873L2 9.753l6.908-1.004L12 2.25l3.092 6.499L22 9.753l-5.007 4.371 1.179 6.873z" /></svg></span>;
                                      nameClass = "text-green-700 hover:underline font-medium";
                                      rateClass = "text-xs text-green-700 ml-2";
                                      message = <span className="text-xs text-green-700">Recommended for your soil pH.</span>;
                                    } else if (isPhNotRecommended) {
                                      icon = <AlertTriangle className="h-4 w-4 text-yellow-500" />;
                                      nameClass = "text-yellow-700 hover:underline font-medium";
                                      rateClass = "text-xs text-yellow-700 ml-2";
                                      message = <span className="text-xs text-yellow-700">Not recommended: soil pH is not within the recommended range for this fertilizer.</span>;
                                    } else if (cappedRate === 0) {
                                      icon = <ShieldAlert className="h-4 w-4 text-red-600" />;
                                      nameClass = "text-red-700 hover:underline font-medium";
                                      rateClass = "text-xs text-red-700 ml-2";
                                      message = <span className="text-xs text-red-600">No safe rate: any application would push {limitingNutrient} above the {maxAllowedExcess}% excess limit.</span>;
                                    } else {
                                      icon = <CheckCircle className="h-4 w-4 text-green-500" />;
                                      nameClass = "text-blue-700 hover:underline font-medium";
                                      rateClass = "text-xs text-green-700 ml-2";
                                      message = null;
                                    }
                                    return (
                                      <SelectItem key={fert.label} value={fert.label} /* never disabled */>
                                        <div className="flex flex-col gap-0.5">
                                          <div className="flex items-center gap-2">
                                            {icon}
                                            <a
                                              href={`https://www.nutri-tech.com.au/products/${fert.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={nameClass}
                                            >
                                              {fert.label}
                                            </a>
                                            <span className="text-xs text-gray-700 ml-1">[{contentString}]</span>
                                            <span className={rateClass}>
                                              {uncappedRate === cappedRate
                                                ? `(${uncappedRate} kg/ha)`
                                                : `(needed: ${uncappedRate} kg/ha, capped: ${cappedRate} kg/ha due to ${limitingNutrient})`}
                                            </span>
                                            {fert.releaseType && (
                                              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                                                fert.releaseType === 'fast' ? 'bg-blue-100 text-blue-800' :
                                                fert.releaseType === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                                fert.releaseType === 'slow' ? 'bg-green-100 text-green-800' :
                                                fert.releaseType === 'very slow' ? 'bg-gray-200 text-gray-800' :
                                                'bg-gray-100 text-gray-700'
                                              }`}>
                                                {fert.releaseType.charAt(0).toUpperCase() + fert.releaseType.slice(1)} Release
                                              </span>
                                            )}
                                          </div>
                                          {message}
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
                                value={(!sel.fertLabel || sel.fertLabel === 'none') ? '' : sel.rate}
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
                      })
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-[#8cb43a] hover:bg-[#7ca32e] text-white"
                      onClick={() => {
                        setFertSelections(prev => {
                          const arr = Array.isArray(prev[nutrient.name]) ? prev[nutrient.name] : [];
                          return { ...prev, [nutrient.name]: [...arr, { fertLabel: '', rate: 100 }] };
                        });
                      }}
                    >Add Fertilizer</Button>

                    {/* --- Show selected fertilizers summary --- */}
                    {selection.length > 0 && (
                      <div className="mt-2 text-xs text-gray-700">
                        <strong>Selected Fertilizers:</strong>
                        <ul className="list-disc ml-5">
                          {selection.map((sel, idx) => sel.fertLabel && sel.fertLabel !== 'none' ? (
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
              // Debug: log what nutrient name is being passed for secondary nutrients
              if (secondaryDeficientNutrients.some(n => n.name === nutrient.name)) {
                console.log('Secondary nutrient:', nutrient.name, 'genericName:', nutrient.genericName, 'availableFerts:', availableFerts.map(f => f.label));
              }
              const selection = Array.isArray(fertSelections[nutrient.name]) ? fertSelections[nutrient.name] : [];
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
                    {selection.length === 0 ? (
                      <div className="text-xs text-gray-500 mb-2">No fertilizers selected. Click "Add Fertilizer" to begin.</div>
                    ) : (
                      selection.map((sel, idx) => {
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
                            }
                          });
                          recommendedRate = cappedRate;
                          // Store uncapped/capped/limitingReason for display
                          sel._uncappedRate = uncappedRate;
                          sel._cappedRate = cappedRate;
                          sel._limitingNutrient = limitingNutrient;
                          sel._limitingReason = limitingNutrient ? `Full rate to reach target is ${uncappedRate} kg/ha, but capped at ${cappedRate} kg/ha due to ${limitingNutrient} exceeding target by more than ${maxAllowedExcess}%` : '';
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
                          const EPSILON = 1e-6;
                          if (newValue > maxAllowed + EPSILON) {
                            wouldExceed = true;
                            exceedNutrient = otherNutrient;
                            exceedAmount = ((newValue - nObj.ideal) / nObj.ideal) * 100;
                          }
                        });
                        // ... existing code for rendering selector ...
                      })
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-[#8cb43a] hover:bg-[#7ca32e] text-white"
                      onClick={() => {
                        setFertSelections(prev => {
                          const arr = Array.isArray(prev[nutrient.name]) ? prev[nutrient.name] : [];
                          return { ...prev, [nutrient.name]: [...arr, { fertLabel: '', rate: 100 }] };
                        });
                      }}
                    >Add Fertilizer</Button>

                    {/* --- Show selected fertilizers summary --- */}
                    {selection.length > 0 && (
                      <div className="mt-2 text-xs text-gray-700">
                        <strong>Selected Fertilizers:</strong>
                        <ul className="list-disc ml-5">
                          {selection.map((sel, idx) => sel.fertLabel && sel.fertLabel !== 'none' ? (
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