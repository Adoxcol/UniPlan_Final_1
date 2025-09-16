'use client';

import { GripVertical, MoreHorizontal, Edit3, Trash2, Calendar, CalendarCheck, Share2 } from 'lucide-react';
import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Semester } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface SemesterHeaderProps {
  semester: Semester;
  semesterGPA: number;
  completedCredits: number;
  totalCredits: number;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export function SemesterHeader({
  semester,
  semesterGPA,
  completedCredits,
  totalCredits,
  onEdit,
  onDelete,
  onShare,
}: SemesterHeaderProps) {
  const { setActiveSemester } = useAppStore();

  const handleSetActive = () => {
    setActiveSemester(semester.id);
  };

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <GripVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        <div>
          <CardTitle className="text-lg">
            {semester.name}
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{semester.season} {semester.year}</Badge>
            {semester.isActive && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <CalendarCheck className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            {completedCredits > 0 && (
              <Badge variant="secondary">
                GPA: {semesterGPA.toFixed(2)}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Semester actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!semester.isActive && (
            <DropdownMenuItem onClick={handleSetActive} aria-label="Mark semester as active">
              <Calendar className="h-4 w-4 mr-2" />
              Mark as Active
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onEdit}>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Semester
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Semester
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Semester
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}