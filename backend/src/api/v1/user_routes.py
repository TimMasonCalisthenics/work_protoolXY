from flask import Blueprint , request
from flask_jwt_extended import jwt_required, verify_jwt_in_request, get_jwt
from api.utils.jsonRespon import json_response
from api.middleware.middlewares import role_required
from application.services.user_service import UserService
from infrastructure.repository.user_repository import UserRepository
from application.dtos.userDTO import UserResponse, UserUpdateDTO, UserRegisterRequest
from app import db
from flask import current_app


user_bp = Blueprint('users', __name__)
user_service = UserService(UserRepository(db))

# @user_bp.before_request
# @jwt_required()
# @role_required('admin')
@user_bp.before_request
def enforce_admin_access():
    if request.method == 'OPTIONS':
        return
    try:
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return json_response(message="Admin access required", status_code=403)
    except Exception as e:
        return json_response(message=str(e), status_code=401)

@user_bp.route('', methods=['POST'])
def create_user():
    # data = UserRegisterRequest(**request.json)
    data = UserRegisterRequest.model_validate(request.json)
    saved_user = user_service.create_user(data)
    return json_response(
        message="User created successfully",
        status_code=201
    )


@user_bp.route('', methods=['GET'])
def get_users():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    search = request.args.get('search', None)

    users, total_count = user_service.get_paginated_users(page, limit, search)
    data = [UserResponse.model_validate(u).model_dump() for u in users]
    return json_response(
        data={
            "users": data,
            "total": total_count,
            "page": page,
            "limit": limit
        },
        message="Get users list successfully"
    )

@user_bp.route('/<int:user_id>', methods=['GET'])
def get_user_detail(user_id):
    # user = user_service.get_user_by_id(user_id)
    return json_response(
        data={"test_value": "banana", "requested_id": user_id},
        message="Test success"
    )

@user_bp.route('/<string:username>', methods=['PATCH'])
def update_user(username):
    update_data = UserUpdateDTO.model_validate(request.json)
    updated_user = user_service.update_user(username , update_data)
    return json_response(
        message="User updated successfully"
    )

@user_bp.route('/<string:username>', methods=['DELETE'])
def delete_user(username):
    
    is_deleted = user_service.delete_user(username)
    if not is_deleted:
        return json_response(
            message=f"User {username} not found",
            status_code=404
        )
    return json_response(
        message=f"User {username} deleted successfully",
        status_code=200
    )
