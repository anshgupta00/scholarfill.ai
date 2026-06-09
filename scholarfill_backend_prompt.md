# scholarfill.ai — COMPLETE BACKEND BUILD PROMPT
# Stack: FastAPI + SQLite + Claude API + Playwright + Python 3.11

---

## OVERVIEW

Build the complete backend for scholarfill.ai — an AI-powered scholarship form auto-fill system.
The frontend is already built with React. This backend must serve it exactly.
Use SQLite (no setup needed). Use Claude API (claude-3-5-sonnet-20241022) for AI tasks.
Use Playwright for browser automation.

---

## SETUP COMMANDS (run every one in order, do not skip)

```bash
mkdir scholarfill.ai-backend
cd scholarfill.ai-backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install fastapi==0.111.0
pip install "uvicorn[standard]==0.29.0"
pip install sqlalchemy==2.0.30
pip install aiosqlite==0.20.0
pip install python-multipart==0.0.9
pip install "python-jose[cryptography]==3.3.0"
pip install "passlib[bcrypt]==1.7.4"
pip install pydantic-settings==2.2.1
pip install PyMuPDF==1.24.3
pip install playwright==1.44.0
pip install anthropic==0.28.0
pip install python-dotenv==1.0.1
pip install httpx==0.27.0
pip install aiofiles==23.2.1

playwright install chromium
```

---

## FOLDER STRUCTURE (create every file listed, no extras)

```
scholarfill.ai-backend/
├── main.py
├── .env
├── requirements.txt
├── core/
│   ├── __init__.py
│   ├── config.py
│   ├── database.py
│   └── security.py
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── cv_profile.py
│   └── application.py
├── schemas/
│   ├── __init__.py
│   ├── user.py
│   ├── cv_profile.py
│   └── application.py
├── routers/
│   ├── __init__.py
│   ├── auth.py
│   ├── cv.py
│   ├── forms.py
│   └── applications.py
├── services/
│   ├── __init__.py
│   ├── cv_parser.py
│   ├── form_scraper.py
│   ├── ai_mapper.py
│   └── form_submitter.py
└── uploads/
    └── .gitkeep
```

---

## .env (create this file exactly)

```
SECRET_KEY=scholarfill.ai_super_secret_key_change_in_production_2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DATABASE_URL=sqlite+aiosqlite:///./scholarfill.ai.db
ANTHROPIC_API_KEY=your_anthropic_api_key_here
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:5173
```

---

## requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
aiosqlite==0.20.0
python-multipart==0.0.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic-settings==2.2.1
PyMuPDF==1.24.3
playwright==1.44.0
anthropic==0.28.0
python-dotenv==1.0.1
httpx==0.27.0
aiofiles==23.2.1
```

---

## core/__init__.py

```python
# empty file
```

---

## core/config.py

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str = "scholarfill.ai_super_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    DATABASE_URL: str = "sqlite+aiosqlite:///./scholarfill.ai.db"
    ANTHROPIC_API_KEY: str = ""
    UPLOAD_DIR: str = "./uploads"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
```

---

## core/database.py

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    async with engine.begin() as conn:
        from models.user import User
        from models.cv_profile import CVProfile
        from models.application import Application
        await conn.run_sync(Base.metadata.create_all)
```

---

## core/security.py

```python
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.config import settings
from core.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    from models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise credentials_exception
    return user
```

---

## models/__init__.py

```python
# empty file
```

---

## models/user.py

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    cv_profile: Mapped["CVProfile"] = relationship("CVProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship("Application", back_populates="user", cascade="all, delete-orphan")
```

---

## models/cv_profile.py

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class CVProfile(Base):
    __tablename__ = "cv_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=True)
    structured_data: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string
    file_name: Mapped[str] = mapped_column(String, nullable=True)
    file_path: Mapped[str] = mapped_column(String, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="cv_profile")
```

---

## models/application.py

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    form_url: Mapped[str] = mapped_column(String, nullable=False)
    form_title: Mapped[str] = mapped_column(String, nullable=True)
    form_fields: Mapped[str] = mapped_column(Text, nullable=True)   # JSON string
    filled_data: Mapped[str] = mapped_column(Text, nullable=True)   # JSON string
    status: Mapped[str] = mapped_column(String, default="pending")  # pending | reviewed | submitted | failed
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="applications")
```

---

## schemas/__init__.py

```python
# empty file
```

---

## schemas/user.py

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    avatar: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    token: str
    user: UserOut
```

---

## schemas/cv_profile.py

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class CVProfileOut(BaseModel):
    id: str
    file_name: Optional[str]
    updated_at: datetime
    structured_data: Optional[Any]  # parsed JSON dict

    model_config = {"from_attributes": True}


class CVProfileUpdate(BaseModel):
    structured_data: Any
```

---

## schemas/application.py

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, List


class FormField(BaseModel):
    name: str
    label: str
    type: str
    required: bool = False
    options: List[str] = []
    placeholder: str = ""


class ApplicationOut(BaseModel):
    id: str
    form_url: str
    form_title: Optional[str]
    status: str
    form_fields: Optional[Any]
    filled_data: Optional[Any]
    error_message: Optional[str]
    created_at: datetime
    submitted_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ApplicationCreate(BaseModel):
    form_url: str


class ApplicationUpdate(BaseModel):
    filled_data: Any
```

---

## services/__init__.py

```python
# empty file
```

---

## services/cv_parser.py

```python
"""
Extracts text from a PDF using PyMuPDF,
then calls Claude API to parse it into structured CV JSON.
"""
import json
import fitz  # PyMuPDF
import anthropic
from core.config import settings

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


async def parse_cv(file_path: str) -> dict:
    """
    Main function: extract PDF text → call Claude → return structured dict.
    Returns the CV JSON schema dict on success.
    Returns a partial dict with personal.full_name='Unknown' on failure.
    """
    # Step 1: Extract text
    raw_text = extract_text_from_pdf(file_path)
    if not raw_text:
        return CV_SCHEMA

    # Step 2: Call Claude
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": f"Parse this CV:\n\n{raw_text[:12000]}"}
            ]
        )
        response_text = message.content[0].text.strip()
        
        # Clean response if it has accidental backticks
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        parsed = json.loads(response_text)
        return parsed

    except json.JSONDecodeError:
        # Retry with explicit fix instruction
        try:
            fix_message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4096,
                system="Fix the following text so it is valid JSON only. Return ONLY the JSON, nothing else.",
                messages=[
                    {"role": "user", "content": response_text}
                ]
            )
            fixed = fix_message.content[0].text.strip()
            return json.loads(fixed)
        except Exception:
            return CV_SCHEMA
    except Exception:
        return CV_SCHEMA
```

---

## services/form_scraper.py

```python
"""
Opens a URL in a headless Playwright browser.
Detects all form fields and returns them as structured JSON.
Handles both standard HTML forms and Google Forms.
"""
import json
import base64
from playwright.async_api import async_playwright


async def scrape_form(url: str) -> dict:
    """
    Open the URL, scrape form fields, return structured result.
    
    Returns:
    {
        "title": str,
        "description": str,
        "fields": [{"name", "label", "type", "required", "options", "placeholder"}],
        "screenshot": str (base64 PNG),
        "is_google_form": bool
    }
    """
    is_google_form = "docs.google.com/forms" in url

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        )
        page = await context.new_page()

        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)

        await page.wait_for_timeout(2000)

        # Get page title
        title = await page.title()
        title = title.replace(" - Google Forms", "").replace(" | Google Forms", "").strip()

        # Screenshot
        screenshot_bytes = await page.screenshot(full_page=False, type="png")
        screenshot_b64 = base64.b64encode(screenshot_bytes).decode("utf-8")

        fields = []

        if is_google_form:
            fields = await _scrape_google_form(page)
        else:
            fields = await _scrape_html_form(page)

        # Get description / intro text
        description = ""
        try:
            desc_el = await page.query_selector("div.freebirdFormviewerViewHeaderDescription, .form-description, p.description")
            if desc_el:
                description = (await desc_el.inner_text()).strip()
        except Exception:
            pass

        await browser.close()

        return {
            "title": title or "Untitled Form",
            "description": description,
            "fields": fields,
            "screenshot": screenshot_b64,
            "is_google_form": is_google_form,
        }


async def _scrape_google_form(page) -> list:
    """Extract fields from Google Forms DOM structure."""
    fields = []

    # Google Forms field containers
    field_containers = await page.query_selector_all("div[data-params], div.freebirdFormviewerComponentsQuestionBaseRoot")
    
    if not field_containers:
        # Fallback selector for newer Google Forms
        field_containers = await page.query_selector_all("div[role='listitem']")

    for i, container in enumerate(field_containers):
        try:
            # Get label
            label_el = await container.query_selector(
                "div.freebirdFormviewerComponentsQuestionBaseTitle, "
                "div[class*='questionTitle'], "
                "span[class*='title']"
            )
            label = (await label_el.inner_text()).strip() if label_el else f"Field {i+1}"

            # Required indicator
            required = False
            try:
                required_el = await container.query_selector("span[aria-label='Required question'], span.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk")
                required = required_el is not None
            except Exception:
                pass

            # Determine field type
            field_type = "text"
            options = []

            # Check for textarea (paragraph)
            textarea = await container.query_selector("textarea")
            if textarea:
                field_type = "textarea"

            # Check for radio buttons
            radio_group = await container.query_selector("div[role='radiogroup']")
            if radio_group:
                field_type = "radio"
                option_els = await radio_group.query_selector_all("div[role='radio'] span, label span")
                for opt_el in option_els:
                    opt_text = (await opt_el.inner_text()).strip()
                    if opt_text and opt_text not in options:
                        options.append(opt_text)

            # Check for checkboxes
            checkbox_group = await container.query_selector("div[role='group']")
            if checkbox_group and not radio_group:
                field_type = "checkbox"
                option_els = await checkbox_group.query_selector_all("div[role='checkbox'] span, label span")
                for opt_el in option_els:
                    opt_text = (await opt_el.inner_text()).strip()
                    if opt_text and opt_text not in options:
                        options.append(opt_text)

            # Check for dropdown
            select_el = await container.query_selector("select, div[role='listbox']")
            if select_el:
                field_type = "select"
                option_els = await container.query_selector_all("option, div[role='option']")
                for opt_el in option_els:
                    opt_text = (await opt_el.inner_text()).strip()
                    if opt_text and opt_text not in options:
                        options.append(opt_text)

            # Check for date
            date_el = await container.query_selector("input[type='date'], div.freebirdFormviewerComponentsQuestionDateDateInputs")
            if date_el:
                field_type = "date"

            # Generate field name from label
            field_name = label.lower().replace(" ", "_").replace("/", "_").replace("?", "").replace("*", "")[:40]
            field_name = "".join(c for c in field_name if c.isalnum() or c == "_")
            field_name = field_name or f"field_{i}"

            fields.append({
                "name": field_name,
                "label": label,
                "type": field_type,
                "required": required,
                "options": options,
                "placeholder": "",
            })
        except Exception:
            continue

    return fields


async def _scrape_html_form(page) -> list:
    """Extract fields from standard HTML forms."""
    fields = []
    seen_names = set()

    # Get all interactive form elements
    elements = await page.query_selector_all(
        "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='image']), "
        "textarea, "
        "select"
    )

    for el in elements:
        try:
            tag = (await el.evaluate("el => el.tagName")).lower()
            el_type = (await el.get_attribute("type") or "text").lower()
            el_name = await el.get_attribute("name") or await el.get_attribute("id") or ""
            el_id = await el.get_attribute("id") or ""
            placeholder = await el.get_attribute("placeholder") or ""
            required_attr = await el.get_attribute("required")
            required = required_attr is not None

            if not el_name:
                continue
            if el_name in seen_names:
                continue
            seen_names.add(el_name)

            # Find label
            label = ""
            if el_id:
                label_el = await page.query_selector(f"label[for='{el_id}']")
                if label_el:
                    label = (await label_el.inner_text()).strip()

            if not label:
                # Try aria-label
                label = await el.get_attribute("aria-label") or ""

            if not label:
                # Try parent label
                label = await el.evaluate("""el => {
                    const parent = el.closest('label');
                    return parent ? parent.innerText.trim() : '';
                }""")

            if not label:
                label = placeholder or el_name.replace("_", " ").replace("-", " ").title()

            # Field type mapping
            if tag == "textarea":
                field_type = "textarea"
            elif tag == "select":
                field_type = "select"
            else:
                field_type = el_type if el_type in ["text", "email", "tel", "date", "number", "password", "radio", "checkbox", "file", "url"] else "text"

            # Get options for select
            options = []
            if field_type == "select":
                option_els = await el.query_selector_all("option")
                for opt in option_els:
                    val = (await opt.inner_text()).strip()
                    if val and val not in ["--", "Select", "Choose", "---"]:
                        options.append(val)

            fields.append({
                "name": el_name,
                "label": label,
                "type": field_type,
                "required": required,
                "options": options,
                "placeholder": placeholder,
            })
        except Exception:
            continue

    return fields
```

---

## services/ai_mapper.py

```python
"""
Uses Claude API to intelligently map CV structured data to form fields.
Takes the CV JSON and form fields list, returns {field_name: filled_value}.
"""
import json
import anthropic
from core.config import settings


SYSTEM_PROMPT = """You are an intelligent form-filling assistant for scholarship and participation applications.
You have access to a person's complete CV data and a list of form fields.
Your job is to fill each field with the most appropriate value from the CV.

Rules:
1. Match field labels semantically — understand intent, not just keywords.
2. For "Why do you want to apply / attend / participate?" → write 2-3 genuine sentences using the person's background, skills, and goals from the CV.
3. For "Describe yourself / Tell us about you / Bio" → write 3-4 sentences as a first-person professional summary.
4. For "Project / Innovation / Achievement" fields → use the most impressive relevant project or award from CV.
5. For essay questions (textarea) → write 100-200 words, professional tone, first person.
6. For "Organization / Institution / Company" → use current or most recent employer/institution.
7. For date fields → use ISO format YYYY-MM-DD where possible.
8. For fields you cannot fill (file upload, captcha, payment) → return null for that field.
9. For fields not relevant to the CV → return null.
10. Return ONLY a valid JSON object: {"field_name": "value_or_null"}
11. No explanation. No markdown. No backticks. Only the JSON object."""


async def map_cv_to_form(cv_data: dict, form_fields: list, form_title: str = "") -> dict:
    """
    Call Claude to map CV data to form fields.
    
    Args:
        cv_data: Structured CV dict (from cv_parser)
        form_fields: List of field dicts from form_scraper
        form_title: Title of the form for context
    
    Returns:
        Dict of {field_name: filled_value}
    """
    if not form_fields:
        return {}

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    user_message = f"""Form Title: {form_title}

CV Data:
{json.dumps(cv_data, indent=2)}

Form Fields to Fill:
{json.dumps(form_fields, indent=2)}

Fill every field using the CV data. Return only the JSON object."""

    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}]
        )

        response_text = message.content[0].text.strip()

        # Clean markdown backticks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        result = json.loads(response_text)

        # Remove null values — keep only filled fields
        return {k: v for k, v in result.items() if v is not None}

    except json.JSONDecodeError:
        # Retry: ask Claude to fix its own JSON
        try:
            fix_message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                system="Fix this text to be valid JSON only. Return ONLY the JSON object, nothing else.",
                messages=[{"role": "user", "content": response_text}]
            )
            fixed = fix_message.content[0].text.strip()
            result = json.loads(fixed)
            return {k: v for k, v in result.items() if v is not None}
        except Exception:
            return _fallback_fill(cv_data, form_fields)

    except Exception:
        return _fallback_fill(cv_data, form_fields)


def _fallback_fill(cv_data: dict, form_fields: list) -> dict:
    """
    Simple keyword-based fallback if Claude fails.
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
        field_name = field.get("name", "").lower()
        field_label = field.get("label", "").lower()

        for keyword, value in KEYWORD_MAP.items():
            if keyword in field_name or keyword in field_label:
                if value:
                    result[field.get("name")] = value
                break

    return result
```

---

## services/form_submitter.py

```python
"""
Opens the form URL in Playwright, fills all fields with provided data,
takes a screenshot, and optionally submits the form.
"""
import base64
from playwright.async_api import async_playwright


async def fill_and_submit(
    url: str,
    filled_data: dict,
    form_fields: list,
    submit: bool = False,
    is_google_form: bool = False,
) -> dict:
    """
    Fill a form using Playwright and optionally submit it.

    Returns:
    {
        "success": bool,
        "screenshot": str (base64 PNG),
        "error": str or None
    }
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        )
        page = await context.new_page()

        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)

        await page.wait_for_timeout(2000)

        errors = []

        for field in form_fields:
            field_name = field.get("name", "")
            field_type = field.get("type", "text")
            value = filled_data.get(field_name)

            if not value:
                continue

            value_str = str(value)

            try:
                if is_google_form:
                    await _fill_google_field(page, field, value_str)
                else:
                    await _fill_html_field(page, field, value_str)
            except Exception as e:
                errors.append(f"{field_name}: {str(e)}")
                continue

            await page.wait_for_timeout(200)

        # Screenshot after filling
        screenshot_bytes = await page.screenshot(full_page=False, type="png")
        screenshot_b64 = base64.b64encode(screenshot_bytes).decode("utf-8")

        # Submit if requested
        if submit:
            try:
                # Try common submit button selectors
                submit_selectors = [
                    "input[type='submit']",
                    "button[type='submit']",
                    "div[role='button'][jsname='M2UYVd']",  # Google Forms submit
                    "span:has-text('Submit')",
                    "button:has-text('Submit')",
                    "button:has-text('Send')",
                ]

                submitted = False
                for selector in submit_selectors:
                    try:
                        el = await page.query_selector(selector)
                        if el:
                            await el.click()
                            await page.wait_for_timeout(3000)
                            submitted = True
                            break
                    except Exception:
                        continue

                if not submitted:
                    # Last resort: press Enter on the last field
                    await page.keyboard.press("Enter")
                    await page.wait_for_timeout(2000)

                # Take post-submit screenshot
                screenshot_bytes = await page.screenshot(full_page=False, type="png")
                screenshot_b64 = base64.b64encode(screenshot_bytes).decode("utf-8")

            except Exception as e:
                await browser.close()
                return {"success": False, "screenshot": screenshot_b64, "error": str(e)}

        await browser.close()

        return {
            "success": True,
            "screenshot": screenshot_b64,
            "error": "; ".join(errors) if errors else None,
        }


async def _fill_html_field(page, field: dict, value: str):
    """Fill a standard HTML form field."""
    field_name = field.get("name", "")
    field_type = field.get("type", "text")

    # Build selectors in priority order
    selectors = [
        f"[name='{field_name}']",
        f"[id='{field_name}']",
        f"[placeholder='{field.get('placeholder', '')}']" if field.get("placeholder") else None,
    ]
    selectors = [s for s in selectors if s]

    el = None
    for selector in selectors:
        el = await page.query_selector(selector)
        if el:
            break

    if not el:
        return

    if field_type in ["text", "email", "tel", "url", "number", "password"]:
        await el.fill(value)

    elif field_type == "textarea":
        await el.fill(value)

    elif field_type == "select":
        try:
            await el.select_option(label=value)
        except Exception:
            try:
                await el.select_option(value=value)
            except Exception:
                pass

    elif field_type == "radio":
        # Find radio with matching value or label
        radio_selectors = [
            f"input[type='radio'][value='{value}']",
            f"input[type='radio'][name='{field_name}'][value='{value}']",
        ]
        for sel in radio_selectors:
            try:
                radio = await page.query_selector(sel)
                if radio:
                    await radio.click()
                    break
            except Exception:
                continue

    elif field_type == "checkbox":
        if value.lower() in ["true", "yes", "1", "on"]:
            is_checked = await el.is_checked()
            if not is_checked:
                await el.click()

    elif field_type == "date":
        # Format: YYYY-MM-DD
        try:
            await el.fill(value[:10])
        except Exception:
            await el.type(value[:10])


async def _fill_google_field(page, field: dict, value: str):
    """Fill a Google Forms field by locating it via label text."""
    label = field.get("label", "")
    field_type = field.get("type", "text")

    if not label:
        return

    # Find the container with this label
    containers = await page.query_selector_all("div[role='listitem'], div.freebirdFormviewerComponentsQuestionBaseRoot")

    for container in containers:
        try:
            label_el = await container.query_selector(
                "div.freebirdFormviewerComponentsQuestionBaseTitle, div[class*='questionTitle']"
            )
            if not label_el:
                continue

            container_label = (await label_el.inner_text()).strip()
            if label.lower() not in container_label.lower():
                continue

            # Fill based on type
            if field_type in ["text", "email", "tel", "number"]:
                input_el = await container.query_selector("input[type='text'], input[type='email'], input")
                if input_el:
                    await input_el.fill(value)

            elif field_type == "textarea":
                textarea_el = await container.query_selector("textarea")
                if textarea_el:
                    await textarea_el.fill(value)

            elif field_type == "radio":
                option_els = await container.query_selector_all("div[role='radio'], label")
                for opt_el in option_els:
                    opt_text = (await opt_el.inner_text()).strip()
                    if value.lower() in opt_text.lower():
                        await opt_el.click()
                        break

            elif field_type == "select":
                dropdown = await container.query_selector("div[role='listbox'], select")
                if dropdown:
                    await dropdown.click()
                    await page.wait_for_timeout(500)
                    option_els = await page.query_selector_all("div[role='option'], li[role='option']")
                    for opt_el in option_els:
                        opt_text = (await opt_el.inner_text()).strip()
                        if value.lower() in opt_text.lower():
                            await opt_el.click()
                            break

            break  # Found and filled the container, move to next field
        except Exception:
            continue
```

---

## routers/__init__.py

```python
# empty file
```

---

## routers/auth.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token, get_current_user
from models.user import User
from schemas.user import UserRegister, UserLogin, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == body.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        name=body.name,
        email=body.email,
        password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})
    user_out = UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar=_make_avatar(user.name),
        created_at=user.created_at,
    )
    return TokenResponse(token=token, user=user_out)


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})
    user_out = UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar=_make_avatar(user.name),
        created_at=user.created_at,
    )
    return TokenResponse(token=token, user=user_out)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatar=_make_avatar(current_user.name),
        created_at=current_user.created_at,
    )


def _make_avatar(name: str) -> str:
    """Return initials from name, e.g. 'Ansh Gupta' → 'AG'"""
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper() if name else "?"
```

---

## routers/cv.py

```python
import os
import json
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import get_current_user
from core.config import settings
from models.user import User
from models.cv_profile import CVProfile
from schemas.cv_profile import CVProfileOut, CVProfileUpdate
from services.cv_parser import parse_cv

router = APIRouter(prefix="/api/cv", tags=["cv"])


@router.post("/upload", response_model=CVProfileOut, status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Validate file size (5MB max)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be under 5MB")

    # Save file to disk
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.id)
    os.makedirs(user_upload_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = os.path.join(user_upload_dir, f"{file_id}.pdf")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Parse CV with AI
    structured_data = await parse_cv(file_path)

    # Upsert CV profile (one per user)
    result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = result.scalar_one_or_none()

    if cv_profile:
        cv_profile.raw_text = ""
        cv_profile.structured_data = json.dumps(structured_data)
        cv_profile.file_name = file.filename
        cv_profile.file_path = file_path
    else:
        cv_profile = CVProfile(
            user_id=current_user.id,
            raw_text="",
            structured_data=json.dumps(structured_data),
            file_name=file.filename,
            file_path=file_path,
        )
        db.add(cv_profile)

    await db.commit()
    await db.refresh(cv_profile)

    return _build_cv_out(cv_profile)


@router.get("/me", response_model=CVProfileOut)
async def get_my_cv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = result.scalar_one_or_none()

    if not cv_profile:
        raise HTTPException(status_code=404, detail="No CV uploaded yet")

    return _build_cv_out(cv_profile)


@router.put("/update", response_model=CVProfileOut)
async def update_cv(
    body: CVProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = result.scalar_one_or_none()

    if not cv_profile:
        raise HTTPException(status_code=404, detail="No CV found. Upload first.")

    cv_profile.structured_data = json.dumps(body.structured_data)
    await db.commit()
    await db.refresh(cv_profile)

    return _build_cv_out(cv_profile)


def _build_cv_out(cv_profile: CVProfile) -> CVProfileOut:
    structured = None
    if cv_profile.structured_data:
        try:
            structured = json.loads(cv_profile.structured_data)
        except Exception:
            structured = None

    return CVProfileOut(
        id=cv_profile.id,
        file_name=cv_profile.file_name,
        updated_at=cv_profile.updated_at,
        structured_data=structured,
    )
```

---

## routers/forms.py

```python
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.cv_profile import CVProfile
from models.application import Application
from services.form_scraper import scrape_form
from services.ai_mapper import map_cv_to_form
from services.form_submitter import fill_and_submit

router = APIRouter(prefix="/api/forms", tags=["forms"])


class ScrapeRequest(BaseModel):
    url: str


class FillRequest(BaseModel):
    application_id: str


class PreviewRequest(BaseModel):
    application_id: str


@router.post("/scrape")
async def scrape_and_fill(
    body: ScrapeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Open the URL, scrape form fields, map CV to fields using AI.
    Creates a new Application record and returns it.
    """
    # Get user's CV
    cv_result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = cv_result.scalar_one_or_none()

    cv_data = {}
    if cv_profile and cv_profile.structured_data:
        try:
            cv_data = json.loads(cv_profile.structured_data)
        except Exception:
            cv_data = {}

    # Scrape the form
    try:
        scraped = await scrape_form(body.url)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not open or scrape the form: {str(e)}")

    form_fields = scraped.get("fields", [])
    form_title = scraped.get("title", "Untitled Form")
    is_google_form = scraped.get("is_google_form", False)

    # AI fill
    filled_data = {}
    if cv_data and form_fields:
        try:
            filled_data = await map_cv_to_form(cv_data, form_fields, form_title)
        except Exception:
            filled_data = {}

    # Save application
    application = Application(
        user_id=current_user.id,
        form_url=body.url,
        form_title=form_title,
        form_fields=json.dumps(form_fields),
        filled_data=json.dumps(filled_data),
        status="pending",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    return _build_app_response(application)


@router.post("/fill")
async def refill_application(
    body: FillRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Re-run AI fill on an existing application."""
    result = await db.execute(
        select(Application).where(
            Application.id == body.application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Get CV
    cv_result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = cv_result.scalar_one_or_none()
    cv_data = json.loads(cv_profile.structured_data) if cv_profile and cv_profile.structured_data else {}

    form_fields = json.loads(application.form_fields) if application.form_fields else []

    filled_data = await map_cv_to_form(cv_data, form_fields, application.form_title or "")
    application.filled_data = json.dumps(filled_data)
    application.status = "pending"

    await db.commit()
    await db.refresh(application)

    return _build_app_response(application)


@router.post("/preview")
async def preview_application(
    body: PreviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fill the form in browser and return a screenshot (no submit)."""
    result = await db.execute(
        select(Application).where(
            Application.id == body.application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    form_fields = json.loads(application.form_fields) if application.form_fields else []
    filled_data = json.loads(application.filled_data) if application.filled_data else {}

    result_data = await fill_and_submit(
        url=application.form_url,
        filled_data=filled_data,
        form_fields=form_fields,
        submit=False,
    )

    return {"screenshot": result_data.get("screenshot")}


def _build_app_response(application: Application) -> dict:
    return {
        "id": application.id,
        "form_url": application.form_url,
        "form_title": application.form_title,
        "status": application.status,
        "created_at": application.created_at.isoformat(),
        "submitted_at": application.submitted_at.isoformat() if application.submitted_at else None,
        "form_fields": json.loads(application.form_fields) if application.form_fields else [],
        "filled_data": json.loads(application.filled_data) if application.filled_data else {},
        "error_message": application.error_message,
    }
```

---

## routers/applications.py

```python
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.application import Application
from schemas.application import ApplicationUpdate
from services.form_submitter import fill_and_submit

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("/")
async def list_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
    )
    applications = result.scalars().all()
    return [_build(a) for a in applications]


@router.get("/{application_id}")
async def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return _build(application)


@router.put("/{application_id}/review")
async def review_application(
    application_id: str,
    body: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save user-edited field values and mark as reviewed."""
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.filled_data = json.dumps(body.filled_data)
    application.status = "reviewed"
    await db.commit()
    await db.refresh(application)
    return _build(application)


@router.post("/{application_id}/submit")
async def submit_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Use Playwright to fill and submit the actual form."""
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.status == "submitted":
        raise HTTPException(status_code=400, detail="Already submitted")

    form_fields = json.loads(application.form_fields) if application.form_fields else []
    filled_data = json.loads(application.filled_data) if application.filled_data else {}

    submit_result = await fill_and_submit(
        url=application.form_url,
        filled_data=filled_data,
        form_fields=form_fields,
        submit=True,
    )

    if submit_result.get("success"):
        application.status = "submitted"
        application.submitted_at = datetime.now(timezone.utc)
        application.error_message = None
    else:
        application.status = "failed"
        application.error_message = submit_result.get("error", "Unknown error")

    await db.commit()
    await db.refresh(application)

    return {
        **_build(application),
        "screenshot": submit_result.get("screenshot"),
    }


@router.delete("/{application_id}", status_code=204)
async def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.delete(application)
    await db.commit()


def _build(application: Application) -> dict:
    return {
        "id": application.id,
        "form_url": application.form_url,
        "form_title": application.form_title,
        "status": application.status,
        "created_at": application.created_at.isoformat(),
        "submitted_at": application.submitted_at.isoformat() if application.submitted_at else None,
        "form_fields": json.loads(application.form_fields) if application.form_fields else [],
        "filled_data": json.loads(application.filled_data) if application.filled_data else {},
        "error_message": application.error_message,
    }
```

---

## main.py (FINAL FILE — create this last)

```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import create_tables
from routers import auth, cv, forms, applications


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables and upload directory on startup
    await create_tables()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="scholarfill.ai API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(cv.router)
app.include_router(forms.router)
app.include_router(applications.router)


@app.get("/")
async def root():
    return {"status": "scholarfill.ai API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## HOW TO RUN

```bash
# Make sure venv is activated
cd scholarfill.ai-backend

# Add your Anthropic API key to .env first:
# ANTHROPIC_API_KEY=sk-ant-your-key-here

uvicorn main:app --reload --port 8000
```

API will be live at: http://localhost:8000
Interactive docs at: http://localhost:8000/docs

---

## HOW TO CONNECT TO FRONTEND

In your React frontend, open `src/hooks/useMockApi.js` and replace each mock function:

```js
// Install axios first if not installed:
// npm install axios

import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

// Add JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const mockApi = {

  login: async (email, password) => {
    const res = await API.post('/api/auth/login', { email, password });
    return res.data; // returns { token, user }
  },

  register: async (name, email, password) => {
    const res = await API.post('/api/auth/register', { name, email, password });
    return res.data; // returns { token, user }
  },

  uploadCV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await API.post('/api/cv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data; // returns cv_profile
  },

  scrapeForm: async (url) => {
    const res = await API.post('/api/forms/scrape', { url });
    return res.data; // returns application with filled_data
  },

  submitApplication: async (id) => {
    const res = await API.post(`/api/applications/${id}/submit`);
    return res.data;
  },

};
```

Also remove the `loadMockSession()` call from `src/App.jsx`:
```js
// DELETE this line:
useEffect(() => { loadMockSession(); }, []);
```

---

## API ENDPOINTS REFERENCE

| Method | URL | Auth | Purpose |
|--------|-----|------|---------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Get token |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/cv/upload | Yes | Upload PDF CV |
| GET | /api/cv/me | Yes | Get my CV |
| PUT | /api/cv/update | Yes | Edit CV data |
| POST | /api/forms/scrape | Yes | Scrape URL + AI fill |
| POST | /api/forms/fill | Yes | Re-run AI fill |
| POST | /api/forms/preview | Yes | Get browser screenshot |
| GET | /api/applications/ | Yes | List all applications |
| GET | /api/applications/{id} | Yes | Get one application |
| PUT | /api/applications/{id}/review | Yes | Save edited fields |
| POST | /api/applications/{id}/submit | Yes | Submit the form |
| DELETE | /api/applications/{id} | Yes | Delete application |

---

## TROUBLESHOOTING

**Error: playwright chromium not found**
```bash
playwright install chromium
```

**Error: ModuleNotFoundError**
```bash
# Make sure venv is active, then:
pip install -r requirements.txt
```

**Error: CORS blocked in browser**
- Check `.env` has `FRONTEND_URL=http://localhost:5173`
- Make sure you are running backend on port 8000

**Error: anthropic.AuthenticationError**
- Open `.env` and set your real key: `ANTHROPIC_API_KEY=sk-ant-...`

**SQLite file not created**
- Run `uvicorn main:app --reload` once — it auto-creates `scholarfill.ai.db`

**Google Form not scraping properly**
- Google Forms require JavaScript rendering — Playwright handles this
- Add `await page.wait_for_timeout(3000)` if fields are still empty

---

*End of backend prompt. Build files in the exact order listed. Run setup commands first.*
