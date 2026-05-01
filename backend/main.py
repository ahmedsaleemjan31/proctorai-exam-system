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

@app.post("/exams")
def create_exam(exam: schemas.ExamCreate, db: Session = Depends(get_db)):
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

@app.post("/submissions")
def create_submission(sub: schemas.SubmissionCreate, db: Session = Depends(get_db)):
    sub_data = sub.model_dump()
    
    # Process incidents to extract base64 images
    for incident in sub_data.get("incidents", []):
        if "image" in incident and incident["image"] and incident["image"].startswith("data:image"):
            try:
                # Extract base64 string
                header, encoded = incident["image"].split(",", 1)
                file_extension = "jpg"
                if "png" in header:
                    file_extension = "png"
                
                # Decode and save
                file_data = base64.b64decode(encoded)
                filename = f"{uuid.uuid4()}.{file_extension}"
                filepath = os.path.join("uploads", filename)
                
                with open(filepath, "wb") as f:
                    f.write(file_data)
                
                # Replace base64 string with URL
                incident["image"] = f"http://localhost:8000/uploads/{filename}"
            except Exception as e:
                print("Failed to process image:", e)
                # If it fails, we keep the original string or set to None
                pass

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
def update_settings(sett_update: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    sett = db.query(models.Settings).first()
    if not sett:
        sett = models.Settings()
        db.add(sett)
    
    for key, value in sett_update.model_dump().items():
        setattr(sett, key, value)
    
    db.commit()
    db.refresh(sett)
    return sett
