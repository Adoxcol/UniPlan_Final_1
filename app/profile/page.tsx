'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, User } from 'lucide-react';
import { UserProfile } from '@/components/UserProfile';
import Link from 'next/link';

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded mb-4 w-32"></div>
            <div className="h-6 bg-muted rounded mb-2 w-48"></div>
            <div className="h-8 bg-muted rounded mb-8 w-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8">
        {/* Navigation Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-accent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="flex items-center hover:text-foreground transition-colors">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <span>/</span>
            <span className="flex items-center text-foreground">
              <User className="h-4 w-4 mr-1" />
              Profile
            </span>
          </nav>
          
          {/* Page Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Profile</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Profile Component */}
        <UserProfile />
      </div>
    </div>
  );
}