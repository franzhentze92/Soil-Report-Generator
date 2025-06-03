import React, { useState, useEffect } from 'react';
import ReportSection from './ReportSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

interface PdfAttachmentsProps {
  frontAttachments: string[];
  setFrontAttachments: React.Dispatch<React.SetStateAction<string[]>>;
  backAttachments: string[];
  setBackAttachments: React.Dispatch<React.SetStateAction<string[]>>;
  onSummaryChange?: (labels: string[]) => void;
}

const PdfAttachments: React.FC<PdfAttachmentsProps> = ({ frontAttachments, setFrontAttachments, backAttachments, setBackAttachments, onSummaryChange }) => {
  const frontOptions = [
    { id: 'cover', label: 'Soil Therapy Report Cover' }
  ];

  const backOptions = [
    { id: 'humic', label: 'Humic Acid Recipe' },
    { id: 'cover-crop', label: 'Cover Crop Mix Table' },
    { id: 'fulvic', label: 'Fulvic Acid Recipe' },
    { id: 'bam', label: 'BAM Recipe' }
  ];

  const handleFrontChange = (optionId: string, checked: boolean) => {
    if (checked) {
      setFrontAttachments([...frontAttachments, optionId]);
    } else {
      setFrontAttachments(frontAttachments.filter(id => id !== optionId));
    }
  };

  const handleBackChange = (optionId: string, checked: boolean) => {
    if (checked) {
      setBackAttachments([...backAttachments, optionId]);
    } else {
      setBackAttachments(backAttachments.filter(id => id !== optionId));
    }
  };

  useEffect(() => {
    if (onSummaryChange) {
      const frontLabels = frontOptions.filter(o => frontAttachments.includes(o.id)).map(o => o.label);
      const backLabels = backOptions.filter(o => backAttachments.includes(o.id)).map(o => o.label);
      onSummaryChange([...frontLabels, ...backLabels]);
    }
  }, [JSON.stringify(frontAttachments), JSON.stringify(backAttachments)]);

  return (
    <ReportSection title="">
      <div className="space-y-6">
        <p className="text-gray-700 mb-4">
          Select additional documents to include with your soil report for comprehensive guidance and reference materials.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Front Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {frontOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`front-${option.id}`}
                      checked={frontAttachments.includes(option.id)}
                      onCheckedChange={(checked) => handleFrontChange(option.id, checked as boolean)}
                    />
                    <Label htmlFor={`front-${option.id}`} className="text-sm font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Back Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`back-${option.id}`}
                      checked={backAttachments.includes(option.id)}
                      onCheckedChange={(checked) => handleBackChange(option.id, checked as boolean)}
                    />
                    <Label htmlFor={`back-${option.id}`} className="text-sm font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {(frontAttachments.length > 0 || backAttachments.length > 0) && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <h4 className="font-medium text-black mb-2">Selected Attachments:</h4>
              <div className="text-sm text-green-700">
                {frontAttachments.length > 0 && (
                  <p>Front: {frontOptions.filter(o => frontAttachments.includes(o.id)).map(o => o.label).join(', ')}</p>
                )}
                {backAttachments.length > 0 && (
                  <p>Back: {backOptions.filter(o => backAttachments.includes(o.id)).map(o => o.label).join(', ')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ReportSection>
  );
};

export default PdfAttachments;