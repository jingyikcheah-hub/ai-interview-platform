import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local to get Supabase credentials
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.trim().match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const candidates = ["Alice Chen", "Bob Smith", "Charlie Wang", "Diana Ross", "Ethan Hunt", "Fiona Gallagher", "George Lucas", "Hannah Abbott", "Ian McKellen", "Julia Roberts"];
const positions = ["Senior React Developer", "Backend Engineer", "Full Stack Ninja", "DevOps Specialist", "Frontend Architect"];
const verdicts = ["STRONG_HIRE", "HIRE", "MAYBE", "NO_HIRE"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateLast30Days() {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, 30));
  return date.toISOString();
}

function generateMockEvaluation(verdict) {
  let baseScore = 50;
  if (verdict === "STRONG_HIRE") baseScore = 85;
  else if (verdict === "HIRE") baseScore = 75;
  else if (verdict === "MAYBE") baseScore = 65;
  
  const score = () => Math.min(100, Math.max(0, baseScore + randomInt(-10, 15)));
  
  return {
    overallScore: score(),
    dimensions: [
      { name: "Architecture Design", score: score(), rationale: "Demonstrated solid understanding." },
      { name: "Core Fundamentals", score: score(), rationale: "Good grasp of CS basics." },
      { name: "Security Awareness", score: score(), rationale: "Identified key vulnerabilities." },
      { name: "Code Quality", score: score(), rationale: "Wrote clean and maintainable code." },
      { name: "Problem Solving", score: score(), rationale: "Approached the problem methodically." },
      { name: "Communication", score: score(), rationale: "Explained thoughts clearly." },
      { name: "Culture Fit", score: score(), rationale: "Aligns well with core values." }
    ],
    summary: "Mock summary for this candidate.",
    strengths: ["Strength 1", "Strength 2", "Strength 3"],
    improvements: ["Improvement 1", "Improvement 2", "Improvement 3"],
    verdict: verdict,
    feedbackLetter: "Mock feedback letter."
  };
}

function generateMockIntegrity() {
  return {
    integrityScore: randomInt(70, 100),
    tabSwitches: randomInt(0, 5),
    pasteEvents: randomInt(0, 3),
    windowBlurs: randomInt(0, 2),
    totalAwayMs: randomInt(0, 5000),
    visualMetrics: {
      averageFocus: randomInt(80, 100),
      averageStress: randomInt(10, 40),
      dominantEmotion: "neutral",
      gazeDeviations: randomInt(0, 5)
    }
  };
}

const mockReports = Array.from({ length: 40 }, (_, i) => {
  const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
  return {
    candidate_email: `candidate${i}@example.com`,
    chat_history: [{ role: "ai", text: "Welcome" }, { role: "user", text: "Hello" }],
    evaluation: generateMockEvaluation(verdict),
    integrity: generateMockIntegrity(),
    created_at: randomDateLast30Days()
  };
});

async function seed() {
  console.log("Seeding 40 mock interview reports...");
  const { data, error } = await supabase.from('interview_reports').insert(mockReports);
  if (error) {
    console.error("Error inserting data:", error);
  } else {
    console.log("Successfully inserted 40 mock reports!");
  }
}

seed();
