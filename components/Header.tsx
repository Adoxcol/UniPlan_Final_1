'use client';

import { Moon, Sun, Calendar, Grid3X3, Download, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { DataManagementDialog } from '@/components/DataManagementDialog';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { 
    showScheduleView, 
    toggleScheduleView,
    exportToPDF 
  } = useAppStore();
  const { userId, signInWithEmail, signOut } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/90 dark:border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">UP</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">UniPlan</h1>
          </div>
          <div className="hidden md:block text-sm text-muted-foreground/80 dark:text-muted-foreground">
            Your Personal University Roadmap
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Button
              variant={showScheduleView ? "default" : "outline"}
              size="sm"
              onClick={toggleScheduleView}
              className="h-9"
            >
              {showScheduleView ? (
                <Grid3X3 className="h-4 w-4 mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              {showScheduleView ? 'Grid View' : 'Schedule'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              className="h-9"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            
            <DataManagementDialog>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
              >
                <Database className="h-4 w-4 mr-2" />
                Data
              </Button>
            </DataManagementDialog>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 hover:bg-accent/50 dark:hover:bg-accent transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {userId ? (
            <Button variant="default" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => signInWithEmail(prompt('Email')||'', prompt('Password')||'')}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}