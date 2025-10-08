import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAIEmbeddings } from 'npm:@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'npm:langchain/text_splitter';
import pdf from 'npm:pdf-parse@1.1.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { pdf_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Fetch the PDF file from storage
    const { data: pdfData, error: pdfError } = await supabase
      .from('pdfs')
      .select('storage_path')
      .eq('id', pdf_id)
      .single();

    if (pdfError) throw pdfError;

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('pdfs')
      .download(pdfData.storage_path);

    if (downloadError) throw downloadError;

    // Parse PDF
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const parsedPdf = await pdf(buffer);
    const content = parsedPdf.text;

    // Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const chunks = await splitter.splitText(content);

    // Generate embeddings and insert for each chunk
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    for (const chunk of chunks) {
  const embedding = await embeddings.embedQuery(chunk);
  await supabase
    .from('documents')
    .insert({ pdf_id, content: chunk, embedding });
}

    // <<<< ONLY return ONCE here, after processing!
    return new Response(
  JSON.stringify({ message: `Successfully embedded ${chunks.length} chunks.` }),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
