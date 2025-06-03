import React, { useState } from 'react';
import ReportSection from './ReportSection';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Info } from 'lucide-react';

interface Nutrient {
  name: string;
  current: number;
  ideal: number;
  unit: string;
  status: 'low' | 'optimal' | 'high';
}

interface GeneralCommentsProps {
  nutrients: Nutrient[];
  somCecText: string;
  setSomCecText: (v: string) => void;
  baseSaturationText: string;
  setBaseSaturationText: (v: string) => void;
  phText: string;
  setPhText: (v: string) => void;
  availableNutrientsText: string;
  setAvailableNutrientsText: (v: string) => void;
  soilReservesText: string;
  setSoilReservesText: (v: string) => void;
}

// Helper for status label
function StatusLabel({ status }: { status: 'low' | 'optimal' | 'high' }) {
  let color = 'bg-green-100 text-green-800 border-green-300';
  let text = 'Optimal';
  if (status === 'low') { color = 'bg-red-100 text-red-800 border-red-300'; text = 'Deficient'; }
  else if (status === 'high') { color = 'bg-blue-100 text-blue-800 border-blue-300'; text = 'Excessive'; }
  return <span className={`ml-2 px-2 py-0.5 rounded-full border text-xs font-semibold ${color}`}>{text}</span>;
}

// Helper to get nutrient status by name (case-insensitive, allow partial match)
function getStatus(nutrients: any[], name: string) {
  const found = nutrients.find(n => n.name.toLowerCase().includes(name.toLowerCase()));
  return found ? found.status : undefined;
}

const GeneralComments: React.FC<GeneralCommentsProps> = ({ nutrients, somCecText, setSomCecText, baseSaturationText, setBaseSaturationText, phText, setPhText, availableNutrientsText, setAvailableNutrientsText, soilReservesText, setSoilReservesText }) => {
  return (
    <ReportSection title="General Comments">
      <div className="space-y-4">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-4">
              Soil Organic Matter (SOM)
              {getStatus(nutrients, 'organic matter') && <StatusLabel status={getStatus(nutrients, 'organic matter')} />}
              <span className="ml-4">Cation Exchange Capacity (CEC)</span>
              {getStatus(nutrients, 'cec') && <StatusLabel status={getStatus(nutrients, 'cec')} />}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none align-middle">
                    <Info className="h-5 w-5 text-blue-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 z-50">
                  <div className="text-sm text-gray-800 font-semibold mb-1">Soil Organic Matter (SOM)</div>
                  <div className="text-xs text-gray-700">Soil organic matter (SOM) is a measure of the amount of organic material in the soil. It is a key indicator of soil fertility and health.</div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={somCecText}
              onChange={(e) => setSomCecText(e.target.value)}
              className="min-h-[100px] bg-white"
            />
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-black flex flex-col gap-1">
              <span>Base Saturation (BS)</span>
              <span className="flex flex-row flex-wrap gap-2 mt-1">
                {['calcium', 'magnesium', 'potassium', 'sodium', 'aluminium', 'hydrogen'].map(nm => (
                  getStatus(nutrients, nm) && (
                    <span key={nm} className="flex items-center gap-1">
                      <span className="capitalize text-xs text-gray-700">{nm.charAt(0).toUpperCase() + nm.slice(1)}</span>
                      <StatusLabel status={getStatus(nutrients, nm)} />
                    </span>
                  )
                ))}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none align-middle">
                    <Info className="h-5 w-5 text-blue-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 z-50">
                  <div className="text-sm text-gray-800 font-semibold mb-1">Base Saturation (BS)</div>
                  <div className="text-xs text-gray-700">Base saturation (BS) is a measure of the percentage of soil exchangeable cations that are bound to the soil colloid surfaces.</div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={baseSaturationText}
              onChange={(e) => setBaseSaturationText(e.target.value)}
              className="min-h-[100px] bg-white"
            />
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-4">
              pH
              {getStatus(nutrients, 'ph') && <StatusLabel status={getStatus(nutrients, 'ph')} />}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none align-middle">
                    <Info className="h-5 w-5 text-blue-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 z-50">
                  <div className="text-sm text-gray-800 font-semibold mb-1">pH</div>
                  <div className="text-xs text-gray-700">pH is a measure of the acidity or alkalinity of a soil. It is a key indicator of soil fertility and health.</div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={phText}
              onChange={(e) => setPhText(e.target.value)}
              className="min-h-[100px] bg-white"
            />
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-black flex flex-col gap-1">
              <span>Available Nutrients</span>
              <span className="flex flex-row flex-wrap gap-2 mt-1">
                {['nitrate', 'ammonium', 'phosphorus', 'calcium', 'potassium', 'magnesium', 'sodium', 'aluminum', 'iron', 'copper', 'manganese', 'zinc', 'boron', 'sulphur'].map(nm => (
                  getStatus(nutrients, nm) && (
                    <span key={nm} className="flex items-center gap-1">
                      <span className="capitalize text-xs text-gray-700">{nm.charAt(0).toUpperCase() + nm.slice(1)}</span>
                      <StatusLabel status={getStatus(nutrients, nm)} />
                    </span>
                  )
                ))}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none align-middle">
                    <Info className="h-5 w-5 text-blue-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 z-50">
                  <div className="text-sm text-gray-800 font-semibold mb-1">Available Nutrients</div>
                  <div className="text-xs text-gray-700">Available nutrients are those that are present in the soil and can be absorbed by plants.</div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={availableNutrientsText}
              onChange={(e) => setAvailableNutrientsText(e.target.value)}
              className="min-h-[100px] bg-white"
            />
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-black flex flex-col gap-1">
              <span>Soil Reserves</span>
              <span className="flex flex-row flex-wrap gap-2 mt-1">
                {['phosphorus', 'potassium', 'calcium', 'magnesium', 'sodium', 'sulphur', 'zinc', 'boron', 'copper', 'iron', 'manganese', 'silicon', 'molybdenum', 'cobalt', 'selenium'].map(nm => (
                  getStatus(nutrients, nm) && (
                    <span key={nm} className="flex items-center gap-1">
                      <span className="capitalize text-xs text-gray-700">{nm.charAt(0).toUpperCase() + nm.slice(1)}</span>
                      <StatusLabel status={getStatus(nutrients, nm)} />
                    </span>
                  )
                ))}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="ml-2 text-gray-400 hover:text-blue-600 focus:outline-none align-middle">
                    <Info className="h-5 w-5 text-blue-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 z-50">
                  <div className="text-sm text-gray-800 font-semibold mb-1">Soil Reserves</div>
                  <div className="text-xs text-gray-700">Soil reserves are the amount of nutrients stored in the soil.</div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={soilReservesText}
              onChange={(e) => setSoilReservesText(e.target.value)}
              className="min-h-[100px] bg-white"
            />
          </CardContent>
        </Card>
      </div>
    </ReportSection>
  );
};

export default GeneralComments;