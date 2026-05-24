-- ============================================================
-- INCUXAI INTERN MANAGEMENT SYSTEM — FULL DATABASE SCHEMA
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (synced with Supabase Auth)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'intern')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- BATCHES TABLE
-- ============================================================
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  domain TEXT,
  admin_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- GROUPS TABLE
-- ============================================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  batch_id UUID REFERENCES batches(id),
  lead_intern_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INTERNS TABLE
-- ============================================================
CREATE TABLE interns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  batch_id UUID REFERENCES batches(id),
  group_id UUID REFERENCES groups(id),
  phone TEXT,
  college TEXT,
  domain TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  skills TEXT[],
  performance_score NUMERIC(5,2) DEFAULT 0,
  join_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add group lead FK after interns table exists
ALTER TABLE groups ADD CONSTRAINT fk_group_lead FOREIGN KEY (lead_intern_id) REFERENCES interns(id);

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID REFERENCES interns(id) NOT NULL,
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  selfie_url TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  status TEXT CHECK (status IN ('present', 'late', 'absent', 'half_day', 'leave')),
  is_verified BOOLEAN DEFAULT false,
  correction_requested BOOLEAN DEFAULT false,
  correction_reason TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (intern_id, date)
);

-- ============================================================
-- PROJECTS TABLE
-- ============================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  batch_id UUID REFERENCES batches(id),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  tech_stack TEXT[],
  repo_url TEXT,
  demo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PROJECT MEMBERS TABLE
-- ============================================================
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  intern_id UUID REFERENCES interns(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (project_id, intern_id)
);

-- ============================================================
-- MILESTONES TABLE
-- ============================================================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TASKS TABLE
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES interns(id),
  group_id UUID REFERENCES groups(id),
  project_id UUID REFERENCES projects(id),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected')),
  due_date TIMESTAMPTZ NOT NULL,
  submission_url TEXT,
  submission_note TEXT,
  mentor_feedback TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LEAVE REQUESTS TABLE
-- ============================================================
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID REFERENCES interns(id) NOT NULL,
  leave_type TEXT CHECK (leave_type IN ('sick', 'personal', 'emergency', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_id UUID REFERENCES users(id),
  admin_comment TEXT,
  actioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  target_audience TEXT CHECK (target_audience IN ('all', 'batch', 'group', 'individual')),
  target_id UUID,
  is_pinned BOOLEAN DEFAULT false,
  send_email BOOLEAN DEFAULT false,
  send_push BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ANNOUNCEMENT READS TABLE
-- ============================================================
CREATE TABLE announcement_reads (
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  intern_id UUID REFERENCES interns(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (announcement_id, intern_id)
);

-- ============================================================
-- EVALUATIONS TABLE
-- ============================================================
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID REFERENCES interns(id) NOT NULL,
  admin_id UUID REFERENCES users(id) NOT NULL,
  period_label TEXT NOT NULL,
  task_score NUMERIC(5,2) CHECK (task_score >= 0 AND task_score <= 10),
  attendance_score NUMERIC(5,2) CHECK (attendance_score >= 0 AND attendance_score <= 10),
  communication_score NUMERIC(5,2) CHECK (communication_score >= 0 AND communication_score <= 10),
  initiative_score NUMERIC(5,2) CHECK (initiative_score >= 0 AND initiative_score <= 10),
  overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 10),
  comments TEXT,
  is_published BOOLEAN DEFAULT false,
  evaluated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX idx_attendance_intern_date ON attendance(intern_id, date DESC);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to, status);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_leave_requests_intern ON leave_requests(intern_id, status);
CREATE INDEX idx_announcements_target ON announcements(target_audience, published_at DESC);
CREATE INDEX idx_evaluations_intern ON evaluations(intern_id, evaluated_at DESC);

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'intern'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — ENABLE ON ALL TABLES
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interns ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — USERS
-- ============================================================
-- Users can read their own record; admins can read all
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS POLICIES — INTERNS
-- ============================================================
CREATE POLICY interns_select ON interns FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY interns_insert ON interns FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY interns_update ON interns FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY interns_delete ON interns FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS POLICIES — ATTENDANCE
-- ============================================================
CREATE POLICY attendance_select ON attendance FOR SELECT
  USING (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY attendance_insert ON attendance FOR INSERT
  WITH CHECK (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid()));

CREATE POLICY attendance_update ON attendance FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS POLICIES — TASKS
-- ============================================================
CREATE POLICY tasks_select ON tasks FOR SELECT
  USING (assigned_to IN (SELECT id FROM interns WHERE user_id = auth.uid())
         OR created_by = auth.uid()
         OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY tasks_insert ON tasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY tasks_update_submit ON tasks FOR UPDATE
  USING (assigned_to IN (SELECT id FROM interns WHERE user_id = auth.uid()) AND status = 'pending'
         OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS POLICIES — PROJECTS
-- ============================================================
CREATE POLICY projects_select ON projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'intern')));

CREATE POLICY projects_insert ON projects FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY projects_update ON projects FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS POLICIES — LEAVE REQUESTS
-- ============================================================
CREATE POLICY leaves_select ON leave_requests FOR SELECT
  USING (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY leaves_insert ON leave_requests FOR INSERT
  WITH CHECK (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid()));

CREATE POLICY leaves_update ON leave_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS POLICIES — ANNOUNCEMENTS
-- ============================================================
CREATE POLICY announcements_select ON announcements FOR SELECT
  USING (target_audience = 'all'
         OR target_id IN (SELECT batch_id FROM interns WHERE user_id = auth.uid())
         OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY announcements_insert ON announcements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY announcements_update ON announcements FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY announcements_delete ON announcements FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS POLICIES — EVALUATIONS
-- ============================================================
CREATE POLICY evaluations_select ON evaluations FOR SELECT
  USING (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid()) AND is_published = true
         OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY evaluations_insert ON evaluations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY evaluations_update ON evaluations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- RLS POLICIES — NOTIFICATIONS
-- ============================================================
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- SEED DATA — DEFAULT ADMIN
-- Run this AFTER creating your Supabase Auth user manually
-- ============================================================
-- INSERT INTO users (id, email, full_name, role) 
-- VALUES ('YOUR_AUTH_USER_ID', 'admin@incuxai.com', 'Admin', 'admin');
