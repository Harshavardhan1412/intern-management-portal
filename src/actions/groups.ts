'use server'

import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function saveGroupAction(
  adminUserId: string,
  groupId: string | null,
  payload: { name: string; description: string; project_id: string | null; deadline_date: string | null },
  memberInternIds: string[]
) {
  const supabaseAdmin = getAdminClient()

  try {
    let currentGroupId = groupId
    let oldMembers: any[] = []
    let oldProject: any = null
    let projectTitle = 'a project'

    // Fetch project title if a project is selected
    if (payload.project_id) {
      const { data: proj } = await supabaseAdmin.from('projects').select('title').eq('id', payload.project_id).single()
      if (proj) projectTitle = proj.title
    }

    if (currentGroupId) {
      // Get existing group and members
      const { data: group } = await supabaseAdmin.from('groups').select('*').eq('id', currentGroupId).single()
      if (group) oldProject = group.project_id
      const { data: members } = await supabaseAdmin.from('interns').select('id, user_id').eq('group_id', currentGroupId)
      if (members) oldMembers = members

      // Update group
      const { error: updateError } = await supabaseAdmin.from('groups').update({
        name: payload.name,
        description: payload.description,
        project_id: payload.project_id || null,
        deadline_date: payload.deadline_date || null
      }).eq('id', currentGroupId)

      if (updateError) throw updateError

      // Unassign old members that are not in the new list
      const removedIds = oldMembers.filter(m => !memberInternIds.includes(m.id)).map(m => m.id)
      if (removedIds.length > 0) {
        await supabaseAdmin.from('interns').update({ group_id: null }).in('id', removedIds)
      }
    } else {
      // Insert new group
      const { data: newGroup, error: insertError } = await supabaseAdmin.from('groups').insert({
        name: payload.name,
        description: payload.description,
        project_id: payload.project_id || null,
        deadline_date: payload.deadline_date || null
      }).select('id').single()

      if (insertError || !newGroup) throw insertError || new Error('Group not created')
      currentGroupId = newGroup.id
    }

    // Assign new members
    if (memberInternIds.length > 0) {
      await supabaseAdmin.from('interns').update({ group_id: currentGroupId }).in('id', memberInternIds)
    }

    // Send notifications
    // 1. To completely new members: "You have been assigned to [Group Name] working on [Project]"
    const newInternIds = memberInternIds.filter(id => !oldMembers.some(m => m.id === id))
    if (newInternIds.length > 0) {
      const { data: newInternsData } = await supabaseAdmin.from('interns').select('user_id').in('id', newInternIds)
      if (newInternsData) {
        const notifications = newInternsData.map(intern => ({
          user_id: intern.user_id,
          type: 'group_assignment',
          title: `Assigned to Group: ${payload.name}`,
          body: `You have been assigned to group ${payload.name}. ${payload.project_id ? `Your project is ${projectTitle}.` : ''} ${payload.deadline_date ? `Deadline: ${payload.deadline_date}` : ''}`
        }))
        await supabaseAdmin.from('notifications').insert(notifications)
      }
    }

    // 2. To existing members: if project or deadline changed
    const retainedInternIds = memberInternIds.filter(id => oldMembers.some(m => m.id === id))
    if (retainedInternIds.length > 0 && currentGroupId && oldProject !== payload.project_id) {
       const { data: retainedInternsData } = await supabaseAdmin.from('interns').select('user_id').in('id', retainedInternIds)
       if (retainedInternsData) {
         const notifications = retainedInternsData.map(intern => ({
           user_id: intern.user_id,
           type: 'group_update',
           title: `Group Update: ${payload.name}`,
           body: `Your group has been assigned a new project: ${projectTitle}. ${payload.deadline_date ? `Deadline: ${payload.deadline_date}` : ''}`
         }))
         await supabaseAdmin.from('notifications').insert(notifications)
       }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function broadcastGroupNotification(groupId: string, title: string, body: string) {
  const supabaseAdmin = getAdminClient()
  try {
    const { data: members } = await supabaseAdmin.from('interns').select('user_id').eq('group_id', groupId)
    if (members && members.length > 0) {
      const notifications = members.map(m => ({
        user_id: m.user_id,
        type: 'announcement',
        title,
        body
      }))
      await supabaseAdmin.from('notifications').insert(notifications)
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getInternPortalData(userId: string) {
  const supabaseAdmin = getAdminClient()
  
  // Get intern
  const { data: intern } = await supabaseAdmin.from('interns').select('id, group_id').eq('user_id', userId).single()
  if (!intern) return { group: null, members: [], projects: [] }

  let group = null
  let members: any[] = []
  let projects: any[] = []

  // Get group and members
  if (intern.group_id) {
    const { data: g } = await supabaseAdmin.from('groups').select('*, projects(title)').eq('id', intern.group_id).single()
    if (g) group = g
    
    const { data: m } = await supabaseAdmin.from('interns').select('id, users(full_name, email)').eq('group_id', intern.group_id)
    if (m) members = m
  }

  // Get projects
  const projectIds = new Set<string>()
  const { data: memberships } = await supabaseAdmin.from('project_members').select('project_id').eq('intern_id', intern.id)
  if (memberships) memberships.forEach(m => projectIds.add(m.project_id))
  if (group && group.project_id) projectIds.add(group.project_id)

  if (projectIds.size > 0) {
    const { data: p } = await supabaseAdmin.from('projects').select('*').in('id', Array.from(projectIds))
    if (p) projects = p
  }

  return { group, members, projects }
}
