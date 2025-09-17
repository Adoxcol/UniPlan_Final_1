'use client';

import { memo, useMemo } from 'react';
import { BookOpen, TrendingUp, Award, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import type { Semester, Course } from '@/lib/types';

interface PDFExportViewProps {
  className?: string;
}

function PDFExportViewComponent({ className = '' }: PDFExportViewProps) {
  const { semesters, calculateCumulativeGPA, calculateSemesterGPA, degree } = useAppStore();
  
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

  const renderCourse = (course: Course) => (
    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
      <div className="flex-1">
        <div className="font-medium text-sm">{course.name}</div>
        {course.notes && (
          <div className="text-xs text-gray-600 mt-1">{course.notes}</div>
        )}
      </div>
      <div className="flex items-center gap-3 ml-4">
        <div className="text-sm font-medium">{course.credits} cr</div>
        {course.grade !== undefined && (
          <div className="text-sm font-medium text-green-600">
            {course.grade === 4 ? 'A' : 
             course.grade === 3.7 ? 'A-' :
             course.grade === 3.3 ? 'B+' :
             course.grade === 3 ? 'B' :
             course.grade === 2.7 ? 'B-' :
             course.grade === 2.3 ? 'C+' :
             course.grade === 2 ? 'C' :
             course.grade === 1.7 ? 'C-' :
             course.grade === 1.3 ? 'D+' :
             course.grade === 1 ? 'D' : 'F'}
          </div>
        )}
      </div>
    </div>
  );

  const renderSemester = (semester: Semester) => {
    const semesterGPA = calculateSemesterGPA(semester.id);
    const completedCredits = semester.courses
      .filter(course => course.grade !== undefined)
      .reduce((sum, course) => sum + course.credits, 0);
    const totalCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0);

    return (
      <Card key={semester.id} className="mb-6 break-inside-avoid">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{semester.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {semester.season} {semester.year}
                </Badge>
                {semester.isActive && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    Active
                  </Badge>
                )}
                {completedCredits > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    GPA: {semesterGPA.toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {completedCredits}/{totalCredits} credits
              </div>
              <div className="text-xs text-gray-600">
                {Math.round((completedCredits / totalCredits) * 100) || 0}% complete
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {semester.notes && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">{semester.notes}</div>
            </div>
          )}
          <div className="space-y-2">
            {semester.courses.map(renderCourse)}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (progressStats.totalCredits === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-gray-500">No semester data available for export</div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 bg-white ${className}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Plan</h1>
        {degree && (
          <div className="text-lg text-gray-700 mb-2">{degree.name}</div>
        )}
        <div className="text-sm text-gray-600">
          Generated on {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progress Overview
        </h2>
        
        {degree && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Degree Progress</span>
              <span className="font-medium">{Math.round(progressStats.degreeProgressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressStats.degreeProgressPercentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {progressStats.completedCredits} of {degree.totalCreditsRequired} credits completed
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600">
              {degree ? 'Degree Credits' : 'Total Credits'}
            </div>
            <div className="text-xl font-bold">
              {degree ? degree.totalCreditsRequired : progressStats.totalCredits}
            </div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-xl font-bold">{progressStats.completedCredits}</div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-600">Cumulative GPA</div>
            <div className="text-xl font-bold">
              {progressStats.cumulativeGPA > 0 ? progressStats.cumulativeGPA.toFixed(2) : '--'}
            </div>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-sm text-gray-600">Semesters</div>
            <div className="text-xl font-bold">{semesters.length}</div>
          </div>
        </div>
      </div>

      {/* Semester Plan */}
      <div>
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Semester Plan
        </h2>
        
        <div className="space-y-6">
          {semesters.map(renderSemester)}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t text-center text-xs text-gray-500">
        <div>Generated by UniPlan - Academic Planning Platform</div>
        <div className="mt-1">Visit uniplan.app for more features</div>
      </div>
    </div>
  );
}

export const PDFExportView = memo(PDFExportViewComponent);