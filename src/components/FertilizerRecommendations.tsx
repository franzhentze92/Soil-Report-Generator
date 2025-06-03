import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Leaf, Calculator } from 'lucide-react';

interface Fertilizer {
  name: string;
  nutrientContent: number;
  applicationRate: number;
  cost: number;
  type: 'organic' | 'synthetic';
  contains?: string[];
}

interface FertilizerRecommendationsProps {
  nutrientName: string;
  deficiency: number;
  unit: string;
  fertilizers: Fertilizer[];
}

const FertilizerRecommendations: React.FC<FertilizerRecommendationsProps> = ({
  nutrientName,
  deficiency,
  unit,
  fertilizers
}) => {
  const calculateAmount = (fertilizer: Fertilizer) => {
    return ((deficiency / fertilizer.nutrientContent) * 100).toFixed(1);
  };

  const calculateCost = (fertilizer: Fertilizer) => {
    const amount = parseFloat(calculateAmount(fertilizer));
    return (amount * fertilizer.cost / 100).toFixed(2);
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          {nutrientName} Fertilizer Recommendations
        </CardTitle>
        <p className="text-sm text-gray-600">
          Requirement to reach target: {deficiency} {unit} - Choose from the following fertilizers:
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {fertilizers.map((fertilizer, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors bg-white">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-lg text-black">
                    {fertilizer.name} {fertilizer.contains && `[${fertilizer.contains.join(', ')}]`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={fertilizer.type === 'organic' ? 'default' : 'secondary'}>
                      {fertilizer.type}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {fertilizer.nutrientContent}% {nutrientName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    ${calculateCost(fertilizer)}
                  </div>
                  <div className="text-sm text-gray-500">
                    per application
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calculator className="h-4 w-4" />
                    <span>Amount: {calculateAmount(fertilizer)} lbs/acre</span>
                  </div>
                  <div>
                    Rate: {fertilizer.applicationRate} lbs/acre
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Select
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FertilizerRecommendations;