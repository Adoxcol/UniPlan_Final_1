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
});


