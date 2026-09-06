"""
IBM Granite Service - IBM watsonx.ai integration
Reads credentials exclusively from environment variables / .env file.
API key is NEVER logged, returned, or exposed.
"""
import os
import httpx
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Generation parameters
DEFAULT_PARAMS = {
    "max_new_tokens": 800,
    "min_new_tokens": 30,
    "temperature": 0.3,
    "top_p": 0.9,
    "repetition_penalty": 1.1,
    "stop_sequences": [],
}


def _get_iam_token() -> str:
    """Exchange API key for IBM Cloud IAM token. Key is never logged."""
    iam_url = "https://iam.cloud.ibm.com/identity/token"
    try:
        resp = httpx.post(
            iam_url,
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": settings.watsonx_api_key,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30,
        )
        resp.raise_for_status()
        token = resp.json().get("access_token", "")
        if not token:
            raise ValueError("Empty token received from IAM")
        return token
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            raise ValueError("Invalid watsonx API key") from e
        raise RuntimeError(f"IAM authentication failed: {e.response.status_code}") from e
    except httpx.TimeoutException:
        raise RuntimeError("IAM authentication timed out")
    except Exception as e:
        raise RuntimeError(f"Authentication error: {type(e).__name__}") from e


def generate_response(
    prompt: str,
    system_prompt: Optional[str] = None,
    params: Optional[dict] = None,
) -> dict:
    """
    Call IBM Granite via watsonx.ai text generation API.
    Returns dict with 'text', 'model', 'demo_mode', 'error' keys.
    """
    if settings.effective_demo_mode:
        return _demo_response(prompt)

    try:
        token = _get_iam_token()
        gen_params = {**DEFAULT_PARAMS, **(params or {})}

        full_prompt = prompt
        if system_prompt:
            full_prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{prompt}\n<|assistant|>\n"

        payload = {
            "model_id": settings.watsonx_model_id,
            "input": full_prompt,
            "parameters": gen_params,
            "project_id": settings.watsonx_project_id,
        }

        url = f"{settings.watsonx_ai_url}/ml/v1/text/generation?version=2023-05-29"
        resp = httpx.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        generated_text = data.get("results", [{}])[0].get("generated_text", "").strip()
        return {
            "text": generated_text,
            "model": settings.watsonx_model_id,
            "demo_mode": False,
            "error": None,
        }

    except ValueError as e:
        logger.warning("Granite auth error (not exposing key): %s", type(e).__name__)
        return {"text": _fallback_text(prompt), "model": settings.watsonx_model_id, "demo_mode": True, "error": "Authentication error - check API key"}
    except httpx.TimeoutException:
        logger.warning("Granite request timed out")
        return {"text": _fallback_text(prompt), "model": settings.watsonx_model_id, "demo_mode": True, "error": "Request timed out"}
    except httpx.HTTPStatusError as e:
        logger.warning("Granite HTTP error: %s", e.response.status_code)
        return {"text": _fallback_text(prompt), "model": settings.watsonx_model_id, "demo_mode": True, "error": f"API error: {e.response.status_code}"}
    except Exception as e:
        logger.warning("Granite error: %s", type(e).__name__)
        return {"text": _fallback_text(prompt), "model": settings.watsonx_model_id, "demo_mode": True, "error": f"Service error: {type(e).__name__}"}


def generate_explanation(context: dict) -> dict:
    """Generate a natural language explanation from structured context."""
    prompt = f"""You are JalRakshak AI, a water intelligence advisor for Saurashtra region, India.
Provide a clear, concise explanation based on the following water data:

{_format_context(context)}

Explain in 3-4 sentences what this data means for the village/region, focusing on the most critical water issues.
Use simple language suitable for farmers and community leaders."""
    return generate_response(prompt)


def generate_report(village_name: str, report_data: dict) -> dict:
    """Generate a structured village water situation report."""
    prompt = f"""You are JalRakshak AI. Generate a professional Water Situation Report for {village_name}.

Data Summary:
{_format_context(report_data)}

Write a report with these sections:
1. Executive Summary (2-3 sentences)
2. Groundwater Status (1-2 sentences)
3. Drought Risk Assessment (1-2 sentences)
4. Immediate Recommended Actions (3 bullet points)
5. Important Limitations (1 sentence)

Keep each section brief and actionable."""
    return generate_response(prompt)


def generate_action_plan(context: dict, timeframe: str = "all") -> dict:
    """Generate a structured water action plan."""
    prompt = f"""You are JalRakshak AI. Create a practical water action plan for Saurashtra farmers/community.

Current Water Situation:
{_format_context(context)}

Generate specific actions for:
- TODAY: Immediate actions (2-3 items)
- THIS WEEK: Short-term actions (2-3 items)
- THIS MONTH: Medium-term actions (2-3 items)
- THIS SEASON: Seasonal actions (2-3 items)

For each action include: what to do, who is responsible, and why it matters.
Be specific and practical."""
    return generate_response(prompt)


def chat(message: str, history: list = None, context: dict = None, lang: str = "en") -> dict:
    """Conversational interface - Water Copilot."""
    if lang == "gu":
        lang_instruction = (
            "IMPORTANT: You MUST respond entirely in Gujarati (ગુજરાતી) script. "
            "Do not use English in your response. All text must be in Gujarati."
        )
    else:
        lang_instruction = "Respond in clear English."

    system = f"""You are JalRakshak AI Water Copilot, an intelligent water advisor for Saurashtra, Gujarat, India.
You help farmers, community leaders, and water administrators understand:
- Groundwater depletion and trends
- Drought risk and early warning
- Water-efficient crops for Saurashtra
- Recharge structures (check dams, farm ponds, recharge wells)
- Water conservation practices
- Community water action planning

Always be:
- Clear and practical
- Supportive of farmers
- Evidence-based
- Honest about uncertainty
- Brief (3-4 sentences unless asked for detail)

{lang_instruction}"""

    if context:
        context_str = f"\n\nCurrent water data context:\n{_format_context(context)}\n"
        message = context_str + "\nUser question: " + message

    return generate_response(message, system_prompt=system)


def _format_context(context: dict) -> str:
    """Format a context dict as readable text."""
    lines = []
    for k, v in context.items():
        if isinstance(v, dict):
            lines.append(f"{k}:")
            for kk, vv in v.items():
                lines.append(f"  {kk}: {vv}")
        else:
            lines.append(f"{k}: {v}")
    return "\n".join(lines)


def _fallback_text(prompt: str) -> str:
    """Safe fallback text when Granite is unavailable."""
    if "groundwater" in prompt.lower() or "water level" in prompt.lower():
        return ("Based on the available data, groundwater levels show a declining trend in this region. "
                "This is primarily driven by agricultural extraction exceeding natural recharge rates, "
                "combined with below-average rainfall in recent seasons. "
                "Immediate action on water conservation and recharge structures is recommended. "
                "[DEMO MODE: AI explanation - IBM Granite unavailable]")
    elif "drought" in prompt.lower():
        return ("The drought risk analysis indicates elevated concern for this area. "
                "Reduced rainfall combined with high agricultural water demand has created water stress conditions. "
                "Early intervention through crop switching and irrigation efficiency improvements is advisable. "
                "[DEMO MODE: AI explanation - IBM Granite unavailable]")
    elif "crop" in prompt.lower():
        return ("For water-stressed conditions in Saurashtra, drought-tolerant crops such as Bajra, "
                "Moth Bean, and Castor are recommended as alternatives to high-water crops. "
                "These can reduce water demand by 50-70% while maintaining farm income. "
                "[DEMO MODE: AI explanation - IBM Granite unavailable]")
    elif "action" in prompt.lower() or "plan" in prompt.lower():
        return ("Immediate actions: Check existing water sources and conservation structures. "
                "This week: Coordinate with local Gram Panchayat on water rationing. "
                "This month: Survey recharge structure opportunities. "
                "This season: Switch to drought-tolerant crops for remaining cultivation. "
                "[DEMO MODE: AI explanation - IBM Granite unavailable]")
    else:
        return ("JalRakshak AI provides water intelligence for Saurashtra based on groundwater, "
                "rainfall, and agricultural data. The system currently operates in demo mode. "
                "Please configure your IBM watsonx.ai API key in the .env file to enable full AI capabilities. "
                "[DEMO MODE: IBM Granite unavailable]")


def _demo_response(prompt: str) -> dict:
    """Return a demo-mode response."""
    return {
        "text": _fallback_text(prompt),
        "model": settings.watsonx_model_id,
        "demo_mode": True,
        "error": None,
    }
