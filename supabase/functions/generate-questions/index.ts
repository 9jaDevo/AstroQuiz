import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateQuestionsRequest {
  topic: string
  count: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

interface GeneratedQuestion {
  question_text: string
  options: string[]
  correct_answer: number
  explanation?: string
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

interface PythonAnywhereResponse {
  Question: string
  Options: {
    Option1: string
    Option2: string
    Option3: string
    Option4: string
    Option5?: string
  }
  CorrectOption: string
}

interface PythonAnywhereErrorResponse {
  error?: string
  detail?: string
  message?: string
  status?: string
}

interface PythonAnywhereAPIResponse {
  AI?: string
  links?: any[]
  error?: string
  detail?: string
  message?: string
  status?: string
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

async function tryOpenAI(topic: string, count: number, difficulty: string): Promise<string> {
  console.log('=== OPENAI ATTEMPT ===')
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  console.log('OpenAI API Key configured:', !!openaiApiKey)
  
  if (!openaiApiKey) {
    console.log('OpenAI API key not found in environment variables')
    throw new Error('OpenAI API key not configured')
  }

  const openaiPrompt = `Generate ${count} multiple-choice quiz questions about "${topic}" with ${difficulty} difficulty level.

Requirements:
- Each question should have exactly 4 answer options
- Only one option should be correct
- Questions should be educational and factually accurate
- Avoid overly obscure or trick questions
- Make questions appropriate for ${difficulty} difficulty level
- Include a brief explanation for the correct answer

Return the response as a JSON array with this exact structure:
[
  {
    "question_text": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this answer is correct"
  }
]

The correct_answer should be the index (0-3) of the correct option in the options array.`

  console.log('Making request to OpenAI API...')
  console.log('Request payload:', {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 2000,
    messages_count: 2
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
            content: 'You are an expert quiz question generator. Always respond with valid JSON only, no additional text or formatting.'
          },
          {
            role: 'user',
            content: openaiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    console.log('OpenAI Response Status:', openaiResponse.status)
    console.log('OpenAI Response Headers:', Object.fromEntries(openaiResponse.headers.entries()))

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error response:', errorText)
      
      let errorDetails = `API returned status ${openaiResponse.status}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error) {
          errorDetails = `${errorJson.error.type}: ${errorJson.error.message}`
          console.log('Parsed OpenAI error:', errorJson.error)
        }
      } catch (e) {
        console.log('Could not parse OpenAI error as JSON')
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

async function tryHuggingFace(topic: string, count: number, difficulty: string): Promise<string> {
  console.log('=== HUGGING FACE ATTEMPT ===')
  const hfApiKey = Deno.env.get('HF_API_KEY')
  console.log('Hugging Face API Key configured:', !!hfApiKey)
  
  if (!hfApiKey) {
    console.log('Hugging Face API key not found in environment variables')
    throw new Error('Hugging Face API key not configured')
  }

  const hfPrompt = `<s>[INST] Generate ${count} multiple-choice quiz questions about "${topic}" with ${difficulty} difficulty level.

Requirements:
- Each question should have exactly 4 answer options
- Only one option should be correct
- Questions should be educational and factually accurate
- Avoid overly obscure or trick questions
- Make questions appropriate for ${difficulty} difficulty level

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question_text": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0
  }
]

The correct_answer should be the index (0-3) of the correct option in the options array. [/INST]`

  console.log('Making request to Hugging Face API...')
  console.log('Request payload:', {
    model: 'mistralai/Mistral-7B-Instruct-v0.3',
    max_new_tokens: 2000,
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
            max_new_tokens: 2000,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false,
          },
        }),
      }
    )

    console.log('Hugging Face Response Status:', hfResponse.status)
    console.log('Hugging Face Response Headers:', Object.fromEntries(hfResponse.headers.entries()))

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

    // Clean up the response - extract JSON from the generated text
    const jsonMatch = generatedContent.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      console.log('Found JSON match in Hugging Face response')
      return jsonMatch[0]
    }

    console.log('No JSON array found in Hugging Face response, returning raw content')
    return generatedContent
  } catch (error) {
    console.error('Hugging Face request failed:', error.message)
    throw error
  }
}

async function tryPythonAnywhere(topic: string, count: number, difficulty: string): Promise<string> {
  console.log('=== PYTHONANYWHERE ATTEMPT ===')
  console.log('Generating', count, 'questions about', topic, 'with', difficulty, 'difficulty')
  
  const questions: GeneratedQuestion[] = []
  
  // Generate questions one by one since the API seems to handle single questions
  for (let i = 0; i < count; i++) {
    console.log(`--- Generating question ${i + 1}/${count} ---`)
    
    // Use the exact format specified by the user
    const prompt = `In 600 letters or less, generate 1 new k-12 exam question on the topic: ${topic} in Subject: GENERAL KNOWLEDGE that spans the four levels of Depth of Knowledge (Recall and Reproduction, Skills and Concepts, Strategic Thinking, and Extended Thinking). Ensure the question is suitable for ${difficulty} level increase in complexity. Respond in json format:{"Question": "What is the capital of France?","Options": {"Option1": "London","Option2": "Berlin","Option3": "Paris","Option4": "Rome","Option5": "Madrid"},"CorrectOption": "Option3"}`
    
    const encodedPrompt = encodeURIComponent(prompt)
    const url = `https://tee1.pythonanywhere.com/chat?prompt=${encodedPrompt}`
    
    console.log('Making request to PythonAnywhere API...')
    console.log('URL length:', url.length)
    console.log('Prompt length:', prompt.length)
    
    try {
      // Use GET method as specified and correct headers
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Access-Control-Allow-Origin': 'https://gmhs.edves.net'
        }
      })

      console.log('PythonAnywhere Response Status:', response.status)
      console.log('PythonAnywhere Response Headers:', Object.fromEntries(response.headers.entries()))

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
        console.log('=== PYTHONANYWHERE API RESPONSE ANALYSIS ===')
        console.log('Full parsed API response:', JSON.stringify(apiResponse, null, 2))
        console.log('Response type:', typeof apiResponse)
        console.log('Response keys:', Object.keys(apiResponse))
        console.log('AI field exists:', 'AI' in apiResponse)
        console.log('AI field type:', typeof apiResponse.AI)
        console.log('AI field value preview:', apiResponse.AI?.substring(0, 100) + '...')
        console.log('=== END API RESPONSE ANALYSIS ===')
      } catch (parseError) {
        console.error('Failed to parse PythonAnywhere response as JSON:', parseError.message)
        console.error('Raw response was:', responseText)
        throw new Error(`Invalid JSON response from PythonAnywhere API: ${parseError.message}`)
      }
      
      // Check if the response contains error fields
      if (apiResponse.error || apiResponse.detail || apiResponse.message || apiResponse.status) {
        const errorMessage = apiResponse.error || apiResponse.detail || apiResponse.message || `API returned status: ${apiResponse.status}`
        console.error('PythonAnywhere API returned error:', errorMessage)
        throw new Error(`PythonAnywhere API error: ${errorMessage}`)
      }
      
      // Check if the AI field exists and contains the question data
      if (!apiResponse.AI || typeof apiResponse.AI !== 'string') {
        console.error('Missing or invalid AI field in response:', apiResponse.AI)
        console.error('Full API response:', apiResponse)
        throw new Error('Invalid response format: missing or invalid AI field')
      }

      // Parse the nested JSON from the AI field
      let questionData: PythonAnywhereResponse
      try {
        console.log('Parsing AI field as JSON...')
        console.log('AI field content:', apiResponse.AI)
        questionData = JSON.parse(apiResponse.AI)
        console.log('=== PARSED QUESTION DATA ANALYSIS ===')
        console.log('Parsed question data:', JSON.stringify(questionData, null, 2))
        console.log('Question field exists:', 'Question' in questionData)
        console.log('Question field type:', typeof questionData.Question)
        console.log('Question field value:', questionData.Question)
        console.log('Options field exists:', 'Options' in questionData)
        console.log('Options field type:', typeof questionData.Options)
        console.log('Options field value:', questionData.Options)
        console.log('CorrectOption field exists:', 'CorrectOption' in questionData)
        console.log('CorrectOption field type:', typeof questionData.CorrectOption)
        console.log('CorrectOption field value:', questionData.CorrectOption)
        console.log('=== END QUESTION DATA ANALYSIS ===')
      } catch (parseError) {
        console.error('Failed to parse AI field as JSON:', parseError.message)
        console.error('AI field content was:', apiResponse.AI)
        throw new Error(`Invalid JSON in AI field: ${parseError.message}`)
      }
      
      // Validate the question data structure
      if (!questionData.Question || typeof questionData.Question !== 'string') {
        console.error('Missing or invalid Question field:', questionData.Question)
        console.error('Full question data:', questionData)
        throw new Error('Invalid response format: missing or invalid Question field')
      }

      if (!questionData.Options || typeof questionData.Options !== 'object') {
        console.error('Missing or invalid Options field:', questionData.Options)
        console.error('Full question data:', questionData)
        throw new Error('Invalid response format: missing or invalid Options field')
      }

      if (!questionData.CorrectOption || typeof questionData.CorrectOption !== 'string') {
        console.error('Missing or invalid CorrectOption field:', questionData.CorrectOption)
        console.error('Full question data:', questionData)
        throw new Error('Invalid response format: missing or invalid CorrectOption field')
      }

      // Extract options more robustly
      const optionKeys = ['Option1', 'Option2', 'Option3', 'Option4', 'Option5']
      const extractedOptions: string[] = []
      
      for (const key of optionKeys) {
        if (questionData.Options[key] && typeof questionData.Options[key] === 'string' && questionData.Options[key].trim()) {
          extractedOptions.push(questionData.Options[key].trim())
        }
      }

      console.log('Extracted options:', extractedOptions)

      if (extractedOptions.length < 2) {
        console.error('Not enough valid options found:', extractedOptions)
        throw new Error(`Invalid response format: only ${extractedOptions.length} valid options found, need at least 2`)
      }

      // Find the correct answer index
      const correctOptionKey = questionData.CorrectOption
      const correctOptionNumber = parseInt(correctOptionKey.replace('Option', ''))
      
      console.log('Correct option key:', correctOptionKey, 'Number:', correctOptionNumber)

      if (isNaN(correctOptionNumber) || correctOptionNumber < 1 || correctOptionNumber > extractedOptions.length) {
        console.error('Invalid correct option number:', correctOptionNumber, 'Available options:', extractedOptions.length)
        throw new Error(`Invalid correct option: ${correctOptionKey} (parsed as ${correctOptionNumber})`)
      }

      const correctAnswerIndex = correctOptionNumber - 1
      const correctAnswerText = extractedOptions[correctAnswerIndex]
      
      console.log('Correct answer index:', correctAnswerIndex, 'Text:', correctAnswerText)

      // Ensure we have exactly 4 options
      let finalOptions = [...extractedOptions]
      
      // If we have more than 4 options, keep the first 4 but ensure the correct answer is included
      if (finalOptions.length > 4) {
        if (correctAnswerIndex >= 4) {
          // Replace the 4th option with the correct answer
          finalOptions[3] = correctAnswerText
          finalOptions = finalOptions.slice(0, 4)
        } else {
          finalOptions = finalOptions.slice(0, 4)
        }
      }
      
      // If we have fewer than 4 options, pad with generic options
      while (finalOptions.length < 4) {
        finalOptions.push(`Option ${finalOptions.length + 1}`)
      }

      // Remove duplicates while preserving the correct answer
      const uniqueOptions: string[] = []
      const correctAnswer = finalOptions[Math.min(correctAnswerIndex, 3)]
      
      for (const option of finalOptions) {
        if (!uniqueOptions.includes(option)) {
          uniqueOptions.push(option)
        }
      }
      
      // If we lost options due to deduplication, add generic ones
      while (uniqueOptions.length < 4) {
        let genericOption = `Alternative ${uniqueOptions.length}`
        let counter = 1
        while (uniqueOptions.includes(genericOption)) {
          genericOption = `Alternative ${uniqueOptions.length}_${counter}`
          counter++
        }
        uniqueOptions.push(genericOption)
      }

      finalOptions = uniqueOptions.slice(0, 4)

      // Shuffle the options to randomize their order
      const optionsWithIndex = finalOptions.map((option, index) => ({ option, originalIndex: index }))
      const correctOriginalIndex = finalOptions.indexOf(correctAnswer)
      
      console.log('Before shuffle - Correct answer:', correctAnswer, 'at index:', correctOriginalIndex)
      
      const shuffledOptionsWithIndex = shuffleArray(optionsWithIndex)
      const shuffledOptions = shuffledOptionsWithIndex.map(item => item.option)
      const newCorrectIndex = shuffledOptions.indexOf(correctAnswer)
      
      console.log('After shuffle - Options:', shuffledOptions, 'Correct answer at index:', newCorrectIndex)

      if (newCorrectIndex === -1) {
        console.error('Correct answer lost during shuffle!')
        throw new Error('Internal error: correct answer lost during option shuffling')
      }

      const question: GeneratedQuestion = {
        question_text: questionData.Question.trim(),
        options: shuffledOptions,
        correct_answer: newCorrectIndex
      }

      console.log('Final question object:', question)
      questions.push(question)
      
    } catch (error) {
      console.error(`Failed to generate question ${i + 1}:`, error.message)
      throw error
    }
  }

  console.log('Successfully generated all questions via PythonAnywhere')
  return JSON.stringify(questions)
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== EDGE FUNCTION START ===')
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Supabase client initialized')

    // Parse request body
    const requestBody = await req.json()
    console.log('Request body:', requestBody)

    const { topic, count, difficulty = 'medium' }: GenerateQuestionsRequest = requestBody

    // Validate input
    if (!topic || !count || count < 1 || count > 20) {
      console.log('Invalid input validation failed')
      return new Response(
        JSON.stringify({ error: 'Invalid input. Topic is required and count must be between 1 and 20.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Input validated:', { topic, count, difficulty })

    // Get AI provider configuration - default to OpenAI for better reliability
    const aiProvider = Deno.env.get('AI_PROVIDER') || 'openai'
    console.log('AI Provider configured:', aiProvider)
    
    let generatedContent: string
    let usedProvider: string
    let lastError: string | null = null

    // Try providers in order: configured provider, then fallbacks including PythonAnywhere
    const allProviders = ['openai', 'huggingface', 'pythonanywhere']
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
          generatedContent = await tryOpenAI(topic, count, difficulty)
        } else if (provider === 'huggingface') {
          generatedContent = await tryHuggingFace(topic, count, difficulty)
        } else if (provider === 'pythonanywhere') {
          generatedContent = await tryPythonAnywhere(topic, count, difficulty)
        }
        
        usedProvider = provider
        console.log(`✅ Successfully generated content using ${provider}`)
        break
        
      } catch (error) {
        console.error(`❌ Failed to generate questions using ${provider}:`, error.message)
        lastError = error.message
        
        // If this is the last provider to try, throw the error
        if (provider === providers[providers.length - 1]) {
          console.log('All providers exhausted, returning error')
          return new Response(
            JSON.stringify({ 
              error: 'All AI providers failed',
              details: `All providers failed. Last error: ${lastError}`,
              attempted_providers: providers,
              provider_errors: {
                [provider]: error.message
              }
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

    console.log('\n=== PARSING GENERATED CONTENT ===')
    console.log('Content length:', generatedContent!.length)
    console.log('Content preview:', generatedContent!.substring(0, 300) + '...')

    // Parse the generated questions
    let generatedQuestions: GeneratedQuestion[]
    try {
      const cleanContent = generatedContent!.trim()
      console.log('Attempting to parse as JSON...')
      generatedQuestions = JSON.parse(cleanContent)
      console.log('Successfully parsed JSON, question count:', generatedQuestions.length)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError.message)
      console.error('Raw content (first 1000 chars):', generatedContent!.substring(0, 1000))
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from AI service',
          details: 'Could not parse AI response as valid JSON',
          parse_error: parseError.message,
          raw_content: generatedContent!.substring(0, 500) + (generatedContent!.length > 500 ? '...' : ''),
          provider: usedProvider!
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('\n=== VALIDATING QUESTIONS ===')
    // Validate generated questions
    const validQuestions = generatedQuestions.filter((q, index) => {
      console.log(`Validating question ${index + 1}:`)
      console.log('- Question text:', !!q.question_text, q.question_text?.substring(0, 50) + '...')
      console.log('- Options array:', Array.isArray(q.options), 'Length:', q.options?.length)
      console.log('- Correct answer:', typeof q.correct_answer, q.correct_answer)
      
      const isValid = q.question_text && 
        Array.isArray(q.options) && 
        q.options.length >= 2 && 
        q.options.length <= 4 &&
        typeof q.correct_answer === 'number' &&
        q.correct_answer >= 0 && 
        q.correct_answer < q.options.length
      
      console.log('- Valid:', isValid)
      return isValid
    })

    console.log(`Generated ${generatedQuestions.length} questions, ${validQuestions.length} valid`)

    if (validQuestions.length === 0) {
      console.log('No valid questions found')
      return new Response(
        JSON.stringify({ 
          error: 'No valid questions generated',
          details: 'All generated questions failed validation',
          total_generated: generatedQuestions.length,
          validation_details: generatedQuestions.map((q, i) => ({
            index: i,
            has_question: !!q.question_text,
            has_options: Array.isArray(q.options),
            options_count: q.options?.length,
            correct_answer_type: typeof q.correct_answer,
            correct_answer_value: q.correct_answer
          })),
          provider: usedProvider!
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('\n=== INSERTING INTO DATABASE ===')
    // Insert questions into database
    const questionsToInsert = validQuestions.map(q => ({
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      category: topic,
      difficulty: difficulty,
      created_by: null, // System generated
    }))

    console.log('Questions to insert:', questionsToInsert.length)
    const { data: insertedQuestions, error: insertError } = await supabaseClient
      .from('questions')
      .insert(questionsToInsert)
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save questions to database',
          details: insertError.message,
          provider: usedProvider!
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Successfully generated and saved questions')
    console.log('=== EDGE FUNCTION COMPLETE ===')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        generated_count: validQuestions.length,
        questions: insertedQuestions,
        provider_used: usedProvider!,
        fallback_used: usedProvider !== aiProvider
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===')
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