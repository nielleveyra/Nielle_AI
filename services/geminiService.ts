import { GoogleGenAI, Type, Modality } from "@google/genai";

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
};

export async function analyzeScene(imageBase64: string, mimeType: string): Promise<{ description: string; accessories: string[] }> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Analyze the provided image. Your response MUST be in a valid JSON format. The JSON object should have two keys: "description" and "accessories".
    1. For the "description" key, provide a one-sentence, vivid description of the scene, background, lighting, and overall vibe. For example: "a bright sunny afternoon on a wide green grass field, giving a fresh picnic vibe with vibrant natural lighting and crisp shadows."
    2. For the "accessories" key, provide a string array of all visible accessories worn or held by the person in the photo. Examples include "sunglasses", "handbag", "watch", "hat", "cap", "ring", "necklace". If no accessories are visible, return an empty array [].
    Do not include any text outside of the JSON object.`;

    const imagePart = fileToGenerativePart(imageBase64, mimeType);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    description: { 
                        type: Type.STRING,
                        description: "A one-sentence vivid description of the scene, background, lighting, and overall vibe."
                    },
                    accessories: {
                        type: Type.ARRAY,
                        description: "A list of all visible accessories in the photo.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["description", "accessories"]
            }
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
}


export async function generateImageWithNanoBanana(
  prompt: string,
  sceneImageBase64: string,
  sceneImageMimeType: string,
  faceImageBase64: string,
  faceImageMimeType: string
): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const textPart = { text: prompt };
  const sceneImagePart = {
    inlineData: {
      data: sceneImageBase64,
      mimeType: sceneImageMimeType,
    },
  };
  const faceImagePart = {
    inlineData: {
        data: faceImageBase64,
        mimeType: faceImageMimeType,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [textPart, sceneImagePart, faceImagePart],
    },
    config: {
        responseModalities: [Modality.IMAGE],
    },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  throw new Error("Image generation failed, no image data returned.");
}