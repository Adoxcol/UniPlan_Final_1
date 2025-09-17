'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  Download,
  Star,
  Filter,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  Shield
} from 'lucide-react';
import { DegreeTemplateService } from '@/lib/degreeTemplateService';
import { DegreeTemplate } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface TemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateLibrary({ open, onOpenChange }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<DegreeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DegreeTemplate | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const publicTemplates = await DegreeTemplateService.getPublicTemplates();
      setTemplates(publicTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates
    .filter(template => {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.university?.toLowerCase().includes(query) ||
        template.major?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Prioritize official templates first
      if (a.is_official && !b.is_official) return -1;
      if (!a.is_official && b.is_official) return 1;
      // Then sort by download count (descending)
      return b.download_count - a.download_count;
    });

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

    // Close the template library dialog first to prevent z-index issues
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Template Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Template List */}
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by name, university, major, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading templates...</p>
                  </div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery ? 'No templates found' : 'No templates available'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'Try adjusting your search terms'
                        : 'Be the first to create a public template!'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-1">
                              {template.name}
                            </CardTitle>
                            {template.university && (
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Building className="h-3 w-3" />
                                {template.university}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex gap-2 ml-2">
                            {template.is_official && (
                              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                                <Shield className="h-3 w-3 mr-1" />
                                Official
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            showApplyConfirmation(template);
                          }}
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
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Template Details Sidebar */}
          {selectedTemplate && (
            <div className="w-80 border-l pl-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                    {selectedTemplate.is_official && (
                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                        <Shield className="h-3 w-3 mr-1" />
                        Official
                      </Badge>
                    )}
                  </div>
                  {selectedTemplate.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Template Details</h4>
                  
                  {selectedTemplate.university && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">University:</span>
                      <span>{selectedTemplate.university}</span>
                    </div>
                  )}
                  
                  {selectedTemplate.major && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Major:</span>
                      <span>{selectedTemplate.major}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Duration:</span>
                    <span>{selectedTemplate.semesters?.length || 0} semesters</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Total Credits:</span>
                    <span>{selectedTemplate.total_credits}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Created:</span>
                    <span>{formatDate(selectedTemplate.created_at)}</span>
                  </div>
                </div>



                <Separator />

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Applying this template will replace your current semester plan. 
                    Make sure to save your current plan if needed.
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full"
                  onClick={() => showApplyConfirmation(selectedTemplate)}
                  disabled={isApplying === selectedTemplate.id}
                >
                  {isApplying === selectedTemplate.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying Template...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Apply This Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}