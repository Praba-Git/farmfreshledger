'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown, FileUp, LogOut, User } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
  onAddTransaction: () => void;
  onExport: () => void;
  onImport: () => void;
  showAdd?: boolean;
  showImportExport?: boolean;
  isAdmin?: boolean;
  isClerk?: boolean;
}

export function Header({ 
  onAddTransaction, 
  onExport, 
  onImport,
  showAdd = true,
  showImportExport = true,
  isAdmin = false,
  isClerk = false
}: HeaderProps) {
  const { auth, user } = useFirebase();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const getFallback = () => {
    if (isAdmin) return 'A';
    if (isClerk) return 'C';
    return user?.displayName?.charAt(0) || 'U';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            FF
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl font-grotesk">
            Farm Fresh Ledger
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {showImportExport && (
            <>
              <Button variant="outline" size="sm" onClick={onImport} className="hidden sm:flex">
                <FileUp className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={onExport} className="hidden sm:flex">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </>
          )}
          {showAdd && (
            <Button size="sm" onClick={onAddTransaction}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                  <AvatarFallback>{getFallback()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
