# Backend Architecture and Data Flows

นี่คือ Diagram โครงสร้างระบบ (System Architecture) และความสัมพันธ์ของข้อมูล (Entity Relationship) ของโปรเจกต์ Backend นี้ครับ 

## วิธีการนำไปใช้ใน Draw.io
1. ให้เปิดเว็บ [draw.io](https://app.diagrams.net/)
2. สร้าง Diagram ใหม่
3. ไปที่เมนู **Arrange -> Insert -> Advanced -> Mermaid...** (หรือ **คลิกเครื่องหมาย + บน Toolbar -> Advanced -> Mermaid...**)
4. Copy โค้ดของ Mermaid ด้านล่างไปวาง แล้วกด Insert จะได้รูป Diagram ทันทีครับสามารถปรับแก้ต่อได้เลย

---

### 1. System Architecture Diagram (Layered Architecture - DDD)
โค้ดสำหรับนำไปวางใน draw.io เพื่อแสดงโครงสร้างชั้น (Layer) ของโค้ดที่มีการแบ่งเป็น Api, Application, Domain, Infrastructure

```mermaid
classDiagram
    direction TB

    %% Presentation Layer
    namespace API_Layer {
        class Routes {
            +auth_routes
            +measurement_routes
            +product_routes
            +sensor_routes
            +systemSettings_routes
            +user_routes
        }
    }

    %% Application Layer
    namespace Application_Layer {
        class Services {
            +auth_service
            +mea_draft_service
            +mea_service
            +product_service
            +sensor_service
            +system_service
            +user_service
        }
        class DTOs {
            +userDTO
            +productDTO
            +measurementDTO
            +sensorDTO
        }
    }

    %% Domain Layer
    namespace Domain_Layer {
        class DomainLogic {
            +draft_flowmanager
            +measurement_domain
            +measurement_finalizer
        }
        class RuleEngine {
            +AirGaugeRule
            +MitutoyoRule
        }
    }

    %% Infrastructure Layer
    namespace Infrastructure_Layer {
        class Repositories {
            +user_repository
            +product_repository
            +mea_repository
            +sensor_repository
            +setting_repository
        }
        class PersistenceModels {
            +user_model
            +product_model
            +measurement_model
            +sensor_model
            +system_settings
        }
        class Database {
            +database.py
        }
    }

    %% Relationships
    Routes --> Services : เรียกใช้งาน (Controller to Service)
    Routes ..> DTOs : รับ/ส่งข้อมูล Request & Response
    Services --> DomainLogic : ใช้งาน Business Logic
    Services --> RuleEngine : ตัดสินใจตาม Rules ควบคุมคุณภาพ
    Services --> Repositories : ดึงและบันทึกข้อมูล
    Repositories --> PersistenceModels : Map ข้อมูลฐานข้อมูลกับ Model
    PersistenceModels --> Database : อ่านเขียนข้อมูล (SQL/ORM)
```

---

### 2. Entity Relationship Diagram (ER Diagram)
Diagram แสดงความสัมพันธ์ของ Entity / Database Table ในระบบ

```mermaid
erDiagram
    USER ||--o{ MEASUREMENT : records
    PRODUCT ||--o{ MEASUREMENT : "measured on (spec)"
    SENSOR ||--o{ MEASUREMENT : uses

    MEASUREMENT {
        int id PK
        int user_id FK
        int product_id FK
        int sensor_id FK
        datetime created_at
        string status
    }

    MEASUREMENT_DRAFT_SPEC ||--o{ MEASUREMENT_RAW_VALUE : contains
    
    PRODUCT {
        int id PK
        string name
        string image_path
    }

    USER {
        int id PK
        string username
        string role
    }

    SENSOR {
        int id PK
        string model
        string connection_type
    }

    SYSTEM_SETTINGS {
        int id PK
        string key
        string value
    }

    HISTORY_DATA {
        int id PK
        string log_details
        datetime timestamp
    }
```

---

## สรุปโครงสร้าง Backend (Domain-Driven Design Pattern)
ระบบนี้ถูกออกแบบตามแนวคิด **Clean Architecture / Domain-Driven Design (DDD)** โดยแบ่งออกเป็น:
1. **API (`src/api`)**: รับผิดชอบเรื่องการรับ HTTP Request (Routes) เเละจัดการการสื่อสารจากภายนอก
2. **Application (`src/application`)**: มี `services` ที่เป็น Use Cases หลักของระบบ เเละ `dtos` (Data Transfer Objects) ไว้ลดทอนรูปทรงของข้อมูลก่อนส่งออก
3. **Domain (`src/domain` และ `src/ruleEngine`)**: เก็บ Core Business Logic เช่นการคำนวณ (Measurement Finalizer), หรือ Rule Engine สำหรับเครื่องมือวัดต่างๆ อย่าง AirGauge และ Mitutoyo
4. **Infrastructure (`src/infrastructure`)**: จัดการเรื่อง Database, Repository Pattern, เเละ Models ที่ต่อกับ ORM
