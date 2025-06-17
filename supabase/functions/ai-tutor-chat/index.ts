import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string
  conversation_history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  error?: {
    message: string
    type: string
    code: string
  }
}

interface HuggingFaceResponse {
  generated_text: string
}

interface PythonAnywhereAPIResponse {
  AI?: string
  error?: string
  detail?: string
  message?: string
  status?: string
}

async function tryOpenAI(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<string> {
  console.log('=== OPENAI ATTEMPT ===')
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  console.log('OpenAI API Key configured:', !!openaiApiKey)
  
  if (!openaiApiKey) {
    console.log('OpenAI API key not found in environment variables')
    throw new Error('OpenAI API key not configured')
  }

  // Build conversation context
  const messages = [
    {
      role: 'system',
      content: `You are an expert astronomy and space science tutor for the AstroQuiz learning platform. Your role is to:

1. Answer questions about astronomy, space science, planets, stars, galaxies, space missions, and related topics
2. Provide clear, educational explanations appropriate for learners of all levels
3. Encourage curiosity and further learning about space and astronomy
4. Use analogies and examples to make complex concepts understandable
5. Be encouraging and supportive in your responses
6. If asked about non-astronomy topics, gently redirect to space science topics

Keep your responses informative but concise (2-3 paragraphs maximum). Always maintain an encouraging and educational tone.`
    },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    {
      role: 'user',
      content: message
    }
  ]

  console.log('Making request to OpenAI API...')
  console.log('Request payload:', {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 500,
    messages_count: messages.length
  })
  
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    console.log('OpenAI Response Status:', openaiResponse.status)

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error response:', errorText)
      
      let errorDetails = `API returned status ${openaiResponse.status}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error) {
          errorDetails = `${errorJson.error.type}: ${errorJson.error.message}`
        }
      } catch (e) {
        errorDetails = errorText
      }
      
      throw new Error(`OpenAI API error: ${errorDetails}`)
    }

    const openaiData: OpenAIResponse = await openaiResponse.json()
    console.log('OpenAI Response Data:', {
      choices_count: openaiData.choices?.length,
      has_error: !!openaiData.error,
      content_length: openaiData.choices?.[0]?.message?.content?.length
    })
    
    if (openaiData.error) {
      console.error('OpenAI API returned error:', openaiData.error)
      throw new Error(`OpenAI API error: ${openaiData.error.type}: ${openaiData.error.message}`)
    }

    const generatedContent = openaiData.choices[0]?.message?.content
    if (!generatedContent) {
      console.error('No content in OpenAI response')
      throw new Error('No content generated from OpenAI API')
    }

    console.log('OpenAI generated content preview:', generatedContent.substring(0, 200) + '...')
    return generatedContent
  } catch (error) {
    console.error('OpenAI request failed:', error.message)
    throw error
  }
}

async function tryHuggingFace(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<string> {
  console.log('=== HUGGING FACE ATTEMPT ===')
  const hfApiKey = Deno.env.get('HF_API_KEY')
  console.log('Hugging Face API Key configured:', !!hfApiKey)
  
  if (!hfApiKey) {
    console.log('Hugging Face API key not found in environment variables')
    throw new Error('Hugging Face API key not configured')
  }

  // Build context from conversation history
  let contextString = ''
  if (conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6) // Last 6 messages for context
    contextString = recentHistory.map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`).join('\n')
    contextString += '\n\n'
  }

  const hfPrompt = `<s>[INST] You are an expert astronomy and space science tutor. Answer the student's question about astronomy, space science, planets, stars, galaxies, or space missions. Provide a clear, educational explanation that encourages learning.

${contextString}Student: ${message}

Provide a helpful, educational response about astronomy or space science (2-3 paragraphs maximum): [/INST]`

  console.log('Making request to Hugging Face API...')
  console.log('Request payload:', {
    model: 'mistralai/Mistral-7B-Instruct-v0.3',
    max_new_tokens: 400,
    temperature: 0.7,
    prompt_length: hfPrompt.length
  })

  try {
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: hfPrompt,
          parameters: {
            max_new_tokens: 400,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false,
          },
        }),
      }
    )

    console.log('Hugging Face Response Status:', hfResponse.status)

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text()
      console.error('Hugging Face API error response:', errorText)
      throw new Error(`Hugging Face API error: API returned status ${hfResponse.status} - ${errorText}`)
    }

    const hfData: HuggingFaceResponse[] = await hfResponse.json()
    console.log('Hugging Face Response Data:', {
      response_count: hfData.length,
      first_response_length: hfData[0]?.generated_text?.length
    })

    const generatedContent = hfData[0]?.generated_text

    if (!generatedContent) {
      console.error('No content in Hugging Face response')
      throw new Error('No content generated from Hugging Face API')
    }

    console.log('Hugging Face generated content preview:', generatedContent.substring(0, 200) + '...')
    return generatedContent.trim()
  } catch (error) {
    console.error('Hugging Face request failed:', error.message)
    throw error
  }
}

async function tryPythonAnywhere(message: string): Promise<string> {
  console.log('=== PYTHONANYWHERE ATTEMPT ===')
  console.log('Processing message:', message)
  
  // Create an astronomy-focused prompt for PythonAnywhere
  const prompt = `As an astronomy tutor, please answer this question about space science: "${message}". Provide an educational explanation suitable for students learning about astronomy, planets, stars, galaxies, or space missions. Keep the response informative but concise.`
  
  const encodedPrompt = encodeURIComponent(prompt)
  const url = `https://tee1.pythonanywhere.com/chat?prompt=${encodedPrompt}`
  
  console.log('Making request to PythonAnywhere API...')
  console.log('URL length:', url.length)
  console.log('Prompt length:', prompt.length)
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Access-Control-Allow-Origin': 'https://gmhs.edves.net'
      }
    })

    console.log('PythonAnywhere Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PythonAnywhere API error response:', errorText)
      throw new Error(`PythonAnywhere API error: API returned status ${response.status} - ${errorText}`)
    }

    const responseText = await response.text()
    console.log('PythonAnywhere raw response:', responseText)

    let apiResponse: PythonAnywhereAPIResponse
    try {
      apiResponse = JSON.parse(responseText)
      console.log('Parsed API response:', JSON.stringify(apiResponse, null, 2))
    } catch (parseError) {
      console.error('Failed to parse PythonAnywhere response as JSON:', parseError.message)
      throw new Error(`Invalid JSON response from PythonAnywhere API: ${parseError.message}`)
    }
    
    // Check if the response contains error fields
    if (apiResponse.error || apiResponse.detail || apiResponse.message || apiResponse.status) {
      const errorMessage = apiResponse.error || apiResponse.detail || apiResponse.message || `API returned status: ${apiResponse.status}`
      console.error('PythonAnywhere API returned error:', errorMessage)
      throw new Error(`PythonAnywhere API error: ${errorMessage}`)
    }
    
    // Check if the AI field exists and contains the response
    if (!apiResponse.AI || typeof apiResponse.AI !== 'string') {
      console.error('Missing or invalid AI field in response:', apiResponse.AI)
      throw new Error('Invalid response format: missing or invalid AI field')
    }

    const tutorResponse = apiResponse.AI.trim()
    console.log('PythonAnywhere tutor response preview:', tutorResponse.substring(0, 200) + '...')
    
    return tutorResponse
  } catch (error) {
    console.error('PythonAnywhere request failed:', error.message)
    throw error
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== AI TUTOR CHAT FUNCTION START ===')
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)

    // Parse request body
    const requestBody = await req.json()
    console.log('Request body:', requestBody)

    const { message, conversation_history = [] }: ChatRequest = requestBody

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.log('Invalid message validation failed')
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a non-empty string.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Input validated:', { message: message.substring(0, 100) + '...', history_length: conversation_history.length })

    // Get AI provider configuration - default to OpenAI for better reliability
    const aiProvider = Deno.env.get('AI_PROVIDER') || 'openai'
    console.log('AI Provider configured:', aiProvider)
    
    let tutorResponse: string
    let usedProvider: string
    let lastError: string | null = null

    // Try providers in order: configured provider, then fallbacks
    const providers = aiProvider === 'openai' 
      ? ['openai', 'huggingface', 'pythonanywhere']
      : aiProvider === 'huggingface'
      ? ['huggingface', 'openai', 'pythonanywhere']
      : ['pythonanywhere', 'openai', 'huggingface']
    
    console.log('Provider order:', providers)

    for (const provider of providers) {
      try {
        console.log(`\n=== Attempting provider: ${provider.toUpperCase()} ===`)
        
        if (provider === 'openai') {
          tutorResponse = await tryOpenAI(message, conversation_history)
        } else if (provider === 'huggingface') {
          tutorResponse = await tryHuggingFace(message, conversation_history)
        } else if (provider === 'pythonanywhere') {
          tutorResponse = await tryPythonAnywhere(message)
        }
        
        usedProvider = provider
        console.log(`✅ Successfully generated response using ${provider}`)
        break
        
      } catch (error) {
        console.error(`❌ Failed to generate response using ${provider}:`, error.message)
        lastError = error.message
        
        // If this is the last provider to try, throw the error
        if (provider === providers[providers.length - 1]) {
          console.log('All providers exhausted, returning error')
          return new Response(
            JSON.stringify({ 
              error: 'All AI providers failed',
              details: `All providers failed. Last error: ${lastError}`,
              attempted_providers: providers
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        // Continue to next provider
        console.log(`Continuing to next provider...`)
        continue
      }
    }

    console.log('\n=== RESPONSE GENERATED ===')
    console.log('Response length:', tutorResponse!.length)
    console.log('Response preview:', tutorResponse!.substring(0, 200) + '...')

    console.log('✅ Successfully generated tutor response')
    console.log('=== AI TUTOR CHAT FUNCTION COMPLETE ===')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        response: tutorResponse!,
        provider_used: usedProvider!,
        fallback_used: usedProvider !== aiProvider
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== AI TUTOR CHAT FUNCTION ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'Unknown error occurred',
        error_type: error.constructor.name
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})