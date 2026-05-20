# Stage 1: Build React
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Apache
FROM httpd:2.4-alpine

# ก๊อปปี้ไฟล์ที่ Build เสร็จแล้ว
COPY --from=build-stage /app/dist/ /usr/local/apache2/htdocs/

# แก้ไข httpd.conf เดิมในเครื่อง (เปิดใช้งาน Proxy และ Rewrite)
RUN sed -i \
    -e 's/^#\(LoadModule proxy_module\)/\1/' \
    -e 's/^#\(LoadModule proxy_http_module\)/\1/' \
    -e 's/^#\(LoadModule rewrite_module\)/\1/' \
    conf/httpd.conf

# เพิ่มการตั้งค่า Custom (Proxy และ React Router) ต่อท้ายไฟล์เดิม
COPY custom-httpd.conf /tmp/custom-httpd.conf
RUN cat /tmp/custom-httpd.conf >> conf/httpd.conf