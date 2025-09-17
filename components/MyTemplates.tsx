'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Lock,
  Globe,
  Loader2,
  AlertTriangle,
  Plus,
  Clock,
  Building
} from 'lucide-react';
import { DegreeTemplateService } from '@/lib/degreeTemplateService';
import { DegreeTemplate } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface MyTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateNew: () => void;
}

export function MyTemplates({ open, onOpenChange, onCreateNew }: MyTemplatesProps) {
  const [templates, setTemplates] = useState<DegreeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadMyTemplates();
    }
  }, [open]);

  const loadMyTemplates = async () => {
    setIsLoading(true);
    try {
      const userTemplates = await DegreeTemplateService.getUserTemplates();
      setTemplates(userTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load your templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = async (template: DegreeTemplate) => {
    setIsApplying(template.id);
    try {
      // Always override (delete existing plan) when applying templates
      await DegreeTemplateService.applyTemplate(template.id, { override: true });
      // Sync data from database to update the UI
      await useAppStore.getState().syncFromSupabase();
      toast.success(`Applied "${template.name}" template successfully!`, {
        description: 'Your semester plan has been replaced with the template.'
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error applying template:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to apply template. Please try again.';
      let errorDescription = '';
      
      if (error?.message) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = 'Duplicate semester detected';
          errorDescription = 'This template contains semesters that already exist in your plan. Please try refreshing and applying again.';
        } else if (error.message.includes('Failed to clear existing')) {
          errorMessage = 'Could not clear existing data';
          errorDescription = 'Please try refreshing the page and applying the template again.';
        } else if (error.message.includes('Template not found')) {
          errorMessage = 'Template not found';
          errorDescription = 'This template may have been deleted or is no longer available.';
        } else if (error.message.includes('User must be authenticated')) {
          errorMessage = 'Authentication required';
          errorDescription = 'Please sign in to apply templates.';
        } else {
          errorDescription = error.message;
        }
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000
      });
    } finally {
      setIsApplying(null);
    }
  };

  const showApplyConfirmation = (template: DegreeTemplate) => {
    const hasExistingData = useAppStore.getState().semesters.length > 0;
    
    if (!hasExistingData) {
      // No existing data, just apply normally
      handleApplyTemplate(template);
      return;
    }

    // Close the my templates dialog first to prevent z-index issues
    onOpenChange(false);

    // Show Sonner confirmation dialog for existing data after a brief delay
    setTimeout(() => {
      toast.custom((t) => (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                Replace Existing Plan?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Applying &quot;{template.name}&quot; will <strong>permanently delete</strong> your current semester plan and replace it with this template.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    toast.dismiss(t);
                    handleApplyTemplate(template);
                  }}
                >
                  Replace Plan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.dismiss(t)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center'
      });
    }, 100); // Small delay to ensure dialog closes first
  };

  const handleDeleteTemplate = async (template: DegreeTemplate) => {
    setIsDeleting(template.id);
    try {
      await DegreeTemplateService.deleteTemplate(template.id);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(null);
    }
  };

  const showDeleteConfirmation = (template: DegreeTemplate) => {
    toast.custom((t) => (
      <div className="bg-background border border-border rounded-lg p-4 shadow-lg max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Delete Template?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Are you sure you want to delete &quot;{template.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  toast.dismiss(t);
                  handleDeleteTemplate(template);
                }}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.dismiss(t)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center'
    });
  };

  const handleToggleVisibility = async (template: DegreeTemplate) => {
    setIsToggling(template.id);
    try {
      const updatedTemplate = await DegreeTemplateService.updateTemplate(template.id, {
        is_public: !template.is_public
      });
      
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, is_public: updatedTemplate.is_public } : t
      ));
      
      toast.success(
        updatedTemplate.is_public 
          ? 'Template is now public' 
          : 'Template is now private'
      );
    } catch (error) {
      console.error('Error updating template visibility:', error);
      toast.error('Failed to update template visibility');
    } finally {
      setIsToggling(null);
    }
  };

  const handleShareTemplate = async (template: DegreeTemplate) => {
    try {
      const shareUrl = `${window.location.origin}/templates/${template.id}`;
      const { copyToClipboard } = await import('@/lib/utils');
      await copyToClipboard(shareUrl);
      toast.success('Template link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Templates
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading your templates...</p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first degree template to save and share your academic plan.
                </p>
                <Button onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-1 pr-2">
                          {template.name}
                        </CardTitle>
                        {template.university && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building className="h-3 w-3" />
                            {template.university}
                          </CardDescription>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={template.is_public ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {template.is_public ? (
                            <>
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </>
                          )}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => showApplyConfirmation(template)}>
                              <Download className="h-4 w-4 mr-2" />
                              Apply Template
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareTemplate(template)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleToggleVisibility(template)}
                              disabled={isToggling === template.id}
                            >
                              {template.is_public ? (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Make Private
                                </>
                              ) : (
                                <>
                                  <Globe className="h-4 w-4 mr-2" />
                                  Make Public
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => showDeleteConfirmation(template)}
                              className="text-destructive"
                              disabled={isDeleting === template.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      {template.major && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {template.major}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {template.semesters?.length || 0} semesters
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {template.total_credits} credits
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(template.created_at)}
                      </div>
                    </div>



                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => showApplyConfirmation(template)}
                      disabled={isApplying === template.id}
                    >
                      {isApplying === template.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-2" />
                          Apply Template
                        </>
                      )}
                    </Button>
                  </CardContent>

                  {/* Loading overlays */}
                  {(isDeleting === template.id || isToggling === template.id) && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}