from fastapi import UploadFile, APIRouter
from backend.database import db
import json

try:
    import pdfplumber  # type: ignore
except Exception:  # pragma: no cover
    pdfplumber = None

router = APIRouter()


@router.post("/sessions/{session_id}/script")
async def upload_script(session_id: str, file: UploadFile):
    content = ""
    if file.filename.endswith(".pdf"):
        if pdfplumber is not None:
            with pdfplumber.open(file.file) as pdf:
                for page in pdf.pages:
                    content += page.extract_text() or ""
        else:
            content = "[PDF uploaded; parser unavailable]"
    elif file.filename.endswith(".json"):
        data = json.load(file.file)
        content = json.dumps(data)
    else:
        content = (await file.read()).decode("utf-8", errors="ignore")
    await db.update_session_script(session_id, content)
    return {"status": "ready"}
