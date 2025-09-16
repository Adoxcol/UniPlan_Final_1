'use client';

import { memo, useMemo } from 'react';
import { BookOpen, TrendingUp, Award, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';

function ProgressSectionComponent() {
  const { semesters, calculateCumulativeGPA, degree } = useAppStore();
  
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {degree ? 'Degree Credits' : 'Total Credits'}
                </p>
                <p className="text-2xl font-bold">
                  {degree ? degree.totalCreditsRequired : progressStats.totalCredits}
                </p>
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