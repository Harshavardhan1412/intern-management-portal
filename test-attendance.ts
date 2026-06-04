import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qdkhjkliqeckrkuemuyf.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka2hqa2xpcWVja3JrdWVtdXlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTUxODQ5MiwiZXhwIjoyMDk1MDk0NDkyfQ.4riGe6XNAbnoFld9MiA8Jz9hYZQdglX2dnKVFk_i7Eg'

async function test() {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Try to query interns to get an intern_id
  const { data: interns, error: internsError } = await supabaseAdmin.from('interns').select('id').limit(1)
  
  if (internsError) {
    console.error('Error fetching interns:', internsError)
    return
  }

  if (!interns || interns.length === 0) {
    console.log('No interns found')
    return
  }

  const internId = interns[0].id

  // Try to insert attendance
  const { data, error } = await supabaseAdmin.from('attendance').insert({
    intern_id: internId,
    date: '2026-05-26',
    check_in_time: null,
    check_out_time: null,
    status: 'present',
    is_verified: true
  })

  if (error) {
    console.error('Insert error:', error)
  } else {
    console.log('Insert success!', data)
    
    // Cleanup the test record
    await supabaseAdmin.from('attendance').delete().eq('intern_id', internId).eq('date', '2026-05-26')
  }
}

test()
