import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function test() {
  const { data, error } = await supabase
    .from('ceac_scheduled_notifications')
    .select('reminder_id, fire_at, status')
    .eq('journey_id', '78742fb7-6c33-4e6e-8343-fb2c1c102ecd')
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Scheduled Notifications:', data)
  }
}

test()
