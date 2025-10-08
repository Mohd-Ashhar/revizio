import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAIEmbeddings, ChatOpenAI } from 'npm:@langchain/openai'
import { PromptTemplate } from 'npm:@langchain/core/prompts'
import { StringOutputParser } from 'npm:@langchain/core/output_parsers'
import { corsHeaders } from '../_shared/cors.ts'

const PROMPT_TEMPLATE = `
You are a helpful study assistant. Based on the following context from a textbook, answer the user's question.
Your answer MUST be grounded in the provided context.
Cite your answer by quoting a relevant 2-3 line snippet from the source context. Format the citation like this: "According to the text: '[snippet]'".

Context:
---
{context}
---

Question:
{question}
`
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { query, pdf_id } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const embeddings = new OpenAIEmbeddings({ openAIApiKey: Deno.env.get('OPENAI_API_KEY') })

    const queryEmbedding = await embeddings.embedQuery(query)
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5,
    })
    if (error) throw error

    const context = documents.map((doc: any) => doc.content).join('\n\n')

    const prompt = PromptTemplate.fromTemplate(PROMPT_TEMPLATE)
    const model = new ChatOpenAI({ openAIApiKey: Deno.env.get('OPENAI_API_KEY'), modelName: 'gpt-3.5-turbo' })
    const chain = prompt.pipe(model).pipe(new StringOutputParser())
    const answer = await chain.invoke({ context, question: query })

    return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})