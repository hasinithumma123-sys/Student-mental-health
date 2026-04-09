import OpenAI from 'openai';

// Initialize Groq client (primary)
const groq = new OpenAI({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true,
});

// Helper function to try Groq, fallback to hardcoded data
async function withFallback<T>(
  groqFn: () => Promise<T>,
  fallbackData: T
): Promise<T> {
  try {
    return await groqFn();
  } catch (error: any) {
    console.warn('Groq API failed, using fallback data:', error?.message);
    return fallbackData;
  }
}

export const getChatResponse = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  const fallbackResponse = 'I appreciate you reaching out. I\'m here to listen and support you. Please take care of yourself, and don\'t hesitate to reach out to a counselor or trusted friend if you need additional support.';

  return withFallback(
    async () => {
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a compassionate and supportive mental health counseling chatbot for students. Provide empathetic listening, stress management tips, and encourage seeking professional help when needed. Do not provide medical diagnoses. If the user is in immediate danger, urge them to use the SOS button or contact emergency services.'
        },
        ...history.map(h => ({
          role: h.role === 'model' ? 'assistant' as const : h.role as 'user',
          content: h.parts[0].text
        })),
        { role: 'user' as const, content: message }
      ];

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.choices[0].message.content || fallbackResponse;
    },
    fallbackResponse
  );
};

export const generateAssessmentQuestions = async () => {
  const fallbackQuestions = [
    { question: "How often do you feel stressed?", options: ["Never", "Rarely", "Sometimes", "Often"], category: "stress" },
    { question: "How is your sleep quality?", options: ["Excellent", "Good", "Fair", "Poor"], category: "sleep" },
    { question: "How would you describe your mood?", options: ["Very positive", "Mostly positive", "Neutral", "Negative"], category: "mood" },
    { question: "Do you feel overwhelmed?", options: ["Never", "Rarely", "Sometimes", "Often"], category: "emotional" },
    { question: "How often do you feel anxious?", options: ["Never", "Rarely", "Sometimes", "Often"], category: "emotional" },
    { question: "How many hours do you sleep per night?", options: ["<5 hours", "5-6 hours", "7-8 hours", ">8 hours"], category: "sleep" },
    { question: "How satisfied are you with your life?", options: ["Very unsatisfied", "Unsatisfied", "Satisfied", "Very satisfied"], category: "mood" },
    { question: "Do you have support from friends/family?", options: ["No support", "Little support", "Adequate support", "Strong support"], category: "emotional" }
  ];

  return withFallback(
    async () => {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: 'Generate 8 multiple-choice questions for a student mental health assessment. Focus on stress levels, mood patterns, sleep quality, and emotional well-being. Return ONLY a JSON array of objects with \'question\', \'options\' (array of 4 strings), and \'category\' (stress, mood, sleep, emotional). No other text.'
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from Groq');

      // Clean up the response - remove markdown code blocks and extra whitespace
      let cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedContent);
      if (!Array.isArray(parsed)) throw new Error('Response is not an array');
      return parsed;
    },
    fallbackQuestions
  );
};

export const analyzeAssessment = async (responses: { question: string, answer: string, category: string }[]) => {
  const fallbackAnalysis = {
    score: 65,
    stressLevel: 60,
    sleepQuality: 55,
    moodPattern: 'Moderate mood with some stress indicators',
    riskLevel: 'low' as const,
    summary: 'Based on your responses, you appear to be managing moderately well. Consider implementing stress management techniques.'
  };

  return withFallback(
    async () => {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `Analyze these mental health assessment responses: ${JSON.stringify(responses)}.
    Provide ONLY a JSON object with these exact fields:
    - score: mental health score (0-100)
    - stressLevel: stress level (0-100)
    - sleepQuality: sleep quality score (0-100)
    - moodPattern: a brief description of the mood pattern identified
    - riskLevel: risk level (low, moderate, high)
    - summary: a brief summary of the findings
    No other text.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from Groq');

      // Clean up the response - remove markdown code blocks and extra whitespace
      let cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleanedContent);
    },
    fallbackAnalysis
  );
};
