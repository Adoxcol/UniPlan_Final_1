import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/lib/store';

describe('Degree Management', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('should set and update degree information', () => {
    const degreeData = {
      name: 'Computer Science',
      totalCreditsRequired: 120
    };

    useAppStore.getState().setDegree(degreeData);
    const degree = useAppStore.getState().degree;

    expect(degree).toEqual(degreeData);
  });

  it('should calculate progress correctly', () => {
    // Set up degree
    useAppStore.getState().setDegree({
      name: 'Computer Science',
      totalCreditsRequired: 120
    });

    // Add semester with courses
    useAppStore.getState().addSemester({ 
      name: 'Fall 2024', 
      year: 2024, 
      season: 'Autumn' 
    });
    
    const [semester] = useAppStore.getState().semesters;
    
    // Add courses with different completion states
    useAppStore.getState().addCourse(semester.id, {
      name: 'Math 101',
      credits: 3,
      grade: 4 // Completed with A
    });
    
    useAppStore.getState().addCourse(semester.id, {
      name: 'CS 101',
      credits: 4,
      grade: 3 // Completed with B
    });
    
    useAppStore.getState().addCourse(semester.id, {
      name: 'Physics 101',
      credits: 3
      // No grade means not completed
    });

    const state = useAppStore.getState();
    const allCourses = state.semesters.flatMap(s => s.courses);
    const completedCourses = allCourses.filter(c => c.grade !== undefined);
    const completedCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0);
    
    expect(completedCredits).toBe(7); // 3 + 4
    expect(state.degree?.totalCreditsRequired).toBe(120);
  });

  it('should calculate cumulative GPA correctly across multiple semesters', () => {
    useAppStore.getState().setDegree({
      name: 'Computer Science',
      totalCreditsRequired: 120
    });

    // First semester
    useAppStore.getState().addSemester({ 
      name: 'Fall 2024', 
      year: 2024, 
      season: 'Autumn' 
    });
    const [sem1] = useAppStore.getState().semesters;
    
    useAppStore.getState().addCourse(sem1.id, {
      name: 'Math 101',
      credits: 3,
      grade: 4 // A
    });
    
    useAppStore.getState().addCourse(sem1.id, {
      name: 'CS 101',
      credits: 3,
      grade: 3 // B
    });

    // Second semester
    useAppStore.getState().addSemester({ 
      name: 'Spring 2025', 
      year: 2025, 
      season: 'Spring' 
    });
    const semesters = useAppStore.getState().semesters;
    const sem2 = semesters[1];
    
    useAppStore.getState().addCourse(sem2.id, {
      name: 'Physics 101',
      credits: 4,
      grade: 4 // A
    });

    const cumulativeGPA = useAppStore.getState().calculateCumulativeGPA();
    
    // Expected: (3*4 + 3*3 + 4*4) / (3 + 3 + 4) = (12 + 9 + 16) / 10 = 3.7
    expect(Number(cumulativeGPA.toFixed(1))).toBe(3.7);
  });

  it('should handle degree requirements validation', () => {
    useAppStore.getState().setDegree({
      name: 'Computer Science',
      totalCreditsRequired: 120
    });

    const state = useAppStore.getState();
    let allCourses = state.semesters.flatMap(s => s.courses);
    let completedCourses = allCourses.filter(c => c.grade !== undefined);
    let completedCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0);
    
    expect(completedCredits).toBe(0); // No courses yet

    // Add enough credits to complete degree
    useAppStore.getState().addSemester({ 
      name: 'Fall 2024', 
      year: 2024, 
      season: 'Autumn' 
    });
    const [semester] = useAppStore.getState().semesters;
    
    // Add a course with exactly the required credits
    useAppStore.getState().addCourse(semester.id, {
      name: 'Capstone',
      credits: 120,
      grade: 4
    });

    const updatedState = useAppStore.getState();
    allCourses = updatedState.semesters.flatMap(s => s.courses);
    completedCourses = allCourses.filter(c => c.grade !== undefined);
    completedCredits = completedCourses.reduce((sum, c) => sum + c.credits, 0);
    
    expect(completedCredits).toBe(120);
    expect(completedCredits >= (updatedState.degree?.totalCreditsRequired || 0)).toBe(true);
  });
});