-- ============================================================
-- FIX RLS INFINITE RECURSION — is_admin() SECURITY DEFINER
-- ============================================================

-- 1. DROP ALL existing policies on users table
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Drop all other existing policies (to recreate with is_admin())
DROP POLICY IF EXISTS interns_select ON interns;
DROP POLICY IF EXISTS interns_insert ON interns;
DROP POLICY IF EXISTS interns_update ON interns;
DROP POLICY IF EXISTS interns_delete ON interns;

DROP POLICY IF EXISTS attendance_select ON attendance;
DROP POLICY IF EXISTS attendance_insert ON attendance;
DROP POLICY IF EXISTS attendance_update ON attendance;

DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_insert ON tasks;
DROP POLICY IF EXISTS tasks_update_submit ON tasks;

DROP POLICY IF EXISTS projects_select ON projects;
DROP POLICY IF EXISTS projects_insert ON projects;
DROP POLICY IF EXISTS projects_update ON projects;

DROP POLICY IF EXISTS leaves_select ON leave_requests;
DROP POLICY IF EXISTS leaves_insert ON leave_requests;
DROP POLICY IF EXISTS leaves_update ON leave_requests;

DROP POLICY IF EXISTS announcements_select ON announcements;
DROP POLICY IF EXISTS announcements_insert ON announcements;
DROP POLICY IF EXISTS announcements_update ON announcements;
DROP POLICY IF EXISTS announcements_delete ON announcements;

DROP POLICY IF EXISTS evaluations_select ON evaluations;
DROP POLICY IF EXISTS evaluations_insert ON evaluations;
DROP POLICY IF EXISTS evaluations_update ON evaluations;

DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_insert ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;

-- ============================================================
-- 2. SECURITY DEFINER FUNCTION — bypasses RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
END;
$$;

-- ============================================================
-- 3. RLS POLICIES — USERS (no recursion)
-- ============================================================
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_select_admin ON users FOR SELECT
  USING (public.is_admin());

-- Allow users to update their own record
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 4. RLS POLICIES — INTERNS
-- ============================================================
CREATE POLICY interns_select ON interns FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY interns_insert ON interns FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY interns_update ON interns FOR UPDATE
  USING (public.is_admin());

CREATE POLICY interns_delete ON interns FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — ATTENDANCE
-- ============================================================
CREATE POLICY attendance_select ON attendance FOR SELECT
  USING (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid())
         OR public.is_admin());

CREATE POLICY attendance_insert ON attendance FOR INSERT
  WITH CHECK (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid()));

CREATE POLICY attendance_update ON attendance FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — TASKS
-- ============================================================
CREATE POLICY tasks_select ON tasks FOR SELECT
  USING (assigned_to IN (SELECT id FROM interns WHERE user_id = auth.uid())
         OR created_by = auth.uid()
         OR public.is_admin());

CREATE POLICY tasks_insert ON tasks FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY tasks_update_submit ON tasks FOR UPDATE
  USING ((assigned_to IN (SELECT id FROM interns WHERE user_id = auth.uid()) AND status = 'pending')
         OR public.is_admin());

-- ============================================================
-- RLS POLICIES — PROJECTS
-- ============================================================
CREATE POLICY projects_select ON projects FOR SELECT
  USING (public.is_admin()
         OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'intern'));

CREATE POLICY projects_insert ON projects FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY projects_update ON projects FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — LEAVE REQUESTS
-- ============================================================
CREATE POLICY leaves_select ON leave_requests FOR SELECT
  USING (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid())
         OR public.is_admin());

CREATE POLICY leaves_insert ON leave_requests FOR INSERT
  WITH CHECK (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid()));

CREATE POLICY leaves_update ON leave_requests FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — ANNOUNCEMENTS
-- ============================================================
CREATE POLICY announcements_select ON announcements FOR SELECT
  USING (target_audience = 'all'
         OR target_id IN (SELECT batch_id FROM interns WHERE user_id = auth.uid())
         OR public.is_admin());

CREATE POLICY announcements_insert ON announcements FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY announcements_update ON announcements FOR UPDATE
  USING (public.is_admin());

CREATE POLICY announcements_delete ON announcements FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — EVALUATIONS
-- ============================================================
CREATE POLICY evaluations_select ON evaluations FOR SELECT
  USING ((intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid()) AND is_published = true)
         OR public.is_admin());

CREATE POLICY evaluations_insert ON evaluations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY evaluations_update ON evaluations FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — NOTIFICATIONS
-- ============================================================
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- 5. RLS POLICIES — GROUPS, BATCHES, PROJECT_MEMBERS,
--    MILESTONES, ANNOUNCEMENT_READS
-- ============================================================

-- batches
CREATE POLICY batches_select ON batches FOR SELECT
  USING (true);

CREATE POLICY batches_insert ON batches FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY batches_update ON batches FOR UPDATE
  USING (public.is_admin());

CREATE POLICY batches_delete ON batches FOR DELETE
  USING (public.is_admin());

-- groups
CREATE POLICY groups_select ON groups FOR SELECT
  USING (true);

CREATE POLICY groups_insert ON groups FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY groups_update ON groups FOR UPDATE
  USING (public.is_admin());

CREATE POLICY groups_delete ON groups FOR DELETE
  USING (public.is_admin());

-- project_members
CREATE POLICY project_members_select ON project_members FOR SELECT
  USING (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid())
         OR public.is_admin());

CREATE POLICY project_members_insert ON project_members FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY project_members_update ON project_members FOR UPDATE
  USING (public.is_admin());

CREATE POLICY project_members_delete ON project_members FOR DELETE
  USING (public.is_admin());

-- milestones
CREATE POLICY milestones_select ON milestones FOR SELECT
  USING (true);

CREATE POLICY milestones_insert ON milestones FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY milestones_update ON milestones FOR UPDATE
  USING (public.is_admin());

CREATE POLICY milestones_delete ON milestones FOR DELETE
  USING (public.is_admin());

-- announcement_reads
CREATE POLICY announcement_reads_select ON announcement_reads FOR SELECT
  USING (intern_id IN (SELECT id FROM interns WHERE user_id = auth.uid())
         OR public.is_admin());

CREATE POLICY announcement_reads_insert ON announcement_reads FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY announcement_reads_update ON announcement_reads FOR UPDATE
  USING (public.is_admin());

CREATE POLICY announcement_reads_delete ON announcement_reads FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- 6. GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
