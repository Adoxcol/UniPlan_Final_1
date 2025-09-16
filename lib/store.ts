import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Semester, Course, ScheduleConflict, TimeSlot } from './types';

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
                  const start1 = new Date(`2000-01-01 ${course1.startTime}`);
                  const end1 = new Date(`2000-01-01 ${course1.endTime}`);
                  const start2 = new Date(`2000-01-01 ${course2.startTime}`);
                  const end2 = new Date(`2000-01-01 ${course2.endTime}`);
                  
                  if ((start1 < end2 && end1 > start2)) {
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
        
        return timeSlots;
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
    }),
    {
      name: 'uniplan-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);