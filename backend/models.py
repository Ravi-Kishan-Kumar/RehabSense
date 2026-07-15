from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joint_key = Column(String, nullable=False)
    joint_label = Column(String, nullable=False)
    exercise_name = Column(String, nullable=False)
    exercise_type = Column(String, default="General")
    target_reps = Column(Integer, default=12)
    total_reps = Column(Integer, default=0)
    good_reps = Column(Integer, default=0)
    warn_reps = Column(Integer, default=0)
    bad_reps = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    avg_score = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    user = relationship("User", back_populates="sessions")
    rep_logs = relationship("RepLog", back_populates="session", cascade="all, delete-orphan")
    ai_advice = relationship("AIAdvice", back_populates="session", uselist=False, cascade="all, delete-orphan")

class RepLog(Base):
    __tablename__ = "rep_logs"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    rep_number = Column(Integer, nullable=False)
    quality = Column(String, nullable=False)  # good / warn / bad
    score = Column(Integer, default=0)
    angle = Column(Float, default=0.0)
    issues_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("Session", back_populates="rep_logs")

class AIAdvice(Base):
    __tablename__ = "ai_advice"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    form_feedback = Column(Text, default="")
    next_exercise = Column(String, default="")
    next_reps = Column(Integer, default=12)
    next_sets = Column(Integer, default=3)
    difficulty_adjustment = Column(String, default="maintain")
    tips_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("Session", back_populates="ai_advice")
