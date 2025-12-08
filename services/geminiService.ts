

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSop = async (
  studentName: string,
  course: string,
  university: string,
  country: string,
  background: string
): Promise<string> => {
  try {
    const prompt = `Write a professional Statement of Purpose (SOP) for ${studentName} applying to ${course} at ${university} in ${country}. 
    Background: ${background}. 
    Structure: Introduction, Academic Background, Why this Course, Why this University, Why this Country, Career Goals, Conclusion.
    Keep it under 600 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to generate SOP.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating SOP. Please check your API key or network connection.";
  }
};

export const analyzeVisaRisk = async (
  profile: string,
  country: string
): Promise<string> => {
  try {
    const prompt = `Act as an expert visa consultant for ${country}. Analyze the visa approval probability based on the following student profile:
    
    ${profile}

    Provide a response with the following sections:
    1. **Risk Score**: (Low / Medium / High)
    2. **Approval Probability**: (Estimated %)
    3. **Key Strengths**: Bullet points of what works in their favor.
    4. **Risk Factors**: Bullet points of potential red flags (e.g. gaps, low score).
    5. **Recommendations**: 3 specific, actionable steps to improve their odds (e.g. explaining the gap, specific financial documents).
    
    Be realistic and strict based on current immigration trends for ${country}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to analyze risk.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing visa risk.";
  }
};

export const getInterviewQuestion = async (context: string): Promise<string> => {
    try {
        const prompt = `You are a strict visa officer for ${context}. Ask me one difficult interview question regarding my study plan or finances. Only return the question text.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text || "Why do you want to study here?";
      } catch (error) {
        console.error("Gemini API Error:", error);
        return "Can you tell me about your background?";
      }
}

export interface UniRecommendation {
  name: string;
  location: string;
  tuition: string;
  acceptanceChance: 'High' | 'Medium' | 'Low';
  reason: string;
}

export const recommendUniversities = async (
  profile: {
    name: string,
    country: string,
    gpa: string,
    testType: string,
    testScore: string,
    financialCap: string,
    courseInterest: string
  }
): Promise<UniRecommendation[]> => {
  try {
    const prompt = `Act as an expert education counsellor. Recommend 4 universities in ${profile.country} for a student named ${profile.name}.
    
    Student Profile:
    - GPA: ${profile.gpa}
    - English Test: ${profile.testType} with score ${profile.testScore}
    - Financial Budget: ${profile.financialCap}
    - Intended Major/Interest: ${profile.courseInterest}
    
    If GPA or Test Score is 'N/A', provide general recommendations for average international students.

    Return a list of 4 best-fit universities.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the university" },
              location: { type: Type.STRING, description: "City and State/Province" },
              tuition: { type: Type.STRING, description: "Estimated annual tuition fee" },
              acceptanceChance: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "Probability of acceptance based on stats" },
              reason: { type: Type.STRING, description: "Short reason why this is a good match" }
            },
            required: ["name", "location", "tuition", "acceptanceChance", "reason"]
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as UniRecommendation[];
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

// --- NEW OCR FEATURE ---

export interface PassportData {
  name: string;
  passportNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationality: string;
  address: string;
  gender: 'Male' | 'Female' | 'Other';
}

export const extractPassportData = async (base64Image: string, mimeType: string): Promise<PassportData | null> => {
  try {
    const prompt = `Analyze this image of a passport. Extract the following details:
    1. Full Name
    2. Passport Number
    3. Date of Birth (format YYYY-MM-DD)
    4. Nationality
    5. Address
    6. Gender (Male, Female, or Other)

    If a field is not visible, return empty string.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            passportNumber: { type: Type.STRING },
            dateOfBirth: { type: Type.STRING },
            nationality: { type: Type.STRING },
            address: { type: Type.STRING },
            gender: { type: Type.STRING, enum: ["Male", "Female", "Other"] }
          },
          required: ["name", "passportNumber"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PassportData;
    }
    return null;
  } catch (error) {
    console.error("Passport OCR Error:", error);
    return null;
  }
};