"""POST /api/chat/{project_id} — port of routes/chat.ts."""
from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm_service import answer_chat_question

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    projectContext: Optional[Dict[str, Any]] = None


@router.post("/{project_id}")
async def chat(project_id: str, body: ChatRequest) -> Dict[str, Any]:
    if not body.question or not body.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    try:
        return await answer_chat_question(
            project_id,
            body.question,
            body.projectContext or {},
        )
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Chat error: %s", exc)
        raise HTTPException(status_code=500, detail="Chat failed")
