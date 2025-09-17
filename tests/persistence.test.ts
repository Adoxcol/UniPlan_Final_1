import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/lib/store';

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// @ts-ignore
global.localStorage = localStorageMock;

describe('Data Persistence', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should persist data to localStorage when state changes', () => {
    const degreeData = {
      name: 'Computer Science',
      totalCredits: 120,
      university: 'Test University'
    };

    useAppStore.getState().setDegree(degreeData);
    
    // Zustand persist should have called setItem
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should export data in correct JSON format', () => {
    // Set up test data
    useAppStore.getState().setDegree({
      name: 'Computer Science',
      totalCredits: 120
    });

    useAppStore.getState().addSemester({ 
      name: 'Fall 2024', 
      year: 2024, 
      season: 'Autumn' 
    });
    
    const [semester] = useAppStore.getState().semesters;
    
    useAppStore.getState().addCourse(semester.id, {
      name: 'Math 101',
      credits: 3,
      grade: 4,
      completed: true
    });

    const exportedData = useAppStore.getState().exportData();
    const parsedData = JSON.parse(exportedData);

    expect(parsedData).toHaveProperty('degree');
    expect(parsedData).toHaveProperty('semesters');
    expect(parsedData.degree.name).toBe('Computer Science');
    expect(parsedData.semesters).toHaveLength(1);
    expect(parsedData.semesters[0].courses).toHaveLength(1);
    expect(parsedData.semesters[0].courses[0].name).toBe('Math 101');
  });

  it('should import data and restore state correctly', () => {
    const testData = {
      degree: {
        name: 'Engineering',
        totalCreditsRequired: 128
      },
      semesters: [
        {
          id: 'test-sem-1',
          name: 'Fall 2024',
          year: 2024,
          season: 'Autumn',
          courses: [
            {
              id: 'test-course-1',
              name: 'Calculus I',
              credits: 4,
              grade: 3.5
            }
          ]
        }
      ]
    };

    const result = useAppStore.getState().importData(JSON.stringify(testData));
    
    expect(result.success).toBe(true);
    
    const state = useAppStore.getState();
    expect(state.degree?.name).toBe('Engineering');
    expect(state.degree?.totalCreditsRequired).toBe(128);
    expect(state.semesters).toHaveLength(1);
    expect(state.semesters[0].name).toBe('Fall 2024');
    expect(state.semesters[0].courses).toHaveLength(1);
    expect(state.semesters[0].courses[0].name).toBe('Calculus I');
  });

  it('should handle invalid import data gracefully', () => {
    const invalidData = '{ invalid json }';
    
    const result = useAppStore.getState().importData(invalidData);
    expect(result.success).toBe(false);
    
    // State should remain unchanged
    const state = useAppStore.getState();
    expect(state.semesters).toHaveLength(0);
    expect(state.degree).toBeNull();
  });

  it('should handle partial import data', () => {
    const partialData = {
      degree: {
        name: 'Partial Degree'
      }
      // Missing semesters array
    };

    const result = useAppStore.getState().importData(JSON.stringify(partialData));
    expect(result.success).toBe(true);
    
    const state = useAppStore.getState();
    expect(state.degree?.name).toBe('Partial Degree');
    expect(state.semesters).toHaveLength(0); // Should default to empty array
  });

  it('should maintain data integrity after multiple operations', () => {
    // Perform multiple operations
    useAppStore.getState().setDegree({ name: 'Test Degree', totalCredits: 120 });
    
    useAppStore.getState().addSemester({ name: 'Sem 1', year: 2024, season: 'Autumn' });
    useAppStore.getState().addSemester({ name: 'Sem 2', year: 2024, season: 'Spring' });
    
    const [sem1, sem2] = useAppStore.getState().semesters;
    
    useAppStore.getState().addCourse(sem1.id, { name: 'Course 1', credits: 3 });
    useAppStore.getState().addCourse(sem2.id, { name: 'Course 2', credits: 4 });
    
    // Export and re-import
    const exported = useAppStore.getState().exportData();
    useAppStore.getState().reset();
    const result = useAppStore.getState().importData(exported);
    
    expect(result.success).toBe(true);
    
    const state = useAppStore.getState();
    expect(state.semesters).toHaveLength(2);
    expect(state.semesters[0].courses).toHaveLength(1);
    expect(state.semesters[1].courses).toHaveLength(1);
    
    // Verify GPA calculation still works
    const gpa = state.calculateCumulativeGPA();
    expect(typeof gpa).toBe('number');
  });

  it('should handle reset functionality correctly', () => {
    // Set up some data
    useAppStore.getState().setDegree({ name: 'Test', totalCredits: 120 });
    useAppStore.getState().addSemester({ name: 'Test Sem', year: 2024, season: 'Autumn' });
    
    // Reset
    useAppStore.getState().reset();
    
    const state = useAppStore.getState();
    expect(state.degree).toBeNull();
    expect(state.semesters).toHaveLength(0);
  });
});