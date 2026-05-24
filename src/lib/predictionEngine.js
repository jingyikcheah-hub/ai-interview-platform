export async function predictCandidateSuccess(evaluation, lang = 'en') {
  const langName = lang === 'en' ? 'English' : 'Simplified Chinese (简体中文)'

  const prompt = `You are a Data Science Prediction Model specialized in Tech Talent Acquisition.
Based on the following AI technical interview evaluation, predict the candidate's future success probability in these areas:
1. 1-Year Retention Probability (0-100%)
2. Seniority Promotion Probability within 2 years (0-100%)
3. Code Deployment Velocity (vs average engineer) (Multiplier, e.g., 1.5x, 0.8x)

[EVALUATION DATA]:
- Overall Score: ${evaluation.overallScore}
- Verdict: ${evaluation.verdict}
- Dimensions: ${JSON.stringify(evaluation.dimensions)}
- Strengths: ${JSON.stringify(evaluation.strengths)}
- Weaknesses: ${JSON.stringify(evaluation.improvements)}

RESPOND ONLY WITH VALID JSON using this exact schema (translate text values to ${langName}):
{
  "retentionProbability": 85,
  "promotionProbability": 60,
  "velocityMultiplier": "1.2x",
  "rationale": "Brief 2-sentence explanation of why these predictions were made."
}`

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    if (!response.ok) throw new Error(data.error || 'Failed to fetch prediction')

    const text = data.text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in prediction')
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Prediction failed:', error)
    return null
  }
}
