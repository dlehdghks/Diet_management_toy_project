# GEMINI Diet Application

개인 맞춤형 식단 추천 및 체중 관리 서비스입니다. 사용자의 신체 정보와 목표를 기반으로 필요한 칼로리를 계산하고, 최적의 식단을 제안합니다.

## 🏗️ 아키텍처 및 기술 스택

### [Frontend]
- **Language**: TypeScript
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS
- **API Client**: Axios
- **Key Path**: `frontend/src/`

### [Backend]
- **Language**: Python 3.11 (Python 3.14 recommended for local)
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Token)
- **OCR Engine**: Tesseract-OCR (InBody 분석용)
- **Libraries**: `pytesseract` (OCR 인터페이스), `Pillow` (이미지 처리), `python-multipart` (파일 업로드)
- **Database**: SQLite (diet_app_v3.db)
- **Key Path**: `backend/`

### [Infrastructure & Deployment]
- **Containerization**: Docker (Multi-stage build)
- **Hosting**: Render (render.yaml 설정 포함)
- **CI/CD**: Docker-based deployment (Dockerfile 내 Tesseract 자동 설치 설정 포함)

---

## 📁 프로젝트 구조

```text
GEMINI/
├── backend/                # FastAPI 백엔드 소스 코드
│   ├── auth.py             # JWT 인증 및 비밀번호 암호화
│   ├── crud.py             # 데이터베이스 CRUD 로직
│   ├── database.py         # SQLAlchemy 엔진 및 세션 설정
│   ├── diet_service.py     # 칼로리 계산 및 식단 추천 로직 / OCR 처리 (Core)
│   ├── main.py             # API 엔드포인트 및 정적 파일 서빙
│   ├── models.py           # SQLAlchemy 데이터베이스 모델
│   ├── schemas.py          # Pydantic 데이터 검증 스키마
│   └── diet_app_v3.db      # SQLite 데이터베이스 파일
├── frontend/               # React 프론트엔드 소스 코드
│   ├── src/
│   │   ├── api.ts          # Axios API 통신 모듈
│   │   ├── App.tsx         # 메인 애플리케이션 컴포넌트
│   │   └── main.tsx        # 진입점
├── Dockerfile              # 프론트엔드 빌드 및 백엔드(Tesseract 포함) 실행을 위한 도커 설정
├── render.yaml             # Render 배포 설정 파일
├── create_excel.py         # 사용설명서 생성 스크립트
└── update_excel.py         # 사용설명서 업데이트 스크립트
```

---

## 🚀 주요 기능 및 메서드

### 1. 백엔드 (Backend)

#### **사용자 및 인증 (`backend/auth.py`, `backend/crud.py`)**
- `create_user(db, user)`: 새로운 사용자 등록 및 비밀번호 해싱
- `get_user_by_username(db, username)`: 사용자 식별
- `create_access_token(data)`: JWT 토큰 생성

#### **식단 & AI 엔진 (`backend/diet_service.py`)**
- **인바디 OCR 분석 (`parse_inbody_image`)**: 
  - 업로드된 이미지에서 나이, 신장, 체중, 기초대사량(BMR)을 자동 추출
- **칼로리 계산 (`calculate_calories`)**: 
  - 인바디 측정값이 있을 경우 우선 사용, 없을 시 **Mifflin-St Jeor** 공식 적용
- **식단 추천 (`get_diet_recommendation`)**:
  - 목표 칼로리에 맞춰 `FOOD_DB`를 활용한 3개 세트의 식단 생성

#### **API 엔드포인트 (`backend/main.py`)**
- `POST /api/register`: 회원가입
- `POST /api/login`: 로그인 및 토큰 발급
- `POST /api/diet/inbody`: 인바디 이미지 업로드 및 데이터 추출
- `GET /api/diet/recommendation`: 개인별 맞춤 식단 추천 결과 반환
- `POST /api/diet/records`: 일일 체중 및 기록 저장
- `GET /api/diet/history`: 사용자의 과거 기록 조회

### 2. 프론트엔드 (Frontend)

#### **API 통신 (`frontend/src/api.ts`)**
- `authApi`: 회원가입, 로그인, 내 정보 수정
- `dietApi`: 식단 추천, 기록 저장, 히스토리 조회, **인바디 분석 요청**

#### **메인 컴포넌트 (`frontend/src/App.tsx`)**
- **입력 모드 전환**: 수동 입력 모드와 인바디 업로드(이미지 기반) 모드 지원
- 인증 상태 관리 및 실시간 분석 리포트 대시보드
- Chart.js 기반 체중 변화 추이 시각화

---

## 🛠️ 실행 방법

### 로컬 개발 환경 (Local Test)

> **중요**: 로컬에서 인바디 분석 기능을 테스트하려면 [Tesseract-OCR](https://github.com/UB-Mannheim/tesseract/wiki)을 별도로 설치해야 합니다. (설치 시 Korean 언어팩 포함 필수)

#### **1. 백엔드 실행**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### **2. 프론트엔드 실행**
```bash
cd frontend
npm install
npm run dev
```

### Docker를 이용한 실행 (프로덕션 환경)
*호스팅 서버(Render 등)에서는 Docker가 Tesseract를 자동으로 설치하므로 수동 설치가 필요 없습니다.*
```bash
# 이미지 빌드
docker build -t diet-app .

# 컨테이너 실행
docker run -p 8000:8000 -e PORT=8000 diet-app
```

---

## 🌐 호스팅 및 배포
본 프로젝트는 **Render**를 통해 호스팅되도록 구성되어 있습니다.
- **Dockerfile**: 인바디 분석을 위한 `tesseract-ocr` 및 `tesseract-ocr-kor` 패키지 자동 설치 포함
- **Environment Variables**:
  - `DATABASE_URL`: 데이터베이스 연결 경로
  - `SECRET_KEY`: JWT 서명용 비밀 키
  - `ALGORITHM`: 암호화 알고리즘 (기본 HS256)
