export interface Course {
  id: string;
  name: string;
  credits: number;
  daysOfWeek?: string[];
  startTime?: string;
  endTime?: string;
  grade?: number; // 0-4 GPA scale
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

export interface AppState {
  semesters: Semester[];
  currentSemester: string | null;
  notes: string;
  theme: 'light' | 'dark';
  showScheduleView: boolean;
  selectedNoteScope: 'global' | 'semester' | 'course';
  selectedSemesterForNotes: string | null;
  selectedCourseForNotes: string | null;
  degree: {
    name: string;
    totalCreditsRequired: number;
  } | null;
  
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
  toggleTheme: () => void;
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
}