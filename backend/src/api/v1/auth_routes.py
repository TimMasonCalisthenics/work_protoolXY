from flask import Blueprint, request
from application.dtos.userDTO import UserRegisterRequest
from infrastructure.repository.user_repository import UserRepository
from flask_jwt_extended import jwt_required
from application.services.auth_service import AuthService
from api.middleware.middlewares import role_required
from api.utils.jsonRespon import json_response
from app import db

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService(UserRepository(db))

@auth_bp.route('/register', methods=['POST'])
def register():
    # data = UserRegisterRequest(**request.json)
    data = UserRegisterRequest.model_validate(request.json)
    saved_user = auth_service.register_user(data)
    return json_response(
        # data=UserResponse.model_validate(saved_user),
        message="User registered successfully",
        status_code=201
    )
@auth_bp.route('/login', methods=['POST'])
def login():

    # data = request.json
    # result = auth_service.authenticate_user(data.get('username'), data.get('password'))
    data = UserRegisterRequest.model_validate(request.json)
    result = auth_service.authenticate_user(data.username, data.password)
    return json_response(
        data={
            "user_id": result['user'].id,
            "access_token": result['token'],
            "role": result['user'].role
        },
        message="Login Success"
    )



@auth_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required('operator')
def get_all_users():
    return json_response(
        message="Login Success"
    )
