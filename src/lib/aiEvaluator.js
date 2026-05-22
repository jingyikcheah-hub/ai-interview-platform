import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

/**
 * After an interview ends, send the full conversation history to Gemini
 * and request a structured JSON evaluation.
 */
export async function generateEvaluation(messages, resumeContext = '', lang = 'en') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const chatHistory = messages.map((m, i) => 
    `[${m.role === 'user' ? 'CANDIDATE' : 'INTERVIEWER'}] (Round ${Math.ceil((i+1)/2)}): ${m.text}`
  ).join('\n\n')

  const langName = lang === 'en' ? 'English' : 'Simplified Chinese (简体中文)'

  const prompt = `You are a senior technical hiring committee member reviewing an AI-conducted technical interview. 
Analyze the following interview transcript and produce a STRICT JSON evaluation.

${resumeContext ? `[CANDIDATE PROFILE]: ${resumeContext}` : ''}

[INTERVIEW TRANSCRIPT]:
${chatHistory}

[YOUR TASK]:
Evaluate the candidate across these 6 dimensions (score 0-100 each):
1. Architecture Design - system design, scalability thinking, design patterns
2. Core Fundamentals - data structures, algorithms, CS theory, language mastery
3. Security Awareness - vulnerability recognition, secure coding, threat modeling
4. Code Quality - readability, naming, testing mindset, documentation
5. Problem Solving - debugging approach, analytical thinking, edge case handling
6. Communication - clarity of explanation, structured thinking, asking good questions

Then provide:
- An overall score (weighted average, security and fundamentals weighted higher)
- A one-paragraph executive summary
- 3 key strengths (brief, specific)
- 3 areas for improvement (brief, specific)
- A verdict: one of STRONG_HIRE, HIRE, MAYBE, NO_HIRE

CRITICAL REQUIREMENT:
You MUST write all descriptive text (summary, strengths, improvements) in strictly ${langName}. Do NOT use any other language for these fields.

RESPOND WITH ONLY VALID JSON, no markdown fences, no explanation. Use this exact schema:
{
  "overallScore": <number 0-100>,
  "dimensions": [
    {"name": "Architecture Design", "score": <number>},
    {"name": "Core Fundamentals", "score": <number>},
    {"name": "Security Awareness", "score": <number>},
    {"name": "Code Quality", "score": <number>},
    {"name": "Problem Solving", "score": <number>},
    {"name": "Communication", "score": <number>}
  ],
  "summary": "<string in ${langName}>",
  "strengths": ["<string in ${langName}>", "<string in ${langName}>", "<string in ${langName}>"],
  "improvements": ["<string in ${langName}>", "<string in ${langName}>", "<string in ${langName}>"],
  "verdict": "<STRONG_HIRE|HIRE|MAYBE|NO_HIRE>"
}`

  try {
    let result;
    let retries = 3;
    while (retries > 0) {
      try {
        result = await model.generateContent(prompt)
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    const text = result.response.text().trim()
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
      ],
      summary: 'Evaluation could not be generated. Please review the interview transcript manually.',
      strengths: ['N/A'],
      improvements: ['N/A'],
      verdict: 'MAYBE',
      error: error.message,
    }
  }
}

/**
 * Build the interview system prompt for the AI interviewer
 */
export function buildInterviewPrompt(userMessage, resumeContext, chatHistory = []) {
  const historyText = chatHistory.map(m => 
    `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.text}`
  ).join('\n')

  return `You are a ruthless "Red vs Blue Team" technical examiner at a top-tier cybersecurity firm. You are conducting an aggressive, high-stakes technical assessment.

${resumeContext ? `[CANDIDATE CONTEXT]: The candidate claims this profile: "${resumeContext}".` : 'No candidate profile provided.'}

[CONVERSATION HISTORY]:
${historyText || '(Interview just started)'}

[CANDIDATE'S LATEST RESPONSE]:
"${userMessage}"

[YOUR INSTRUCTIONS (STRICT)]:
1. If this is the start of the interview, IMMEDIATELY throw a highly realistic, vulnerable code snippet or architecture description (e.g. smart contract reentrancy, SSRF, broken auth) related to their stack.
2. Demand that the candidate find the vulnerability and write a patch within 5 minutes.
3. Be relentless. If they provide a surface-level fix, exploit it and show them how their fix still fails.
4. Keep responses brief, intense, and highly technical. No generic pleasantries.
5. Provide code blocks using markdown (specify the language).
6. Respond in the SAME LANGUAGE the candidate uses (English or Chinese).`
}
