'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { DegreeTemplateService } from '@/lib/degreeTemplateService';
import { useAppStore } from '@/lib/store';

interface DeleteDegreePlanDialogProps {
  onDeleted?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function DeleteDegreePlanDialog({ 
  onDeleted, 
  variant = 'destructive',
  size = 'default',
  className 
}: DeleteDegreePlanDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await DegreeTemplateService.deleteAllPlanData();
      
      // Sync data from database to update the UI
      await useAppStore.getState().syncFromSupabase();
      
      toast.success('Degree plan deleted successfully', {
        description: 'All your semesters and courses have been removed.'
      });
      
      setIsOpen(false);
      onDeleted?.();
    } catch (error: any) {
      console.error('Error deleting degree plan:', error);
      
      let errorMessage = 'Failed to delete degree plan. Please try again.';
      let errorDescription = '';
      
      if (error?.message) {
        if (error.message.includes('Failed to delete courses')) {
          errorMessage = 'Could not delete courses';
          errorDescription = 'Please try refreshing the page and deleting again.';
        } else if (error.message.includes('Failed to delete semesters')) {
          errorMessage = 'Could not delete semesters';
          errorDescription = 'Please try refreshing the page and deleting again.';
        } else if (error.message.includes('User must be authenticated')) {
          errorMessage = 'Authentication required';
          errorDescription = 'Please sign in to delete your degree plan.';
        } else {
          errorDescription = error.message;
        }
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={className}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Degree Plan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Entire Degree Plan
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>This action cannot be undone.</strong> This will permanently delete:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All your semesters</li>
              <li>All your courses</li>
              <li>Your degree information</li>
              <li>All progress and notes</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Are you sure you want to delete your entire degree plan?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Everything'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}