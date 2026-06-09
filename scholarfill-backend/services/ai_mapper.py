"""
Uses the configured AI provider (Groq or Gemini) to intelligently map CV data to form fields.
Set AI_PROVIDER in .env to switch providers. See services/ai_client.py for details.
"""
import json
import logging
from services.ai_client import ai_complete
from core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an elite, highly intelligent form-filling assistant for scholarship, event, and job applications.
You have access to a person's structured CV data, the form's title and description, and a list of form fields (with their labels, types, and options).

Your task: Fill EVERY field in the form intelligently and professionally, matching the user's background to the form's goals.

=== STRICT RESPONSE FORMAT ===
You must return ONLY a raw JSON object where keys are the field "name" from the input fields list, and values are the generated answers.
Example: {"first_name": "Alice", "interests": "Machine Learning, Web Development"}
Return ONLY the raw JSON object. Do not include markdown formatting (like ```json), conversation, or explanations.

=== CORE INSTRUCTIONS ===

1. STRICT USER INSTRUCTION OVERRIDE:
   - If the user provides "User Custom Instructions/Context", you MUST prioritize it over everything else.
   - If the user says "set graduation to 2027", do so even if the CV says 2026.
   - Use the custom instructions to customize essay responses, pick specific projects, or choose particular options.

2. MULTIPLE CHOICE FIELDS (radio, select, checkbox):
   - You will be given a list of "options" for these fields.
   - You MUST pick your answer from the provided "options" list. The returned value MUST match one of the options EXACTLY (case, punctuation, spelling).
   - If no option is an exact match for the CV details, choose the closest semantic match. For example, if the options are ["Student", "Professional", "Other"] and the CV shows they are currently in university, select "Student".
   - For checkboxes, if multiple options match, return them as a comma-separated string (e.g., "Python, JavaScript, SQL") containing values exactly matching options.

3. PERSONAL INFORMATION MAPPING:
   - Split full_name into first/last name if the form has separate fields (e.g., "first_name" / "last_name").
   - Extract links (GitHub, LinkedIn, Website) and place them in appropriate URL fields.

4. EDUCATION & INSTITUTIONS:
   - For "School", "Institution", "University", "College", use the current or most recent institution from the CV.
   - For "Degree", "Major", "Field of Study", map to the current education level.
   - If asked for "Year of Study" or "Current Grade", calculate it based on the graduation year relative to the current year (2026). E.g., if graduating in 2027, they are likely a junior/3rd-year student or senior.

5. ESSAYS, BIO, AND MOTIVATION FIELDS:
   - For fields asking "Why do you want to apply?", "Motivation", "Tell us about yourself", or "Brief Bio":
     - Write in the first person ("I...", "My...").
     - Use a highly professional, confident, and persuasive tone.
     - Tailor the text to the form's theme (e.g., if it is an AI event, highlight AI skills, projects, and achievements from the CV).
     - Keep essay answers between 100 to 200 words. For short bios or motivation statements, write 3 to 4 impactful sentences.
     - NEVER use generic placeholders. Write a completed, ready-to-submit response.

6. PROJECT & EXPERIENCES:
   - If the form asks for "Project Name", "Describe your project", or "Tech stack of your project":
     - Select the most relevant project from the CV projects list (e.g., select an AI project for an AI application).
     - Write a clear, structured description detailing the project's purpose, technologies used, and the applicant's role/accomplishments.

7. WORK & SKILLS:
   - Highlight skills that align directly with the form's context (e.g., if the form is for a full-stack role, focus on React, Node.js, databases).
   - Use the applicant's current or most recent job/experience for queries about "current role" or "employer".

8. REQUIRED FIELDS GUARD:
   - If a field is marked "required", you MUST make an educated guess using the CV and form context. Do not leave required fields empty or null.

9. SPECIAL FIELDS:
   - For files, captcha, signature, date of submission, or payment fields, return null."""


def minimize_cv_data(cv: dict) -> dict:
    """
    Minimizes the CV structure to reduce token usage.
    Removes references, limits lists, and truncates long descriptions.
    """
    if not cv:
        return {}
    
    mini = {}
    
    # 1. Personal Info
    if "personal" in cv and cv["personal"]:
        mini["personal"] = cv["personal"]
        
    # 2. Summary (limit length)
    if "summary" in cv and cv["summary"]:
        mini["summary"] = cv["summary"][:300] + "..." if len(cv["summary"]) > 300 else cv["summary"]
        
    # 3. Education (keep all, but clean up achievements)
    if "education" in cv and cv["education"]:
        mini["education"] = []
        for edu in cv["education"]:
            entry = {
                "degree": edu.get("degree"),
                "field": edu.get("field"),
                "institution": edu.get("institution"),
                "start_year": edu.get("start_year"),
                "end_year": edu.get("end_year"),
                "gpa": edu.get("gpa")
            }
            if edu.get("achievements"):
                entry["achievements"] = [a[:100] for a in edu["achievements"][:3]]
            mini["education"].append(entry)
            
    # 4. Experience (limit to most recent 3, truncate descriptions)
    if "experience" in cv and cv["experience"]:
        mini["experience"] = []
        for exp in cv["experience"][:3]:
            entry = {
                "title": exp.get("title"),
                "organization": exp.get("organization"),
                "start_date": exp.get("start_date"),
                "end_date": exp.get("end_date"),
            }
            if exp.get("description"):
                desc = exp["description"]
                entry["description"] = desc[:200] + "..." if len(desc) > 200 else desc
            if exp.get("highlights"):
                entry["highlights"] = [h[:100] for h in exp["highlights"][:3]]
            mini["experience"].append(entry)
            
    # 5. Skills
    if "skills" in cv and cv["skills"]:
        mini["skills"] = cv["skills"]
        
    # 6. Projects (limit to top 3, truncate descriptions)
    if "projects" in cv and cv["projects"]:
        mini["projects"] = []
        for proj in cv["projects"][:3]:
            entry = {
                "name": proj.get("name"),
                "tech_stack": proj.get("tech_stack"),
                "year": proj.get("year")
            }
            if proj.get("description"):
                desc = proj["description"]
                entry["description"] = desc[:200] + "..." if len(desc) > 200 else desc
            mini["projects"].append(entry)
            
    # 7. Certifications & Awards (limit to 3 each)
    if "certifications" in cv and cv["certifications"]:
        mini["certifications"] = cv["certifications"][:3]
    if "awards" in cv and cv["awards"]:
        mini["awards"] = cv["awards"][:3]
        
    return mini


async def map_cv_to_form(
    cv_data: dict,
    form_fields: list,
    form_title: str = "",
    form_description: str = "",
    user_instructions: str | None = None,
    model: str | None = None,
) -> dict:
    """
    Call the configured AI provider to map CV data to form fields.
    """
    if not form_fields:
        return {}

    # Minimize CV data to reduce token usage
    cv_data_minimized = minimize_cv_data(cv_data)

    # Build a compact field summary that includes options (critical for radio/select)
    field_summary = []
    for f in form_fields:
        entry = {
            "name": f.get("name"),
            "label": f.get("label"),
            "type": f.get("type"),
            "required": f.get("required", False),
        }
        if f.get("options"):
            entry["options"] = f["options"]
        field_summary.append(entry)

    user_message = f"""Form Title: {form_title}
Form Description: {form_description or "(none provided)"}

CV Data:
{json.dumps(cv_data_minimized, indent=2)}

Form Fields to Fill:
{json.dumps(field_summary, indent=2)}"""

    if user_instructions:
        user_message += f"\n\nUser Custom Instructions/Context:\n{user_instructions}\n"
        user_message += "\nIMPORTANT: The user has provided these explicit instructions/values for filling the form. Prioritize these instructions/values over the general CV data when matching fields."

    user_message += "\n\nUsing the form title, description, and custom instructions as context, fill every field intelligently from the CV. Return only the JSON object."

    response_text = ""
    try:
        response_text = await ai_complete(
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
            max_tokens=2048,
            temperature=0.1,
            json_mode=True,
        )
    except Exception as e:
        logger.error(f"AI mapping failed: {e}")
        return _fallback_fill(cv_data, form_fields)

    try:
        # Strip accidental markdown code fences if any
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        result = json.loads(response_text)
        return {k: v for k, v in result.items() if v is not None}
    except Exception as parse_e:
        logger.error(f"JSON parsing error: {parse_e}")
        return _fallback_fill(cv_data, form_fields)


def _fallback_fill(cv_data: dict, form_fields: list) -> dict:
    """
    Simple keyword-based fallback if Groq call fails.
    Maps common field names directly from CV personal data.
    """
    personal = cv_data.get("personal", {})
    result = {}

    KEYWORD_MAP = {
        "name": personal.get("full_name", ""),
        "full_name": personal.get("full_name", ""),
        "email": personal.get("email", ""),
        "phone": personal.get("phone", ""),
        "address": personal.get("address", ""),
        "city": personal.get("city", ""),
        "country": personal.get("country", ""),
        "linkedin": personal.get("linkedin", ""),
        "github": personal.get("github", ""),
        "website": personal.get("website", ""),
        "organization": (cv_data.get("experience") or [{}])[0].get("organization", ""),
        "institution": (cv_data.get("education") or [{}])[0].get("institution", ""),
        "degree": (cv_data.get("education") or [{}])[0].get("degree", ""),
        "summary": cv_data.get("summary", ""),
    }

    for field in form_fields:
        if field.get("type") == "file":
            continue
        field_name = field.get("name", "").lower()
        field_label = field.get("label", "").lower()
        for keyword, value in KEYWORD_MAP.items():
            if keyword in field_name or keyword in field_label:
                if value:
                    result[field.get("name")] = value
                break

    return result


async def generate_form_summary(form_title: str, form_description: str, form_fields: list, model: str | None = None) -> str:
    """
    Generate a short, friendly summary explaining what the form is about.
    """
    if not form_title and not form_description and not form_fields:
        return "This is an empty form."

    # Build a simple summary of the fields
    field_labels = [f.get("label") or f.get("name") for f in form_fields if f.get("label") or f.get("name")]
    fields_list = ", ".join(field_labels[:15])
    if len(field_labels) > 15:
        fields_list += f" (and {len(field_labels) - 15} more fields)"

    system_prompt = (
        "You are an assistant that summarizes forms (e.g. applications, surveys, registrations).\n"
        "Generate a brief, user-friendly summary (2-3 sentences max) explaining: \n"
        "1. The main subject/purpose of this form (what is this form for?).\n"
        "2. What information it is collecting.\n"
        "Avoid meta-language like 'This form is for...' or 'This application is...'. Start directly explaining the purpose.\n"
        "Keep the tone professional and clear. Return ONLY the final summary paragraph, no intro/outro."
    )

    user_message = (
        f"Form Title: {form_title}\n"
        f"Form Description: {form_description or '(none provided)'}\n"
        f"Fields captured: {fields_list}\n\n"
        f"Summarize the subject and objective of this form:"
    )

    try:
        summary = await ai_complete(
            system_prompt=system_prompt,
            user_message=user_message,
            max_tokens=256,
            temperature=0.3,
            json_mode=False,
        )
        if summary.startswith('"') and summary.endswith('"'):
            summary = summary[1:-1]
        return summary
    except Exception as e:
        logger.error(f"Error generating form summary: {e}")
        if form_description:
            return form_description[:200]
        return f"Application form for '{form_title}' collecting details like {fields_list[:100]}."
