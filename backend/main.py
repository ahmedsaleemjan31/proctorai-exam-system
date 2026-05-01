from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
    db_sub = models.Submission(**sub.model_dump())
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
