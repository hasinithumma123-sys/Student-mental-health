import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getChatResponse = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history,
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: "You are a compassionate and supportive mental health counseling chatbot for students. Provide empathetic listening, stress management tips, and encourage seeking professional help when needed. Do not provide medical diagnoses. If the user is in immediate danger, urge them to use the SOS button or contact emergency services.",
    }
  });
  return response.text;
};

export const generateAssessmentQuestions = async () => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Generate 8 multiple-choice questions for a student mental health assessment. Focus on stress levels, mood patterns, sleep quality, and emotional well-being. Return as a JSON array of objects with 'question', 'options' (array of 4 strings), and 'category' (stress, mood, sleep, emotional).",
    config: {
      responseMimeType: "application/json",
    }
  });
  return JSON.parse(response.text);
};

export const analyzeAssessment = async (responses: { question: string, answer: string, category: string }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these mental health assessment responses: ${JSON.stringify(responses)}. 
    Provide the following as a JSON object:
    - score: mental health score (0-100)
    - stressLevel: stress level (0-100)
    - sleepQuality: sleep quality score (0-100)
    - moodPattern: a brief description of the mood pattern identified
    - riskLevel: risk level (low, moderate, high)
    - summary: a brief summary of the findings`,
    config: {
      responseMimeType: "application/json",
    }
  });
  return JSON.parse(response.text);
};
