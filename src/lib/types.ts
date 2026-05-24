export type Role = 'admin' | 'director' | 'intern'

export interface Announcement {
  id: string
  title: string
  type: 'Training' | 'Meeting' | 'Event' | 'Update' | 'Alert'
  audience: 'All' | 'Interns' | 'Admins'
  author: string
  date: string
  content: string
  pinned: boolean
  read: boolean
  readCount: number
  commentCount: number
  scheduledDate?: string
}

export interface InternProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  batch_id: string | null
  group_id: string | null
  group_name?: string
  batch_name?: string
  phone: string | null
  college: string | null
  domain: string | null
  github_url: string | null
  linkedin_url: string | null
  resume_url: string | null
  skills: string[]
  performance_score: number
  join_date: string
  end_date: string | null
  status: 'active' | 'completed' | 'terminated'
  is_active: boolean
}

export interface AttendanceRecord {
  id: string
  intern_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  selfie_url: string | null
  latitude: number | null
  longitude: number | null
  status: 'present' | 'late' | 'absent' | 'half_day' | 'leave'
  is_verified: boolean
  correction_requested: boolean
  correction_reason: string | null
  admin_note: string | null
}

export interface Task {
  id: string
  title: string
  description: string | null
  created_by: string
  assigned_to: string | null
  group_id: string | null
  project_id: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected'
  due_date: string
  submission_url: string | null
  submission_note: string | null
  mentor_feedback: string | null
  submitted_at: string | null
  approved_at: string | null
}

export interface Project {
  id: string
  title: string
  description: string | null
  created_by: string
  batch_id: string | null
  start_date: string | null
  end_date: string | null
  status: 'planning' | 'active' | 'on_hold' | 'completed'
  progress_percent: number
  tech_stack: string[]
  repo_url: string | null
  demo_url: string | null
}

export interface Group {
  id: string
  name: string
  batch_id: string | null
  lead_intern_id: string | null
  description: string | null
  member_count?: number
}

export interface LeaveRequest {
  id: string
  intern_id: string
  leave_type: 'sick' | 'personal' | 'emergency' | 'other'
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_id: string | null
  admin_comment: string | null
  actioned_at: string | null
}

export interface Evaluation {
  id: string
  intern_id: string
  admin_id: string
  period_label: string
  task_score: number
  attendance_score: number
  communication_score: number
  initiative_score: number
  overall_score: number
  comments: string | null
  is_published: boolean
  evaluated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  related_id: string | null
  is_read: boolean
  created_at: string
}
