import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAIEmbeddings } from 'npm:@langchain/openai'
import { RecursiveCharacterTextSplitter } from 'npm:langchain/text_splitter'
import { PDFLoader } from 'npm:langchain/document_loaders/fs/pdf'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { pdf_id } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: pdfData, error: pdfError } = await supabase.from('pdfs').select('storage_path').eq('id', pdf_id).single()
    if (pdfError) throw pdfError
    
    const { data: fileData, error: downloadError } = await supabase.storage.from('pdfs').download(pdfData.storage_path)
    if (downloadError) throw downloadError

    const loader = new PDFLoader(fileData, { splitPages: false })
    const docs = await loader.load()
    const content = docs.map(doc => doc.pageContent).join('\n\n')

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
    const chunks = await splitter.splitText(content)

    const embeddings = new OpenAIEmbeddings({ openAIApiKey: Deno.env.get('OPENAI_API_KEY') })

    for (const chunk of chunks) {
      const embedding = await embeddings.embedQuery(chunk)
      await supabase.from('documents').insert({ pdf_id, content: chunk, embedding })
    }

    return new Response(JSON.stringify({ message: `Successfully embedded ${chunks.length} chunks.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})