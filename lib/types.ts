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

// Action history data types for undo/redo functionality
export interface ActionHistoryData {
  semesters?: Semester[];
  newSemesters?: Semester[];
  [key: string]: unknown;
}

export interface ActionHistoryItem {
  type: string;
  data: ActionHistoryData;
  timestamp: number;
}

// Database record types for Supabase
export interface DatabaseSemester {
  id: string;
  name: string;
  year: number;
  season: 'Autumn' | 'Spring' | 'Summer';
  is_active: boolean;
  notes?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCourse {
  id: string;
  name: string;
  credits: number;
  days_of_week?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
  grade?: number | null;
  color?: string | null;
  notes?: string | null;
  semester_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Legacy degree type for backward compatibility
export interface LegacyDegree {
  name: string;
  totalCredits?: number;
  totalCreditsRequired?: number;
}

export interface Profile {
  user_id: string;
  notes: string;
  degree_name?: string | null;
  degree_total_credits?: number | null;
  
  // Optional Personal Information
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  
  // Optional Academic Information
  university?: string | null;
  major?: string | null;
  minor?: string | null;
  graduation_year?: number | null;
  gpa?: number | null;
  
  // Privacy Settings
  profile_public: boolean;
  allow_plan_sharing: boolean;
  
  // Admin Role
  is_admin: boolean;
  admin_level: 'user' | 'moderator' | 'admin' | 'super_admin';
  
  created_at: string;
  updated_at: string;
}

export interface SharedPlan {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  share_token: string;
  is_public: boolean;
  view_count: number;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  semesters?: SharedPlanSemester[];
}

export interface SharedPlanSemester {
  id: string;
  shared_plan_id: string;
  name: string;
  year: number;
  season: 'Autumn' | 'Spring' | 'Summer';
  notes?: string | null;
  courses?: SharedPlanCourse[];
}

export interface SharedPlanCourse {
  id: string;
  shared_plan_semester_id: string;
  name: string;
  credits: number;
  days_of_week?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
  grade?: number | null;
  color?: string | null;
  notes?: string | null;
}

export interface DegreeTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  university?: string | null;
  major?: string | null;
  minor?: string | null;
  total_credits?: number | null;
  duration_years?: number | null;
  tags?: string[] | null;
  is_public: boolean;
  is_official?: boolean;
  share_token: string;
  view_count: number;
  like_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  semesters?: DegreeTemplateSemester[];
}

export interface DegreeTemplateSemester {
  id: string;
  degree_template_id: string;
  name: string;
  year: number;
  season: 'Autumn' | 'Spring' | 'Summer';
  notes?: string | null;
  courses?: DegreeTemplateCourse[];
}

export interface DegreeTemplateCourse {
  id: string;
  degree_template_semester_id: string;
  name: string;
  credits: number;
  course_code?: string | null;
  prerequisites?: string | null;
  description?: string | null;
  is_required: boolean;
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
  isInitialLoading: boolean;
  actionHistory: ActionHistoryItem[];
  historyIndex: number;
  
  // Actions
  addSemester: (semester: Omit<Semester, 'id' | 'courses'>) => void;
  removeSemester: (id: string) => void;
  updateSemester: (id: string, updates: Partial<Semester>) => void;
  reorderSemesters: (startIndex: number, endIndex: number) => void;
  autoLayoutSemesters: () => void;
  
  addCourse: (semesterId: string, course: Omit<Course, 'id'>) => string;
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
  saveToHistory: (action: string, data: ActionHistoryData) => void;
  undo: () => void;
  redo: () => void;
}