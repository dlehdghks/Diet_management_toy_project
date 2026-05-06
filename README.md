# 🥗 AI 식단 추천 서비스 (GEMINI Diet)

사용자의 신체 정보(나이, 성별, 키, 체중)와 활동량, 목표를 기반으로 최적의 일일 섭취 칼로리를 계산하고 맞춤형 식단을 제안하는 웹 서비스입니다.

## 🚀 주요 업데이트 및 변경 사항 (최근)

- **OCR 기능 제거:** 복잡한 인바디 이미지 분석 대신 정확한 사용자 수동 입력 방식으로 롤백하여 안정성을 높였습니다.
- **로컬 개발 환경 최적화:** `localhost` 대신 `127.0.0.1` 바인딩을 기본으로 설정하여 브라우저 접속 호환성을 개선했습니다.
- **배포 이미지 경량화:** OCR 엔진(Tesseract) 의존성을 제거하여 Docker 빌드 속도와 실행 효율을 최적화했습니다.
- **UI/UX 개선:** 차트 데이터 정렬 버그 수정 및 입력 폼 사용자 경험을 개선했습니다.

## 🛠️ 기술 스택

- **Frontend:** React (Vite), TypeScript, Chart.js
- **Backend:** FastAPI (Python), SQLAlchemy, JWT Auth
- **Database:** SQLite (로컬/테스트), PostgreSQL (운영 배포 시 권장)
- **Deployment:** Docker, Render

---

## 💻 로컬 개발 및 실행 방법

### 1. 백엔드 실행
```bash
cd backend
# 가상환경 활성화 (Windows 기준)
.\venv\Scripts\activate
# 의존성 설치
pip install -r requirements.txt
# 서버 실행
uvicorn main:app --reload --port 8000
```

### 2. 프런트엔드 실행
```bash
cd frontend
npm install
# 127.0.0.1:5173으로 실행
npx vite --host 127.0.0.1 --port 5173
```

---

## 📤 직접 변경 사항 반영하기 (Git & Deployment)

소스 코드를 수정한 후 깃허브에 올리고 실제 서버에 배포하는 과정입니다.

### 1. 변경 사항 저장 및 업로드 (Git)
터미널(또는 VS Code 터미널)에서 아래 명령어를 순서대로 입력합니다.

```bash
# 1. 모든 변경 내용을 기록 대상으로 추가
git add .

# 2. 어떤 작업을 했는지 메모와 함께 기록(커밋)
git commit -m "작업 내용 요약 (예: UI 디자인 수정)"

# 3. 깃허브(원격 저장소)로 업로드
git push origin main
```

### 2. 배포 확인 (Deployment)
- **자동 배포:** 현재 설정상 깃허브의 `main` 브랜치에 코드가 올라가면 **Render**에서 이를 감지하고 자동으로 재배포를 시작합니다.
- **진행 상황 확인:** [Render Dashboard](https://dashboard.render.com/)에서 현재 빌드가 진행 중인지, 오류는 없는지 실시간 로그로 확인할 수 있습니다.

---

## 📁 프로젝트 구조 요약
- `backend/`: FastAPI 소스 및 데이터베이스 로직
- `frontend/`: React 소스 및 UI 컴포넌트
- `Dockerfile`: 배포용 컨테이너 설정
- `render.yaml`: Render 서비스 구성 정보

---

## 📝 참고 사항
- 외부 접속 시 Render에서 제공하는 주소로 접속하면 되며, 데이터는 `backend/diet_app_v3.db` 파일에 저장됩니다. (배포 환경에 따라 영구 저장소 설정이 필요할 수 있습니다.)
