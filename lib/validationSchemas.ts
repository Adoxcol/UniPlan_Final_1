import { z } from 'zod';

// Semester validation schema
export const semesterSchema = z.object({
  name: z.string().min(1, 'Semester name is required').max(50, 'Semester name must be less than 50 characters'),
  year: z.number()
    .int('Year must be a whole number')
    .min(2020, 'Year must be 2020 or later')
    .max(2030, 'Year must be 2030 or earlier'),
  season: z.enum(['Autumn', 'Spring', 'Summer'], {
    errorMap: () => ({ message: 'Season must be Autumn, Spring, or Summer' })
  }),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  isActive: z.boolean().optional()
});

// Course validation schema
export const courseSchema = z.object({
  name: z.string()
    .min(1, 'Course name is required')
    .max(100, 'Course name must be less than 100 characters')
    .trim(),
  credits: z.number()
    .int('Credits must be a whole number')
    .min(1, 'Credits must be at least 1')
    .max(6, 'Credits cannot exceed 6'),
  daysOfWeek: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']))
    .optional()
    .refine((days) => !days || days.length <= 7, 'Cannot select more than 7 days'),
  startTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format')
    .optional()
    .or(z.literal('')),
  endTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
    .optional()
    .or(z.literal('')),
  grade: z.number()
    .min(0, 'Grade cannot be negative')
    .max(4, 'Grade cannot exceed 4.0')
    .optional()
    .nullable()
}).refine((data) => {
  // If both start and end times are provided, end time should be after start time
  if (data.startTime && data.endTime && data.startTime !== '' && data.endTime !== '') {
    const start = new Date(`1970-01-01T${data.startTime}:00`);
    const end = new Date(`1970-01-01T${data.endTime}:00`);
    return end > start;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});

// Degree validation schema
export const degreeSchema = z.object({
  name: z.string()
    .min(1, 'Degree name is required')
    .max(100, 'Degree name must be less than 100 characters')
    .trim(),
  totalCreditsRequired: z.number()
    .int('Total credits must be a whole number')
    .min(60, 'Total credits must be at least 60')
    .max(200, 'Total credits cannot exceed 200')
});

// Data import validation schema
export const importDataSchema = z.object({
  semesters: z.array(z.object({
    id: z.string(),
    name: z.string(),
    year: z.number(),
    season: z.enum(['Autumn', 'Spring', 'Summer']),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
    courses: z.array(z.object({
      id: z.string(),
      name: z.string(),
      credits: z.number(),
      daysOfWeek: z.array(z.string()).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      grade: z.number().optional().nullable()
    }))
  })),
  notes: z.string().optional(),
  degree: z.object({
    name: z.string(),
    totalCreditsRequired: z.number()
  }).optional().nullable(),
  exportDate: z.string().optional(),
  version: z.string().optional()
});

// Notes validation schema
export const notesSchema = z.object({
  content: z.string().max(10000, 'Notes cannot exceed 10,000 characters'),
  scope: z.enum(['global', 'semester', 'course']),
  semesterId: z.string().optional(),
  courseId: z.string().optional()
}).refine((data) => {
  // If scope is semester, semesterId is required
  if (data.scope === 'semester') {
    return !!data.semesterId;
  }
  // If scope is course, both semesterId and courseId are required
  if (data.scope === 'course') {
    return !!data.semesterId && !!data.courseId;
  }
  return true;
}, {
  message: 'Semester ID is required for semester scope, and both semester and course IDs are required for course scope'
});

// Type exports for TypeScript
export type SemesterFormData = z.infer<typeof semesterSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type DegreeFormData = z.infer<typeof degreeSchema>;
export type ImportData = z.infer<typeof importDataSchema>;
export type NotesFormData = z.infer<typeof notesSchema>;