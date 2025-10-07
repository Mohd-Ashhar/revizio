
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const file = req.body
    
    // We need to get the file name from the request headers
    const fileNameHeader = req.headers.get('X-File-Name') || 'untitled.pdf';
    const uniqueFileName = `${Date.now()}-${decodeURIComponent(fileNameHeader)}`
    const filePath = `public/${uniqueFileName}`
    
    if (!file) {
      throw new Error('No file provided in the request body')
    }

    // 1. Upload the file stream to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('pdfs')
      .upload(filePath, file, {
          // The new `upload` method for streams requires content-type
          contentType: req.headers.get('Content-Type') || 'application/pdf',
      })
    // --- END OF FIX ---

    if (uploadError) {
      throw uploadError
    }

    // 2. Save the file metadata to the 'pdfs' database table
    const { data, error: insertError } = await supabaseClient
      .from('pdfs')
      .insert({
        file_name: decodeURIComponent(fileNameHeader), // Use the decoded file name
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