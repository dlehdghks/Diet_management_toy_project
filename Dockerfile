# frontend build
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# backend & final stage
FROM python:3.11-slim
WORKDIR /app

# PostgreSQL 연결 의존성 설치
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# backend 폴더 통째로 복사 (내부에서 backend.main 으로 호출 가능하게 함)
COPY backend/ ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# PYTHONPATH 설정으로 모듈 찾기 문제 해결 (루트와 backend 폴더 모두 추가)
ENV PYTHONPATH=/app:/app/backend

EXPOSE 8000
# 쉘 형식으로 변경하여 환경변수 $PORT를 정상적으로 인식하게 함
CMD uvicorn backend.main:app --host 0.0.0.0 --port $PORT
