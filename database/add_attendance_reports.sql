-- SQL script to add required columns for the Attendance & Reports module to the existing 'attendance' table.
-- Please run this in your Supabase SQL Editor.

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS total_hours NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS tasks_submitted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false;

-- The 'status' column already exists (CHECK IN ('present', 'late', 'absent', 'half_day', 'leave')).
-- The 'admin_note' column already exists and can be used for 'notes'.
-- The 'check_in_time' and 'check_out_time' already exist.

-- Let's update any existing 'late' statuses to set is_late = true
UPDATE attendance SET is_late = true WHERE status = 'late';
