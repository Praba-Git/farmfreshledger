'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
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
import { useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Category, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateTransaction } from '@/lib/actions';
import { AddCategoryDialog } from './add-category-dialog';
import { formatLocalDate, parseLocalDate } from '@/lib/utils';

interface EditTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean, wasSuccessful?: boolean) => void;
  categories: Category[];
  transaction: Transaction | null;
}

export function EditTransactionDialog({
  isOpen,
  onOpenChange,
  categories,
  transaction,
}: EditTransactionDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    description: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    quantityInKg: '',
    ratePerKg: '',
  });

  useEffect(() => {
    if (transaction) {
      const date = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date);
      setFormData({
        amount: transaction.amount.toString(),
        date: formatLocalDate(date),
        description: transaction.description,
        type: transaction.type,
        category: transaction.category,
        quantityInKg: transaction.quantityInKg?.toString() || '',
        ratePerKg: transaction.ratePerKg?.toString() || '',
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !transaction || !transaction.id) return;

    setIsSubmitting(true);
    try {
      await updateTransaction(firestore, transaction.id, {
        ...formData,
        amount: parseFloat(formData.amount),
        quantityInKg: formData.quantityInKg ? parseFloat(formData.quantityInKg) : null,
        ratePerKg: formData.ratePerKg ? parseFloat(formData.ratePerKg) : null,
        date: parseLocalDate(formData.date),
      } as any);

      toast({
        title: 'Success',
        description: 'Transaction updated successfully.',
      });
      onOpenChange(false, true);
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <div className="col-span-3 flex gap-2">
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => setIsAddingCategory(true)}
                title="Add New Category"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          {formData.type === 'income' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">Qty (Kg)</Label>
                    <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantityInKg}
                    onChange={(e) => setFormData({ ...formData, quantityInKg: e.target.value })}
                    className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rate" className="text-right">Rate/Kg</Label>
                    <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={formData.ratePerKg}
                    onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                    className="col-span-3"
                    />
                </div>
              </>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Desc</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AddCategoryDialog 
        isOpen={isAddingCategory} 
        onOpenChange={setIsAddingCategory}
        onSuccess={(name) => setFormData({ ...formData, category: name })}
      />
    </Dialog>
  );
}
