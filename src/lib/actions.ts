import { collection, addDoc, getDocs, Firestore, serverTimestamp, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { Category, Transaction } from './types';
import { handleFirestoreError, OperationType } from '@/firebase/errors';
import { getAuth } from 'firebase/auth';

export const INITIAL_CATEGORIES = [
  'Fertilizers',
  'Seeds',
  'Pesticides',
  'Labor',
  'Equipment',
  'Fuel',
  'Water',
  'Harvesting',
  'Marketing',
  'Sales',
  'Farm Maintenance',
];

export async function seedInitialCategories(db: Firestore) {
  const categoriesRef = collection(db, 'categories');
  const auth = getAuth();
  
  try {
    const snapshot = await getDocs(categoriesRef);
    if (snapshot.empty) {
      for (const name of INITIAL_CATEGORIES) {
        await addDoc(categoriesRef, { name });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'categories', auth);
    throw error;
  }
}

export async function exportData(db: Firestore) {
  const transactionsRef = collection(db, 'transactions');
  const snapshot = await getDocs(transactionsRef);
  const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Date,Description,Category,Type,Amount,Quantity (Kg),Rate (Per Kg)\n"
    + transactions.map((t: any) => {
        const date = t.date?.toDate ? t.date.toDate().toLocaleDateString() : new Date(t.date).toLocaleDateString();
        return `${date},"${t.description}","${t.category}",${t.type},${t.amount},${t.quantityInKg || ''},${t.ratePerKg || ''}`;
      }).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `farm_transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importData(db: Firestore, file: File) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const text = await file.text();
  const transactionsRef = collection(db, 'transactions');
  let importedCount = 0;

  if (file.name.endsWith('.json')) {
    try {
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : (data.transactions || [data]);
      
      // Get existing categories to avoid duplicates
      const categoriesRef = collection(db, 'categories');
      const catSnapshot = await getDocs(categoriesRef);
      const existingCats = new Set(catSnapshot.docs.map(doc => doc.data().name));

      for (const item of items) {
        try {
          const amount = parseFloat(item.amount || item.Amount || 0);
          if (isNaN(amount)) continue;

          const categoryName = item.category || item.Category || 'Uncategorized';
          
          // Auto-create category if it doesn't exist
          if (!existingCats.has(categoryName)) {
            await addDoc(categoriesRef, { name: categoryName });
            existingCats.add(categoryName);
          }

          await addDoc(transactionsRef, {
            amount,
            date: item.date ? Timestamp.fromDate(new Date(item.date)) : (item.Date ? Timestamp.fromDate(new Date(item.Date)) : serverTimestamp()),
            description: item.description || item.Description || 'Imported Transaction',
            category: categoryName,
            type: (item.type?.toLowerCase() === 'income' || item.Type?.toLowerCase() === 'income' ? 'income' : 'expense'),
            quantityInKg: item.quantityInKg || item['Quantity (Kg)'] ? parseFloat(item.quantityInKg || item['Quantity (Kg)']) : null,
            ratePerKg: item.ratePerKg || item['Rate (Per Kg)'] ? parseFloat(item.ratePerKg || item['Rate (Per Kg)']) : null,
            uid: user.uid,
            createdAt: serverTimestamp(),
          });
          importedCount++;
        } catch (e) {
          console.error('Error importing JSON item:', item, e);
        }
      }
      return importedCount;
    } catch (e) {
      throw new Error('Invalid JSON format.');
    }
  }

  const lines = text.split('\n');
  const headers = lines[0].split(',');
  
  // Basic validation of CSV headers
  if (!headers.includes('Amount') && !headers.includes('amount')) {
    throw new Error('Invalid format. Expected CSV with "Amount" header or a JSON file.');
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser (handles basic cases, doesn't handle nested commas in quotes perfectly but good for this use case)
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.replace(/^"|"$/g, '').trim();
    });

    try {
      const amount = parseFloat(row['Amount'] || row['amount']);
      if (isNaN(amount)) continue;

      await addDoc(transactionsRef, {
        amount,
        date: (row['Date'] || row['date']) ? Timestamp.fromDate(new Date(row['Date'] || row['date'])) : serverTimestamp(),
        description: row['Description'] || row['description'] || 'Imported Transaction',
        category: row['Category'] || row['category'] || 'Uncategorized',
        type: ((row['Type'] || row['type'])?.toLowerCase() === 'income' ? 'income' : 'expense'),
        quantityInKg: (row['Quantity (Kg)'] || row['quantityInKg']) ? parseFloat(row['Quantity (Kg)'] || row['quantityInKg']) : null,
        ratePerKg: (row['Rate (Per Kg)'] || row['ratePerKg']) ? parseFloat(row['Rate (Per Kg)'] || row['ratePerKg']) : null,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
      importedCount++;
    } catch (error) {
      console.error('Error importing row:', row, error);
    }
  }

  return importedCount;
}

export async function deleteTransaction(db: Firestore, id: string) {
  const auth = getAuth();
  try {
    await deleteDoc(doc(db, 'transactions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`, auth);
    throw error;
  }
}

export async function updateTransaction(db: Firestore, id: string, data: Partial<Transaction>) {
  const auth = getAuth();
  try {
    const { id: _, ...updateData } = data as any;
    await updateDoc(doc(db, 'transactions', id), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`, auth);
    throw error;
  }
}
