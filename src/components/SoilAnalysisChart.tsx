import React from 'react';

const SoilAnalysisChart = ({ nutrients }) => {
  if (!nutrients || nutrients.length === 0) return null;
  return (
    <div style={{ width: '100%', padding: 24, background: '#fff' }}>
      {nutrients.map((n, idx) => (
        <div key={n.name} style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: 8 }}>
          <div style={{ width: '25%', minWidth: 120, textAlign: 'right', paddingRight: 12, fontWeight: 500, color: '#222', fontSize: 14 }}>{n.name}</div>
          <div style={{ width: '25%', minWidth: 80, textAlign: 'right', paddingRight: 12, fontSize: 13, color: '#444' }}>{typeof n.current === 'number' && !isNaN(n.current) ? n.current.toFixed(2) : '-'} {n.unit}</div>
          <div style={{ flex: 1, minWidth: 0, position: 'relative', height: 18, background: '#f3f4f6', borderRadius: 4 }}>
            {/* Placeholder bar: 50% width, green */}
            <div style={{ position: 'absolute', left: 0, top: 0, height: 18, width: '50%', background: '#22c55e', borderRadius: 4, opacity: 0.85 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SoilAnalysisChart; 