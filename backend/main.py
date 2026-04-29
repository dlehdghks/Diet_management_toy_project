from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt
import datetime

import models, crud, schemas, auth, diet_service
from database import get_db, engine, Base

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GEMINI Diet API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

async def get_current_user_optional(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        user = crud.get_user_by_username(db, username=username)
        return user
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = await get_current_user_optional(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@app.get("/")
def read_root(): return {"message": "Welcome to GEMINI AI Diet API"}

# Auth APIs
@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    return crud.create_user(db, user)

@app.post("/login")
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=user_credentials.username)
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=schemas.User)
def update_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.update_user_profile(db, current_user.id, user_update)

# Diet APIs
@app.get("/diet/recommendation")
async def get_recommendation(
    age: Optional[int] = None,
    gender: Optional[str] = None,
    height: Optional[int] = None,
    weight: Optional[int] = None,
    activity_level: Optional[str] = None,
    goal: Optional[str] = None,
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    # 1. 실시간 쿼리 파라미터를 최우선으로 사용
    # 2. 파라미터가 없으면 로그인된 사용자의 DB 정보 사용
    # 3. 둘 다 없으면 기본값(또는 None)
    
    data = {
        "age": age if age is not None else (current_user.age if current_user else None),
        "gender": gender if gender is not None else (current_user.gender if current_user else None),
        "height": height if height is not None else (current_user.height if current_user else None),
        "weight": weight if weight is not None else (current_user.weight if current_user else None),
        "activity_level": activity_level if activity_level is not None else (current_user.activity_level if current_user else None),
        "goal": goal if goal is not None else (current_user.goal if current_user else None)
    }
    
    calc = diet_service.calculate_calories(data)
    if not calc:
        return {"message": "신체 정보를 입력해주세요."}
    
    rec = diet_service.get_diet_recommendation(
        data["goal"], 
        calc["target_calories"]
    )
    return {"calculation": calc, "recommendation": rec}

@app.post("/diet/records")
def save_record(record: schemas.DietRecordCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # dict()와 model_dump() 모두 대응 가능하도록 처리
        data = record.model_dump() if hasattr(record, "model_dump") else record.dict()
        db_record = models.DietRecord(**data, user_id=current_user.id)
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return {"message": "기록되었습니다."}
    except Exception as e:
        print(f"SAVE ERROR: {str(e)}") # 서버 콘솔에 에러 출력
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/diet/history", response_model=List[schemas.DietRecord])
def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    all_records = db.query(models.DietRecord).filter(models.DietRecord.user_id == current_user.id).order_by(models.DietRecord.date.desc()).all()
    
    unique_records = {}
    for r in all_records:
        # 한국 시간대 등을 고려하지 않은 단순 서버 날짜 기준 (YYYY-MM-DD)
        date_str = r.date.strftime("%Y-%m-%d")
        if date_str not in unique_records:
            unique_records[date_str] = r
            
    # 결과를 다시 날짜 내림차순(최신순)으로 정렬하여 반환
    result = list(unique_records.values())
    return result
