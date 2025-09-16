'use client';

import { BookOpen, TrendingUp, Award, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';

export function ProgressSection() {
  const { semesters, calculateCumulativeGPA, degree } = useAppStore();
  
  const allCourses = semesters.flatMap(s => s.courses);
  const totalCredits = allCourses.reduce((sum, course) => sum + course.credits, 0);
  const completedCredits = allCourses
    .filter(course => course.grade !== undefined)
    .reduce((sum, course) => sum + course.credits, 0);
  const cumulativeGPA = calculateCumulativeGPA();
  
  const degreeProgressPercentage = degree ? (completedCredits / degree.totalCreditsRequired) * 100 : 0;
  const semesterProgressPercentage = totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0;
  
  if (totalCredits === 0) return null;

  return (
    <div className="mb-8">
      {degree && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{degree.name}</h3>
          <p className="text-sm text-muted-foreground">
            {completedCredits} of {degree.totalCreditsRequired} credits completed
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
                  {degree ? degree.totalCreditsRequired : totalCredits}
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
                <p className="text-2xl font-bold">{completedCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round(degree ? degreeProgressPercentage : semesterProgressPercentage)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CGPA</p>
                <p className="text-2xl font-bold">{cumulativeGPA.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {degree ? 'Degree Progress' : 'Academic Progress'}
            </span>
            <span className="text-sm text-muted-foreground">
              {completedCredits} of {degree ? degree.totalCreditsRequired : totalCredits} credits
            </span>
          </div>
          <Progress 
            value={degree ? degreeProgressPercentage : semesterProgressPercentage} 
            className="h-2" 
          />
        </CardContent>
      </Card>
    </div>
  );
}