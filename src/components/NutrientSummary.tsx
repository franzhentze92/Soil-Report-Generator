import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Nutrient {
  name: string;
  current: number;
  ideal: number;
  unit: string;
  status: 'low' | 'optimal' | 'high';
  category: string;
  original: number;
  newLevel: number;
  quantityRecommended: number;
  stillPending: boolean;
}

interface NutrientSummaryProps {
  nutrients: Nutrient[];
}

const NutrientSummary: React.FC<NutrientSummaryProps> = ({ nutrients }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return 'bg-red-100 text-red-800';
      case 'optimal':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'low':
        return 'Deficient';
      case 'optimal':
        return 'Optimal';
      case 'high':
        return 'Excessive';
      default:
        return 'Unknown';
    }
  };

  // Sort nutrients by status: deficient, optimal, excessive
  const sortedNutrients = [...nutrients].sort((a, b) => {
    const statusOrder = { 'low': 0, 'optimal': 1, 'high': 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const deficientCount = nutrients.filter(n => n.status === 'low').length;
  const optimalCount = nutrients.filter(n => n.status === 'optimal').length;
  const excessiveCount = nutrients.filter(n => n.status === 'high').length;

  // Group sorted nutrients by status
  const deficientNutrients = sortedNutrients.filter(n => n.status === 'low');
  const optimalNutrients = sortedNutrients.filter(n => n.status === 'optimal');
  const excessiveNutrients = sortedNutrients.filter(n => n.status === 'high');

  const renderNutrientGroup = (title: string, nutrients: Nutrient[], bgColor: string) => {
    if (nutrients.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h4 className="font-semibold text-black mb-2">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {nutrients.map((nutrient, index) => (
            <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${bgColor}`}>
              <span className="font-medium text-black">{nutrient.name}</span>
              <Badge className={getStatusColor(nutrient.status)}>
                {getStatusText(nutrient.status)}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-black">Nutrient Status Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg bg-red-50">
            <div className="text-2xl font-bold text-red-600">{deficientCount}</div>
            <div className="text-sm text-red-700">Deficient</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50">
            <div className="text-2xl font-bold text-green-600">{optimalCount}</div>
            <div className="text-sm text-green-700">Optimal</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue-50">
            <div className="text-2xl font-bold text-blue-600">{excessiveCount}</div>
            <div className="text-sm text-blue-700">Excessive</div>
          </div>
        </div>
        
        {renderNutrientGroup('Deficient Nutrients', deficientNutrients, 'bg-red-50')}
        {renderNutrientGroup('Optimal Nutrients', optimalNutrients, 'bg-green-50')}
        {renderNutrientGroup('Excessive Nutrients', excessiveNutrients, 'bg-blue-50')}
      </CardContent>
    </Card>
  );
};

export default NutrientSummary;