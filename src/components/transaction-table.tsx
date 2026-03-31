'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Transaction, Category } from '@/lib/types';
import { format } from 'date-fns';
import { useFirebase, useUser } from '@/firebase';
import { deleteTransaction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (transaction: Transaction) => void;
  isAdmin: boolean;
  isClerk: boolean;
}

type SortKey = 'date' | 'description' | 'category' | 'type' | 'amount' | 'createdAt';
type SortDirection = 'asc' | 'desc' | null;

export function TransactionTable({ 
  transactions, 
  categories, 
  onEdit,
  isAdmin,
  isClerk
}: TransactionTableProps) {
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'createdAt',
    direction: 'desc',
  });

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const sortedTransactions = useMemo(() => {
    if (!sortConfig.direction) return transactions;

    return [...transactions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'date':
          aValue = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
          bValue = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
          break;
        case 'createdAt':
          aValue = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          bValue = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, sortConfig]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return format(d, 'dd MMM yyyy');
  };

  const formatDateTime = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return format(d, 'dd MMM yyyy HH:mm');
  };

  const handleDelete = async (id: string | undefined) => {
    if (!firestore || !id) return;
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await deleteTransaction(firestore, id);
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction.',
        variant: 'destructive',
      });
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column || !sortConfig.direction) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Row #</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors select-none" 
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center">Date <SortIcon column="date" /></div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors select-none" 
              onClick={() => handleSort('createdAt')}
            >
              <div className="flex items-center">Created At <SortIcon column="createdAt" /></div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors select-none" 
              onClick={() => handleSort('description')}
            >
              <div className="flex items-center">Description <SortIcon column="description" /></div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors select-none" 
              onClick={() => handleSort('category')}
            >
              <div className="flex items-center">Category <SortIcon column="category" /></div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors select-none" 
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center">Type <SortIcon column="type" /></div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50 transition-colors select-none" 
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center justify-end">Amount <SortIcon column="amount" /></div>
            </TableHead>
            {!isClerk && <TableHead className="w-[100px] text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isClerk ? 7 : 8} className="h-24 text-center">
                No transactions found.
              </TableCell>
            </TableRow>
          ) : (
            sortedTransactions.map((transaction, index) => {
              const canModify = isAdmin || (transaction.uid === user?.uid && !isClerk);

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {(index + 1).toString().padStart(2, '0')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{transaction.description}</span>
                      {transaction.type === 'income' && transaction.quantityInKg && (
                        <span className="text-xs text-muted-foreground">
                          {transaction.quantityInKg} Kg @ {formatCurrency(transaction.ratePerKg || 0)}/Kg
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.type === 'income' ? 'success' : 'destructive'}
                      className="capitalize"
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  {!isClerk && (
                    <TableCell className="text-right">
                      {canModify && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(transaction)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
