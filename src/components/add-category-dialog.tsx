'use client';

import { useState } from 'react';
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
import { useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/firebase/errors';

interface AddCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: (categoryName: string) => void;
}

export function AddCategoryDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: AddCategoryDialogProps) {
  const { firestore, auth } = useFirebase();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !name.trim()) return;

    console.log('Attempting to add category. Current user:', auth?.currentUser?.email);
    console.log('Auth UID:', auth?.currentUser?.uid);
    console.log('Firestore instance:', firestore);

    setIsSubmitting(true);
    try {
      // Check if category already exists
      const q = query(collection(firestore, 'categories'), where('name', '==', name.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({
          title: 'Info',
          description: 'Category already exists.',
        });
        onSuccess?.(name.trim());
        onOpenChange(false);
        setName('');
        return;
      }

      await addDoc(collection(firestore, 'categories'), {
        name: name.trim(),
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'New category added.',
      });
      
      onSuccess?.(name.trim());
      onOpenChange(false);
      setName('');
    } catch (error) {
      console.error('Error adding category:', error);
      const errInfo = handleFirestoreError(error, OperationType.CREATE, 'categories', auth);
      toast({
        title: 'Error',
        description: `Failed to add category: ${errInfo.error}`,
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
          <DialogTitle>Add New Category</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Enter the name for the new category.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id="name"
              placeholder="e.g., Irrigation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
