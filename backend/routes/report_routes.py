from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
from database import get_db
import models, auth as auth_utils
from services import report_service

router = APIRouter()

@router.get("/pdf/{session_id}")
def download_pdf(
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

    pdf_bytes = report_service.generate_session_pdf(session, current_user)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=rehabsense_session_{session_id}.pdf"}
    )

@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user)
):
    sessions = db.query(models.Session).filter(
        models.Session.user_id == current_user.id
    ).all()
    total_reps = sum(s.total_reps for s in sessions)
    total_good = sum(s.good_reps for s in sessions)
    total_duration = sum(s.duration_seconds for s in sessions)
    avg_accuracy = (
        sum(s.accuracy for s in sessions) / len(sessions)
        if sessions else 0
    )
    return {
        "total_sessions": len(sessions),
        "total_reps": total_reps,
        "total_good_reps": total_good,
        "total_duration_seconds": total_duration,
        "avg_accuracy": round(avg_accuracy, 1),
        "joints_trained": list({s.joint_key for s in sessions}),
    }
