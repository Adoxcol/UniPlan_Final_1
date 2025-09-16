'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export function ScheduleView() {
  const { getCurrentSchedule, getScheduleConflicts, currentSemester, semesters } = useAppStore();
  const activeSemester = semesters.find(s => s.id === currentSemester) ?? semesters.find(s => s.isActive);
  
  const schedule = getCurrentSchedule(activeSemester?.id);
  const conflicts = getScheduleConflicts(activeSemester?.id);

  const getCoursesForTimeSlot = (day: string, time: string) => {
    return schedule.filter(slot => {
      if (slot.day !== day) return false;
      
      const slotStart = new Date(`2000-01-01 ${slot.startTime}`);
      const slotEnd = new Date(`2000-01-01 ${slot.endTime}`);
      const checkTime = new Date(`2000-01-01 ${time}:00`);
      
      return checkTime >= slotStart && checkTime < slotEnd;
    });
  };

  const isConflictTime = (day: string, time: string) => {
    return conflicts.some(conflict => {
      if (conflict.day !== day) return false;
      
      const conflictStart = new Date(`2000-01-01 ${conflict.timeOverlap.start}`);
      const conflictEnd = new Date(`2000-01-01 ${conflict.timeOverlap.end}`);
      const checkTime = new Date(`2000-01-01 ${time}:00`);
      
      return checkTime >= conflictStart && checkTime < conflictEnd;
    });
  };

  return (
    <div className="space-y-6">
      {!activeSemester && (
        <Alert>
          <AlertDescription>
            No active semester selected. Mark a semester as active to view its schedule.
          </AlertDescription>
        </Alert>
      )}
      
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {conflicts.length} schedule conflict{conflicts.length > 1 ? 's' : ''} detected. 
            Check the highlighted time slots below.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Weekly Schedule
            {activeSemester && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - {activeSemester.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="min-w-[720px] sm:min-w-0 grid grid-cols-8 gap-2 px-2 sm:px-0">
            {/* Header row */}
            <div className="font-semibold text-sm p-2">Time</div>
            {DAYS.map(day => (
              <div key={day} className="font-semibold text-sm p-2 text-center">
                {day.slice(0, 3)}
              </div>
            ))}

            {/* Time slots */}
            {TIME_SLOTS.map(time => (
              <div key={time} className="contents">
                <div className="text-sm p-2 text-muted-foreground font-mono">
                  {time}
                </div>
                {DAYS.map(day => {
                  const courses = getCoursesForTimeSlot(day, time);
                  const hasConflict = isConflictTime(day, time);
                  
                  return (
                    <div 
                      key={`${day}-${time}`} 
                      className={`min-h-12 p-1 border rounded-sm transition-colors ${
                        hasConflict 
                          ? 'bg-destructive/20 border-destructive/50' 
                          : courses.length > 0 
                            ? 'bg-accent/50 border-accent' 
                            : 'bg-background border-border hover:bg-accent/20'
                      }`}
                    >
                      {courses.map(slot => (
                        <div
                          key={slot.course.id}
                          className="text-xs p-1 rounded mb-1 text-white font-medium"
                          style={{ backgroundColor: slot.course.color }}
                        >
                          <div className="truncate">{slot.course.name}</div>
                          <div className="text-xs opacity-90">
                            {slot.startTime}-{slot.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Schedule Conflicts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflicts.map((conflict, index) => (
                <div key={index} className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="font-semibold text-sm mb-2">
                    {conflict.day} - {conflict.timeOverlap.start} to {conflict.timeOverlap.end}
                  </div>
                  <div className="flex gap-2">
                    {conflict.courses.map(course => (
                      <Badge key={course.id} variant="destructive">
                        {course.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}