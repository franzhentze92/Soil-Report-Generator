import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText } from 'lucide-react';

interface SoilUploadProps {
  onFileUpload: (file: File) => void;
  resetKey?: number;
}

const SoilUpload: React.FC<SoilUploadProps> = ({ onFileUpload, resetKey }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    setUploadedFile(null);
  }, [resetKey]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    onFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Card className="w-full max-w-screen-xl mx-auto bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black text-2xl">
          <Upload className="h-6 w-6" />
          Upload Soil Analysis Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploadedFile ? (
            <div className="flex items-center justify-center gap-2 text-black">
              <FileText className="h-10 w-10" />
              <div>
                <p className="font-medium text-lg">{uploadedFile.name}</p>
                <p className="text-base text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-16 w-16 mx-auto text-gray-400 mb-6" />
              <p className="text-2xl font-medium text-gray-700 mb-4">
                Drop your soil analysis chart here
              </p>
              <p className="text-lg text-gray-500 mb-6">
                or click to browse files
              </p>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Button asChild size="lg">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SoilUpload;