export interface Course {
  id: string;
  name: string;
  credits: number;
  daysOfWeek?: string[];
  startTime?: string;
  endTime?: string;
  grade?: number | null; // 0-4 GPA scale
  color?: string;
  notes?: string;
}

export interface Semester {
  id: string;
  name: string;
  year: number;
  season: 'Autumn' | 'Spring' | 'Summer';
  courses: Course[];
  notes?: string;
  isActive?: boolean;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  course: Course;
}

export interface ScheduleConflict {
  courses: Course[];
  day: string;
  timeOverlap: {
    start: string;
    end: string;
  };
}

export interface Schedule {
  [day: string]: {
    [time: string]: Course;
  };
}

export interface ActionHistoryItem {
  type: string;
  data: Record<string, any>;
  timestamp: number;
}

export interface AppState {
  semesters: Semester[];
  currentSemester: string | null;
  notes: string;
  showScheduleView: boolean;
  selectedNoteScope: 'global' | 'semester' | 'course';
  selectedSemesterForNotes: string | null;
  selectedCourseForNotes: string | null;
  degree: {
    name: string;
    totalCreditsRequired: number;
  } | null;
  isLoading: boolean;
  isSyncing: boolean;
  actionHistory: ActionHistoryItem[];
  historyIndex: number;
  
  // Actions
  addSemester: (semester: Omit<Semester, 'id' | 'courses'>) => void;
  removeSemester: (id: string) => void;
  updateSemester: (id: string, updates: Partial<Semester>) => void;
  reorderSemesters: (startIndex: number, endIndex: number) => void;
  
  addCourse: (semesterId: string, course: Omit<Course, 'id'>) => void;
  removeCourse: (semesterId: string, courseId: string) => void;
  updateCourse: (semesterId: string, courseId: string, updates: Partial<Course>) => void;
  reorderCourses: (semesterId: string, startIndex: number, endIndex: number) => void;
  
  setNotes: (notes: string) => void;
  setCurrentSemester: (id: string | null) => void;
  toggleScheduleView: () => void;
  setNoteScope: (scope: 'global' | 'semester' | 'course', semesterId?: string, courseId?: string) => void;
  setDegree: (degree: { name: string; totalCreditsRequired: number }) => void;
  setActiveSemester: (semesterId: string) => void;
  
  calculateSemesterGPA: (semesterId: string) => number;
  calculateCumulativeGPA: () => number;
  getScheduleConflicts: (semesterId?: string) => ScheduleConflict[];
  getCurrentSchedule: (semesterId?: string) => TimeSlot[];
  getActiveSemester: () => Semester | undefined;
  
  loadData: () => void;
  saveData: () => void;
  exportToPDF: () => Promise<void>;
  reset: () => void;
  syncFromSupabase: () => Promise<void>;
  saveAllToSupabase: () => Promise<void>;
  exportData: () => string;
  importData: (jsonData: string) => { success: boolean; message: string };
  saveToHistory: (action: string, data: Record<string, any>) => void;
  undo: () => void;
  redo: () => void;
}