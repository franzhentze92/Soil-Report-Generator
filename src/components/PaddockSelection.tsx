import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Paddock {
  id: string;
  name: string;
}

interface PaddockSelectionProps {
  onSelectionChange: (selectedPaddocks: string[]) => void;
}

const mockPaddocks: Paddock[] = [
  { id: '1', name: 'North Field' },
  { id: '2', name: 'South Paddock' },
  { id: '3', name: 'East Block' },
  { id: '4', name: 'West Quarter' },
  { id: '5', name: 'Central Field' }
];

const PaddockSelection: React.FC<PaddockSelectionProps> = ({ onSelectionChange }) => {
  const [selectedPaddocks, setSelectedPaddocks] = useState<string[]>([]);

  const handlePaddockToggle = (paddockId: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedPaddocks, paddockId]
      : selectedPaddocks.filter(id => id !== paddockId);
    
    setSelectedPaddocks(newSelection);
    onSelectionChange(newSelection);
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-black">Select Paddocks/Fields</CardTitle>
        <p className="text-sm text-gray-600">
          Choose which paddocks or fields from the PDF analysis report to include in this recommendation.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockPaddocks.map((paddock) => (
            <div key={paddock.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={paddock.id}
                checked={selectedPaddocks.includes(paddock.id)}
                onCheckedChange={(checked) => handlePaddockToggle(paddock.id, checked as boolean)}
              />
              <Label htmlFor={paddock.id} className="flex-1 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-black">{paddock.name}</span>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </div>
        
        {selectedPaddocks.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              Selected {selectedPaddocks.length} paddock(s).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaddockSelection;