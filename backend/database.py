from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Render 배포 시 DATABASE_URL이 환경 변수로 들어옵니다. 없으면 로컬 SQLite 사용.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./diet_app_v3.db")

# Render/PostgreSQL 호환성: postgres://를 postgresql://로 변환
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLAlchemy 엔진 설정
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # PostgreSQL 등 다른 DB의 경우 (SSL 모드 등을 위한 추가 설정이 필요할 수 있음)
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
