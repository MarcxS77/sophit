const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', url)
console.log('KEY length:', key?.length)
console.log('KEY start:', key?.substring(0, 30))

const supabase = createClient(url, key)

async function main() {
  // Criar usuário admin
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@vitalsync.com',
    password: 'Admin123',
    options: { data: { full_name: 'Admin VitalSync' } }
  })
  
  console.log('ERRO:', JSON.stringify(error))
  console.log('USER ID:', data.user?.id)
  console.log('USER EMAIL:', data.user?.email)
}

main()
