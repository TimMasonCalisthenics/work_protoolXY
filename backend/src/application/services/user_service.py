from application.dtos.userDTO import UserUpdateDTO, UserRegisterRequest
from werkzeug.security import generate_password_hash
from infrastructure.persistence.models.user_model import UserModel
from domain.exceptions.base import  ConflictError

class UserService:
    def __init__(self, user_repo):
        self.repo = user_repo
    def create_user(self, user_data: UserRegisterRequest):
        existing_user = self.repo.get_by_username(user_data.username)
        if existing_user:
            raise ConflictError(f"Username '{user_data.username}' is already exists.")

        hashed_pw = generate_password_hash(user_data.password)
        new_user = UserModel(
            username=user_data.username,
            password_hash=hashed_pw,
            role=user_data.role if hasattr(user_data, 'role') else 'operator'
        )
        return self.repo.save(new_user)
    def get_paginated_users(self, page: int, limit: int, search: str = None):
        return self.repo.get_paginated_users(page, limit, search)

    def get_user_by_id(self, user_id: int):
        return []
        # return self.user_repository.get_user_by_id(user_id)

    def update_user(self, username: str, update_data: UserUpdateDTO):

        return self.repo.update_user(username, update_data.role)

    def delete_user(self, username: str):
        return self.repo.delete_user(username)