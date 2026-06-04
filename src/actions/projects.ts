'use server'

import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function getProjectMembers(projectId: string) {
  const supabaseAdmin = getAdminClient()
  try {
    // 1. Fetch direct members
    const { data: directData, error: directError } = await supabaseAdmin
      .from('project_members')
      .select('intern_id, interns(id, users:user_id(full_name, email))')
      .eq('project_id', projectId)

    if (directError) throw directError

    const directMembersMap = new Map<string, any>()
    
    ;(directData ?? []).forEach((m: any) => {
      const intern = m.interns
      const userObj = intern?.users
      if (intern?.id) {
        directMembersMap.set(intern.id, {
          id: intern.id,
          full_name: userObj?.full_name ?? 'Unnamed',
          email: userObj?.email ?? '',
          source: 'Direct'
        })
      }
    })

    // 2. Fetch groups for this project
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('project_id', projectId)

    if (groupsError) throw groupsError

    const groupMembersMap = new Map<string, any>()

    if (groups && groups.length > 0) {
      const groupIds = groups.map(g => g.id)
      const groupNamesMap = new Map(groups.map(g => [g.id, g.name]))

      const { data: groupInternsData, error: groupInternsError } = await supabaseAdmin
        .from('interns')
        .select('id, group_id, users:user_id(full_name, email)')
        .in('group_id', groupIds)

      if (groupInternsError) throw groupInternsError

      ;(groupInternsData ?? []).forEach((i: any) => {
        const userObj = i.users
        const groupName = groupNamesMap.get(i.group_id) || 'Unknown Group'
        if (i.id) {
          groupMembersMap.set(i.id, {
            id: i.id,
            full_name: userObj?.full_name ?? 'Unnamed',
            email: userObj?.email ?? '',
            source: `Group: ${groupName}`
          })
        }
      })
    }

    // 3. Combine both maps. If an intern is in both, combine their sources.
    const allMembersMap = new Map<string, any>()
    
    // Add all group members first
    groupMembersMap.forEach((m, id) => {
      allMembersMap.set(id, m)
    })

    // Add direct members or append source if already added
    directMembersMap.forEach((m, id) => {
      if (allMembersMap.has(id)) {
        const existing = allMembersMap.get(id)
        allMembersMap.set(id, {
          ...existing,
          source: `Direct & ${existing.source}`
        })
      } else {
        allMembersMap.set(id, m)
      }
    })

    return Array.from(allMembersMap.values())
  } catch (err: any) {
    console.error('Error fetching project members:', err)
    return []
  }
}

export async function addProjectMember(projectId: string, internId: string) {
  const supabase = getAdminClient()
  try {
    const { error } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, intern_id: internId, role: 'member' })
    
    if (error) throw error

    // Send assignment notification
    const { data: intern } = await supabase
      .from('interns')
      .select('user_id')
      .eq('id', internId)
      .single()

    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single()

    if (intern?.user_id && project?.title) {
      await supabase.from('notifications').insert({
        user_id: intern.user_id,
        type: 'project_assignment',
        title: `Assigned to Project: ${project.title}`,
        body: `You have been directly assigned to the project "${project.title}".`
      })
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function removeProjectMember(projectId: string, internId: string) {
  const supabase = getAdminClient()
  try {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('intern_id', internId)
    
    if (error) throw error
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getAvailableInternsForProject(projectId: string) {
  const supabase = getAdminClient()
  try {
    // Get current direct members
    const { data: members } = await supabase
      .from('project_members')
      .select('intern_id')
      .eq('project_id', projectId)
    
    const memberIds = (members ?? []).map(m => m.intern_id)

    // Get groups for this project
    const { data: groups } = await supabase
      .from('groups')
      .select('id')
      .eq('project_id', projectId)
    
    let groupMemberIds: string[] = []
    if (groups && groups.length > 0) {
      const { data: groupInterns } = await supabase
        .from('interns')
        .select('id')
        .in('group_id', groups.map(g => g.id))
      groupMemberIds = (groupInterns ?? []).map(i => i.id)
    }

    const allAssignedIds = Array.from(new Set([...memberIds, ...groupMemberIds]))

    // Fetch all active interns
    const { data: interns, error } = await supabase
      .from('interns')
      .select('id, users:user_id(full_name, email)')
      .eq('status', 'active')

    if (error) throw error

    return (interns ?? [])
      .filter(i => !allAssignedIds.includes(i.id))
      .map((i: any) => ({
        id: i.id,
        full_name: i.users?.full_name ?? 'Unnamed',
        email: i.users?.email ?? '',
      }))
  } catch (err: any) {
    console.error('Error fetching available interns:', err)
    return []
  }
}
