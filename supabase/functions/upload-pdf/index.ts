import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Parse the multipart form data from the request
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      throw new Error('No file provided')
    }

    // Create a unique file name to avoid conflicts
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `public/${fileName}`

    // 1. Upload the file to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('pdfs') // Make sure you have a 'pdfs' bucket in your Storage
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    // 2. Save the file metadata to the 'pdfs' database table
    const { data, error: insertError } = await supabaseClient
      .from('pdfs')
      .insert({
        file_name: file.name,
        storage_path: filePath,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return new Response(JSON.stringify({ pdf: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
