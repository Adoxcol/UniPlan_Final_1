import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Semester, Course, ScheduleConflict, TimeSlot } from './types';
import { timeStringToMinutes } from './utils';
import { supabase } from './supabaseClient';

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
      theme: 'light',
      showScheduleView: false,
      selectedNoteScope: 'global',
      selectedSemesterForNotes: null,
      selectedCourseForNotes: null,
      degree: null,

      addSemester: (semesterData) => {
        const newSemester: Semester = {
          ...semesterData,
          id: generateId(),
          courses: [],
        };
        set((state) => ({
          semesters: [...state.semesters, newSemester],
        }));
      },

      removeSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.filter((s) => s.id !== id),
          currentSemester: state.currentSemester === id ? null : state.currentSemester,
        }));
      },

      updateSemester: (id, updates) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      reorderSemesters: (startIndex, endIndex) => {
        set((state) => {
          const result = Array.from(state.semesters);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { semesters: result };
        });
      },

      addCourse: (semesterId, courseData) => {
        const colorIndex = get().semesters
          .find(s => s.id === semesterId)?.courses.length || 0;
        
        const newCourse: Course = {
          ...courseData,
          id: generateId(),
          color: courseColors[colorIndex % courseColors.length],
        };

        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.id === semesterId
              ? { ...s, courses: [...s.courses, newCourse] }
              : s
          ),
        }));
      },

      removeCourse: (semesterId, courseId) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.id === semesterId
              ? { ...s, courses: s.courses.filter((c) => c.id !== courseId) }
              : s
          ),
        }));
      },

      updateCourse: (semesterId, courseId, updates) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.id === semesterId
              ? {
                  ...s,
                  courses: s.courses.map((c) =>
                    c.id === courseId ? { ...c, ...updates } : c
                  ),
                }
              : s
          ),
        }));
      },

      reorderCourses: (semesterId, startIndex, endIndex) => {
        set((state) => ({
          semesters: state.semesters.map((s) =>
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
          ),
        }));
      },

      setNotes: (notes) => set({ notes }),
      setCurrentSemester: (id) => set({ currentSemester: id }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
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

        const coursesWithGrades = semester.courses.filter((c) => c.grade !== undefined);
        if (coursesWithGrades.length === 0) return 0;

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

      calculateCumulativeGPA: () => {
        const allCourses = get().semesters.flatMap((s) => s.courses);
        const coursesWithGrades = allCourses.filter((c) => c.grade !== undefined);
        
        if (coursesWithGrades.length === 0) return 0;

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
        const semesters = semesterId 
          ? state.semesters.filter(s => s.id === semesterId)
          : state.semesters;
        
        const allCourses = semesters.flatMap(s => s.courses);
        const conflicts: ScheduleConflict[] = [];
        
        // Check for time conflicts
        for (let i = 0; i < allCourses.length; i++) {
          for (let j = i + 1; j < allCourses.length; j++) {
            const course1 = allCourses[i];
            const course2 = allCourses[j];
            
            if (!course1.daysOfWeek || !course2.daysOfWeek || 
                !course1.startTime || !course2.startTime ||
                !course1.endTime || !course2.endTime) continue;
                
            // Check for overlaps between any days of the two courses
            for (const day1 of course1.daysOfWeek) {
              for (const day2 of course2.daysOfWeek) {
                if (day1 === day2) {
                  const start1 = timeStringToMinutes(course1.startTime);
                  const end1 = timeStringToMinutes(course1.endTime);
                  const start2 = timeStringToMinutes(course2.startTime);
                  const end2 = timeStringToMinutes(course2.endTime);
                  
                  if (start1 < end2 && end1 > start2) {
                    conflicts.push({
                      courses: [course1, course2],
                      day: day1,
                      timeOverlap: {
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
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user.id;
        if (!userId) return;
        const [profiles, semestersRes, coursesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('semesters').select('*').eq('user_id', userId),
          supabase.from('courses').select('*').eq('user_id', userId),
        ]);
        const profile = (profiles as any).data || null;
        const semesters = (semestersRes as any).data || [];
        const courses = (coursesRes as any).data || [];
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
        });
      },

      saveAllToSupabase: async () => {
        if (!supabase) return;
        const state = get();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user.id;
        if (!userId) return;
        
        // Fetch existing data to handle deletions
        const [existingSemestersRes, existingCoursesRes] = await Promise.all([
          supabase.from('semesters').select('id').eq('user_id', userId),
          supabase.from('courses').select('id').eq('user_id', userId),
        ]);
        
        const existingSemesters = (existingSemestersRes as any).data || [];
        const existingCourses = (existingCoursesRes as any).data || [];
        
        // Get current IDs
        const currentSemesterIds = state.semesters.map(s => s.id);
        const currentCourseIds = state.semesters.flatMap(s => s.courses.map(c => c.id));
        
        // Find IDs to delete
        const semesterIdsToDelete = existingSemesters
          .filter((s: any) => !currentSemesterIds.includes(s.id))
          .map((s: any) => s.id);
          
        const courseIdsToDelete = existingCourses
          .filter((c: any) => !currentCourseIds.includes(c.id))
          .map((c: any) => c.id);
        
        // Delete removed items
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
        
        // upsert profile
        await supabase.from('profiles').upsert({
          user_id: userId,
          notes: state.notes,
          degree_name: state.degree?.name ?? null,
          degree_total_credits: state.degree?.totalCreditsRequired ?? null,
        });
        
        // upsert semesters
        const semestersPayload = state.semesters.map(s => ({
          id: s.id,
          user_id: userId,
          name: s.name,
          year: s.year,
          season: s.season,
          is_active: !!s.isActive,
          notes: s.notes ?? null,
        }));
        await supabase.from('semesters').upsert(semestersPayload);
        
        // upsert courses
        const coursesPayload = state.semesters.flatMap(s => s.courses.map(c => ({
          id: c.id,
          user_id: userId,
          semester_id: s.id,
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
      },

      reset: () => set({
        semesters: [],
        currentSemester: null,
        notes: '',
        theme: 'light',
        showScheduleView: false,
        selectedNoteScope: 'global',
        selectedSemesterForNotes: null,
        selectedCourseForNotes: null,
        degree: null,
      }),
    }),
    {
      name: 'uniplan-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);