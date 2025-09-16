'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Plus, 
  X, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Users,
  Lock
} from 'lucide-react';
import { DegreeTemplateService, CreateDegreeTemplateData } from '@/lib/degreeTemplateService';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTemplateDialog({ open, onOpenChange }: CreateTemplateDialogProps) {
  const { semesters } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDegreeTemplateData>({
    name: '',
    description: '',
    university: '',
    major: '',
    total_credits: 0,
    duration_years: 4,
    is_public: false,
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  const calculatedCredits = semesters.reduce((sum, semester) => 
    sum + semester.courses.reduce((semSum, course) => semSum + course.credits, 0), 0
  );
  
  // Only use calculated credits if they're within the valid range (60-200), otherwise use null
  const totalCredits = calculatedCredits >= 60 && calculatedCredits <= 200 ? calculatedCredits : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (semesters.length === 0) {
      toast.error('You need at least one semester to create a template');
      return;
    }

    setIsLoading(true);
    
    try {
      const templateData = {
        ...formData,
        total_credits: totalCredits,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        university: formData.university?.trim() || undefined,
        major: formData.major?.trim() || undefined
      };

      await DegreeTemplateService.createTemplate({
        ...templateData,
        total_credits: totalCredits ?? undefined
      }, semesters);
      
      toast.success('Degree template created successfully!');
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        university: '',
        major: '',
        total_credits: 0,
        duration_years: 4,
        is_public: false,
        tags: []
      });
      setNewTag('');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Create Degree Template
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Overview */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Template Overview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Semesters:</span>
                <span className="ml-2 font-medium">{semesters.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Courses:</span>
                <span className="ml-2 font-medium">
                  {semesters.reduce((sum, s) => sum + s.courses.length, 0)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Credits:</span>
                <span className="ml-2 font-medium">
                  {calculatedCredits}
                  {calculatedCredits < 60 && (
                    <span className="text-orange-500 text-xs ml-1">(below minimum)</span>
                  )}
                  {calculatedCredits > 200 && (
                    <span className="text-orange-500 text-xs ml-1">(above maximum)</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-medium">
                  {Math.ceil(semesters.length / 2)} years
                </span>
              </div>
            </div>
          </div>

          {semesters.length === 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to create at least one semester with courses before creating a template.
              </AlertDescription>
            </Alert>
          )}

          {(calculatedCredits < 60 || calculatedCredits > 200) && calculatedCredits > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your current plan has {calculatedCredits} credits. Templates are typically between 60-200 credits. 
                The template will be saved without a specific credit total, allowing flexibility for users who adopt it.
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Computer Science - University of Example"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this degree plan, its focus areas, or any special notes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  placeholder="University name"
                />
              </div>
              <div>
                <Label htmlFor="major">Major/Program</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duration (Years)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="10"
                value={formData.duration_years}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  duration_years: parseInt(e.target.value) || 4 
                }))}
              />
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag (e.g., engineering, liberal-arts)"
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Privacy Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  {formData.is_public ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Make Template Public
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.is_public 
                    ? 'Other users can discover and use this template'
                    : 'Only you can access this template'
                  }
                </p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_public: checked }))
                }
              />
            </div>

            {formData.is_public && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Public templates help other students with similar academic paths. 
                  Your personal information won&apos;t be shared.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || semesters.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Template'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}