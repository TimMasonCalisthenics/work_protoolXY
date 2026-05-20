from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from infrastructure.persistence.models.user_model import UserModel
from domain.exceptions.base import AppError, ConflictError

class AuthService:
    def __init__(self, user_repo):
        self.repo = user_repo

    def register_user(self, data):
        existing_user = self.repo.get_by_username(data.username)
        if existing_user:
            raise ConflictError(f"Username '{data.username}' is already exists.")

        hashed_pw = generate_password_hash(data.password)
        new_user = UserModel(
            username=data.username,
            password_hash=hashed_pw,
            role=data.role if hasattr(data, 'role') else 'operator'
        )
        return self.repo.save(new_user)

    def authenticate_user(self, username, password):
        user = self.repo.get_by_username(username)
        if user and check_password_hash(user.password_hash, password):
            token = create_access_token(
                identity=str(user.id),
                additional_claims={"role": user.role}
            )
            return {"token": token, "user": user}
        raise AppError(message="Invalid username or password", status_code=401)