import { GoogleGenAI } from "@google/genai";
import { RememberedPerson } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const describeScene = async (imageBase64: string, onChunk: (chunk: string) => void): Promise<void> => {
  const imagePart = fileToGenerativePart(imageBase64, "image/jpeg");
  const resultStream = await ai.models.generateContentStream({
      model,
      contents: {
        parts: [
          { text: "Describe the scene in the image for a visually impaired person. Be direct and objective. List key objects, people, and the general environment." },
          imagePart,
        ],
      },
  });
  for await (const chunk of resultStream) {
    onChunk(chunk.text);
  }
};

export const recognizeAndDescribePerson = async (imageBase64: string, rememberedPeople: RememberedPerson[], onChunk: (chunk: string) => void): Promise<void> => {
  const currentImagePart = fileToGenerativePart(imageBase64, "image/jpeg");
  
  const parts: any[] = [];
  
  let prompt;
  
  if (rememberedPeople.length > 0) {
    prompt = `Analyze the main person in the image. Compare them against the provided 'remembered people'.
- If a match is found, state their name and what they are wearing and doing. Example: '[Name] is here, wearing a blue shirt.'
- If there is no match, describe the unknown person's key features like gender, clothing, and activity.`;
    
    parts.push({ text: prompt });
    parts.push(currentImagePart);
    parts.push({text: "\n--- Remembered People for comparison ---"});
    rememberedPeople.forEach(person => {
      parts.push({text: `Name: ${person.name}`});
      parts.push(fileToGenerativePart(person.imageBase64, 'image/jpeg'));
    });
  } else {
    prompt = "Describe the most prominent person in the image. Be direct. Focus on their apparent gender, clothing, and what they are doing.";
    parts.push({ text: prompt });
    parts.push(currentImagePart);
  }
  
  const resultStream = await ai.models.generateContentStream({
    model,
    contents: {
      parts: parts
    },
  });

  for await (const chunk of resultStream) {
    onChunk(chunk.text);
  }
};

export const askAboutImage = async (imageBase64: string, question: string, onChunk: (chunk: string) => void): Promise<void> => {
  const imagePart = fileToGenerativePart(imageBase64, "image/jpeg");
  const resultStream = await ai.models.generateContentStream({
    model,
    contents: {
      parts: [
        { text: `Based on the image, answer the following question factually: "${question}"` },
        imagePart,
      ],
    },
  });

  for await (const chunk of resultStream) {
    onChunk(chunk.text);
  }
};

export const getNavigationGuidance = async (imageBase64: string): Promise<string> => {
  const imagePart = fileToGenerativePart(imageBase64, "image/jpeg");
  const result = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "You are a navigation assistant for a visually impaired person. Your absolute priority is safety and clarity. Provide brief, urgent-sounding instructions about the path immediately ahead.\n- Mention obstacles, changes in terrain (like curbs or stairs), and potential hazards.\n- Use clock-face directions (e.g., 'curb at your 1 o'clock') and approximate distances (e.g., 'about 3 steps ahead').\n- If the path is clear, simply say 'Path is clear.'\nExamples: 'Clear path ahead.' or 'Stairs going down, 5 steps in front of you.' or 'Pole on your right, about one step away.'" },
        imagePart,
      ],
    },
  });
  return result.text;
};

export const getContinuousDescription = async (imageBase64: string, history: string[]): Promise<string> => {
  const imagePart = fileToGenerativePart(imageBase64, "image/jpeg");

  const historyPromptSection = history.length > 0 
    ? `**PREVIOUS OBSERVATIONS (Most recent first):**\n${history.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
    : "This is the first observation.";

  const prompt = `You are an AI assistant in continuous observation mode for a visually impaired person. Your task is to provide updates on significant changes while filtering out minor ones.

${historyPromptSection}

**CURRENT TASK:**
Analyze the new image and compare it to the previous observations. Your response MUST be one of two things:
1. A brief, factual description of new, significant events or changes.
2. The exact word "[SILENT]" if nothing significant has changed.

**WHAT IS SIGNIFICANT (Speak up for these):**
- People or animals entering the immediate vicinity.
- Vehicles approaching, starting, or stopping nearby.
- Doors or windows opening or closing nearby.
- New objects appearing as potential obstacles in the user's path.
- Potential hazards (e.g., smoke, spills, an item dropped in front of the user).

**WHAT IS NOT SIGNIFICANT (Stay silent):**
- Minor shifts in lighting, leaves rustling, distant background activity.

**STYLE:**
Be concise and factual. Summarize multiple events. If nothing noteworthy has changed, you MUST respond with only "[SILENT]".`;
  
  const result = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        imagePart,
      ],
    },
  });
  return result.text;
};