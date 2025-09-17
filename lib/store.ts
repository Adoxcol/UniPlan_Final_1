import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Semester, Course, ScheduleConflict, TimeSlot, ActionHistoryItem } from './types';
import { timeStringToMinutes } from './utils';
import { supabase } from './supabaseClient';
import { importDataSchema } from './validationSchemas';
import { z } from 'zod';

const generateId = () => Math.random().toString(36).substr(2, 9);

const courseColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      semesters: [],
      currentSemester: null,
      notes: '',
      showScheduleView: false,
      selectedNoteScope: 'global',
      selectedSemesterForNotes: null,
      selectedCourseForNotes: null,
      degree: null,
      isLoading: false,
      isSyncing: false,
      isInitialLoading: true,
      actionHistory: [],
      historyIndex: -1,

      addSemester: (semesterData) => {
        const state = get();
        const newSemester: Semester = {
          ...semesterData,
          id: generateId(),
          courses: [],
        };
        const newSemesters = [...state.semesters, newSemester];
        
        // Save to history
        get().saveToHistory('ADD_SEMESTER', {
          semesters: state.semesters,
          newSemesters
        });
        
        set({
          semesters: newSemesters,
          currentSemester: newSemester.id,
        });
      },

      removeSemester: (id) => {
        const state = get();
        const newSemesters = state.semesters.filter((s) => s.id !== id);
        
        // Save to history
        get().saveToHistory('DELETE_SEMESTER', {
          semesters: state.semesters,
          newSemesters
        });
        
        set({
          semesters: newSemesters,
          currentSemester: state.currentSemester === id ? null : state.currentSemester,
        });
      },

      updateSemester: (id, updates) => {
        const state = get();
        const newSemesters = state.semesters.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        );
        
        // Save to history
        get().saveToHistory('UPDATE_SEMESTER', {
          semesters: state.semesters,
          newSemesters
        });
        
        set({ semesters: newSemesters });
      },

      reorderSemesters: (startIndex, endIndex) => {
        const state = get();
        const result = Array.from(state.semesters);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        // Save to history
        get().saveToHistory('REORDER_SEMESTERS', {
          semesters: state.semesters,
          newSemesters: result
        });
        
        set({ semesters: result });
      },

      autoLayoutSemesters: () => {
        const state = get();
        const sortedSemesters = [...state.semesters].sort((a, b) => {
          // First sort by year (earliest first)
          if (a.year !== b.year) {
            return a.year - b.year;
          }
          
          // Then sort by season within the same year (Spring -> Summer -> Autumn)
          const seasonOrder = { 'Spring': 1, 'Summer': 2, 'Autumn': 3 };
          return seasonOrder[a.season] - seasonOrder[b.season];
        });
        
        set({ semesters: sortedSemesters });
        
        get().saveToHistory('auto_layout_semesters', {
          previousOrder: state.semesters.map(s => ({ id: s.id, name: s.name, year: s.year, season: s.season })),
          newOrder: sortedSemesters.map(s => ({ id: s.id, name: s.name, year: s.year, season: s.season }))
        });
      },

      addCourse: (semesterId, courseData) => {
        const state = get();
        const colorIndex = state.semesters
          .find(s => s.id === semesterId)?.courses.length || 0;
        
        const newCourse: Course = {
          ...courseData,
          id: generateId(),
          color: courseColors[colorIndex % courseColors.length],
        };

        const newSemesters = state.semesters.map((s) =>
          s.id === semesterId
            ? { ...s, courses: [...s.courses, newCourse] }
            : s
        );
        
        // Save to history
        get().saveToHistory('ADD_COURSE', {
          semesters: state.semesters,
          newSemesters
        });

        set({ semesters: newSemesters });
      },

      removeCourse: (semesterId, courseId) => {
        const state = get();
        const newSemesters = state.semesters.map((s) =>
          s.id === semesterId
            ? { ...s, courses: s.courses.filter((c) => c.id !== courseId) }
            : s
        );
        
        // Save to history
        get().saveToHistory('DELETE_COURSE', {
          semesters: state.semesters,
          newSemesters
        });
        
        set({ semesters: newSemesters });
      },

      updateCourse: (semesterId, courseId, updates) => {
        const state = get();
        const newSemesters = state.semesters.map((s) =>
          s.id === semesterId
            ? {
                ...s,
                courses: s.courses.map((c) =>
                  c.id === courseId ? { ...c, ...updates } : c
                ),
              }
            : s
        );
        
        // Save to history
        get().saveToHistory('UPDATE_COURSE', {
          semesters: state.semesters,
          newSemesters
        });
        
        set({ semesters: newSemesters });
      },

      reorderCourses: (semesterId, startIndex, endIndex) => {
        const state = get();
        const newSemesters = state.semesters.map((s) =>
          s.id === semesterId
            ? {
                ...s,
                courses: (() => {
                  const result = Array.from(s.courses);
                  const [removed] = result.splice(startIndex, 1);
                  result.splice(endIndex, 0, removed);
                  return result;
                })(),
              }
            : s
        );
        
        // Save to history
        get().saveToHistory('REORDER_COURSES', {
          semesters: state.semesters,
          newSemesters
        });
        
        set({ semesters: newSemesters });
      },

      setNotes: (notes) => set({ notes }),
      setCurrentSemester: (id) => set({ currentSemester: id }),
      toggleScheduleView: () => set((state) => ({ 
        showScheduleView: !state.showScheduleView 
      })),
      setNoteScope: (scope, semesterId, courseId) => set({
        selectedNoteScope: scope,
        selectedSemesterForNotes: semesterId || null,
        selectedCourseForNotes: courseId || null,
      }),
      
      setDegree: (degree) => set({ degree }),

      setActiveSemester: (semesterId) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.id === semesterId 
              ? { ...s, isActive: true }
              : { ...s, isActive: false }
          ),
          currentSemester: semesterId,
        }));
      },

      calculateSemesterGPA: (semesterId) => {
        const semester = get().semesters.find((s) => s.id === semesterId);
        if (!semester) return 0;

        // Filter out courses without grades - only completed courses count toward GPA
        // Courses in progress or planned don't affect the calculation
        const coursesWithGrades = semester.courses.filter((c) => c.grade !== undefined);
        if (coursesWithGrades.length === 0) return 0;

        // Calculate weighted GPA using credit hours as weights
        // Formula: GPA = Σ(grade × credits) / Σ(credits)
        // This ensures courses with more credits have proportionally more impact
        const totalPoints = coursesWithGrades.reduce(
          (sum, course) => sum + (course.grade! * course.credits),
          0
        );
        const totalCredits = coursesWithGrades.reduce(
          (sum, course) => sum + course.credits,
          0
        );

        // Prevent division by zero, though this should be caught by the earlier check
        return totalCredits > 0 ? totalPoints / totalCredits : 0;
      },

      calculateCumulativeGPA: () => {
        // Aggregate all courses from all semesters for overall GPA calculation
        const allCourses = get().semesters.flatMap((s) => s.courses);
        // Only include courses with assigned grades in the cumulative calculation
        const coursesWithGrades = allCourses.filter((c) => c.grade !== undefined);
        
        if (coursesWithGrades.length === 0) return 0;

        // Calculate cumulative GPA across all semesters using the same weighted formula
        // This treats all courses equally regardless of which semester they were taken
        // Formula: Cumulative GPA = Σ(all_grades × credits) / Σ(all_credits)
        const totalPoints = coursesWithGrades.reduce(
          (sum, course) => sum + (course.grade! * course.credits),
          0
        );
        const totalCredits = coursesWithGrades.reduce(
          (sum, course) => sum + course.credits,
          0
        );

        return totalCredits > 0 ? totalPoints / totalCredits : 0;
      },

      getScheduleConflicts: (semesterId) => {
        const state = get();
        // Filter to specific semester if provided, otherwise check all semesters
        const semesters = semesterId 
          ? state.semesters.filter(s => s.id === semesterId)
          : state.semesters;
        
        // Flatten all courses from selected semesters into a single array for comparison
        const allCourses = semesters.flatMap(s => s.courses);
        const conflicts: ScheduleConflict[] = [];
        
        // Use nested loops to compare every course with every other course (O(n²) complexity)
        // This ensures we catch all possible conflicts between any two courses
        for (let i = 0; i < allCourses.length; i++) {
          for (let j = i + 1; j < allCourses.length; j++) {
            const course1 = allCourses[i];
            const course2 = allCourses[j];
            
            // Skip courses that don't have complete schedule information
            // All fields must be present to perform meaningful conflict detection
            if (!course1.daysOfWeek || !course2.daysOfWeek || 
                !course1.startTime || !course2.startTime ||
                !course1.endTime || !course2.endTime) continue;
                
            // Check for overlaps between any days of the two courses
            // A course can meet on multiple days, so we need to check all combinations
            for (const day1 of course1.daysOfWeek) {
              for (const day2 of course2.daysOfWeek) {
                if (day1 === day2) {
                  // Convert time strings (HH:MM) to minutes for easier comparison
                  const start1 = timeStringToMinutes(course1.startTime);
                  const end1 = timeStringToMinutes(course1.endTime);
                  const start2 = timeStringToMinutes(course2.startTime);
                  const end2 = timeStringToMinutes(course2.endTime);
                  
                  // Check for time overlap using interval intersection logic
                  // Two intervals [start1, end1] and [start2, end2] overlap if:
                  // start1 < end2 AND end1 > start2
                  // This handles all cases: partial overlap, complete containment, etc.
                  if (start1 < end2 && end1 > start2) {
                    conflicts.push({
                      courses: [course1, course2],
                      day: day1,
                      timeOverlap: {
                        // Calculate the actual overlapping time period
                        start: start1 > start2 ? course1.startTime : course2.startTime,
                        end: end1 < end2 ? course1.endTime : course2.endTime,
                      },
                    });
                  }
                }
              }
            }
          }
        }
        
        return conflicts;
      },

      getCurrentSchedule: (semesterId) => {
        const state = get();
        const semesters = semesterId 
          ? state.semesters.filter(s => s.id === semesterId)
          : state.semesters;
        
        const timeSlots: TimeSlot[] = [];
        
        semesters.forEach(semester => {
          semester.courses.forEach(course => {
            if (course.daysOfWeek && course.startTime && course.endTime) {
              course.daysOfWeek.forEach(day => {
                timeSlots.push({
                  day,
                  startTime: course.startTime!,
                  endTime: course.endTime!,
                  course,
                });
              });
            }
          });
        });
        
        // Sort by day then start time (minutes)
        return timeSlots.sort((a, b) => {
          if (a.day === b.day) {
            return timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime);
          }
          return a.day.localeCompare(b.day);
        });
      },

      getActiveSemester: () => {
        const state = get();
        return state.semesters.find(s => s.id === state.currentSemester) 
          || state.semesters.find(s => s.isActive);
      },

      loadData: () => {
        // Data is automatically loaded by persist middleware
      },

      saveData: () => {
        // Data is automatically saved by persist middleware
      },

      exportToPDF: async () => {
        // Will implement PDF export functionality
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        
        const element = document.getElementById('uniplan-content');
        if (!element) return;
        
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF();
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save('uniplan-roadmap.pdf');
      },

      // Sync functions
      syncFromSupabase: async () => {
          if (!supabase) return;
          const currentState = get();
          const isFirstLoad = currentState.semesters.length === 0;
          set({ 
            isSyncing: true, 
            isLoading: isFirstLoad,
            isInitialLoading: isFirstLoad && currentState.isInitialLoading
          });
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user.id;
        if (!userId) return;
        const [profiles, semestersRes, coursesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('semesters').select('*').eq('user_id', userId),
          supabase.from('courses').select('*').eq('user_id', userId),
        ]);
        const profile = profiles.data || null;
        const semesters = semestersRes.data || [];
        const courses = coursesRes.data || [];
        const semestersWithCourses: Semester[] = semesters.map((s: any) => ({
          id: s.id,
          name: s.name,
          year: s.year,
          season: s.season,
          isActive: s.is_active,
          notes: s.notes ?? undefined,
          courses: courses.filter((c: any) => c.semester_id === s.id).map((c: any) => ({
            id: c.id,
            name: c.name,
            credits: c.credits,
            daysOfWeek: c.days_of_week ?? undefined,
            startTime: c.start_time ?? undefined,
            endTime: c.end_time ?? undefined,
            grade: c.grade ?? undefined,
            color: c.color ?? undefined,
            notes: c.notes ?? undefined,
          })),
        }));
        set({
          semesters: semestersWithCourses,
          notes: profile?.notes ?? '',
            degree: profile?.degree_name ? { name: profile.degree_name, totalCreditsRequired: profile.degree_total_credits ?? 0 } : null,
            isSyncing: false,
            isLoading: false,
            isInitialLoading: false,
          });
      },

      saveAllToSupabase: async () => {
        if (!supabase) return;
        set({ isSyncing: true });
        const state = get();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user.id;
        if (!userId) return;
        
        // Complex synchronization logic: handle both updates and deletions
        // We need to identify items that exist in the database but not in local state
        // and delete them to maintain consistency
        const [existingSemestersRes, existingCoursesRes] = await Promise.all([
          supabase.from('semesters').select('id').eq('user_id', userId),
          supabase.from('courses').select('id').eq('user_id', userId),
        ]);
        
        const existingSemesters = existingSemestersRes.data || [];
        const existingCourses = existingCoursesRes.data || [];
        
        // Extract all current IDs from local state for comparison
        const currentSemesterIds = state.semesters.map(s => s.id);
        const currentCourseIds = state.semesters.flatMap(s => s.courses.map(c => c.id));
        
        // Identify orphaned records: items that exist in database but not in local state
        // These need to be deleted to reflect user's local changes (deletions)
        const semesterIdsToDelete = existingSemesters
          .filter((s: any) => !currentSemesterIds.includes(s.id))
        .map((s: any) => s.id);
          
        const courseIdsToDelete = existingCourses
          .filter((c: any) => !currentCourseIds.includes(c.id))
        .map((c: any) => c.id);
        
        // Perform deletions first to maintain referential integrity
        // Delete courses before semesters due to foreign key constraints
        if (courseIdsToDelete.length > 0) {
          await supabase.from('courses')
            .delete()
            .in('id', courseIdsToDelete);
        }
        
        if (semesterIdsToDelete.length > 0) {
          await supabase.from('semesters')
            .delete()
            .in('id', semesterIdsToDelete);
        }
        
        // Upsert profile data (insert or update based on user_id)
        // This handles both new users and updates to existing profiles
        await supabase.from('profiles').upsert({
          user_id: userId,
          notes: state.notes,
          degree_name: state.degree?.name ?? null,
          degree_total_credits: state.degree?.totalCreditsRequired ?? null,
        });
        
        // Transform local semester data to match database schema
        // Convert boolean isActive to database boolean format
        const semestersPayload = state.semesters.map(s => ({
          id: s.id,
          user_id: userId,
          name: s.name,
          year: s.year,
          season: s.season,
          is_active: !!s.isActive, // Ensure boolean conversion
          notes: s.notes ?? null,
        }));
        await supabase.from('semesters').upsert(semestersPayload);
        
        // Flatten nested course structure and transform to database schema
        // Each course needs its parent semester_id for relational integrity
        const coursesPayload = state.semesters.flatMap(s => s.courses.map(c => ({
          id: c.id,
          user_id: userId,
          semester_id: s.id, // Establish parent-child relationship
          name: c.name,
          credits: c.credits,
          days_of_week: c.daysOfWeek ?? null,
          start_time: c.startTime ?? null,
          end_time: c.endTime ?? null,
          grade: c.grade ?? null,
          color: c.color ?? null,
          notes: c.notes ?? null,
        })));
        await supabase.from('courses').upsert(coursesPayload);
        set({ isSyncing: false });
      },

      // Action history methods for implementing undo/redo functionality
      saveToHistory: (action: string, data: Record<string, any>) => {
        const state = get();
        // Create a snapshot of the current state before the action
        // Deep clone the data to prevent reference issues when restoring state
        const newAction: ActionHistoryItem = {
          type: action,
          data: JSON.parse(JSON.stringify(data)), // Deep clone to avoid mutations
          timestamp: Date.now()
        };
        
        // Implement branching history: when user undoes then performs a new action,
        // we discard the "future" actions to create a linear history
        // This prevents confusing redo behavior after new actions
        const newHistory = state.actionHistory.slice(0, state.historyIndex + 1);
        newHistory.push(newAction);
        
        // Memory management: keep only the last 50 actions to prevent unbounded growth
        // This balances functionality with memory usage
        const trimmedHistory = newHistory.slice(-50);
        
        set({
          actionHistory: trimmedHistory,
          historyIndex: trimmedHistory.length - 1 // Point to the latest action
        });
      },

      undo: () => {
        const state = get();
        // Can't undo if we're at the beginning of history or history is empty
        if (state.historyIndex <= 0) return;
        
        // Get the state snapshot from before the current action
        const previousAction = state.actionHistory[state.historyIndex - 1];
        if (previousAction) {
          // Restore the previous state based on the action type
          // All semester and course actions affect the semesters array
          switch (previousAction.type) {
            case 'ADD_SEMESTER':
            case 'DELETE_SEMESTER':
            case 'UPDATE_SEMESTER':
            case 'REORDER_SEMESTERS':
              set({ semesters: previousAction.data.semesters });
              break;
            case 'ADD_COURSE':
            case 'DELETE_COURSE':
            case 'UPDATE_COURSE':
            case 'REORDER_COURSES':
              set({ semesters: previousAction.data.semesters });
              break;
          }
          // Move the history pointer backward
          set({ historyIndex: state.historyIndex - 1 });
        }
      },

      redo: () => {
        const state = get();
        // Can't redo if we're at the end of history
        if (state.historyIndex >= state.actionHistory.length - 1) return;
        
        const nextAction = state.actionHistory[state.historyIndex + 1];
        if (nextAction) {
          // Apply next action
          switch (nextAction.type) {
            case 'ADD_SEMESTER':
            case 'DELETE_SEMESTER':
            case 'UPDATE_SEMESTER':
            case 'REORDER_SEMESTERS':
              set({ semesters: nextAction.data.newSemesters });
              break;
            case 'ADD_COURSE':
            case 'DELETE_COURSE':
            case 'UPDATE_COURSE':
            case 'REORDER_COURSES':
              set({ semesters: nextAction.data.newSemesters });
              break;
          }
          set({ historyIndex: state.historyIndex + 1 });
        }
      },

      // Data export/import methods for backup and data portability
      exportData: () => {
        const state = get();
        // Create a standardized export format with metadata for version compatibility
        // Include timestamp and version for future migration support
        const exportData = {
          semesters: state.semesters,    // Complete semester and course data
          notes: state.notes,            // Global notes
          degree: state.degree,          // Degree information
          exportDate: new Date().toISOString(), // Export timestamp for tracking
          version: '1.0'                 // Schema version for future compatibility
        };
        
        // Pretty-print JSON for human readability and easier debugging
        return JSON.stringify(exportData, null, 2);
      },

      importData: (jsonData: string) => {
        try {
          // Parse JSON string - this can throw if invalid JSON
          const data = JSON.parse(jsonData);
          
          // Validate the data structure with Zod schema to ensure data integrity
          // This prevents importing corrupted or incompatible data that could break the app
          const validatedData = importDataSchema.parse(data);
          
          // Create a restore point before importing - allows user to undo import
          // This is critical for data safety when importing potentially destructive changes
          const currentState = get();
          get().saveToHistory('IMPORT_DATA', {
            semesters: currentState.semesters,
            notes: currentState.notes,
            degree: currentState.degree
          });
          
          // Replace current state with imported data
          // Use fallback values to handle partial imports gracefully
          set({
            semesters: validatedData.semesters || [],
            notes: validatedData.notes || '',
            degree: validatedData.degree || null,
            // Set current semester to first imported semester for better UX
            currentSemester: validatedData.semesters?.[0]?.id || null
          });
          
          return { success: true, message: 'Data imported successfully!' };
        } catch (error) {
          // Handle validation errors with detailed feedback
          if (error instanceof z.ZodError) {
            // Transform Zod errors into user-friendly messages
            const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
            return { 
              success: false, 
              message: `Import failed - Invalid data format: ${errorMessages}` 
            };
          }
          // Handle other errors (JSON parsing, etc.)
          return { 
            success: false, 
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      },

      reset: () => set({
        semesters: [],
        currentSemester: null,
        notes: '',
        showScheduleView: false,
        selectedNoteScope: 'global',
        selectedSemesterForNotes: null,
        selectedCourseForNotes: null,
        degree: null,
        isLoading: false,
        isSyncing: false,
        actionHistory: [],
        historyIndex: -1,
      }),
    }),
    {
      name: 'uniplan-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);