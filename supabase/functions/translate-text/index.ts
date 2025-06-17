import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TranslateRequest {
  text: string
  targetLang: string
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

// Language mappings for better translation context
const languageNames: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi'
}

async function tryOpenAI(text: string, targetLang: string): Promise<string> {
  console.log('=== OPENAI TRANSLATION ATTEMPT ===')
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  console.log('OpenAI API Key configured:', !!openaiApiKey)
  
  if (!openaiApiKey) {
    console.log('OpenAI API key not found in environment variables')
    throw new Error('OpenAI API key not configured')
  }

  const targetLanguage = languageNames[targetLang] || targetLang
  const prompt = `Translate the following text to ${targetLanguage}. Maintain the meaning and context, especially for scientific and astronomical terms. Only return the translated text, nothing else.

Text to translate: "${text}"`

  console.log('Making request to OpenAI API...')
  console.log('Request payload:', {
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    max_tokens: 500,
    target_language: targetLanguage
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
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in scientific and educational content. Translate accurately while preserving technical terminology.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
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

    const translatedText = openaiData.choices[0]?.message?.content
    if (!translatedText) {
      console.error('No content in OpenAI response')
      throw new Error('No translation generated from OpenAI API')
    }

    console.log('OpenAI translation preview:', translatedText.substring(0, 100) + '...')
    return translatedText.trim()
  } catch (error) {
    console.error('OpenAI request failed:', error.message)
    throw error
  }
}

async function tryHuggingFace(text: string, targetLang: string): Promise<string> {
  console.log('=== HUGGING FACE TRANSLATION ATTEMPT ===')
  const hfApiKey = Deno.env.get('HF_API_KEY')
  console.log('Hugging Face API Key configured:', !!hfApiKey)
  
  if (!hfApiKey) {
    console.log('Hugging Face API key not found in environment variables')
    throw new Error('Hugging Face API key not configured')
  }

  const targetLanguage = languageNames[targetLang] || targetLang
  const hfPrompt = `<s>[INST] Translate the following text to ${targetLanguage}. Maintain accuracy and preserve scientific terminology. Only return the translated text.

Text: "${text}" [/INST]`

  console.log('Making request to Hugging Face API...')
  console.log('Request payload:', {
    model: 'mistralai/Mistral-7B-Instruct-v0.3',
    max_new_tokens: 300,
    temperature: 0.3,
    target_language: targetLanguage
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
            max_new_tokens: 300,
            temperature: 0.3,
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

    const translatedText = hfData[0]?.generated_text

    if (!translatedText) {
      console.error('No content in Hugging Face response')
      throw new Error('No translation generated from Hugging Face API')
    }

    console.log('Hugging Face translation preview:', translatedText.substring(0, 100) + '...')
    return translatedText.trim()
  } catch (error) {
    console.error('Hugging Face request failed:', error.message)
    throw error
  }
}

async function tryPythonAnywhere(text: string, targetLang: string): Promise<string> {
  console.log('=== PYTHONANYWHERE TRANSLATION ATTEMPT ===')
  console.log('Translating text to:', targetLang)
  
  const targetLanguage = languageNames[targetLang] || targetLang
  const prompt = `Translate this text to ${targetLanguage}: "${text}". Return only the translated text, maintaining scientific accuracy.`
  
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
    
    // Check if the AI field exists and contains the translation
    if (!apiResponse.AI || typeof apiResponse.AI !== 'string') {
      console.error('Missing or invalid AI field in response:', apiResponse.AI)
      throw new Error('Invalid response format: missing or invalid AI field')
    }

    const translatedText = apiResponse.AI.trim()
    console.log('PythonAnywhere translation preview:', translatedText.substring(0, 100) + '...')
    
    return translatedText
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
    console.log('=== TRANSLATE TEXT FUNCTION START ===')
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)

    // Parse request body
    const requestBody = await req.json()
    console.log('Request body:', requestBody)

    const { text, targetLang }: TranslateRequest = requestBody

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.log('Invalid text validation failed')
      return new Response(
        JSON.stringify({ error: 'Text is required and must be a non-empty string.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!targetLang || typeof targetLang !== 'string' || targetLang.trim().length === 0) {
      console.log('Invalid target language validation failed')
      return new Response(
        JSON.stringify({ error: 'Target language is required and must be a non-empty string.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If target language is English, return original text
    if (targetLang.toLowerCase() === 'en' || targetLang.toLowerCase() === 'english') {
      console.log('Target language is English, returning original text')
      return new Response(
        JSON.stringify({ 
          success: true, 
          translatedText: text,
          provider_used: 'none',
          fallback_used: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Input validated:', { text: text.substring(0, 50) + '...', targetLang })

    // Get AI provider configuration - default to OpenAI for better reliability
    const aiProvider = Deno.env.get('AI_PROVIDER') || 'openai'
    console.log('AI Provider configured:', aiProvider)
    
    let translatedText: string
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
          translatedText = await tryOpenAI(text, targetLang)
        } else if (provider === 'huggingface') {
          translatedText = await tryHuggingFace(text, targetLang)
        } else if (provider === 'pythonanywhere') {
          translatedText = await tryPythonAnywhere(text, targetLang)
        }
        
        usedProvider = provider
        console.log(`✅ Successfully translated text using ${provider}`)
        break
        
      } catch (error) {
        console.error(`❌ Failed to translate using ${provider}:`, error.message)
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

    console.log('\n=== TRANSLATION COMPLETED ===')
    console.log('Translation length:', translatedText!.length)
    console.log('Translation preview:', translatedText!.substring(0, 100) + '...')

    console.log('✅ Successfully translated text')
    console.log('=== TRANSLATE TEXT FUNCTION COMPLETE ===')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        translatedText: translatedText!,
        provider_used: usedProvider!,
        fallback_used: usedProvider !== aiProvider
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== TRANSLATE TEXT FUNCTION ERROR ===')
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