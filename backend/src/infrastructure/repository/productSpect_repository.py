from sqlalchemy import func, select, update
from sqlalchemy.orm import joinedload, load_only
from sqlalchemy.exc import IntegrityError
from infrastructure.persistence.models import ProductModel, ProductSpecPointModel
from flask import current_app

class ProductSpecPointRepository:
    def __init__(self, db):
        self.db = db

    def create(self, product_id: int, spec_point: ProductSpecPointModel):
        return []
    def get_by_id(self, product_id: int):
        return []

    def update(self, product_id: int, spec_point: ProductSpecPointModel):
        return []

    def delete(self, product_id: int, spec_point: ProductSpecPointModel):
        return []