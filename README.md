Tech stack
-   **Frontend:** React
-   **Backend:** Python Flask (Compile ด้วย Nuitka เพื่อเพิ่ม Performance
    และป้องกันการดู Source Code)
-   **Database:** MySQL 8.0
-   **Containerization:** Docker และ Docker Compose


# การเตรียมชุดติดตั้ง (สำหรับ Developer)

หากต้องการ Export ระบบเพื่อไปติดตั้งที่เครื่องลูกค้า ให้ทำตามขั้นตอนนี้

### 1. ให้ระบบรันอยู่ก่อน

``` bash
docker-compose --profile prod up --build
```

ใช้คำสั่ง
**work-measurement-web** อาจจะเปลื่ยนไปตามแต่ละเครื่อง
**Note การดูชื่อ NAMES ของ container ใช้คำสั่งดังนี้**
``` bash
docker ps --filter "name=work-measurement-web"
```

``` bash
docker exec -it work-measurement-web ./factory_app db upgrade
หรือ
manage.bat upgrade
```
และคำสั่งต่อไปนี้สำหรับเริ่มต้นสร้าง user เริ่มต้นกับ system settings

``` bash
docker exec -it work-measurement-web ./factory_app db seed
หรือ
manage.bat seed
```
**section การใช้งานอ่านต่อที่ไฟล์ Manual.md**

### 2. รันสคริปต์ Export

``` bash
export-project.bat
```

สคริปต์นี้จะรวมทุกอย่างที่จำเป็นสำหรับการติดตั้งระบบ

### 3. หลังจากรันเสร็จ

จะได้โฟลเดอร์ชื่อประมาณนี้

    Deploy_YYYYMMDD

ภายในจะมีไฟล์ดังนี้

-   `project_images.tar` → Docker Images ทั้งหมดของระบบ
-   `database_dump.sql` → โครงสร้างฐานข้อมูลและข้อมูลเริ่มต้น
-   `docker-compose.yml` และ `.env` → Config สำหรับรันระบบ
-   `install-project.bat` → สคริปต์สำหรับติดตั้งระบบที่เครื่องลูกค้า

------------------------------------------------------------------------

# วิธีติดตั้งระบบที่เครื่องลูกค้า (Deployment)

## 1. สิ่งที่ต้องมีในเครื่อง

เครื่องลูกค้าต้องติดตั้ง

-   **Docker Desktop (Windows)**

และควรตั้งค่าใน Docker Desktop

    Settings → Resources → File Sharing

ให้สามารถเข้าถึงโฟลเดอร์ที่วางโปรเจกต์ได้

------------------------------------------------------------------------

## 2. ขั้นตอนการติดตั้ง

1.  ลงโปรแกรม Docker Desktop (Windows)
    https://www.docker.com/products/docker-desktop/
    ติดตั้งโปรแกรมแล้วเปิดโปรแกรม
2.  ก๊อปปี้โฟลเดอร์ `Deploy_YYYYMMDD` ไปที่เครื่องลูกค้า
    แนะนำให้วางใน path สั้นๆ เช่น
    C:\factory-qc หรือ Documents
    
    เข้าไปที่ โฟลเดอร์ `Deploy_YYYYMMDD`
    คลิกขวาไฟล์

``` bash
    install-project.bat
```
แล้วเลือก

    Run as Administrator

3.  สคริปต์จะทำงานตามขั้นตอนนี้

-   Load Docker Images (ใช้เวลาประมาณ 1-5 นาที ขึ้นอยู่กับขนาดไฟล์)
-   Start Containers
-   Upgrade Database Structure (Alembic Migration)
-   Import SQL Data

4.  เมื่อหน้าต่างขึ้นข้อความ


    SUCCESS: System is ready!

สามารถเข้าใช้งานระบบได้ที่

    http://localhost

------------------------------------------------------------------------

# การเก็บข้อมูล (Data Storage)

ระบบตั้งค่า **Docker Volume** เพื่อให้ข้อมูลไม่หายเมื่อ Restart Container

ตำแหน่งเก็บข้อมูลมีดังนี้

-   **Database**

```bash
    mysql_data/
```

-   **รูปภาพสินค้า**
```bash
    storage/products/
```
-   **รูปภาพแต่ละจุดตรวจสอบของสินค้า**
```bash
    storage/points/
```
หากต้องการ **สำรองข้อมูลรูปภาพ** สามารถก๊อปปี้โฟลเดอร์

    storage/

ไปเก็บไว้ได้ทันที

------------------------------------------------------------------------

# คำสั่งสำหรับจัดการระบบ

สามารถใช้ไฟล์

    manage.bat

ในการจัดการระบบได้

  คำสั่ง                   รายละเอียด
  ---------------------- ----------------------
  `manage.bat upgrade`   อัปเดตโครงสร้างฐานข้อมูล(database กรณีมีการปรับเปลื่ยน โครงสร้าง table)
  `manage.bat seed`      เพิ่มข้อมูลเริ่มต้นของระบบ(เอาไว้กรณี database ว่างไม่มี username และ system settings)




# Section การติดตั้งเครื่องสำหรับ dev mode และ production mode