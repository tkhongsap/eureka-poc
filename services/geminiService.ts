import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Initialize the client. API_KEY is assumed to be in process.env per instructions.
const apiKey = process.env.API_KEY || 'dummy_key_for_mocking'; 
const ai = new GoogleGenAI({ apiKey });

export interface AnalysisResult {
  rootCauses: string[];
  recommendedActions: string[];
  safetyPrecautions: string[];
  estimatedTimeHours: number;
}

export const analyzeMaintenanceIssue = async (
  issueDescription: string,
  assetContext: string
): Promise<AnalysisResult> => {
  
  if (apiKey === 'dummy_key_for_mocking') {
    console.warn("Gemini API Key missing. Returning mock data.");
    return {
      rootCauses: ["Bearing fatigue due to vibration", "Lubrication failure"],
      recommendedActions: ["Inspect shaft alignment", "Replace bearing #404", "Check oil levels"],
      safetyPrecautions: ["Lockout/Tagout required", "Wear heat resistant gloves"],
      estimatedTimeHours: 4
    };
  }

  try {
    const prompt = `
      Act as a senior maintenance reliability engineer.
      Analyze the following maintenance issue for a ${assetContext}.
      Issue Description: "${issueDescription}"
      
      Provide a structured JSON response with:
      - A list of potential root causes.
      - A list of recommended maintenance actions (steps to fix).
      - Safety precautions specific to this task.
      - An estimated repair time in hours (number only).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            safetyPrecautions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            estimatedTimeHours: {
              type: Type.NUMBER
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

export const generateSmartChecklist = async (assetType: string): Promise<string[]> => {
    if (apiKey === 'dummy_key_for_mocking') {
        return ["Check power connection", "Inspect for physical damage", "Verify safety guards", "Test emergency stop"];
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a concise 5-item preventive maintenance checklist for a ${assetType}. Return only the list as a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (error) {
        console.error("Error generating checklist:", error);
        return [];
    }
}

export const analyzeAssetReliability = async (assetName: string, history: string): Promise<string> => {
  if (apiKey === 'dummy_key_for_mocking') {
    return "Based on historical data, this asset shows signs of wear in the motor assembly. Recommended to increase inspection frequency to weekly.";
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the reliability of ${assetName} considering this history: ${history}. Provide a concise 2-sentence summary of health and recommendation.`,
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Error analyzing asset:", error);
    return "AI Analysis unavailable at this time.";
  }
}

export const predictInventoryNeeds = async (partsData: any[]): Promise<any[]> => {
  if (apiKey === 'dummy_key_for_mocking') {
    return [{ partName: "Hydraulic Filter", recommendation: "Order 5 units (High Usage)" }];
  }
  
  try {
    const prompt = `
      Analyze this spare part inventory data: ${JSON.stringify(partsData.map(p => ({name: p.name, qty: p.quantity, min: p.minLevel})))}.
      Identify up to 3 parts that need attention due to low stock or potential risk.
      Return a JSON array of objects with 'partName' and 'recommendation'.
    `;
    
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
                    partName: { type: Type.STRING },
                    recommendation: { type: Type.STRING }
                }
            }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
     console.error("Error predicting inventory:", error);
     return [];
  }
}

/**
 * Generate a concise title from maintenance issue description using AI
 */
export const generateTitleFromDescription = async (description: string): Promise<string> => {
  console.log('[AI Title] Generating title for:', description);
  console.log('[AI Title] API Key status:', apiKey === 'dummy_key_for_mocking' ? 'Using mock' : 'Using real API');
  
  // Mock titles for common patterns when API key is missing
  if (apiKey === 'dummy_key_for_mocking') {
    const desc = description.toLowerCase();
    let result = '';
    
    // English patterns
    if (desc.includes('leak') || desc.includes('leaking')) result = 'Leak Repair Required';
    else if (desc.includes('noise') || desc.includes('grinding')) result = 'Abnormal Noise Investigation';
    else if (desc.includes('broken') || desc.includes('break')) result = 'Equipment Breakdown';
    else if (desc.includes('light') || desc.includes('flicker')) result = 'Electrical Issue';
    else if (desc.includes('pump')) result = 'Pump Malfunction';
    else if (desc.includes('motor')) result = 'Motor Issue';
    else if (desc.includes('sensor')) result = 'Sensor Calibration';
    else if (desc.includes('belt') || desc.includes('conveyor')) result = 'Conveyor Maintenance';
    else if (desc.includes('hvac') || desc.includes('air condition')) result = 'HVAC Maintenance';
    else if (desc.includes('door') || desc.includes('lock')) result = 'Door/Lock Repair';
    else if (desc.includes('floor') || desc.includes('tile')) result = 'Floor Repair';
    else if (desc.includes('wall') || desc.includes('paint')) result = 'Wall/Paint Repair';
    else if (desc.includes('pipe') || desc.includes('plumb')) result = 'Plumbing Issue';
    else if (desc.includes('electric') || desc.includes('power')) result = 'Electrical Maintenance';
    else if (desc.includes('machine') || desc.includes('equipment')) result = 'Equipment Maintenance';
    // Thai patterns
    else if (desc.includes('รั่ว') || desc.includes('ซึม')) result = 'Leak Repair Required';
    else if (desc.includes('เสียง') || desc.includes('ดัง')) result = 'Abnormal Noise Investigation';
    else if (desc.includes('พัง') || desc.includes('เสีย') || desc.includes('ใช้ไม่ได้')) result = 'Equipment Breakdown';
    else if (desc.includes('ไฟ') || desc.includes('หลอด')) result = 'Electrical Issue';
    else if (desc.includes('ปั๊ม')) result = 'Pump Malfunction';
    else if (desc.includes('มอเตอร์')) result = 'Motor Issue';
    else if (desc.includes('แอร์') || desc.includes('เย็น') || desc.includes('ร้อน')) result = 'HVAC Maintenance';
    else if (desc.includes('ประตู') || desc.includes('กุญแจ')) result = 'Door/Lock Repair';
    else if (desc.includes('พื้น') || desc.includes('กระเบื้อง')) result = 'Floor Repair';
    else if (desc.includes('ผนัง') || desc.includes('สี')) result = 'Wall/Paint Repair';
    else if (desc.includes('ท่อ') || desc.includes('น้ำ')) result = 'Plumbing Issue';
    else if (desc.includes('เครื่อง') || desc.includes('อุปกรณ์')) result = 'Equipment Maintenance';
    // Default: Create short title
    else {
      // Extract first sentence or first 40 chars
      const firstSentence = description.split(/[.!?。]/)[0].trim();
      result = firstSentence.length > 40 
        ? firstSentence.substring(0, 37) + '...' 
        : firstSentence || 'Maintenance Request';
    }
    
    console.log('[AI Title] Generated mock title:', result);
    return result;
  }

  try {
    const prompt = `Generate a short, concise title (3-5 words maximum) for this maintenance issue. Return only the title, no quotes or extra text.

Issue description: "${description}"

Examples of good titles:
- "Hydraulic Pump Failure"
- "Conveyor Belt Inspection"
- "Sensor Calibration Required"
- "Motor Overheating Issue"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const title = response.text?.trim() || description.substring(0, 40);
    console.log('[AI Title] Generated AI title:', title);
    // Clean up any quotes that might be returned
    return title.replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error("Error generating title:", error);
    // Fallback: use smart mock logic
    return generateMockTitle(description);
  }
}

/**
 * Helper function to generate mock title based on keywords
 */
function generateMockTitle(description: string): string {
  const desc = description.toLowerCase();
  
  // English patterns
  if (desc.includes('leak') || desc.includes('leaking')) return 'Leak Repair Required';
  if (desc.includes('noise') || desc.includes('grinding')) return 'Abnormal Noise Investigation';
  if (desc.includes('broken') || desc.includes('break')) return 'Equipment Breakdown';
  if (desc.includes('light') || desc.includes('flicker')) return 'Electrical Issue';
  if (desc.includes('pump')) return 'Pump Malfunction';
  if (desc.includes('motor')) return 'Motor Issue';
  if (desc.includes('sensor')) return 'Sensor Calibration';
  if (desc.includes('belt') || desc.includes('conveyor')) return 'Conveyor Maintenance';
  if (desc.includes('hvac') || desc.includes('air condition')) return 'HVAC Maintenance';
  if (desc.includes('door') || desc.includes('lock')) return 'Door/Lock Repair';
  if (desc.includes('hydraulic')) return 'Hydraulic System Issue';
  if (desc.includes('oil')) return 'Oil/Lubrication Issue';
  
  // Thai patterns
  if (desc.includes('รั่ว') || desc.includes('ซึม')) return 'Leak Repair Required';
  if (desc.includes('เสียง') || desc.includes('ดัง')) return 'Abnormal Noise Investigation';
  if (desc.includes('พัง') || desc.includes('เสีย') || desc.includes('ใช้ไม่ได้')) return 'Equipment Breakdown';
  if (desc.includes('ไฟ') || desc.includes('หลอด')) return 'Electrical Issue';
  if (desc.includes('ปั๊ม')) return 'Pump Malfunction';
  if (desc.includes('มอเตอร์')) return 'Motor Issue';
  if (desc.includes('แอร์') || desc.includes('เย็น') || desc.includes('ร้อน')) return 'HVAC Maintenance';
  
  // Default: Create short title from first part
  const firstSentence = description.split(/[.!?。]/)[0].trim();
  return firstSentence.length > 40 
    ? firstSentence.substring(0, 37) + '...' 
    : firstSentence || 'Maintenance Request';
}