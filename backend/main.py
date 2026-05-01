import os
import base64
import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from .utils.ai_monitor import AIProctor
proctor = AIProctor()

@app.post("/analyse-frame")
def analyse_frame(data: dict):
    """Real-time webcam frame analysis."""
    frame_b64 = data.get("image")
    if not frame_b64:
        raise HTTPException(status_code=400, detail="Image data required")
    return proctor.analyze_frame(frame_b64)

@app.post("/analyse-audio")
def analyse_audio(data: dict):
    """Real-time audio level analysis."""
    rms = data.get("rms", 0)
    return proctor.analyze_audio(rms)

import csv
import io
from fastapi.responses import StreamingResponse

# Helper to check role (since this version doesn't use tokens yet)
def check_role(user_id: str, db: Session, allowed_roles: List[str]):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail=f"Access denied. Requires one of: {allowed_roles}")
    return user

@app.post("/users")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user.id).first()
    if db_user:
        return db_user
    new_user = models.User(id=user.id, email=user.email, name=user.name, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.delete("/users/{user_id}")
def delete_user(user_id: str, admin_id: str, db: Session = Depends(get_db)):
    """Delete a user. Admin only."""
    check_role(admin_id, db, ["admin"])
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

@app.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}/role")
def update_user_role(user_id: str, role: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return user

@app.get("/promote-to-instructor")
def promote_by_email(email: str, db: Session = Depends(get_db)):
    """Helper to manually promote a user by email."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with email {email} not found in database.")
    user.role = "instructor"
    db.commit()
    return {"message": f"User {email} is now an Instructor", "user": user}

@app.post("/exams")
def create_exam(exam: schemas.ExamCreate, db: Session = Depends(get_db)):
    # BR-1: Only instructors/admins can create exams
    check_role(exam.instructor_id, db, ["instructor", "admin"])
    db_exam = models.Exam(**exam.model_dump())
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam

@app.get("/exams")
def get_exams(db: Session = Depends(get_db)):
    return db.query(models.Exam).all()

@app.get("/exams/{exam_id}")
def get_exam(exam_id: str, db: Session = Depends(get_db)):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@app.delete("/exams/{exam_id}")
def delete_exam(exam_id: str, db: Session = Depends(get_db)):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    return {"message": "Deleted"}

@app.get("/submissions/export/csv")
def export_submissions_csv(user_id: str, db: Session = Depends(get_db)):
    """Export submissions as CSV. Instructor/Admin only."""
    check_role(user_id, db, ["instructor", "admin"])
    subs = db.query(models.Submission).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Exam ID", "Student Name", "Student Email", "Trust Score", "Submitted At"])
    
    for s in subs:
        writer.writerow([s.id, s.exam_id, s.student_name, s.student_email, s.trust_score, s.submitted_at])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=submissions_report.csv"}
    )

@app.post("/submissions")
def create_submission(sub: schemas.SubmissionCreate, db: Session = Depends(get_db)):
    sub_data = sub.model_dump()
    
    # Process incidents to extract base64 images AND audio clips
    for incident in sub_data.get("incidents", []):
        # Handle Images
        if "image" in incident and incident["image"] and incident["image"].startswith("data:image"):
            try:
                header, encoded = incident["image"].split(",", 1)
                file_extension = "jpg" if "jpeg" in header or "jpg" in header else "png"
                file_data = base64.b64decode(encoded)
                filename = f"img_{uuid.uuid4()}.{file_extension}"
                filepath = os.path.join("uploads", filename)
                with open(filepath, "wb") as f: f.write(file_data)
                incident["image"] = f"http://localhost:8000/uploads/{filename}"
            except Exception as e: print("Failed to process image:", e)

        # Handle Audio Clips (REQ-19)
        if "audio" in incident and incident["audio"] and incident["audio"].startswith("data:audio"):
            try:
                _, encoded = incident["audio"].split(",", 1)
                file_data = base64.b64decode(encoded)
                filename = f"audio_{uuid.uuid4()}.webm"
                filepath = os.path.join("uploads", filename)
                with open(filepath, "wb") as f: f.write(file_data)
                incident["audio"] = f"http://localhost:8000/uploads/{filename}"
            except Exception as e: print("Failed to process audio:", e)

    db_sub = models.Submission(**sub_data)
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

@app.get("/submissions")
def get_submissions(db: Session = Depends(get_db)):
    return db.query(models.Submission).all()

@app.get("/submissions/{sub_id}")
def get_submission(sub_id: str, db: Session = Depends(get_db)):
    sub = db.query(models.Submission).filter(models.Submission.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

@app.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    sett = db.query(models.Settings).first()
    if not sett:
        sett = models.Settings()
        db.add(sett)
        db.commit()
        db.refresh(sett)
    return sett

@app.put("/settings")
def update_settings(sett_update: schemas.SettingsUpdate, user_id: str, db: Session = Depends(get_db)):
    """Update system settings. Admin only."""
    check_role(user_id, db, ["admin"])
    sett = db.query(models.Settings).first()
    if not sett:
        sett = models.Settings()
        db.add(sett)
    
    for key, value in sett_update.model_dump().items():
        setattr(sett, key, value)
    
    db.commit()
    db.refresh(sett)
    return sett
