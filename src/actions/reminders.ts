'use server'

import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function sendDeadlineReminders() {
  const supabaseAdmin = getAdminClient()
  const logs: string[] = []

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const twoDaysFromNow = new Date(today)
    twoDaysFromNow.setDate(today.getDate() + 2)
    twoDaysFromNow.setHours(23, 59, 59, 999)

    const todayStr = today.toISOString().split('T')[0]
    const limitDateStr = twoDaysFromNow.toISOString().split('T')[0]

    // 1. Process Group Project Deadlines
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('id, name, project_id, deadline_date, projects(title)')
      .gte('deadline_date', todayStr)
      .lte('deadline_date', limitDateStr)

    if (groupsError) throw groupsError

    logs.push(`Found ${groups?.length || 0} groups with deadlines in the next 2 days.`)

    if (groups && groups.length > 0) {
      for (const group of groups) {
        const { data: interns } = await supabaseAdmin
          .from('interns')
          .select('id, user_id, users:user_id(full_name)')
          .eq('group_id', group.id)

        if (interns && interns.length > 0) {
          const projectTitle = (group.projects as any)?.title || 'Assigned Project'
          const deadline = new Date(group.deadline_date)
          const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24))
          
          const notifications = interns.map(intern => ({
            user_id: intern.user_id,
            type: 'announcement', // Display as announcement so it triggers pop-ups and panel listings
            title: `⚠️ Project Deadline Approaching!`,
            body: `Hello ${(intern.users as any)?.full_name || 'Intern'}, the deadline for your group project "${projectTitle}" (${group.name}) is in ${daysLeft} day(s) (on ${group.deadline_date}). Please submit your work on time.`
          }))

          const { error: notifError } = await supabaseAdmin.from('notifications').insert(notifications)
          if (notifError) {
            logs.push(`Error inserting group notifications for group ${group.name}: ${notifError.message}`)
          } else {
            logs.push(`Sent group reminders to ${interns.length} interns in group ${group.name}.`)
          }
        }
      }
    }

    // 2. Process Task Deadlines
    const nowStr = new Date().toISOString()
    const limitDateTimeStr = twoDaysFromNow.toISOString()

    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id, title, due_date, assigned_to, interns(id, user_id, users:user_id(full_name))')
      .neq('status', 'approved')
      .gte('due_date', nowStr)
      .lte('due_date', limitDateTimeStr)

    if (tasksError) throw tasksError

    logs.push(`Found ${tasks?.length || 0} active tasks with deadlines in the next 2 days.`)

    if (tasks && tasks.length > 0) {
      const notifications = []
      for (const task of tasks) {
        const intern = task.interns
        if (intern && (intern as any).user_id) {
          const dueDate = new Date(task.due_date)
          const timeLeftHours = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600))
          const daysLeft = Math.ceil(timeLeftHours / 24)

          notifications.push({
            user_id: (intern as any).user_id,
            type: 'announcement',
            title: `⚠️ Task Deadline Approaching!`,
            body: `Hello ${(intern as any).users?.full_name || 'Intern'}, the deadline for your task "${task.title}" is in ${daysLeft} day(s) / ${timeLeftHours} hour(s) (due ${dueDate.toLocaleString()}). Please complete and submit it.`
          })
        }
      }

      if (notifications.length > 0) {
        const { error: notifError } = await supabaseAdmin.from('notifications').insert(notifications)
        if (notifError) {
          logs.push(`Error inserting task notifications: ${notifError.message}`)
        } else {
          logs.push(`Sent task reminders for ${notifications.length} tasks.`)
        }
      }
    }

    return { success: true, logs }
  } catch (err: any) {
    console.error('Error sending deadline reminders:', err)
    return { success: false, error: err.message, logs }
  }
}
