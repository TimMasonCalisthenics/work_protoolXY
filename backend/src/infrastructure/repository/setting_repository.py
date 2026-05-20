from sqlalchemy.exc import IntegrityError
from infrastructure.persistence.models.system_settings import SystemSetting
from flask import current_app
from domain.exceptions.base import AppError
from sqlalchemy import func
class SettingRepository:
    def __init__(self , db):
        self.db = db
    def _get_first_setting(self):        
        return self.db.session.query(SystemSetting).order_by(SystemSetting.id.asc()).first()
    def get_active_id_product(self):
        return self.db.session.query(SystemSetting).first()
    def get_active_id_draft(self):
        return self.db.session.query(SystemSetting).first()
    def get_detail_setting(self):
        return self.db.session.query(SystemSetting).first()
    def update_active_id_product(self, product_id):
        setting = self._get_first_setting()        
        self.db.session.query(SystemSetting) \
                    .filter(SystemSetting.id == setting.id) \
                    .update({"active_product_id": product_id})

        return self.db.session.commit()
    def update_active_id_draft(self, draft_id , date_time):
        setting = self._get_first_setting()
        self.db.session.query(SystemSetting) \
                    .filter(SystemSetting.id == setting.id) \
                    .update({"active_draft_id": draft_id,
                            "last_active_draft_time": date_time
                    })
        return self.db.session.commit()

    def update_debug_mode(self, is_debug_mode: bool):
        setting = self._get_first_setting()
        if not setting:
            setting = SystemSetting(is_debug_mode=is_debug_mode)
            self.db.session.add(setting)
        else:
            self.db.session.query(SystemSetting) \
                        .filter(SystemSetting.id == setting.id) \
                        .update({"is_debug_mode": is_debug_mode})
        return self.db.session.commit()
