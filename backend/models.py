from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, JSON
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(String, default="student")

class Exam(Base):
    __tablename__ = "exams"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    date = Column(String)
    time = Column(String)
    instructor_id = Column(String, ForeignKey("users.id"))
    questions = Column(JSON) # Store list of questions
    submissions = relationship("Submission", back_populates="exam")

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(String, primary_key=True, index=True)
    exam_id = Column(String, ForeignKey("exams.id"))
    student_id = Column(String, ForeignKey("users.id"))
    student_name = Column(String)
    student_email = Column(String)
    answers = Column(JSON)
    incidents = Column(JSON)
    trust_score = Column(Float)
    submitted_at = Column(String)

    exam = relationship("Exam", back_populates="submissions")

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    sensitivity = Column(String, default="medium")
    allowedApps = Column(String, default="Calculator, Notepad")
    timeLimit = Column(Integer, default=120)
    lockdown = Column(Boolean, default=True)
    isGazeEnabled = Column(Boolean, default=True)
    isObjectEnabled = Column(Boolean, default=True)
    isAudioEnabled = Column(Boolean, default=True)
    isIdentityEnabled = Column(Boolean, default=True)
