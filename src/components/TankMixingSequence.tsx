import React, { useState, useEffect } from 'react';
import ReportSection from './ReportSection';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface MixingItem {
  id: string;
  sequence: number;
  productDescription: string;
  products: string[];
  notes: string;
}

const productDescriptions = [
  'More soluble Solids',
  'Liquid Solutions', 
  'MMS (Micronized Mineral Solutions)',
  'Spray Oil',
  'Microbial Products'
];

const productNotes = [
  'May require several minutes of good agitation',
  'Make sure previous inputs are fully dissolved before adding.',
  'Pre-mix well before adding slowly to the tank under constant agitation. Maintain constant agitation to prevent settling.',
  'Spreader/sticker/penetrant. Essential for success of foliar sprays.',
  'Always add microbes to the spray tank last after the other ingredients have been diluted.'
];

interface TankMixingSequenceProps {
  selectedProducts: string[];
  mixingItems: MixingItem[];
  setMixingItems: React.Dispatch<React.SetStateAction<MixingItem[]>>;
  onSummaryChange?: (items: MixingItem[]) => void;
}

const TankMixingSequence: React.FC<TankMixingSequenceProps> = ({ selectedProducts, mixingItems, setMixingItems, onSummaryChange }) => {
  const addItem = () => {
    const newItem: MixingItem = {
      id: Date.now().toString(),
      sequence: mixingItems.length + 1,
      productDescription: '',
      products: [],
      notes: ''
    };
    setMixingItems([...mixingItems, newItem]);
  };

  const removeItem = (id: string) => {
    const newItems = mixingItems.filter(item => item.id !== id);
    newItems.forEach((item, index) => {
      item.sequence = index + 1;
    });
    setMixingItems(newItems);
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = mixingItems.findIndex(item => item.id === id);
    if ((direction === 'up' && currentIndex > 0) || (direction === 'down' && currentIndex < mixingItems.length - 1)) {
      const newItems = [...mixingItems];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      [newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]];
      
      newItems.forEach((item, index) => {
        item.sequence = index + 1;
      });
      
      setMixingItems(newItems);
    }
  };

  const updateItem = (id: string, field: keyof MixingItem, value: any) => {
    setMixingItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'productDescription') {
          const descIndex = productDescriptions.indexOf(value as string);
          if (descIndex !== -1) {
            updatedItem.notes = productNotes[descIndex];
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  useEffect(() => {
    if (onSummaryChange) onSummaryChange(mixingItems);
  }, [JSON.stringify(mixingItems)]);

  return (
    <ReportSection title="General Tank Mixing Sequence">
      <Card className="bg-white">
        <CardContent>
          <div className="space-y-4 mt-6">
            <p className="text-gray-700 mb-4">
              Proper tank mixing sequence prevents chemical incompatibilities and ensures optimal product efficacy. 
              Select from foliar spray products and arrange in proper mixing order.
            </p>
            
            <Card className="bg-white">
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Order</TableHead>
                      <TableHead>Product Description</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mixingItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.sequence}</TableCell>
                        <TableCell>
                          <Select
                            value={item.productDescription}
                            onValueChange={(value) => updateItem(item.id, 'productDescription', value)}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select description" />
                            </SelectTrigger>
                            <SelectContent>
                              {productDescriptions.map((desc) => (
                                <SelectItem key={desc} value={desc}>
                                  {desc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                {item.products && item.products.length > 0 ? item.products.join(', ') : 'Select product(s)'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <div className="flex flex-col gap-2">
                                {selectedProducts.map((product) => {
                                  // Disable if selected in another row
                                  const isSelectedElsewhere = mixingItems.some(
                                    (other) => other.id !== item.id && other.products.includes(product)
                                  );
                                  return (
                                    <label key={product} className={`flex items-center gap-2 cursor-pointer ${isSelectedElsewhere ? 'opacity-50 pointer-events-none' : ''}`}>
                                      <Checkbox
                                        checked={item.products.includes(product)}
                                        onCheckedChange={(checked) => {
                                          if (isSelectedElsewhere) return;
                                          const newProducts = checked
                                            ? [...item.products, product]
                                            : item.products.filter((p) => p !== product);
                                          updateItem(item.id, 'products', newProducts);
                                        }}
                                        disabled={isSelectedElsewhere}
                                      />
                                      <span>{product}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <textarea
                            className="text-sm p-2 bg-gray-50 rounded min-h-[60px] w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={item.notes}
                            onChange={e => updateItem(item.id, 'notes', e.target.value)}
                            rows={2}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={item.sequence === 1}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={item.sequence === mixingItems.length}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {mixingItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No products added yet. Click "Add Product" to start building your mixing sequence.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </ReportSection>
  );
};

export default TankMixingSequence;