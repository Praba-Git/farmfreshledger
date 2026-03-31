'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { seedInitialCategories, exportData, importData } from '@/lib/actions';
import type { Transaction, Category } from '@/lib/types';
import { Header } from '@/components/header';
import { TransactionTable } from '@/components/transaction-table';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { EditTransactionDialog } from '@/components/edit-transaction-dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ShoppingCart } from 'lucide-react';
import { useCollection, useFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import withAuth from '@/components/with-auth';
import { Loader2 } from 'lucide-react';
import { TransactionFilters, type Filters } from '@/components/transaction-filters';
import { getSafeTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


function Home() {
  const { firestore } = useFirebase();
  const { user, claims } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hasSeedingAttempted, setHasSeedingAttempted] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    type: 'all',
    dateRange: undefined,
  });

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (firestore && user) {
      const userRef = doc(firestore, 'users', user.uid);
      getDoc(userRef).then(docSnap => {
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        }
      });
    }
  }, [firestore, user]);

  const isAdmin = claims?.role === 'admin' || userRole === 'admin' || user?.email === 'mailtoempee@gmail.com' || user?.email === 'admin@mydomain.com';
  const isClerk = claims?.role === 'clerk' || userRole === 'clerk' || user?.email === 'clerk@mydomain.com';
  const hasFullAccess = isAdmin || isClerk;

  // Memoize Firestore queries
  const transactionsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    
    // Admins and Clerks can see all transactions; regular users only see their own
    if (hasFullAccess) {
      return query(
        collection(firestore, 'transactions')
      );
    }

    return query(
        collection(firestore, 'transactions'), 
        where('uid', '==', user.uid),
        orderBy('date', 'desc')
    );
  }, [firestore, user, hasFullAccess]);

  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('name', 'asc'));
  }, [firestore]);


  // Fetch data using hooks
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);
  const { data: allCategories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);

  useEffect(() => {
    // Seed categories for new user
    if (firestore && !isLoadingCategories && allCategories && allCategories.length === 0 && !hasSeedingAttempted) {
        setHasSeedingAttempted(true);
        console.log('No categories found, attempting to seed...');
        seedInitialCategories(firestore).catch(() => {
            // Error is handled by the global error listener,
            // but we catch here to prevent unhandled promise rejection warnings in the console.
        });
    }
  }, [firestore, allCategories, isLoadingCategories, hasSeedingAttempted]);


  useEffect(() => {
    if (allCategories) {
        setCategories(allCategories);
    }
  }, [allCategories]);


  const handleDialogClose = (isOpen: boolean, wasSuccessful?: boolean) => {
    if (!isOpen) {
      setIsAddOpen(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditOpen(true);
  };

  const handleExport = async () => {
    if (!firestore) return;
    await exportData(firestore);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore) return;

    setIsImporting(true);
    toast({
      title: 'Importing...',
      description: 'Please wait while we process your data.',
    });

    try {
      const count = await importData(firestore, file);
      toast({
        title: 'Success',
        description: `Successfully imported ${count} transactions.`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to import data.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: 'all',
      type: 'all',
      dateRange: undefined,
    });
  };

  const fromTimestamp = filters.dateRange?.from?.getTime();
  const toTimestamp = filters.dateRange?.to?.getTime();

  const filteredTransactions = useMemo(() => {
    if (!transactions) {
      return [];
    }
    return transactions.filter(t => {
      const fromTime = fromTimestamp ? new Date(fromTimestamp).setHours(0, 0, 0, 0) : null;
      const toDate = toTimestamp ? new Date(toTimestamp) : (fromTimestamp ? new Date(fromTimestamp) : null);
      const toTime = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;

      const categoryMatch = filters.category === 'all' || t.category === filters.category;
      const typeMatch = filters.type === 'all' || t.type === filters.type;
      
      let dateMatch = true;
      if (fromTime !== null && toTime !== null) {
        const transactionTime = getSafeTime(t.date);
        dateMatch = transactionTime !== null && transactionTime >= fromTime && transactionTime <= toTime;
      }
      
      return categoryMatch && typeMatch && dateMatch;
    })
  }, [
    transactions,
    filters.category,
    filters.type,
    fromTimestamp,
    toTimestamp,
  ]);


  const { 
    totalIncome, 
    totalExpense, 
    netProfit,
  } = useMemo(() => { // Also memoize this calculation for performance.
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.totalIncome += t.amount;
        } else { // expense
          acc.totalExpense += t.amount;
        }
        acc.netProfit = acc.totalIncome - acc.totalExpense;
        return acc;
      },
      { 
        totalIncome: 0, 
        totalExpense: 0, 
        netProfit: 0,
      }
    );
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };
  
  const isLoading = isLoadingTransactions || isLoadingCategories;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header 
        onAddTransaction={() => setIsAddOpen(true)} 
        onExport={handleExport} 
        onImport={handleImportClick}
        showAdd={isAdmin}
        showImportExport={isAdmin}
        isAdmin={isAdmin}
        isClerk={isClerk}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".csv,.json" 
        onChange={handleFileChange}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">
                Total income from sales (filtered)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpense)}</div>
              <p className="text-xs text-muted-foreground">
                Total farm-related expenses (filtered)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(netProfit)}</div>
              <p className="text-xs text-muted-foreground">
                Total revenue minus expenses (filtered)
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4">
            {/* Debug info - remove later */}
            <div className="text-xs text-muted-foreground">
                Admin: {isAdmin ? 'Yes' : 'No'} | 
                User: {user?.email} | 
                Raw Transactions: {transactions?.length ?? 'null'} | 
                Filtered: {filteredTransactions.length}
            </div>
            <TransactionFilters 
                categories={categories}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <TransactionTable 
              transactions={filteredTransactions} 
              categories={categories}
              onEdit={handleEdit}
              isAdmin={isAdmin}
              isClerk={isClerk}
            />
            )}
        </div>
      </main>
      <AddTransactionDialog
          isOpen={isAddOpen}
          onOpenChange={handleDialogClose}
          categories={categories}
      />
      <EditTransactionDialog
        isOpen={isEditOpen}
        onOpenChange={(open) => setIsEditOpen(open)}
        categories={categories}
        transaction={editingTransaction}
      />
    </div>
  );
}

export default withAuth(Home);
