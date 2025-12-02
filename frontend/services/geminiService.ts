import { api } from './api';
import { ScriptAnalysis } from '../types';

/**
 * Calls the backend to analyze a script's content using the Gemini LLM.
 * @param scriptText The text content of the script.
 * @returns A promise that resolves to the ScriptAnalysis object.
 */
export const analyzeScript = async (scriptText: string): Promise<ScriptAnalysis> => {
  try {
    const response = await api.post<ScriptAnalysis>('/analyze-script', {
      script_content: scriptText,
    });
    return response.data;
  } catch (error) {
    console.error('Script analysis failed:', error);
    // Re-throw the error so the component can catch it and display a message
    throw error;
  }
};
