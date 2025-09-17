'use client';

import { memo, useMemo, useState } from 'react';
import { BookOpen, TrendingUp, Award, Target, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';

function ProgressSectionComponent() {
  const { semesters, calculateCumulativeGPA, degree, setDegree } = useAppStore();
  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [editCreditsValue, setEditCreditsValue] = useState('');
  
  // Memoize expensive calculations
  const progressStats = useMemo(() => {
    const allCourses = semesters.flatMap(s => s.courses);
    const totalCredits = allCourses.reduce((sum, course) => sum + course.credits, 0);
    const completedCredits = allCourses
      .filter(course => course.grade !== undefined)
      .reduce((sum, course) => sum + course.credits, 0);
    const cumulativeGPA = calculateCumulativeGPA();
    
    const degreeProgressPercentage = degree ? (completedCredits / degree.totalCreditsRequired) * 100 : 0;
    const semesterProgressPercentage = totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0;
    
    return {
      totalCredits,
      completedCredits,
      cumulativeGPA,
      degreeProgressPercentage,
      semesterProgressPercentage
    };
  }, [semesters, calculateCumulativeGPA, degree]);

  // Handle editing degree credits
  const handleStartEditCredits = () => {
    if (degree) {
      setEditCreditsValue(degree.totalCreditsRequired.toString());
      setIsEditingCredits(true);
    }
  };

  const handleSaveCredits = () => {
    const newCredits = parseInt(editCreditsValue);
    
    if (!degree) {
      toast.error('No degree information found');
      return;
    }
    
    if (isNaN(newCredits)) {
      toast.error('Please enter a valid number');
      return;
    }
    
    if (newCredits < 30) {
      toast.error('Total credits must be at least 30');
      return;
    }
    
    if (newCredits > 300) {
      toast.error('Total credits cannot exceed 300');
      return;
    }
    
    setDegree({
      ...degree,
      totalCreditsRequired: newCredits
    });
    setIsEditingCredits(false);
    toast.success(`Degree credits updated to ${newCredits}`);
  };

  const handleCancelEditCredits = () => {
    setIsEditingCredits(false);
    setEditCreditsValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveCredits();
    } else if (e.key === 'Escape') {
      handleCancelEditCredits();
    }
  };
  
  if (progressStats.totalCredits === 0) return null;

  return (
    <div className="mb-8">
      {degree && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{degree.name}</h3>
          <p className="text-sm text-muted-foreground">
            {progressStats.completedCredits} of {degree.totalCreditsRequired} credits completed
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {degree ? 'Degree Credits' : 'Total Credits'}
                </p>
                {degree && isEditingCredits ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={editCreditsValue}
                      onChange={(e) => setEditCreditsValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="h-8 w-20 text-lg font-bold"
                      min="30"
                      max="300"
                      step="1"
                      autoFocus
                      placeholder="120"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveCredits}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEditCredits}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {degree ? degree.totalCreditsRequired : progressStats.totalCredits}
                    </p>
                    {degree && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleStartEditCredits}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{progressStats.completedCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cumulative GPA</p>
                <p className="text-2xl font-bold">
                  {progressStats.cumulativeGPA > 0 ? progressStats.cumulativeGPA.toFixed(2) : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">
                  {degree 
                    ? `${Math.round(progressStats.degreeProgressPercentage)}%`
                    : `${Math.round(progressStats.semesterProgressPercentage)}%`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {degree && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Degree Progress</span>
            <span>{Math.round(progressStats.degreeProgressPercentage)}%</span>
          </div>
          <Progress value={progressStats.degreeProgressPercentage} className="h-2" />
        </div>
      )}
    </div>
  );
}

export const ProgressSection = memo(ProgressSectionComponent);