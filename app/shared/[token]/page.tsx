'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  Eye,
  Share2,
  ExternalLink,
  AlertTriangle,
  Home
} from 'lucide-react';
import { SharingService, SharedPlanWithDetails } from '@/lib/sharingService';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SharedPlanPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [sharedPlan, setSharedPlan] = useState<SharedPlanWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadSharedPlan();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadSharedPlan = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const plan = await SharingService.getSharedPlan(token);
      
      if (!plan) {
        setError('This shared plan was not found or has expired.');
        return;
      }
      
      setSharedPlan(plan);
    } catch (error) {
      console.error('Error loading shared plan:', error);
      setError('Failed to load shared plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const calculateTotalCredits = (courses: any[]) => {
    return courses.reduce((sum, course) => sum + course.credits, 0);
  };

  const formatSchedule = (schedule: any) => {
    if (!schedule || !schedule.days || !schedule.startTime || !schedule.endTime) {
      return null;
    }
    
    const days = Array.isArray(schedule.days) ? schedule.days.join(', ') : schedule.days;
    return `${days} ${schedule.startTime} - ${schedule.endTime}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sharedPlan) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || 'This shared plan could not be found.'}
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 text-center">
              <Link href="/">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go to UniPlan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const semester = sharedPlan.semesters[0]; // Shared plans contain one semester
  const totalCredits = calculateTotalCredits(semester.courses);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Share2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Shared Plan</h1>
                <p className="text-sm text-muted-foreground">
                  Powered by UniPlan
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Link href="/">
                <Button size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Create Your Own
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Plan Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{sharedPlan.title}</CardTitle>
                  {sharedPlan.description && (
                    <p className="text-muted-foreground mt-2">{sharedPlan.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sharedPlan.is_public && (
                    <Badge variant="default">Public</Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {sharedPlan.view_count} views
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Shared {new Date(sharedPlan.created_at).toLocaleDateString()}
                </span>
                {sharedPlan.expires_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Expires {new Date(sharedPlan.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Semester Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{semester.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{semester.season} {semester.year}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{totalCredits}</div>
                  <div className="text-sm text-muted-foreground">Total Credits</div>
                </div>
              </div>
            </CardHeader>
            
            {semester.notes && (
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Semester Notes</h4>
                  <p className="text-sm text-muted-foreground">{semester.notes}</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Courses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Courses ({semester.courses.length})
            </h3>
            
            {semester.courses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No courses added to this semester yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {semester.courses.map((course, index) => {
                  const scheduleText = formatSchedule({
                    days: course.days_of_week,
                    startTime: course.start_time,
                    endTime: course.end_time
                  });
                  
                  return (
                    <Card key={course.id} className="h-fit">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base leading-tight">
                              {course.name}
                            </CardTitle>
                          </div>
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0 ml-2"
                            style={{ backgroundColor: course.color || '#6b7280' }}
                          />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Credits</span>
                          <span className="font-medium">{course.credits}</span>
                        </div>
                        

                        
                        {scheduleText && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{scheduleText}</span>
                          </div>
                        )}
                        
                        {course.notes && (
                          <>
                            <Separator />
                            <div className="text-sm text-muted-foreground">
                              {course.notes}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <Card className="bg-muted/50">
            <CardContent className="py-6">
              <div className="text-center space-y-3">
                <h4 className="font-medium">Create Your Own Academic Plan</h4>
                <p className="text-sm text-muted-foreground">
                  UniPlan helps you organize your university journey with beautiful, 
                  interactive semester planning and course management.
                </p>
                <Link href="/">
                  <Button>
                    Get Started with UniPlan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}