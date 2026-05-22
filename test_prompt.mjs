import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCHvHavCDBo7QuYsfGSyJuMAW8BfQaFTbU');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function test() {
  const prompt = `Evaluate this:
[INTERVIEWER]: Hello
[CANDIDATE]: Hi

CRITICAL REQUIREMENT: You MUST write all descriptive text (summary, strengths, improvements) in strictly Simplified Chinese (简体中文). Do NOT use any other language.

RESPOND WITH ONLY VALID JSON:
{
  "summary": "<string in Simplified Chinese (简体中文)>",
  "strengths": ["<string in Simplified Chinese (简体中文)>"]
}`;
  
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

test();
