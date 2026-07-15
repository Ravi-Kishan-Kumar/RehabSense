from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter()

@router.post("", response_model=schemas.SessionResponse)
def create_session(
    data: schemas.SessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    session = models.Session(user_id=current_user.id, **data.dict())
    db.add(session); db.commit(); db.refresh(session)
    return session

@router.put("/{session_id}", response_model=schemas.SessionResponse)
def update_session(
    session_id: int,
    data: schemas.SessionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    for k, v in data.dict().items():
        setattr(session, k, v)
    session.ended_at = datetime.utcnow()
    db.commit(); db.refresh(session)
    return session

@router.get("", response_model=List[schemas.SessionResponse])
def list_sessions(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    return db.query(models.Session).filter(
        models.Session.user_id == current_user.id
    ).order_by(models.Session.started_at.desc()).offset(skip).limit(limit).all()

@router.get("/{session_id}", response_model=schemas.SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    return session

@router.post("/reps/batch")
def save_rep_batch(
    data: schemas.RepLogBatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    session = db.query(models.Session).filter(
        models.Session.id == data.session_id,
        models.Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    for r in data.reps:
        rep = models.RepLog(
            session_id=data.session_id,
            rep_number=r.rep_number,
            quality=r.quality,
            score=r.score,
            angle=r.angle,
            issues_json=json.dumps(r.issues),
        )
        db.add(rep)
    db.commit()
    return {"saved": len(data.reps)}
