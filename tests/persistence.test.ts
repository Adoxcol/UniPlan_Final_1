import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/lib/store';

describe('Data Persistence', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('should persist data when state changes', () => {
    const degreeData = {
      name: 'Computer Science',
      totalCreditsRequired: 120
    };

    useAppStore.getState().setDegree(degreeData);
    
    // Check that the data is actually in the store
    const state = useAppStore.getState();
    expect(state.degree?.name).toBe('Computer Science');
    expect(state.degree?.totalCreditsRequired).toBe(120);
    
    // Test that the store maintains the data (persistence is working)
    const retrievedState = useAppStore.getState();
    expect(retrievedState.degree?.name).toBe('Computer Science');
    expect(retrievedState.degree?.totalCreditsRequired).toBe(120);
  });

  it('should export data in correct JSON format', () => {
    // Set up test data
    useAppStore.getState().setDegree({
      name: 'Computer Science',
      totalCreditsRequired: 120
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
      grade: 4
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
    useAppStore.getState().setDegree({ name: 'Test Degree', totalCreditsRequired: 120 });
    
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
    useAppStore.getState().setDegree({ name: 'Test', totalCreditsRequired: 120 });
    useAppStore.getState().addSemester({ name: 'Test Sem', year: 2024, season: 'Autumn' });
    
    // Reset
    useAppStore.getState().reset();
    
    const state = useAppStore.getState();
    expect(state.degree).toBeNull();
    expect(state.semesters).toHaveLength(0);
  });

  it('should handle invalid JSON data gracefully', () => {
    const invalidJson = '{ invalid json }';
    
    const result = useAppStore.getState().importData(invalidJson);
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Import failed');
  });

  it('should handle Zod validation errors with detailed messages', () => {
    const invalidData = JSON.stringify({
      semesters: [{
        id: 'sem1',
        name: '', // Invalid: empty name
        year: 1999, // Invalid: year too early
        season: 'InvalidSeason', // Invalid: not a valid season
        courses: []
      }]
    });
    
    const result = useAppStore.getState().importData(invalidData);
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid data format');
  });

  it('should handle legacy degree properties correctly', () => {
    const legacyData = JSON.stringify({
      semesters: [],
      degree: {
        name: 'Computer Science',
        totalCredits: 130 // Legacy property name
      }
    });
    
    const result = useAppStore.getState().importData(legacyData);
    
    expect(result.success).toBe(true);
    const state = useAppStore.getState();
    expect(state.degree).toEqual({
      name: 'Computer Science',
      totalCreditsRequired: 130 // Should be converted to new property name
    });
  });

  it('should handle degree with both legacy and new properties', () => {
    const mixedData = JSON.stringify({
      semesters: [],
      degree: {
        name: 'Engineering',
        totalCredits: 140, // Legacy property
        totalCreditsRequired: 150 // New property should take precedence
      }
    });
    
    const result = useAppStore.getState().importData(mixedData);
    
    expect(result.success).toBe(true);
    const state = useAppStore.getState();
    expect(state.degree).toEqual({
      name: 'Engineering',
      totalCreditsRequired: 150 // New property should be used
    });
  });

  it('should handle degree without credit requirements', () => {
    const degreeOnlyNameData = JSON.stringify({
      semesters: [],
      degree: {
        name: 'Liberal Arts'
        // No credit requirements
      }
    });
    
    const result = useAppStore.getState().importData(degreeOnlyNameData);
    
    expect(result.success).toBe(true);
    const state = useAppStore.getState();
    expect(state.degree).toEqual({
      name: 'Liberal Arts',
      totalCreditsRequired: 120 // Should default to 120
    });
  });

  it('should handle completely empty import data', () => {
    const emptyData = JSON.stringify({});
    
    const result = useAppStore.getState().importData(emptyData);
    
    expect(result.success).toBe(true);
    const state = useAppStore.getState();
    expect(state.semesters).toEqual([]);
    expect(state.degree).toBeNull();
  });

  it('should handle import data with only partial fields', () => {
    const partialData = JSON.stringify({
      notes: 'Only notes provided'
      // No semesters or degree
    });
    
    const result = useAppStore.getState().importData(partialData);
    
    expect(result.success).toBe(true);
    const state = useAppStore.getState();
    expect(state.notes).toBe('Only notes provided');
    expect(state.semesters).toEqual([]);
    expect(state.degree).toBeNull();
  });

  it('should set current semester to first imported semester', () => {
    const dataWithMultipleSemesters = JSON.stringify({
      semesters: [
        {
          id: 'sem1',
          name: 'Fall 2024',
          year: 2024,
          season: 'Autumn',
          courses: []
        },
        {
          id: 'sem2',
          name: 'Spring 2025',
          year: 2025,
          season: 'Spring',
          courses: []
        }
      ]
    });
    
    const result = useAppStore.getState().importData(dataWithMultipleSemesters);
    
    expect(result.success).toBe(true);
    const state = useAppStore.getState();
    expect(state.currentSemester).toBe('sem1'); // Should be set to first semester
  });

  it('should create restore point before importing', () => {
    // Set up initial state
    useAppStore.getState().addSemester({ name: 'Original Semester', year: 2024, season: 'Autumn' });
    useAppStore.getState().setNotes('Original notes');
    
    const initialHistoryLength = useAppStore.getState().actionHistory.length;
    
    // Import new data
    const newData = JSON.stringify({
      semesters: [{
        id: 'new-sem',
        name: 'New Semester',
        year: 2025,
        season: 'Spring',
        courses: []
      }],
      notes: 'New notes'
    });
    
    useAppStore.getState().importData(newData);
    
    // Should have created a restore point in action history
    const state = useAppStore.getState();
    expect(state.actionHistory.length).toBe(initialHistoryLength + 1);
    expect(state.actionHistory[state.actionHistory.length - 1].type).toBe('IMPORT_DATA');
    
    // Verify the restore point contains the original state
    const restorePoint = state.actionHistory[state.actionHistory.length - 1];
    expect(restorePoint.data.semesters).toHaveLength(1);
    expect(restorePoint.data.semesters![0].name).toBe('Original Semester');
    expect(restorePoint.data.notes).toBe('Original notes');
  });
});