import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceArea } from 'recharts';

// DeviationBarChart: bars start at 0, show deviation % (left/center/right)
export const DeviationBarChart = ({ nutrients }) => {
  const data = nutrients.map(n => {
    const deviation = n.ideal !== 0 ? ((n.current - n.ideal) / n.ideal) * 100 : 0;
    let color = '#22c55e';
    if (deviation < -25) color = '#ef4444';
    else if (deviation > 25) color = '#2563eb';
    return {
      name: n.name,
      deviation: Number(deviation.toFixed(1)),
      color,
    };
  });
  const DEFICIENT = -25, EXCESSIVE = 25, MIN = -100, MAX = 100;
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
        <ReferenceArea x1={MIN} x2={DEFICIENT} fill="#fee2e2" fillOpacity={0.6} />
        <ReferenceArea x1={DEFICIENT} x2={EXCESSIVE} fill="#dcfce7" fillOpacity={0.6} />
        <ReferenceArea x1={EXCESSIVE} x2={MAX} fill="#dbeafe" fillOpacity={0.6} />
        <XAxis type="number" domain={[MIN, MAX]} tickFormatter={v => `${v}%`} label={{ value: 'Deviation (%)', position: 'insideBottom', offset: -10 }} />
        <YAxis type="category" dataKey="name" width={120} />
        <Tooltip formatter={v => `${v}%`} labelFormatter={l => `Nutrient: ${l}`} />
        <Bar dataKey="deviation" isAnimationActive={false}>
          {data.map((entry, idx) => (<Cell key={`cell-${idx}`} fill={entry.color} />))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// AbsoluteValueBarChart: bars start at left, show actual value (e.g. ppm), background regions for deficient/acceptable/excessive
export const AbsoluteValueBarChart = ({ nutrients, regionDefs }) => {
  // regionDefs: [{ name, min, max, deficientMax, excessiveMin }]
  // If not provided, use default for ppm
  const data = nutrients.map(n => {
    let color = '#22c55e';
    let region = 'acceptable';
    let def = regionDefs && regionDefs.find(r => r.name === n.name);
    let deficientMax = def ? def.deficientMax : n.ideal * 0.75;
    let excessiveMin = def ? def.excessiveMin : n.ideal * 1.25;
    if (n.current < deficientMax) { color = '#ef4444'; region = 'deficient'; }
    else if (n.current > excessiveMin) { color = '#2563eb'; region = 'excessive'; }
    return {
      name: n.name,
      value: n.current,
      color,
      region,
      unit: n.unit,
      ideal: n.ideal,
      deficientMax,
      excessiveMin,
    };
  });
  // Find global min/max for axis
  const minVal = Math.min(...data.map(d => d.value), ...data.map(d => d.deficientMax));
  const maxVal = Math.max(...data.map(d => d.value), ...data.map(d => d.excessiveMin));
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
        {/* Backgrounds for each region */}
        <ReferenceArea x1={minVal} x2={Math.min(...data.map(d => d.deficientMax))} fill="#fee2e2" fillOpacity={0.6} />
        <ReferenceArea x1={Math.min(...data.map(d => d.deficientMax))} x2={Math.max(...data.map(d => d.excessiveMin))} fill="#dcfce7" fillOpacity={0.6} />
        <ReferenceArea x1={Math.max(...data.map(d => d.excessiveMin))} x2={maxVal} fill="#dbeafe" fillOpacity={0.6} />
        <XAxis type="number" domain={[minVal, maxVal]} tickFormatter={v => `${v}`} label={{ value: 'Actual Value', position: 'insideBottom', offset: -10 }} />
        <YAxis type="category" dataKey="name" width={120} />
        <Tooltip formatter={(v, n, p) => `${v} ${p.payload.unit}`} labelFormatter={l => `Nutrient: ${l}`} />
        <Bar dataKey="value" isAnimationActive={false}>
          {data.map((entry, idx) => (<Cell key={`cell-${idx}`} fill={entry.color} />))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DeviationBarChart; 