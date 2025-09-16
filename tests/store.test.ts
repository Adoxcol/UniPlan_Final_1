import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/lib/store';

describe('store basics', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('adds a semester and sets active/current', () => {
    useAppStore.getState().addSemester({ name: 'Fall', year: 2025, season: 'Autumn' });
    const [sem] = useAppStore.getState().semesters;
    expect(sem).toBeDefined();
    useAppStore.getState().setActiveSemester(sem.id);
    expect(useAppStore.getState().currentSemester).toBe(sem.id);
    const active = useAppStore.getState().getActiveSemester();
    expect(active?.id).toBe(sem.id);
  });

  it('detects schedule conflicts', () => {
    useAppStore.getState().addSemester({ name: 'Spring', year: 2026, season: 'Spring' });
    const [sem] = useAppStore.getState().semesters;
    useAppStore.getState().addCourse(sem.id, {
      name: 'Math', credits: 3, daysOfWeek: ['Monday'], startTime: '10:00', endTime: '11:00'
    });
    useAppStore.getState().addCourse(sem.id, {
      name: 'Physics', credits: 3, daysOfWeek: ['Monday'], startTime: '10:30', endTime: '11:30'
    });
    const conflicts = useAppStore.getState().getScheduleConflicts(sem.id);
    expect(conflicts.length).toBe(1);
  });

  it('computes semester GPA and cumulative GPA', () => {
    useAppStore.getState().addSemester({ name: 'Fall', year: 2025, season: 'Autumn' });
    const [sem] = useAppStore.getState().semesters;
    useAppStore.getState().addCourse(sem.id, { name: 'A', credits: 3, grade: 4 });
    useAppStore.getState().addCourse(sem.id, { name: 'B', credits: 3, grade: 3 });
    const sgpa = useAppStore.getState().calculateSemesterGPA(sem.id);
    expect(Number(sgpa.toFixed(2))).toBe(3.5);
    const cgpa = useAppStore.getState().calculateCumulativeGPA();
    expect(Number(cgpa.toFixed(2))).toBe(3.5);
  });

  it('reorders semesters and courses', () => {
    useAppStore.getState().addSemester({ name: 'S1', year: 2025, season: 'Spring' });
    useAppStore.getState().addSemester({ name: 'S2', year: 2025, season: 'Summer' });
    const idsBefore = useAppStore.getState().semesters.map(s => s.id);
    useAppStore.getState().reorderSemesters(0, 1);
    const idsAfter = useAppStore.getState().semesters.map(s => s.id);
    expect(idsAfter[0]).toBe(idsBefore[1]);

    const [sem] = useAppStore.getState().semesters;
    useAppStore.getState().addCourse(sem.id, { name: 'C1', credits: 3 });
    useAppStore.getState().addCourse(sem.id, { name: 'C2', credits: 3 });
    const before = useAppStore.getState().semesters.find(s => s.id === sem.id)!.courses.map(c => c.id);
    useAppStore.getState().reorderCourses(sem.id, 0, 1);
    const after = useAppStore.getState().semesters.find(s => s.id === sem.id)!.courses.map(c => c.id);
    expect(after[0]).toBe(before[1]);
  });
});


