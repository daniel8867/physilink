
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, TheoryVerification, KnowledgeFile } from "../types";

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Detailed summary. Wrap ALL mathematical symbols, variables, and formulas in single dollar signs, e.g. $F = ma$." },
    concepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          field: { type: Type.STRING },
          description: { type: Type.STRING, description: "Brief description. Wrap ALL math symbols/variables in dollar signs." },
          equations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Provide PURE LaTeX strings without dollar signs. Example: '\\frac{1}{2}mv^{2}'." },
          importance: { type: Type.NUMBER }
        },
        required: ["name", "field", "description", "equations", "importance"]
      }
    },
    realLifeObservations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          conceptName: { type: Type.STRING },
          description: { type: Type.STRING },
          example: { type: Type.STRING }
        },
        required: ["conceptName", "description", "example"]
      }
    },
    resources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING },
          description: { type: Type.STRING },
          link: { type: Type.STRING }
        },
        required: ["title", "type", "description"]
      }
    },
    tips: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING },
          trick: { type: Type.STRING }
        },
        required: ["concept", "trick"]
      }
    },
    complexityLevel: { type: Type.NUMBER },
    sourceEvidence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          source: { type: Type.STRING }
        },
        required: ["text", "source"]
      }
    }
  },
  required: ["summary", "concepts", "realLifeObservations", "resources", "tips", "complexityLevel", "sourceEvidence"]
};

const verificationSchema = {
  type: Type.OBJECT,
  properties: {
    overallCorrectness: { type: Type.NUMBER },
    verdict: { type: Type.STRING },
    inaccuracies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          point: { type: Type.STRING },
          reason: { type: Type.STRING, description: "Wrap math symbols in $ signs." },
          correction: { type: Type.STRING, description: "Provide pure LaTeX or text with $ math $." }
        },
        required: ["point", "reason", "correction"]
      }
    },
    feedback: { type: Type.STRING, description: "Overall feedback. Wrap math symbols in $ signs." },
    improvedTheory: { type: Type.STRING },
    sourceEvidence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          source: { type: Type.STRING }
        },
        required: ["text", "source"]
      }
    }
  },
  required: ["overallCorrectness", "verdict", "inaccuracies", "feedback", "sourceEvidence"]
};

export async function analyzePhysicsQuery(
  text: string, 
  imageData?: string, 
  knowledgeFiles: KnowledgeFile[] = [], 
  strictMode: boolean = false
): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";
  
  const parts: any[] = [];
  knowledgeFiles.forEach(file => {
    parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
  });

  if (imageData) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } });
  }

  parts.push({ text: `Query/Problem: ${text}` });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      systemInstruction: `You are PhysiLink, an advanced scientific deconstruction engine.
      MANDATORY FORMATTING RULES:
      1. Use LaTeX for ALL mathematical notation.
      2. Inside any prose/text description, wrap EVERY mathematical variable (like x, t, v), symbol, or equation in single dollar signs ($).
      3. In the 'equations' arrays, provide PURE LaTeX strings without the outer dollar signs.
      4. Ensure all LaTeX is high-precision.
      5. Do not explain the formatting rules in your output.`
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return {
    summary: parsed.summary || "",
    concepts: parsed.concepts || [],
    realLifeObservations: parsed.realLifeObservations || [],
    resources: parsed.resources || [],
    tips: parsed.tips || [],
    complexityLevel: parsed.complexityLevel || 5,
    sourceEvidence: parsed.sourceEvidence || []
  };
}

export async function generatePhysicsImage(prompt: string): Promise<string | undefined> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Professional scientific diagram or clean physics experiment photograph illustrating: ${prompt}. Clean, high contrast, textbook quality. No text labels inside the image.`,
        },
      ],
    },
    config: {
      imageConfig: { aspectRatio: "16:9" },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return undefined;
}

export async function verifyTheory(
  problemDescription: string, 
  userWork: string, 
  knowledgeFiles: KnowledgeFile[] = [],
  strictMode: boolean = false
): Promise<TheoryVerification> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";
  const parts: any[] = [];

  knowledgeFiles.forEach(file => {
    parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
  });

  parts.push({ text: `Context: ${problemDescription}\nUser's Theory: ${userWork}` });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: verificationSchema,
      systemInstruction: "Audit the scientific reasoning. MANDATORY: Wrap all variables and symbols in $ signs. Use pure LaTeX for corrections. Be rigorous."
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return {
    overallCorrectness: parsed.overallCorrectness || 0,
    verdict: parsed.verdict || "Incorrect",
    inaccuracies: parsed.inaccuracies || [],
    feedback: parsed.feedback || "",
    improvedTheory: parsed.improvedTheory || "",
    sourceEvidence: parsed.sourceEvidence || []
  };
}
