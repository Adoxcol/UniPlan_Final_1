/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap,
  Download,
  ArrowLeft,
  Building,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { DegreeTemplateService } from '@/lib/degreeTemplateService';
import { DegreeTemplate } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();

  const [template, setTemplate] = useState<DegreeTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templateId = params.id as string;

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const templateData = await DegreeTemplateService.getTemplate(templateId);
      setTemplate(templateData);
    } catch (error) {
      console.error('Error loading template:', error);
      setError('Template not found or no longer available');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!template) return;
    
    setIsApplying(true);
    try {
      // Always override (delete existing plan) when applying templates
      await DegreeTemplateService.applyTemplate(template.id, { override: true });
      // Sync data from database to update the UI
      await useAppStore.getState().syncFromSupabase();
      toast.success(`Applied "${template.name}" template successfully!`, {
        description: 'Your semester plan has been replaced with the template.'
      });
      router.push('/planner');
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
      setIsApplying(false);
    }
  };

  const showApplyConfirmation = () => {
    const hasExistingData = useAppStore.getState().semesters.length > 0;
    
    if (!hasExistingData) {
      // No existing data, just apply normally
      handleApplyTemplate();
      return;
    }

    // Show Sonner confirmation dialog for existing data
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
              Applying &quot;{template?.name}&quot; will <strong>permanently delete</strong> your current semester plan and replace it with this template.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  toast.dismiss(t);
                  handleApplyTemplate();
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
  };

  const handleCopyLink = async () => {
    try {
      const { copyToClipboard } = await import('@/lib/utils');
      await copyToClipboard(window.location.href);
      toast.success('Template link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-medium mb-2">Loading Template</h2>
              <p className="text-muted-foreground">Please wait while we fetch the template details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
              <p className="text-muted-foreground mb-6">
                {error || 'The template you\'re looking for doesn\'t exist or is no longer available.'}
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open UniPlan
              </Button>
            </Link>
          </div>
        </div>

        {/* Template Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{template.name}</CardTitle>
                {template.university && (
                  <CardDescription className="flex items-center gap-2 text-base">
                    <Building className="h-4 w-4" />
                    {template.university}
                  </CardDescription>
                )}
              </div>
              
              <Badge variant="default" className="ml-4">
                <Users className="h-3 w-3 mr-1" />
                Public Template
              </Badge>
            </div>
            
            {template.description && (
              <p className="text-muted-foreground mt-4 leading-relaxed">
                {template.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              {template.major && (
                <div className="text-center">
                  <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <div className="font-medium">{template.major}</div>
                  <div className="text-sm text-muted-foreground">Major</div>
                </div>
              )}
              
              <div className="text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="font-medium">{template.semesters?.length || 0} Semesters</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              
              <div className="text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="font-medium">{template.total_credits}</div>
                <div className="text-sm text-muted-foreground">Total Credits</div>
              </div>
              
              <div className="text-center">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="font-medium">{formatDate(template.created_at)}</div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
            </div>


          </CardContent>
        </Card>

        {/* Apply Template Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Apply This Template
            </CardTitle>
            <CardDescription>
              Use this degree template as a starting point for your academic planning
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This template will create a complete semester plan based on the original creator&apos;s academic roadmap. 
                You can customize it after applying to match your specific needs and preferences.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What you&apos;ll get:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete semester-by-semester course plan</li>
                  <li>• Organized course sequence and prerequisites</li>
                  <li>• Credit hour distribution across semesters</li>
                  <li>• Customizable foundation for your degree planning</li>
                </ul>
              </div>
              
              <Button 
                size="lg" 
                className="w-full" 
                onClick={showApplyConfirmation}
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying Template...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Apply &quot;{template.name}&quot; Template
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Applying this template will replace any existing semester plan you may have
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}