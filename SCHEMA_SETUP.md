# Supabase Database Schema Setup Guide

This guide will help you set up the complete Supabase database schema for UniPlan with all necessary constraints, indexes, and security policies.

## 🗄️ Schema Overview

The updated schema includes three main tables with comprehensive data validation:

### Tables
- **`profiles`** - User profiles with global notes and degree information
- **`semesters`** - Academic semesters with courses and scheduling
- **`courses`** - Individual courses within semesters

## 🚀 Setup Instructions

### 1. Delete Existing Database (if applicable)

If you have an existing database with constraint issues:

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **General**
3. Scroll down to **Danger Zone**
4. Click **Delete Project** (if you want a fresh start)
5. Create a new project

### 2. Run the Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema

### 3. Verify Setup

After running the schema, verify that:

- All three tables are created: `profiles`, `semesters`, `courses`
- Row Level Security (RLS) is enabled on all tables
- All indexes are created
- All constraints are in place

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Automatic user_id filtering on all operations
- Secure policies for SELECT, INSERT, UPDATE, DELETE

### Data Validation Constraints

#### Profiles Table
- Notes limited to 10,000 characters
- Degree name limited to 100 characters
- Degree credits must be between 60-200 (if specified)
- Degree name and credits must both be provided or both be null

#### Semesters Table
- Name must be 1-50 characters
- Year must be between 2020-2030
- Season must be 'Autumn', 'Spring', or 'Summer'
- Notes limited to 1,000 characters
- Only one active semester per user
- Unique constraint on user_id + year + season combination

#### Courses Table
- Name must be 1-100 characters (trimmed)
- Credits must be between 1-6
- Grade must be between 0-4 (if specified)
- Time format validation (HH:MM)
- End time must be after start time
- Days of week must be valid weekday names
- Color must be valid hex format (#RRGGBB)
- Notes limited to 1,000 characters

## 📊 Performance Optimizations

### Indexes Created
- `idx_profiles_user_id` - Fast profile lookups
- `idx_semesters_user_id` - Fast semester queries by user
- `idx_semesters_user_year_season` - Fast semester filtering
- `idx_semesters_active` - Fast active semester lookup
- `idx_courses_user_id` - Fast course queries by user
- `idx_courses_semester_id` - Fast course queries by semester
- `idx_courses_user_semester` - Fast combined user/semester queries

### Unique Constraints
- One active semester per user
- Unique semester per user/year/season combination

## 🔄 Automatic Features

### Timestamps
- `created_at` and `updated_at` fields on all tables
- Automatic `updated_at` timestamp updates via triggers

### Cascade Deletions
- Deleting a user removes all their data
- Deleting a semester removes all its courses

## 🛠️ Troubleshooting

### Common Issues

1. **Constraint Violation Errors**
   - Check that data meets validation requirements
   - Ensure season values are exactly 'Autumn', 'Spring', or 'Summer'
   - Verify time formats are HH:MM

2. **Permission Errors**
   - Ensure user is authenticated
   - Check that RLS policies are properly set

3. **Duplicate Key Errors**
   - Check for duplicate semester (user + year + season)
   - Ensure only one active semester per user

### Testing the Schema

After setup, test with sample data:

```sql
-- Test profile creation
INSERT INTO profiles (user_id, notes, degree_name, degree_total_credits)
VALUES (auth.uid(), 'My notes', 'Computer Science', 120);

-- Test semester creation
INSERT INTO semesters (id, user_id, name, year, season, is_active)
VALUES ('test-sem-1', auth.uid(), 'Fall 2024', 2024, 'Autumn', true);

-- Test course creation
INSERT INTO courses (id, user_id, semester_id, name, credits, start_time, end_time)
VALUES ('test-course-1', auth.uid(), 'test-sem-1', 'Database Systems', 3, '10:00', '11:30');
```

## 📝 Schema Changes from Previous Version

### Added Features
- Comprehensive data validation constraints
- Performance indexes
- Automatic timestamp management
- Unique constraints for data integrity
- Better RLS policies
- Detailed documentation

### Breaking Changes
- Stricter validation may reject previously valid data
- Unique constraints prevent duplicate semesters
- Only one active semester allowed per user

## 🔗 Integration with Application

The schema is fully compatible with the existing UniPlan application code. No changes are required to:
- Store operations in `lib/store.ts`
- Data types in `lib/types.ts`
- Validation schemas in `lib/validationSchemas.ts`

The application will automatically benefit from:
- Better data integrity
- Improved performance
- Enhanced security
- Automatic constraint validation