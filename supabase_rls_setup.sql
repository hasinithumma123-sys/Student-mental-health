-- ========================================================================
-- Supabase RLS Policy Setup for Student Mental Health App
-- ========================================================================
-- Run these SQL statements in your Supabase dashboard:
-- 1. Go to SQL Editor in Supabase
-- 2. Create a new query
-- 3. Copy and paste the statements below
-- 4. Click "Run"
-- ========================================================================

-- For development/testing: Disable RLS on all tables to test functionality
-- After confirming everything works, you can re-enable RLS with proper policies

-- ASSESSMENTS TABLE: Allow students to insert/read their own assessments
-- First, check if RLS is enabled
-- ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Allow students to read their own assessments
-- CREATE POLICY "Students can read own assessments" ON assessments
--   FOR SELECT USING (auth.uid()::text = studentuid);

-- Allow students to insert their own assessments
-- CREATE POLICY "Students can insert own assessments" ON assessments
--   FOR INSERT WITH CHECK (auth.uid()::text = studentuid);

-- For now, allow anyone to insert/read assessments (for development)
-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "assessments_public" ON assessments;
DROP POLICY IF EXISTS "Students can read own assessments" ON assessments;
DROP POLICY IF EXISTS "Students can insert own assessments" ON assessments;

-- Allow public access to assessments table (development mode)
CREATE POLICY "assessments_public" ON assessments
  FOR ALL USING (true)
  WITH CHECK (true);

-- ========================================================================
-- APPOINTMENTS TABLE: Allow students and counselors to read/manage appointments
-- ========================================================================
DROP POLICY IF EXISTS "appointments_public" ON appointments;

CREATE POLICY "appointments_public" ON appointments
  FOR ALL USING (true)
  WITH CHECK (true);

-- ========================================================================
-- SOS TABLE: Allow students to create SOS alerts
-- ========================================================================
DROP POLICY IF EXISTS "sos_public" ON sos;

CREATE POLICY "sos_public" ON sos
  FOR ALL USING (true)
  WITH CHECK (true);

-- ========================================================================
-- USERS TABLE: Allow reading user profiles
-- ========================================================================
DROP POLICY IF EXISTS "users_public" ON users;

CREATE POLICY "users_public" ON users
  FOR ALL USING (true)
  WITH CHECK (true);

-- ========================================================================
-- IMPORTANT: For Production
-- ========================================================================
-- Before deploying to production, replace the above permissive policies
-- with proper RLS policies that:
-- 1. Verify user authentication
-- 2. Check user roles (student/counselor/admin)
-- 3. Restrict data access appropriately
-- 
-- Example production policy for assessments:
-- CREATE POLICY "Students can read own assessments" ON assessments
--   FOR SELECT USING (
--     auth.uid()::text = studentuid OR
--     (SELECT role FROM users WHERE uid = auth.uid()::text) = 'staff'
--   );
-- ========================================================================
