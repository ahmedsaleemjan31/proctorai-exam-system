import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
console.log("Gemini SDK Initialized. API Key starts with:", import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 5));

export interface GeneratedQuestion {
  text: string;
  type: 'textarea' | 'mcq';
  options: string; // Comma separated for MCQ
}

export async function generateAIQuestions(topic: string, count: number = 5): Promise<GeneratedQuestion[]> {
  // Check for Mock Mode
  if (import.meta.env.VITE_MOCK_AI === 'true') {
    await new Promise(r => setTimeout(r, 1000)); // Simulate delay
    return [
      { text: `What are the core principles of ${topic}?`, type: 'textarea', options: '' },
      { text: `Which of the following best describes ${topic}?`, type: 'mcq', options: 'Option A, Option B, Option C, Option D' },
      { text: `Explain the historical context of ${topic}.`, type: 'textarea', options: '' },
      { text: `True or False: ${topic} is widely used in modern industry.`, type: 'mcq', options: 'True, False' },
      { text: `Describe a common use case for ${topic}.`, type: 'textarea', options: '' }
    ];
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please check your .env file.");
  }

  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" }, { apiVersion: 'v1' });

  const prompt = `
    Generate ${count} exam questions about: "${topic}".
    Output MUST be a valid JSON array of objects.
    Structure: [{"text": string, "type": "mcq" | "textarea", "options": "A, B, C, D"}]
    No markdown, no preamble. Just the JSON array.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text() || "";
    
    // Remove potential markdown code blocks
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Improved JSON extraction
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("AI Response was not valid JSON:", text);
      throw new Error("AI returned an invalid format. Please try again.");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const msg = error?.message || "Unknown error";
    throw new Error(`AI Error (${model.model}): ${msg.substring(0, 100)}`);
  }
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  grading_notes: string;
}

export async function evaluateSubmission(examName: string, questions: any[], answers: any): Promise<EvaluationResult> {
  // Check for Mock Mode
  if (import.meta.env.VITE_MOCK_AI === 'true') {
    await new Promise(r => setTimeout(r, 1500));
    return {
      score: 85,
      feedback: "Great overall understanding. Some answers could be more detailed.",
      grading_notes: "MCQs were mostly correct. Essay responses showed good conceptual grasp."
    };
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key missing.");

  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" }, { apiVersion: 'v1' });

  const prompt = `
    You are an expert examiner. Evaluate the following student submission for the exam: "${examName}".
    
    Exam Questions:
    ${JSON.stringify(questions)}
    
    Student Answers:
    ${JSON.stringify(answers)}
    
    Provide an evaluation in the following JSON format:
    {
      "score": (number out of 100),
      "feedback": (short summary for the student),
      "grading_notes": (detailed technical notes for the instructor)
    }
    No markdown, no preamble. Just valid JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text() || "";
    
    // Remove potential markdown code blocks
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI returned invalid JSON format");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("AI Evaluation Error:", error);
    throw new Error(`AI Evaluation failed (${model.model}): ${error.message || "Check your API key and connection"}`);
  }
}
