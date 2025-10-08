import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAIEmbeddings } from 'npm:@langchain/openai'
import pdf from 'npm:pdf-parse@1.1.1'
import { corsHeaders } from '../_shared/cors.ts'

// A simple, dependency-free text splitter
function splitTextIntoChunks(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = i + chunkSize;
    const chunk = text.slice(i, end);
    chunks.push(chunk);
    i += chunkSize - chunkOverlap;
  }
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { pdf_id } = await req.json()
    if (!pdf_id) throw new Error('Missing pdf_id in request body')

    // IMPORTANT: Use the Service Role Key to bypass RLS for admin tasks.
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Fetch PDF info and download the file
    const { data: pdfData, error: pdfError } = await supabaseAdmin.from('pdfs').select('storage_path').eq('id', pdf_id).single()
    if (pdfError) throw pdfError
    
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage.from('pdfs').download(pdfData.storage_path)
    if (downloadError) throw downloadError

    // 2. Parse PDF content
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const parsedPdf = await pdf(buffer);
    const content = parsedPdf.text;

    // 3. Split text using our simple function
    const chunks = splitTextIntoChunks(content, 500, 50);

    // 4. Generate embeddings
    const embeddings = new OpenAIEmbeddings({ openAIApiKey: Deno.env.get('OPENAI_API_KEY') })
    const embeddingData = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await embeddings.embedQuery(chunk)
        return { pdf_id, content: chunk, embedding }
      })
    )

    // 5. Delete old embeddings for this PDF to avoid duplicates
    await supabaseAdmin.from('documents').delete().eq('pdf_id', pdf_id);

    // 6. Insert new embeddings
    const { error: insertError } = await supabaseAdmin.from('documents').insert(embeddingData)
    if (insertError) throw insertError

    return new Response(JSON.stringify({ message: `Successfully embedded ${chunks.length} chunks.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})