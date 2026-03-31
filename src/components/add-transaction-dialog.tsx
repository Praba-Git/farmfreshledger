'use client';

import { useState, useRef } from 'react';
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
import { useFirebase, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ScanLine, Camera } from 'lucide-react';
import { processImageWithOcr } from '@/ai/flows/process-image-with-ocr';
import { extractExpenseData } from '@/ai/flows/extract-expense-data-from-text';

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean, wasSuccessful?: boolean) => void;
  categories: Category[];
}

export function AddTransactionDialog({
  isOpen,
  onOpenChange,
  categories,
}: AddTransactionDialogProps) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    quantityInKg: '',
    ratePerKg: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'transactions'), {
        ...formData,
        amount: parseFloat(formData.amount),
        quantityInKg: formData.quantityInKg ? parseFloat(formData.quantityInKg) : null,
        ratePerKg: formData.ratePerKg ? parseFloat(formData.ratePerKg) : null,
        date: new Date(formData.date),
        createdAt: serverTimestamp(),
        uid: user.uid,
      });

      toast({
        title: 'Success',
        description: 'Transaction added successfully.',
      });
      onOpenChange(false, true);
      setFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'expense',
        category: '',
        quantityInKg: '',
        ratePerKg: '',
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        toast({
            title: "Scanning...",
            description: "Extracting text from image using AI OCR."
        });

        const ocrResult = await processImageWithOcr({ image: base64String });
        
        toast({
            title: "Processing...",
            description: "Analyzing text to extract transaction details."
        });

        const extractedData = await extractExpenseData({ 
            text: ocrResult.text,
            categories: categories.map(c => c.name)
        });

        if (extractedData.transactions && extractedData.transactions.length > 0) {
          const first = extractedData.transactions[0];
          setFormData({
            amount: first.amount.toString(),
            date: first.date.split('T')[0],
            description: first.description,
            type: first.type,
            category: first.category,
            quantityInKg: first.quantityInKg?.toString() || '',
            ratePerKg: first.ratePerKg?.toString() || '',
          });
          toast({
            title: 'Success',
            description: 'Transaction data extracted successfully.',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error scanning receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to scan receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-2">
            <Button 
                variant="outline" 
                className="w-full border-dashed border-2 h-16 flex flex-col gap-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
            >
                {isScanning ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        <ScanLine className="h-5 w-5" />
                        <span className="text-xs">Scan Receipt / Record</span>
                    </>
                )}
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleScanReceipt}
            />
        </div>
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
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="col-span-3">
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
              Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
