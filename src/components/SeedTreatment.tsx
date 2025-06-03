import React, { useState } from 'react';
import ReportSection from './ReportSection';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sprout, X } from 'lucide-react';
import { seedTreatmentProducts as products } from '../fertilizerProducts';

interface SelectedProduct {
  id: string;
  product: string;
  rate: string;
  unit: string;
}

interface SeedTreatmentProps {
  selectedProducts: SelectedProduct[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<SelectedProduct[]>>;
}

const SeedTreatment: React.FC<SeedTreatmentProps> = ({ selectedProducts, setSelectedProducts }) => {
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [currentUnit, setCurrentUnit] = useState('');

  const units = ['g/ha', 'ml/ha', 'kg/ha', 'L/ha', 'L/tonne of seed', 'kg/tonne of seed'];

  const addProduct = () => {
    if (currentProduct && currentRate && currentUnit) {
      const productData = products.find(p => p.value === currentProduct);
      if (productData) {
        const newProduct: SelectedProduct = {
          id: Date.now().toString(),
          product: productData.label,
          rate: currentRate,
          unit: currentUnit
        };
        setSelectedProducts([...selectedProducts, newProduct]);
        setCurrentProduct('');
        setCurrentRate('');
        setCurrentUnit('');
      }
    }
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const handleProductChange = (value: string) => {
    setCurrentProduct(value);
    const productData = products.find(p => p.value === value);
    if (productData) {
      setCurrentRate(productData.defaultRate);
      setCurrentUnit(productData.defaultUnit);
    }
  };

  return (
    <ReportSection title="Seed Treatment">
      <Card className="bg-white">
        <CardContent>
          <div className="space-y-4 mt-6">
            <p className="text-gray-700 mb-4">
              Seed treatments enhance germination rates, protect against soil-borne diseases, and establish beneficial microbial relationships. Apply treatments according to seed weight and planting conditions for optimal establishment.
            </p>
            
            <Card className="bg-white">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="product">Select Product</Label>
                    <Select value={currentProduct} onValueChange={handleProductChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose seed treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.value} value={product.value}>
                            <a
                              href={`https://www.nutri-tech.com.au/products/${product.value}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {product.label}
                            </a>
                            {product.nutrientPercents && (
                              <span className="text-xs text-gray-500 ml-2">({product.nutrientPercents.join(', ')})</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rate">Application Rate</Label>
                    <Input
                      id="rate"
                      type="text"
                      value={currentRate}
                      onChange={(e) => setCurrentRate(e.target.value)}
                      placeholder="Enter rate"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={currentUnit} onValueChange={setCurrentUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={addProduct} 
                      disabled={!currentProduct || !currentRate || !currentUnit}
                      className="bg-[#8cb43a] hover:bg-[#7ca32e] text-white w-full"
                    >
                      Add Product
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedProducts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-black">Selected Products:</h4>
                {selectedProducts.map((product) => {
                  const productData = products.find(p => p.label === product.product);
                  return (
                    <Card key={product.id} className="bg-purple-100 border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-black">
                                {product.product}
                                {productData && productData.contains && (
                                  <span className="text-xs text-gray-500 ml-2">({productData.contains.join(', ')})</span>
                                )}
                              </h5>
                              <p className="text-sm text-purple-700">Rate: {product.rate} {product.unit}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ReportSection>
  );
};

export const PlantingBlend: React.FC<SeedTreatmentProps> = ({ selectedProducts, setSelectedProducts }) => {
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [currentUnit, setCurrentUnit] = useState('');

  const units = ['g/ha', 'ml/ha', 'kg/ha', 'L/ha', 'L/tonne of seed', 'kg/tonne of seed'];

  const addProduct = () => {
    if (currentProduct && currentRate && currentUnit) {
      const productData = products.find(p => p.value === currentProduct);
      if (productData) {
        const newProduct: SelectedProduct = {
          id: Date.now().toString(),
          product: productData.label,
          rate: currentRate,
          unit: currentUnit
        };
        setSelectedProducts([...selectedProducts, newProduct]);
        setCurrentProduct('');
        setCurrentRate('');
        setCurrentUnit('');
      }
    }
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const handleProductChange = (value: string) => {
    setCurrentProduct(value);
    const productData = products.find(p => p.value === value);
    if (productData) {
      setCurrentRate(productData.defaultRate);
      setCurrentUnit(productData.defaultUnit);
    }
  };

  return (
    <ReportSection title="Planting Blend">
      <Card className="bg-white">
        <CardContent>
          <div className="space-y-4 mt-6">
            <p className="text-gray-700 mb-4">
              Planting blends provide a balanced mix of nutrients and biologicals at sowing, supporting early root development and crop establishment. Apply blends according to crop and soil needs for best results.
            </p>
            <Card className="bg-white">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="product">Select Product</Label>
                    <Select value={currentProduct} onValueChange={handleProductChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose planting blend" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.value} value={product.value}>
                            <a
                              href={`https://www.nutri-tech.com.au/products/${product.value}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline"
                            >
                              {product.label}
                            </a>
                            {product.nutrientPercents && (
                              <span className="text-xs text-gray-500 ml-2">({product.nutrientPercents.join(', ')})</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rate">Application Rate</Label>
                    <Input
                      id="rate"
                      type="text"
                      value={currentRate}
                      onChange={(e) => setCurrentRate(e.target.value)}
                      placeholder="Enter rate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={currentUnit} onValueChange={setCurrentUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={addProduct} 
                      disabled={!currentProduct || !currentRate || !currentUnit}
                      className="bg-[#8cb43a] hover:bg-[#7ca32e] text-white w-full"
                    >
                      Add Product
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {selectedProducts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-black">Selected Products:</h4>
                {selectedProducts.map((product) => {
                  const productData = products.find(p => p.label === product.product);
                  return (
                    <Card key={product.id} className="bg-orange-100 border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-black">
                                {product.product}
                                {productData && productData.contains && (
                                  <span className="text-xs text-gray-500 ml-2">({productData.contains.join(', ')})</span>
                                )}
                              </h5>
                              <p className="text-sm text-orange-700">Rate: {product.rate} {product.unit}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ReportSection>
  );
};

export default SeedTreatment;