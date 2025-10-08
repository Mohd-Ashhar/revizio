// supabase/functions/generate-quiz/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ChatOpenAI } from 'npm:@langchain/openai'
import { PromptTemplate } from 'npm:@langchain/core/prompts'
import { StringOutputParser } from 'npm:@langchain/core/output_parsers'

import pdf from 'npm:pdf-parse@1.1.1'
import { corsHeaders } from '../_shared/cors.ts'

const PROMPT_TEMPLATE = `
You are an expert at creating educational quizzes for students.
Given the following content from a textbook, generate a quiz with 3 Multiple Choice Questions (MCQs), 1 Short Answer Question (SAQ), and 1 Long Answer Question (LAQ).

The output MUST be a single, valid JSON object. Do not include any text or markdown formatting before or after the JSON.

The JSON object should follow this exact structure:
{{
  "mcqs": [
    {{
      "question": "The question text here.",
       "topic": "A one or two-word topic for this question (e.g., 'Kinematics', 'Newton's Laws').",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The correct option text.",
      "explanation": "A brief explanation of why this is the correct answer."
    }}
  ],
  "saqs": [
    {{
      "question": "The short answer question here.",
       "topic": "A one or two-word topic for this question (e.g., 'Kinematics', 'Newton's Laws').",
      "answer": "A concise, correct answer.",
      "explanation": "A brief explanation of the concept."
    }}
  ],
  "laqs": [
    {{
      "question": "The long answer question here.",
       "topic": "A one or two-word topic for this question (e.g., 'Kinematics', 'Newton's Laws').",
      "answer": "A comprehensive, correct answer.",
      "explanation": "A detailed explanation of the topic."
    }}
  ]
}}

Here is the textbook content:
---
{content}
---
`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pdf_id } = await req.json()
    if (!pdf_id) throw new Error('pdf_id is required')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: pdfData, error: pdfError } = await supabaseClient
      .from('pdfs')
      .select('storage_path')
      .eq('id', pdf_id)
      .single()

    if (pdfError || !pdfData) {
      throw new Error(`Failed to retrieve PDF data: ${pdfError?.message || 'Not found'}`)
    }

    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('pdfs')
      .download(pdfData.storage_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download PDF: ${downloadError?.message || 'No data'}`)
    }

    // --- THIS IS THE FIX ---
    // Convert the downloaded Blob to a Buffer that pdf-parse can read
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const parsedPdf = await pdf(buffer);
    const content = parsedPdf.text;
    // --- END OF FIX ---

    const prompt = PromptTemplate.fromTemplate(PROMPT_TEMPLATE)
    const model = new ChatOpenAI({
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
      modelName: 'gpt-3.5-turbo-1106',
      temperature: 0.1,
    })
    const outputParser = new StringOutputParser()
    const chain = prompt.pipe(model).pipe(outputParser)

    const llmResponse = await chain.invoke({ content: content.substring(0, 16000) })

    const quizContent = JSON.parse(llmResponse)

    const { data: quizData, error: insertError } = await supabaseClient
      .from('quizzes')
      .insert({
        pdf_id: pdf_id,
        quiz_content: quizContent,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return new Response(JSON.stringify({ quiz: quizData }), {
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