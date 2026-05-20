from infrastructure.persistence.models.system_settings import SystemSetting
from domain.exceptions.base import AppError, ConflictError
from flask import current_app

class SystemService:
    def __init__(self, system_repo):
        self.repo = system_repo
    def get_active_id_product(self):
        return self.repo.get_active_id_product()

    def update_active_id_product(self, product_id):
        return self.repo.update_active_id_product(product_id)
    def update_active_id_draft(self, draft_id):
        return self.repo.update_active_id_draft(draft_id)

    def get_debug_mode(self):
        setting = self.repo.get_detail_setting()
        return setting.is_debug_mode if setting else False

    def update_debug_mode(self, is_debug_mode: bool):
        return self.repo.update_debug_mode(is_debug_mode)
