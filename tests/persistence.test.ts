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

  it('should update store state when degree is set', () => {
    // Make a state change
    useAppStore.getState().setDegree({
      name: 'Test Degree',
      totalCreditsRequired: 120
    });
    
    // Verify the state was updated
    const state = useAppStore.getState();
    expect(state.degree).toBeTruthy();
    expect(state.degree?.name).toBe('Test Degree');
    expect(state.degree?.totalCreditsRequired).toBe(120);
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
      semesters: [
        {
          id: 'test-sem-1',
          name: 'Fall 2024',
          year: 2024,
          season: 'Autumn',
          courses: []
        }
      ]
    };

    const result = useAppStore.getState().importData(JSON.stringify(partialData));
    
    expect(result.success).toBe(true);
    
    const state = useAppStore.getState();
    expect(state.semesters).toHaveLength(1);
    expect(state.semesters[0].name).toBe('Fall 2024');
  });

  it('should maintain data integrity after multiple operations', () => {
    // Set up initial data
    const initialData = {
      semesters: [
        {
          id: 'test-sem-1',
          name: 'Fall 2024',
          year: 2024,
          season: 'Autumn',
          courses: [
            {
              id: 'test-course-1',
              name: 'Data Structures',
              credits: 3
            }
          ]
        }
      ],
      degree: {
        name: 'Computer Science',
        totalCreditsRequired: 120
      }
    };

    // Import data
    const result = useAppStore.getState().importData(JSON.stringify(initialData));
    expect(result.success).toBe(true);

    // Perform multiple operations
    const store = useAppStore.getState();
    store.addSemester({
      name: 'Spring 2025',
      year: 2025,
      season: 'Spring'
    });

    // Export and verify integrity
    const exportedData = store.exportData();
    const parsedData = JSON.parse(exportedData);
    
    expect(parsedData.degree.name).toBe('Computer Science');
    expect(parsedData.semesters).toHaveLength(2);
    expect(parsedData.semesters[0].courses).toHaveLength(1);
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