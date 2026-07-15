from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ── Auth ──────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    created_at: datetime
    class Config: from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ── Sessions ──────────────────────────────────────────────────
class SessionCreate(BaseModel):
    joint_key: str
    joint_label: str
    exercise_name: str
    exercise_type: str
    target_reps: int

class SessionUpdate(BaseModel):
    total_reps: int
    good_reps: int
    warn_reps: int
    bad_reps: int
    accuracy: float
    avg_score: float
    duration_seconds: int

class RepLogCreate(BaseModel):
    rep_number: int
    quality: str
    score: int
    angle: float
    issues: List[str] = []

class RepLogBatch(BaseModel):
    session_id: int
    reps: List[RepLogCreate]

class RepLogResponse(BaseModel):
    id: int
    rep_number: int
    quality: str
    score: int
    angle: float
    issues_json: str
    created_at: datetime
    class Config: from_attributes = True

class SessionResponse(BaseModel):
    id: int
    joint_key: str
    joint_label: str
    exercise_name: str
    exercise_type: str
    target_reps: int
    total_reps: int
    good_reps: int
    warn_reps: int
    bad_reps: int
    accuracy: float
    avg_score: float
    duration_seconds: int
    started_at: datetime
    ended_at: Optional[datetime]
    rep_logs: List[RepLogResponse] = []
    class Config: from_attributes = True

# ── AI ────────────────────────────────────────────────────────
class AISuggestRequest(BaseModel):
    session_id: int
    joint_key: str
    joint_label: str
    exercise_name: str
    total_reps: int
    good_reps: int
    warn_reps: int
    bad_reps: int
    accuracy: float
    avg_score: float
    rep_log: List[dict] = []

class AIAdviceResponse(BaseModel):
    form_feedback: str
    tips: List[str]
    next_exercise: str
    next_reps: int
    next_sets: int
    difficulty_adjustment: str
