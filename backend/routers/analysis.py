# backend/routers/analysis.py

import os
import json
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from livekit.plugins.google import LLM as GoogleLLM

from ..middleware.rate_limit import limiter
from ..auth import get_current_user # Protect this endpoint

router = APIRouter(tags=["Analysis"], dependencies=[Depends(get_current_user)])

# --- Pydantic Models ---
class ScriptAnalysisRequest(BaseModel):
    script_content: str = Field(..., min_length=50, description="The full text content of the script to be analyzed.")

class ScriptAnalysisResponse(BaseModel):
    summary: str = Field(..., description="A brief summary of the script's purpose.")
    tone: str = Field(..., description="The overall tone of the script (e.g., 'Formal', 'Conversational').")
    complexity: str = Field(..., description="The complexity level of the language used (e.g., 'Simple', 'Moderate', 'Complex').")
    estimated_duration_minutes: int = Field(..., description="Estimated time in minutes to complete the script.")
    key_questions: list[str] = Field(..., description="A list of the most important questions asked in the script.")


# --- Gemini LLM Client ---
def get_gemini_client():
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GEMINI_API_KEY is not configured on the server.")
    return GoogleLLM(model="gemini-1.5-flash-latest", api_key=gemini_api_key)


ANALYSIS_PROMPT_TEMPLATE = """
You are a legal assistant AI. Your task is to analyze a legal verification script and provide a structured summary of its contents.

Analyze the following script and respond ONLY with a valid JSON object that conforms to the specified schema. Do not include any other text, greetings, or explanations.

**JSON Schema:**
{{
  "summary": "A brief summary of the script's purpose.",
  "tone": "The overall tone of the script (e.g., 'Formal', 'Conversational').",
  "complexity": "The complexity level of the language used (e.g., 'Simple', 'Moderate', 'Complex').",
  "estimated_duration_minutes": "An integer representing the estimated time in minutes to complete the script.",
  "key_questions": ["A list of the most important questions asked in the script."]
}}

**Script to Analyze:**
---
{script_content}
---
"""

@router.post("/analyze-script", response_model=ScriptAnalysisResponse)
@limiter.limit("10/minute")
async def analyze_script(
    request: ScriptAnalysisRequest,
    gemini: GoogleLLM = Depends(get_gemini_client)
):
    """
    Analyzes a legal script using the Gemini LLM to extract key information.
    This is a protected endpoint and requires user authentication.
    """
    if len(request.script_content) < 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Script content is too short for a meaningful analysis.")

    prompt = ANALYSIS_PROMPT_TEMPLATE.format(script_content=request.script_content)

    try:
        llm_response = await gemini.chat(prompt=prompt)
        # The response from gemini might be in a markdown code block
        cleaned_json_string = llm_response.choices[0].message.text.strip().replace("`json", "").replace("`", "")
        
        analysis_data = json.loads(cleaned_json_string)

        return ScriptAnalysisResponse(**analysis_data)
        
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        print(f"Raw LLM Output: {llm_response.choices[0].message.text}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to parse the analysis from the AI model.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred during script analysis.")
