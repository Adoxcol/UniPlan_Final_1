/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, GraduationCap, Shield, Save, Upload } from 'lucide-react';

interface UserProfileProps {
  onClose?: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { userId } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    if (!userId || !supabase) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData(data);
      } else {
        // Create default profile if none exists
        const defaultProfile: Partial<Profile> = {
          user_id: userId,
          notes: '',
          profile_public: false,
          allow_plan_sharing: true,
        };
        setFormData(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Profile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? null : value
    }));
  };

  const handleSave = async () => {
    if (!userId || !supabase) return;

    try {
      setIsSaving(true);
      
      const profileData = {
        ...formData,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;

      setProfile(profileData as Profile);
      toast.success('Profile updated successfully');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayName = () => {
    if (formData.display_name) return formData.display_name;
    if (formData.first_name || formData.last_name) {
      return `${formData.first_name || ''} ${formData.last_name || ''}`.trim();
    }
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar_url || ''} alt={getDisplayName()} />
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{getDisplayName()}</CardTitle>
              <CardDescription className="text-base">
                {formData.university && formData.major ? (
                  <span>{formData.major} at {formData.university}</span>
                ) : (
                  <span>Complete your profile to get started</span>
                )}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                {formData.profile_public && (
                  <Badge variant="secondary">Public Profile</Badge>
                )}
                {formData.allow_plan_sharing && (
                  <Badge variant="outline">Sharing Enabled</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Form */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Personal</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4" />
            <span>Academic</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                This information is optional and helps others connect with you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name || ''}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="How you'd like to be displayed (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell others about yourself (optional)"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-sm text-muted-foreground">
                  {(formData.bio || '').length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Information Tab */}
        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>
                Share your academic background and goals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={formData.university || ''}
                  onChange={(e) => handleInputChange('university', e.target.value)}
                  placeholder="Your university or college"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    value={formData.major || ''}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    placeholder="Your major field of study"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minor">Minor</Label>
                  <Input
                    id="minor"
                    value={formData.minor || ''}
                    onChange={(e) => handleInputChange('minor', e.target.value)}
                    placeholder="Your minor (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graduation_year">Expected Graduation Year</Label>
                  <Input
                    id="graduation_year"
                    type="number"
                    min="2020"
                    max="2035"
                    value={formData.graduation_year || ''}
                    onChange={(e) => handleInputChange('graduation_year', parseInt(e.target.value) || null)}
                    placeholder="2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpa">Current GPA</Label>
                  <Input
                    id="gpa"
                    type="number"
                    min="0"
                    max="4"
                    step="0.01"
                    value={formData.gpa || ''}
                    onChange={(e) => handleInputChange('gpa', parseFloat(e.target.value) || null)}
                    placeholder="3.75"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Degree Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree_name">Degree Name</Label>
                    <Input
                      id="degree_name"
                      value={formData.degree_name || ''}
                      onChange={(e) => handleInputChange('degree_name', e.target.value)}
                      placeholder="Bachelor of Science in Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="degree_total_credits">Total Credits Required</Label>
                    <Input
                      id="degree_total_credits"
                      type="number"
                      min="60"
                      max="200"
                      value={formData.degree_total_credits || ''}
                      onChange={(e) => handleInputChange('degree_total_credits', parseInt(e.target.value) || null)}
                      placeholder="120"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings Tab */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your profile and plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile_public">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to view your profile information
                  </p>
                </div>
                <Switch
                  id="profile_public"
                  checked={formData.profile_public || false}
                  onCheckedChange={(checked) => handleInputChange('profile_public', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_plan_sharing">Allow Plan Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable sharing your semester plans with others
                  </p>
                </div>
                <Switch
                  id="allow_plan_sharing"
                  checked={formData.allow_plan_sharing || false}
                  onCheckedChange={(checked) => handleInputChange('allow_plan_sharing', checked)}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Privacy Information</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your email address is never shared publicly</li>
                  <li>• You control what information is visible to others</li>
                  <li>• Shared plans can be made private at any time</li>
                  <li>• You can delete your profile and data at any time</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}