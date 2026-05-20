from flask import Blueprint , request
from flask_jwt_extended import jwt_required, verify_jwt_in_request, get_jwt
from api.utils.jsonRespon import json_response
from app import db
from flask import current_app
from application.services.system_service import SystemService
from infrastructure.repository.setting_repository import SettingRepository
from api.middleware.middlewares import role_required

system_bp = Blueprint('system', __name__)
system_service = SystemService(SettingRepository(db))

@system_bp.route('/active_product', methods=['PATCH'])
def update_active_product():
    try:
        product_id = request.json.get('product_id')
        system_service.update_active_id_product(product_id)
        return json_response(
            message="Update active product successfully"
        )
    except Exception as e:
        return json_response(
            message="Update active product failed",
            status_code=400
        )

@system_bp.route('/active_product', methods=['GET'])
def get_active_product():    
    data = system_service.get_active_id_product()
    if not data:
        return json_response(
            message="Get active product failed",
            status_code=404
        )
    return json_response(
        data=data.active_product_id,
        message="Get active product successfully"
    )

@system_bp.route('/debug_mode', methods=['GET'])
def get_debug_mode():
    try:
        is_debug_mode = system_service.get_debug_mode()
        return json_response(
            data={"is_debug_mode": is_debug_mode},
            message="Get debug mode successfully"
        )
    except Exception as e:
        return json_response(
            message=str(e),
            status_code=500
        )

@system_bp.route('/debug_mode', methods=['PATCH'])
@jwt_required()
@role_required('supervisor', 'admin')
def update_debug_mode():
    try:
        is_debug_mode = request.json.get('is_debug_mode', False)
        system_service.update_debug_mode(is_debug_mode)
        return json_response(
            message="Update debug mode successfully"
        )
    except Exception as e:
        return json_response(
            message=str(e),
            status_code=500
        )