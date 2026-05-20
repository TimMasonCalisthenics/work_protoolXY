from infrastructure.persistence.models.user_model import UserModel
from sqlalchemy import select , func , delete , update

class UserRepository:
    def __init__(self , db):
        self.db = db
    def save(self, user_model: UserModel):
        self.db.session.add(user_model)
        self.db.session.commit()
        return user_model

    def get_by_username(self, username: str):
        query = select(UserModel).where(UserModel.username == username)
        return self.db.session.execute(query).scalar_one_or_none()
    def get_paginated_users(self, page: int, limit: int, search: str = None):
        count_query = select(func.count(UserModel.id))
        if search:
            count_query = count_query.where(UserModel.username.contains(search))
        total_count = self.db.session.execute(count_query).scalar()
        offset = (page - 1) * limit
        data_query = select(UserModel.username, UserModel.role, UserModel.created_at, UserModel.updated_at) \
                    .where(UserModel.username.contains(search) if search else True) \
                    .offset(offset).limit(limit)
        users = self.db.session.execute(data_query).all()

        return users, total_count
    def update_user(self, username: str, role: str):
        stmt = update(UserModel).where(UserModel.username == username).values(role=role)
        result = self.db.session.execute(stmt)
        self.db.session.commit()
        return result.rowcount
    def delete_user(self, username: str):
        stmt = delete(UserModel).where(UserModel.username == username)
        result = self.db.session.execute(stmt)
        self.db.session.commit()
        return result.rowcount
    def get_all(self):
        query = select(UserModel)
        return self.db.session.execute(query).scalars().all()
