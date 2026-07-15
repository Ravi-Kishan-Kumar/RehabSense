from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
import models
import auth as auth_utils
from services import ai_service

router = APIRouter()

class ChatMessage(BaseModel):
    role: str   # 'user' or 'model'
    parts: List[dict]

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

@router.post("/chat")
def chat(req: ChatRequest, current_user: models.User = Depends(auth_utils.get_current_user)):
    history = [{"role": m.role, "parts": m.parts} for m in (req.history or [])]
    reply = ai_service.get_chat_response(req.message, history)
    return {"reply": reply}
