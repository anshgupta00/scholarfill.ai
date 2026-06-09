"""
Extracts text from a PDF using PyMuPDF,
then calls the configured AI provider to parse it into structured CV JSON.
Set AI_PROVIDER in .env to switch between Groq and Gemini.
"""
import json
import logging
import fitz  # PyMuPDF
from services.ai_client import ai_complete

logger = logging.getLogger(__name__)

CV_SCHEMA = {
    "personal": {
        "full_name": "", "email": "", "phone": "", "address": "",
        "city": "", "country": "", "linkedin": "", "github": "", "website": "", "date_of_birth": ""
    },
    "summary": "",
    "education": [{"degree": "", "field": "", "institution": "", "location": "", "start_year": "", "end_year": "", "gpa": "", "achievements": []}],
    "experience": [{"title": "", "organization": "", "location": "", "start_date": "", "end_date": "", "description": "", "highlights": []}],
    "skills": {"technical": [], "soft": [], "languages": [], "tools": []},
    "projects": [{"name": "", "description": "", "tech_stack": [], "url": "", "year": ""}],
    "certifications": [{"name": "", "issuer": "", "year": "", "url": ""}],
    "awards": [{"title": "", "issuer": "", "year": "", "description": ""}],
    "extracurricular": [],
    "references": []
}

SYSTEM_PROMPT = f"""You are a CV parser. Extract all information from the CV text provided by the user.
Return ONLY a valid JSON object matching this exact schema:
{json.dumps(CV_SCHEMA, indent=2)}

Rules:
- If a field is not found, use empty string "" or empty array [].
- Extract ALL entries for education, experience, projects, awards — do not skip any.
- For skills, categorize into technical, soft, languages, tools.
- Return ONLY the JSON object. No explanation. No markdown. No backticks."""


def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file using PyMuPDF."""
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


async def parse_cv(file_path: str, model: str | None = None) -> dict:
    """
    Main function: extract PDF text → call AI provider → return structured dict.
    Returns the CV JSON schema dict on success, empty CV_SCHEMA on failure.
    """
    # Step 1: Extract text from PDF
    raw_text = extract_text_from_pdf(file_path)
    if not raw_text:
        logger.warning("CV parser: PDF contained no extractable text.")
        return CV_SCHEMA

    # Step 2: Call AI provider
    response_text = ""
    try:
        response_text = await ai_complete(
            system_prompt=SYSTEM_PROMPT,
            user_message=f"Parse this CV:\n\n{raw_text[:12000]}",
            max_tokens=4096,
            temperature=0.1,
            json_mode=True,
        )

        # Strip accidental markdown code fences
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        parsed = json.loads(response_text)
        logger.info("CV parser: successfully parsed CV.")
        return parsed

    except json.JSONDecodeError as e:
        logger.error(f"CV parser: AI returned invalid JSON. Error: {e}. Preview: {response_text[:300]}")
        # Retry: ask model to fix its own output
        if response_text:
            try:
                fix_response = await ai_complete(
                    system_prompt="Fix the following text so it is valid JSON only. Return ONLY the JSON object, nothing else.",
                    user_message=response_text,
                    max_tokens=4096,
                    temperature=0,
                    json_mode=True,
                )
                return json.loads(fix_response)
            except Exception as e2:
                logger.error(f"CV parser: retry fix also failed: {e2}")
        return CV_SCHEMA

    except Exception as e:
        logger.error(f"CV parser: unexpected error: {type(e).__name__}: {e}")
        return CV_SCHEMA
