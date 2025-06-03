import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface NutrientData {
  name: string;
  current: number;
  ideal: number;
  unit: string;
  status: 'low' | 'optimal' | 'high';
}

interface NutrientAnalysisProps {
  nutrients: NutrientData[];
}

const NutrientAnalysis: React.FC<NutrientAnalysisProps> = ({ nutrients }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'destructive';
      case 'optimal': return 'default';
      case 'high': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'low': return <AlertTriangle className="h-4 w-4" />;
      case 'optimal': return <CheckCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getProgressValue = (current: number, ideal: number) => {
    return Math.min((current / ideal) * 100, 100);
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-red-500';
      case 'optimal': return 'bg-green-500';
      case 'high': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nutrient Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {nutrients.map((nutrient, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{nutrient.name}</h3>
                  <Badge variant={getStatusColor(nutrient.status)} className="flex items-center gap-1">
                    {getStatusIcon(nutrient.status)}
                    {nutrient.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {nutrient.current} / {nutrient.ideal} {nutrient.unit}
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={getProgressValue(nutrient.current, nutrient.ideal)} 
                  className="h-3"
                />
                <div 
                  className={`absolute top-0 left-0 h-3 rounded-full ${getProgressBarColor(nutrient.status)}`}
                  style={{ width: `${getProgressValue(nutrient.current, nutrient.ideal)}%` }}
                />
              </div>
              {nutrient.status === 'low' && (
                <p className="text-sm text-red-600">
                  Deficiency: {(nutrient.ideal - nutrient.current).toFixed(1)} {nutrient.unit} needed
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NutrientAnalysis;