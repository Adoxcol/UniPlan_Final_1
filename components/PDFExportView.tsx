'use client';

import { memo, useMemo } from 'react';
import { BookOpen, TrendingUp, Award, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import type { Semester, Course } from '@/lib/types';

interface PDFExportViewProps {
  className?: string;
  forceTheme?: 'light' | 'dark';
}

function PDFExportViewComponent({ className = '', forceTheme }: PDFExportViewProps) {
  const { semesters, calculateCumulativeGPA, calculateSemesterGPA, degree, notes } = useAppStore();
  const { theme: currentTheme } = useTheme();
  const theme = forceTheme || currentTheme || 'light';
  
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {semester.courses.map((course) => (
              <div key={course.id} className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} p-4 rounded-lg border`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{course.name}</h4>
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{course.credits} cr</span>
                </div>
                {course.notes && (
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>{course.notes}</div>
                )}
                <div className="flex flex-wrap gap-2">
                  {course.grade !== undefined && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-100 text-green-800'}`}>
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
                    </span>
                  )}
                </div>
              </div>
            ))}
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
    <div className={`max-w-4xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} ${className}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className={`text-center mb-8 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pb-6`}>
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Academic Plan</h1>
        {degree && (
          <div className={`text-lg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>{degree.name}</div>
        )}
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
          <div className={`text-center p-4 border rounded-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-center mb-2">
              <BookOpen className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {degree ? 'Degree Credits' : 'Total Credits'}
            </div>
            <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {degree ? degree.totalCreditsRequired : progressStats.totalCredits}
            </div>
          </div>

          <div className={`text-center p-4 border rounded-lg ${theme === 'dark' ? 'bg-green-900/30 border-green-700' : 'bg-green-50'}`}>
            <div className="flex items-center justify-center mb-2">
              <Target className={`h-5 w-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Completed</div>
            <div className={`text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{progressStats.completedCredits}</div>
          </div>

          <div className={`text-center p-4 border rounded-lg ${theme === 'dark' ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50'}`}>
            <div className="flex items-center justify-center mb-2">
              <Award className={`h-5 w-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cumulative GPA</div>
            <div className={`text-xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              {progressStats.cumulativeGPA > 0 ? progressStats.cumulativeGPA.toFixed(2) : '--'}
            </div>
          </div>

          <div className={`text-center p-4 border rounded-lg ${theme === 'dark' ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50'}`}>
            <div className="flex items-center justify-center mb-2">
              <Calendar className={`h-5 w-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Semesters</div>
            <div className={`text-xl font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{semesters.length}</div>
          </div>
        </div>
      </div>

      {/* Semester Plan */}
      <div>
        <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <Calendar className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          Semester Plan
        </h2>
        
        <div className="space-y-6">
          {semesters.map(renderSemester)}
        </div>
      </div>

      {/* Notes Section */}
      {notes && notes.trim() && (
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
            <BookOpen className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            Notes
          </h2>
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-6 rounded-lg border`}>
            <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>{notes}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-8 pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} text-center`}>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Generated by UniPlan Academic Planner on {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export const PDFExportView = memo(PDFExportViewComponent);