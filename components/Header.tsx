/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Calendar, Grid3X3, Download, Database, BookOpen, Library, Plus, User, Shield, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { DataManagementDialog } from '@/components/DataManagementDialog';
import { CreateTemplateDialog } from '@/components/CreateTemplateDialog';
import { TemplateLibrary } from '@/components/TemplateLibrary';
import { MyTemplates } from '@/components/MyTemplates';
import { isCurrentUserAdmin } from '@/lib/adminUtils';
import Link from 'next/link';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { 
    showScheduleView, 
    toggleScheduleView,
    exportToPDF,
    autoLayoutSemesters 
  } = useAppStore();
  const { userId, signInWithEmail, signOut } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showMyTemplates, setShowMyTemplates] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await isCurrentUserAdmin();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [userId]);

  // Early return prevents hydration mismatch
  if (!mounted) {
    return (
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.svg" 
              alt="DegreePlan Logo" 
              width={40} 
              height={40} 
              className="h-10 w-10"
            />
            <h1 className="text-2xl font-bold">DegreePlan</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/90 dark:border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.svg" 
            alt="DegreePlan Logo" 
            width={40} 
            height={40} 
            className="h-10 w-10"
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text leading-tight">DegreePlan</h1>
            <div className="hidden md:block text-xs text-muted-foreground/80 dark:text-muted-foreground leading-tight">
              Your Personal University Roadmap
            </div>
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
              onClick={autoLayoutSemesters}
              className="h-9"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Auto Layout
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowCreateTemplate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowMyTemplates(true)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Templates
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowTemplateLibrary(true)}>
                  <Library className="h-4 w-4 mr-2" />
                  Browse Library
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Theme toggle button - safe now because mounted is guaranteed */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 hover:bg-accent/50 dark:hover:bg-accent transition-colors relative"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {userId && isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Shield className="h-4 w-4" />
                <span className="sr-only">Admin Dashboard</span>
              </Button>
            </Link>
          )}

          {userId && (
            <Link href="/profile">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <User className="h-4 w-4" />
                <span className="sr-only">Profile</span>
              </Button>
            </Link>
          )}

          {userId ? (
            <Button variant="default" size="sm" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                signInWithEmail(prompt('Email') || '', prompt('Password') || '')
              }
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
      
      {/* Template Dialogs */}
      <CreateTemplateDialog 
        open={showCreateTemplate} 
        onOpenChange={setShowCreateTemplate} 
      />
      
      <TemplateLibrary 
        open={showTemplateLibrary} 
        onOpenChange={setShowTemplateLibrary} 
      />
      
      <MyTemplates 
        open={showMyTemplates} 
        onOpenChange={setShowMyTemplates}
        onCreateNew={() => {
          setShowMyTemplates(false);
          setShowCreateTemplate(true);
        }}
      />
    </header>
  );
}
