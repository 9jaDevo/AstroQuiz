import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheatDetectionRequest {
  session_id: string
  user_id: string
  score: number
  total_questions: number
  time_taken: number
  streak: number
}

interface CheatDetectionResponse {
  is_suspicious: boolean
  suspicion_reason?: string
  confidence_score: number
  analysis_details: {
    time_per_question: number
    accuracy_percentage: number
    speed_analysis: string
    pattern_analysis: string
  }
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

// Anomaly detection thresholds
const DETECTION_THRESHOLDS = {
  IMPOSSIBLE_SPEED: 1, // Less than 1 second per question
  EXTREMELY_FAST: 2, // Less than 2 seconds per question
  PERFECT_SCORE_TIME_LIMIT: 15, // Perfect score in less than 15 seconds total
  HIGH_SCORE_FAST_TIME: 3, // >80% accuracy with <3 seconds per question
  MINIMUM_EXPECTED_TIME: 5, // Minimum expected time per question for any score
}

async function performAnomalyDetection(request: CheatDetectionRequest): Promise<CheatDetectionResponse> {
  const { score, total_questions, time_taken, streak } = request
  
  const timePerQuestion = time_taken / total_questions
  const accuracyPercentage = (score / total_questions) * 100
  
  console.log('=== ANOMALY DETECTION ANALYSIS ===')
  console.log('Time per question:', timePerQuestion)
  console.log('Accuracy percentage:', accuracyPercentage)
  console.log('Total time taken:', time_taken)
  console.log('Streak:', streak)
  
  let isSuspicious = false
  let suspicionReason = ''
  let confidenceScore = 0
  let speedAnalysis = 'Normal'
  let patternAnalysis = 'Normal'
  
  // Check for impossible speed (less than 1 second per question)
  if (timePerQuestion < DETECTION_THRESHOLDS.IMPOSSIBLE_SPEED) {
    isSuspicious = true
    suspicionReason = 'Impossible completion speed detected'
    confidenceScore = 0.95
    speedAnalysis = 'Impossible - Less than 1 second per question'
  }
  // Check for extremely fast completion
  else if (timePerQuestion < DETECTION_THRESHOLDS.EXTREMELY_FAST) {
    isSuspicious = true
    suspicionReason = 'Extremely fast completion speed'
    confidenceScore = 0.85
    speedAnalysis = 'Extremely Fast - Less than 2 seconds per question'
  }
  // Check for perfect score completed too quickly
  else if (accuracyPercentage === 100 && time_taken < DETECTION_THRESHOLDS.PERFECT_SCORE_TIME_LIMIT) {
    isSuspicious = true
    suspicionReason = 'Perfect score achieved in impossibly short time'
    confidenceScore = 0.90
    speedAnalysis = 'Suspicious - Perfect score too fast'
  }
  // Check for high score with very fast time
  else if (accuracyPercentage >= 80 && timePerQuestion < DETECTION_THRESHOLDS.HIGH_SCORE_FAST_TIME) {
    isSuspicious = true
    suspicionReason = 'High accuracy with suspiciously fast completion'
    confidenceScore = 0.75
    speedAnalysis = 'Suspicious - High score with fast completion'
  }
  // Check for statistical outliers
  else if (timePerQuestion < DETECTION_THRESHOLDS.MINIMUM_EXPECTED_TIME && accuracyPercentage > 50) {
    isSuspicious = true
    suspicionReason = 'Completion time significantly below expected minimum'
    confidenceScore = 0.70
    speedAnalysis = 'Below Expected Minimum'
  }
  
  // Pattern analysis
  if (streak === total_questions && timePerQuestion < 3) {
    patternAnalysis = 'Perfect streak with fast completion - Highly Suspicious'
    if (!isSuspicious) {
      isSuspicious = true
      suspicionReason = 'Perfect streak achieved with suspiciously fast timing'
      confidenceScore = 0.80
    }
  } else if (streak >= total_questions * 0.8) {
    patternAnalysis = 'High streak percentage'
  }
  
  console.log('Anomaly detection result:', {
    isSuspicious,
    suspicionReason,
    confidenceScore,
    speedAnalysis,
    patternAnalysis
  })
  
  return {
    is_suspicious: isSuspicious,
    suspicion_reason: suspicionReason,
    confidence_score: confidenceScore,
    analysis_details: {
      time_per_question: timePerQuestion,
      accuracy_percentage: accuracyPercentage,
      speed_analysis: speedAnalysis,
      pattern_analysis: patternAnalysis
    }
  }
}

async function performLLMAnalysis(request: CheatDetectionRequest): Promise<{ is_suspicious: boolean, reason?: string, confidence: number }> {
  console.log('=== LLM ANALYSIS ATTEMPT ===')
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    console.log('OpenAI API key not configured, skipping LLM analysis')
    return { is_suspicious: false, confidence: 0 }
  }

  const { score, total_questions, time_taken, streak } = request
  const timePerQuestion = time_taken / total_questions
  const accuracyPercentage = (score / total_questions) * 100

  const prompt = `Analyze this quiz session for potential cheating or suspicious behavior:

Session Data:
- Questions: ${total_questions}
- Correct Answers: ${score}
- Accuracy: ${accuracyPercentage.toFixed(1)}%
- Total Time: ${time_taken} seconds
- Time per Question: ${timePerQuestion.toFixed(2)} seconds
- Best Streak: ${streak}

Context: This is an astronomy quiz where questions typically require reading and thinking time.

Please analyze if this performance pattern suggests cheating or automated assistance. Consider:
1. Is the completion speed humanly possible for reading and answering?
2. Does the accuracy vs speed combination seem realistic?
3. Are there any red flags in the pattern?

Respond with a JSON object only:
{
  "is_suspicious": boolean,
  "reason": "brief explanation if suspicious",
  "confidence": number between 0 and 1
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert in detecting cheating patterns in online assessments. Analyze the data objectively and respond only with the requested JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status)
      return { is_suspicious: false, confidence: 0 }
    }

    const data: OpenAIResponse = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      console.error('No content in OpenAI response')
      return { is_suspicious: false, confidence: 0 }
    }

    try {
      const analysis = JSON.parse(content)
      console.log('LLM Analysis result:', analysis)
      return {
        is_suspicious: analysis.is_suspicious || false,
        reason: analysis.reason,
        confidence: analysis.confidence || 0
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError)
      return { is_suspicious: false, confidence: 0 }
    }

  } catch (error) {
    console.error('LLM analysis failed:', error)
    return { is_suspicious: false, confidence: 0 }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CHEAT DETECTION FUNCTION START ===')
    console.log('Request method:', req.method)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const requestBody = await req.json()
    console.log('Request body:', requestBody)

    const request: CheatDetectionRequest = requestBody

    // Validate input
    if (!request.session_id || !request.user_id || 
        typeof request.score !== 'number' || 
        typeof request.total_questions !== 'number' || 
        typeof request.time_taken !== 'number') {
      console.log('Invalid input validation failed')
      return new Response(
        JSON.stringify({ error: 'Invalid input. All fields are required and must be valid.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Input validated:', request)

    // Perform anomaly detection
    const anomalyResult = await performAnomalyDetection(request)
    
    // Perform LLM analysis (optional, fallback to anomaly detection if fails)
    const llmResult = await performLLMAnalysis(request)
    
    // Combine results - if either method flags as suspicious, mark as suspicious
    const finalResult: CheatDetectionResponse = {
      is_suspicious: anomalyResult.is_suspicious || llmResult.is_suspicious,
      suspicion_reason: anomalyResult.is_suspicious ? anomalyResult.suspicion_reason : llmResult.reason,
      confidence_score: Math.max(anomalyResult.confidence_score, llmResult.confidence),
      analysis_details: anomalyResult.analysis_details
    }

    console.log('Final detection result:', finalResult)

    // Update the quiz session with suspicion flag if needed
    if (finalResult.is_suspicious) {
      console.log('Updating quiz session with suspicion flag...')
      const { error: updateError } = await supabaseClient
        .from('quiz_sessions')
        .update({
          is_suspicious: true,
          suspicion_reason: finalResult.suspicion_reason
        })
        .eq('id', request.session_id)

      if (updateError) {
        console.error('Failed to update quiz session:', updateError)
        // Don't fail the entire request if update fails
      } else {
        console.log('Successfully flagged quiz session as suspicious')
      }
    }

    console.log('✅ Cheat detection completed successfully')
    console.log('=== CHEAT DETECTION FUNCTION COMPLETE ===')
    
    return new Response(
      JSON.stringify(finalResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== CHEAT DETECTION FUNCTION ERROR ===')
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