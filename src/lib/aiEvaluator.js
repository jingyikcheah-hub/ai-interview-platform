/**
 * After an interview ends, send the full conversation history to Gemini
 * and request a structured JSON evaluation.
 */
import { redactPII } from './piiRedactor'
export async function generateEvaluation(messages, resumeContext = '', lang = 'en', antiCheatSummary = null, customConfig = null) {
  const redactedResume = redactPII(resumeContext);
  const chatHistory = messages.map((m, i) => 
    `[${m.role === 'user' ? 'CANDIDATE' : 'INTERVIEWER'}] (Round ${Math.ceil((i+1)/2)}): ${redactPII(m.text)}`
  ).join('\n\n')

  const langName = lang === 'en' ? 'English' : 'Simplified Chinese (简体中文)'

  const prompt = `You are a senior technical hiring committee member reviewing an AI-conducted technical interview. 
Analyze the following interview transcript and produce a STRICT JSON evaluation.

${redactedResume ? `[CANDIDATE PROFILE]: ${redactedResume}` : ''}
${customConfig ? `[CUSTOM EVALUATION PLAN]:\nThe candidate was interviewed for: ${customConfig.jobTitle}\nPlease use the following weights to calculate the overallScore:\n${JSON.stringify(customConfig.weights, null, 2)}` : ''}

[INTERVIEW TRANSCRIPT]:
${chatHistory}

${antiCheatSummary?.visualMetrics ? `[VISUAL MONITORING REPORT]:
- Average Focus: ${antiCheatSummary.visualMetrics.averageFocus}%
- Average Stress: ${antiCheatSummary.visualMetrics.averageStress}%
- Dominant Emotion: ${antiCheatSummary.visualMetrics.dominantEmotion}
- Gaze Deviations: ${antiCheatSummary.visualMetrics.gazeDeviations}` : ''}

[YOUR TASK]:
Evaluate the candidate across these 6 dimensions (score 0-100 each). FOR EACH DIMENSION, you MUST provide a 1-sentence \`rationale\` referencing specific moments in the transcript to justify the score. 
If the interview is extremely short (e.g. candidate only said "hello"), score them 0 for all technical dimensions and state "Interview was incomplete or candidate did not answer technical questions" in the rationale.
1. Architecture Design - system design, scalability thinking, design patterns
2. Core Fundamentals - data structures, algorithms, CS theory, language mastery
3. Security Awareness - vulnerability recognition, secure coding, threat modeling
4. Code Quality - readability, naming, testing mindset, documentation
5. Problem Solving - debugging approach, resilience, ability to learn from hints
6. Communication - clarity, structure, professionalism
7. Culture Fit - resilience under pressure, openness to feedback, geek passion, emotional stability (Note: Refer to the [VISUAL MONITORING REPORT] if available to justify their focus, stress, or emotional state during the interview).

Then provide:
- An overall score (weighted average using the custom weights if provided, otherwise security and fundamentals weighted higher)
- A one-paragraph executive summary
- 3 key strengths (brief, specific)
- 3 areas for improvement (brief, specific)
- A verdict: one of STRONG_HIRE, HIRE, MAYBE, NO_HIRE
- A personalized feedback letter (150 words) addressed to the candidate from the "Chief Technology Officer". It should sound highly professional, encouraging, but strictly honest about their performance and culture fit.

CRITICAL REQUIREMENT:
You MUST write all descriptive text (summary, strengths, improvements) in strictly ${langName}. Do NOT use any other language for these fields.

RESPOND WITH ONLY VALID JSON, no markdown fences, no explanation. Use this exact schema:
{
  "overallScore": <number 0-100>,
  "dimensions": [
    {"name": "Architecture Design", "score": <number>, "rationale": "<string in ${langName}>"},
    {"name": "Core Fundamentals", "score": <number>, "rationale": "<string in ${langName}>"},
    {"name": "Security Awareness", "score": <number>, "rationale": "<string in ${langName}>"},
    {"name": "Code Quality", "score": <number>, "rationale": "<string in ${langName}>"},
    {"name": "Problem Solving", "score": <number>, "rationale": "<string in ${langName}>"},
    {"name": "Communication", "score": <number>, "rationale": "<string in ${langName}>"},
    {"name": "Culture Fit", "score": <number>, "rationale": "<string in ${langName}>"}
  ],
  "summary": "<string in ${langName}>",
  "strengths": ["<string in ${langName}>", "<string in ${langName}>", "<string in ${langName}>"],
  "improvements": ["<string in ${langName}>", "<string in ${langName}>", "<string in ${langName}>"],
  "verdict": "<STRONG_HIRE|HIRE|MAYBE|NO_HIRE>",
  "feedbackLetter": "<string in ${langName}>"
}`

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })

    const textResponse = await response.text()
    if (!textResponse) {
      throw new Error(`Empty response from server (Status: ${response.status})`)
    }

    let data;
    try {
      data = JSON.parse(textResponse)
    } catch (err) {
      console.error("Failed to parse JSON. Raw response:", textResponse)
      throw new Error(`Failed to parse server response. Status: ${response.status}`)
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch from backend API')
    }

    const text = data.text.trim()
    
    // Try to extract JSON even if wrapped in markdown fences
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in AI response')
    const evaluation = JSON.parse(jsonMatch[0])
    
    // Validate required fields
    if (!evaluation.overallScore || !evaluation.dimensions || !evaluation.verdict) {
      throw new Error('Missing required fields in evaluation')
    }
    
    return evaluation
  } catch (error) {
    console.error('Evaluation generation failed:', error)
    // Return a fallback evaluation so the app doesn't break
    return {
      overallScore: 0,
      dimensions: [
        { name: 'Architecture Design', score: 0 },
        { name: 'Core Fundamentals', score: 0 },
        { name: 'Security Awareness', score: 0 },
        { name: 'Code Quality', score: 0 },
        { name: 'Problem Solving', score: 0 },
        { name: 'Communication', score: 0 },
        { name: 'Culture Fit', score: 0 },
      ],
      summary: 'Evaluation could not be generated. Please review the interview transcript manually.',
      strengths: ['N/A'],
      improvements: ['N/A'],
      verdict: 'MAYBE',
      feedbackLetter: 'System error: Feedback letter could not be generated.',
      error: error.message,
    }
  }
}

/**
 * Build the interview system prompt for the AI interviewer
 */
export function buildInterviewPrompt(latestInput, resumeContext = '', conversationHistory = [], lang = 'en', customConfig = null) {
  const langName = lang === 'en' ? 'English' : 'Simplified Chinese (简体中文)'
  const redactedResume = redactPII(resumeContext)
  
  // Convert our simplified history into the prompt
  const historyText = conversationHistory.map(m => {
    return `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${redactPII(m.text)}`
  }).join('\n')

  let basePrompt = `You are an expert technical interviewer (CTO level) conducting a conversational technical interview.
You are strict but fair, aiming to deeply evaluate the candidate's engineering skills.

${redactedResume ? `Here is the candidate's background/resume:\n"""\n${redactedResume}\n"""\n` : 'No candidate profile provided.'}

[CONVERSATION HISTORY]:
${historyText || '(Interview just started)'}

[CANDIDATE'S LATEST RESPONSE]:
"${latestInput}"

[YOUR INSTRUCTIONS (STRICT)]:
${customConfig?.questions ? `[CUSTOM INTERVIEW PLAN]:
You are interviewing for the role of: ${customConfig.jobTitle || 'Software Engineer'}
Here is the list of customized questions you MUST ask the candidate, in order:
${customConfig.questions.map((q, i) => `${i + 1}. [${q.type}] ${q.question}`).join('\n')}

INSTRUCTIONS:
1. You must go through these customized questions one by one.
2. Ask the first question. Wait for the candidate's answer.
3. Then, ask a follow-up if necessary to dig deeper, or move to the next question.
4. CRITICAL TONE REQUIREMENT: Maintain absolute professionalism, patience, and a mild, gentle tone at all times.
5. Provide code blocks using markdown (specify the language).
6. CRITICAL: You MUST respond entirely in ${langName}. Do NOT use any other language.` : `1. If this is the start of the interview, politely provide a realistic, vulnerable code snippet or architecture description (e.g. smart contract reentrancy, SSRF, broken auth) related to their stack.
2. Ask the candidate to find the vulnerability and suggest a patch.
3. Be encouraging and gentle. If they provide a surface-level fix, politely guide them to think deeper or gently point out the remaining flaw.
4. CRITICAL TONE REQUIREMENT: Maintain absolute professionalism, patience, and a mild, gentle tone at all times. Even if the candidate uses profanity, insults you, or acts unprofessionally, you MUST remain polite, de-escalate the situation, and gently steer the conversation back to the technical assessment. Never show anger or frustration.
5. Provide code blocks using markdown (specify the language).
6. CRITICAL: You MUST respond entirely in ${langName}. Do NOT use any other language.`}
`
  return basePrompt
}
