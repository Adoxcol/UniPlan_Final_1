'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { UserProfile } from '@/components/UserProfile';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold">User Profile</h1>
          
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Profile Component */}
        <UserProfile />
      </div>
    </div>
  );
}