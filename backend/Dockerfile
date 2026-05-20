# ==========================================
# STAGE 1: Base
# ==========================================
FROM python:3.12-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ==========================================
# STAGE 2: Development
# ==========================================
FROM base AS development
COPY . .
CMD ["python", "src/app.py"]

# ==========================================
# STAGE 3: Production (Compile)
# ==========================================
FROM base AS production
# ติดตั้ง Rust และ Nuitka
RUN apt-get update && apt-get install -y curl \
    patchelf \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y 
ENV PATH="/root/.cargo/bin:${PATH}"
RUN pip install --no-cache-dir nuitka

COPY . .

# สั่ง Compile (ใช้ nuitka ตัวเล็ก)
# เพิ่ม --follow-imports เพื่อให้เก็บไฟล์ทั้งหมดใน src/ เข้าไปด้วย
RUN python -m nuitka \
    --onefile \
    --standalone \
    --follow-imports \
    --include-data-dir=/usr/local/lib/python3.12/site-packages/flask_migrate=flask_migrate \
    --include-module=logging.config \
    --include-module=logging.handlers \
    --no-deployment-flag=self-execution \
    src/app.py -o /app/factory_app

# ==========================================
# STAGE 4: Final Production (ใช้งานจริง)
# ==========================================
# ใช้ base image เดียวกันเพื่อป้องกัน Library version mismatch
FROM python:3.12-slim AS final-prod
WORKDIR /app

# ติดตั้ง Runtime libs ที่จำเป็น (ลดขนาดลงเหลือแค่ที่ต้องใช้)
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# ก๊อปปี้ไฟล์ Binary มาจาก Stage Production
COPY --from=production /app/factory_app .

# สั่งรัน (ใช้ ENTRYPOINT เพื่อรับค่าจาก CMD หรือ Docker-compose ได้)
ENTRYPOINT ["./factory_app"]