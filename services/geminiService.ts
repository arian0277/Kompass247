
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Language, LANGUAGES, MatrixData, RasterData, InterpretationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Generates a structured interpretation using a custom admin prompt.
 */
export const generateInterpretation = async (
  themeName: string, 
  matrix: MatrixData, 
  raster: RasterData, 
  language: Language = 'de',
  customSystemPrompt: string
): Promise<InterpretationResult> => {
  const langName = LANGUAGES[language];
  const prompt = `
    Thema: "${themeName}"
    Sprache: ${langName}
    Matrix-Kontext: Zentrum=${matrix.center}, Ahnen=${JSON.stringify(matrix.lineage)}, Gesundheit=${JSON.stringify(matrix.healthCard.totals)}.
    Raster-Statistik: ${JSON.stringify(raster.stats)}.
    
    Verwende diesen spezifischen Auftrag: ${customSystemPrompt}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullText: {
            type: Type.STRING,
            description: "The complete, detailed interpretation text."
          },
          summary: {
            type: Type.STRING,
            description: "A very short, shareable summary of the main points."
          }
        },
        required: ["fullText", "summary"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as InterpretationResult;
  } catch (e) {
    return {
      fullText: response.text || "Fehler bei der Generierung.",
      summary: "Zusammenfassung konnte nicht erstellt werden."
    };
  }
};

/**
 * Transforms text into audio bytes.
 */
export const generatePodcastAudio = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
