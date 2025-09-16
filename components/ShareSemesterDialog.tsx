'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Share2, 
  Copy, 
  Globe, 
  Lock, 
  Calendar, 
  Eye,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { SharingService } from '@/lib/sharingService';
import type { Semester, SharedPlan } from '@/lib/types';

interface ShareSemesterDialogProps {
  semester: Semester | null;
  open: boolean;
  onClose: () => void;
}

export function ShareSemesterDialog({ semester, open, onClose }: ShareSemesterDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [sharedPlan, setSharedPlan] = useState<SharedPlan | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
    hasExpiration: false,
    expirationDays: 30,
  });

  const handleClose = () => {
    setSharedPlan(null);
    setFormData({
      title: '',
      description: '',
      isPublic: false,
      hasExpiration: false,
      expirationDays: 30,
    });
    onClose();
  };

  const handleCreateShare = async () => {
    if (!semester) return;

    try {
      setIsCreating(true);

      const expiresAt = formData.hasExpiration 
        ? new Date(Date.now() + formData.expirationDays * 24 * 60 * 60 * 1000)
        : undefined;

      const plan = await SharingService.createSharedPlan(semester, {
        title: formData.title || semester.name,
        description: formData.description || `Shared plan for ${semester.name}`,
        isPublic: formData.isPublic,
        expiresAt,
      });

      setSharedPlan(plan);
      toast.success('Semester plan shared successfully!');
    } catch (error) {
      console.error('Error creating shared plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to share semester plan');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!sharedPlan) return;

    try {
      await SharingService.copyShareUrl(sharedPlan.share_token);
      toast.success('Share URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying URL:', error);
      toast.error('Failed to copy URL');
    }
  };

  const handleOpenInNewTab = () => {
    if (!sharedPlan) return;
    
    const url = SharingService.generateShareUrl(sharedPlan.share_token);
    window.open(url, '_blank');
  };

  if (!semester) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Semester Plan
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for &quot;{semester.name}&quot; that others can view
          </DialogDescription>
        </DialogHeader>

        {!sharedPlan ? (
          // Create share form
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Share Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={semester.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a description for your shared plan..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Privacy Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Make Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to discover this plan publicly
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hasExpiration">Set Expiration</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically disable sharing after a period
                  </p>
                </div>
                <Switch
                  id="hasExpiration"
                  checked={formData.hasExpiration}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasExpiration: checked }))}
                />
              </div>

              {formData.hasExpiration && (
                <div className="space-y-2">
                  <Label htmlFor="expirationDays">Expires in (days)</Label>
                  <Input
                    id="expirationDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.expirationDays}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      expirationDays: parseInt(e.target.value) || 30 
                    }))}
                  />
                </div>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">What will be shared:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Semester name and details ({semester.season} {semester.year})</li>
                <li>• All courses with names, credits, and schedules</li>
                <li>• Course colors and basic information</li>
                <li>• Semester notes (if any)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Personal information like grades and private notes are never shared.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateShare} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Share Link
              </Button>
            </div>
          </div>
        ) : (
          // Share created - show URL and options
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-green-600" />
                  Share Link Created!
                </CardTitle>
                <CardDescription>
                  Your semester plan is now shareable. Anyone with this link can view it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {sharedPlan.is_public ? (
                    <Badge variant="default" className="bg-green-600">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      Link Only
                    </Badge>
                  )}
                  
                  {sharedPlan.expires_at && (
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      Expires {new Date(sharedPlan.expires_at).toLocaleDateString()}
                    </Badge>
                  )}
                  
                  <Badge variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    {sharedPlan.view_count} views
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Share URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={SharingService.generateShareUrl(sharedPlan.share_token)}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Share Options
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>• Copy the URL and share it directly</p>
                <p>• Open in a new tab to preview how others will see it</p>
                <p>• You can manage or delete this share from your profile</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}