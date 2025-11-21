import { GoogleGenAI, Type } from "@google/genai";
import { WheelItem } from "../types";
import { WHEEL_COLORS } from "../constants";

const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateWheelItems = async (theme: string): Promise<WheelItem[]> => {
  if (!ai) {
    throw new Error("API Key is missing");
  }

  const prompt = `Generate a list of 6 to 10 short, fun, and distinct options for a "Spin the Wheel" game based on the theme: "${theme}". 
  Keep labels under 20 characters. Add a relevant emoji to each label if possible.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text) as { items: string[] };
    
    // Map strings to WheelItems with colors
    return data.items.map((label, index) => ({
      id: `gen-${Date.now()}-${index}`,
      label,
      color: WHEEL_COLORS[index % WHEEL_COLORS.length],
    }));

  } catch (error) {
    console.error("Error generating items:", error);
    throw error;
  }
};
