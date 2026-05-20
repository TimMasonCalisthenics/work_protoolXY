import os
import sys
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
from infrastructure.database.database import db
from flask_jwt_extended import JWTManager
from api.utils.globalError import register_error_handlers
from datetime import timedelta
from flask_cors import CORS
import click
from waitress import serve
from werkzeug.security import generate_password_hash


# โหลดค่าจากไฟล์ .env

load_dotenv()

# 1. สร้าง Instance ของ Extension ต่างๆ ไว้ด้านบน (เพื่อให้ไฟล์อื่นเรียกใช้ได้)
migrate = Migrate()

def create_app():
    base_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    app = Flask(__name__ , root_path=base_dir)

    # 2. ตั้งค่า Database (ดึงจาก Environment Variables ใน Docker)
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"mysql+mysqlconnector://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    # cache db
    app.config['SQLALCHEMY_BINDS'] = {
        'cache_db': 'sqlite:///:memory:'
    }
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config["JWT_SECRET_KEY"] = os.getenv('JWT_SECRET_KEY')
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)   # ยืดเป็น 12 ชั่วโมง
    # app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=1)   # ยืดเป็น 12 ชั่วโมง
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)   # refresh token 30 วัน


    @app.cli.command("seed-db") # ตั้งชื่อคำสั่งว่า seed-db
    def seed_db():
        from infrastructure.persistence.models.user_model import UserModel
        from infrastructure.persistence.models.system_settings import SystemSetting
        
        click.echo("🌱 Starting to seed data...")
        
        try:
            if UserModel.query.first() is None:
                #add admin user
                hashed_pw = generate_password_hash("admin")
                new_user = UserModel(
                    username="admin",
                    password_hash=hashed_pw,
                    role="admin"
                )
                db.session.add(new_user)
                db.session.commit()
                click.echo("✅ Seeding completed!")
            else:
                click.echo("⚠️  Database already has data. Skipping.")
            existing_setting = db.session.query(SystemSetting).first()            
            if not existing_setting:
                click.echo("🌱 Table is empty. Creating initial row...")                
                new_setting = SystemSetting(
                    active_product_id=None,
                    active_draft_id=None,
                    last_active_draft_time=None                    
                )
                db.session.add(new_setting)
                db.session.commit()
                click.echo("✅ SystemSetting initialized successfully (ID: 1).")
            else:
                click.echo(f"⚠️  SystemSetting already exists (ID: {existing_setting.id}). Skipping.")

        except Exception as e:
            db.session.rollback()
            click.echo(f"❌ Error seeding: {e}")

    # 3. เริ่มต้นใช้งาน Extensions กับ App
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app)
    with app.app_context():
        # from infrastructure.persistence.models import user_model
        from infrastructure.persistence import models
        print(f"DEBUG: Loaded tables -> {db.metadata.tables.keys()}")
    migrate.init_app(app, db)

    # 4. ลงทะเบียน Blueprint (นี่คือส่วนที่คุณถามครับ)
    from api.v1 import v1_bp
    app.register_blueprint(v1_bp, url_prefix='/api/v1')
    register_error_handlers(app)
    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv('BACKEND_PORT', 5000))
    if len(sys.argv) > 1:        
        # ใช้คำสั่งนี้เพื่อให้ Flask จัดการ CLI
        app.cli()
    else:
        if os.getenv('FLASK_DEBUG', '0') == '0':
            try:
                print(f"Starting Production Server (Waitress) on port {port}...")
                serve(app, host='0.0.0.0', port=port)
            except ImportError:
                # ถ้าหา waitress ไม่เจอ (เช่น ตอนรัน dev) ให้รัน flask ปกติ
                print("Waitress not found, falling back to Flask Dev Server...")
                app.run(host='0.0.0.0', port=port, debug=True)
        else:
            app.run(host='0.0.0.0', port=port, debug=True)