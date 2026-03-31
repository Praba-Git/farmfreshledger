'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Check, X } from 'lucide-react';
import type { Category } from '@/lib/types';

interface ScannedTransaction {
  amount: number;
  date: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  quantityInKg?: number;
  ratePerKg?: number;
}

interface ScannedItemsReviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  items: ScannedTransaction[];
  categories: Category[];
  onSave: (items: ScannedTransaction[]) => Promise<void>;
}

export function ScannedItemsReviewDialog({
  isOpen,
  onOpenChange,
  items: initialItems,
  categories,
  onSave,
}: ScannedItemsReviewDialogProps) {
  const [items, setItems] = useState<ScannedTransaction[]>(initialItems);
  const [isSaving, setIsSaving] = useState(false);

  // Update items when initialItems change (e.g. after a new scan)
  useEffect(() => {
    if (isOpen) {
      setItems(initialItems);
    }
  }, [initialItems, isOpen]);

  const handleUpdateItem = (index: number, field: keyof ScannedTransaction, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(items);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving scanned items:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Scanned Items</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Qty (Kg)</TableHead>
                <TableHead>Rate/Kg</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      type="date"
                      value={item.date.split('T')[0]}
                      onChange={(e) => handleUpdateItem(index, 'date', e.target.value)}
                      className="w-[130px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.type}
                      onValueChange={(value) => handleUpdateItem(index, 'type', value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.category}
                      onValueChange={(value) => handleUpdateItem(index, 'category', value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleUpdateItem(index, 'amount', parseFloat(e.target.value))}
                      className="w-[100px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantityInKg || ''}
                      onChange={(e) => handleUpdateItem(index, 'quantityInKg', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-[80px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.ratePerKg || ''}
                      onChange={(e) => handleUpdateItem(index, 'ratePerKg', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-[80px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No items found. Please try scanning again or add manually.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving || items.length === 0}>
            {isSaving ? 'Saving...' : `Save ${items.length} Items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
