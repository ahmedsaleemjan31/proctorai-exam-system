from pydantic import BaseModel
from typing import List, Optional, Any, Dict

class UserCreate(BaseModel):
    id: str
    email: str
    name: str
    role: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    class Config:
        from_attributes = True

class ExamCreate(BaseModel):
    id: str
    name: str
    date: str
    time: str
    instructor_id: str
    questions: List[Dict[str, Any]]
    assigned_students: Optional[List[str]] = []

class SubmissionCreate(BaseModel):
    id: str
    exam_id: str
    student_id: str
    student_name: str
    student_email: str
    answers: Dict[str, Any]
    incidents: List[Dict[str, Any]]
    trust_score: float
    submitted_at: str
    ai_grade: Optional[Dict[str, Any]] = None

class SettingsUpdate(BaseModel):
    sensitivity: str
    allowedApps: str
    timeLimit: int
    lockdown: bool
    isGazeEnabled: bool
    isObjectEnabled: bool
    isAudioEnabled: bool
    isIdentityEnabled: bool

class EmailReportRequest(BaseModel):
    to_email: str
    student_name: str
    exam_id: str
    pdf_content: str # base64 string
