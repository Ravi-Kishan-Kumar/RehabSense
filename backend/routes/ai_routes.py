from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth as auth_utils
from services import ai_service
import json

router = APIRouter()

@router.post("/suggest", response_model=schemas.AIAdviceResponse)
def get_suggestion(
    data: schemas.AISuggestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    session = db.query(models.Session).filter(
        models.Session.id == data.session_id,
        models.Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")

    advice_dict = ai_service.get_ai_suggestion(data.dict())

    # Persist advice
    existing = db.query(models.AIAdvice).filter(
        models.AIAdvice.session_id == data.session_id
    ).first()
    if existing:
        db.delete(existing); db.commit()

    advice = models.AIAdvice(
        session_id=data.session_id,
        form_feedback=advice_dict.get("form_feedback", ""),
        next_exercise=advice_dict.get("next_exercise", ""),
        next_reps=advice_dict.get("next_reps", 12),
        next_sets=advice_dict.get("next_sets", 3),
        difficulty_adjustment=advice_dict.get("difficulty_adjustment", "maintain"),
        tips_json=json.dumps(advice_dict.get("tips", [])),
    )
    db.add(advice); db.commit()

    return schemas.AIAdviceResponse(
        form_feedback=advice_dict.get("form_feedback", ""),
        tips=advice_dict.get("tips", []),
        next_exercise=advice_dict.get("next_exercise", ""),
        next_reps=advice_dict.get("next_reps", 12),
        next_sets=advice_dict.get("next_sets", 3),
        difficulty_adjustment=advice_dict.get("difficulty_adjustment", "maintain"),
    )
