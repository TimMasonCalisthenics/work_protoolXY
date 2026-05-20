from sqlalchemy import func, select, update
from sqlalchemy.orm import joinedload, load_only
from sqlalchemy.exc import IntegrityError
from infrastructure.persistence.models import ProductModel, ProductSpecPointModel
from flask import current_app

class ProductRepository:
    def __init__(self, db):
        self.db = db

    def save(self, product_data: dict):
        try:
            points_data = product_data.pop('spec_points', [])

            product = ProductModel(**product_data)
            self.db.session.add(product)
            self.db.session.flush()

            for pt in points_data:
                if pt.get("max_value") < pt.get("min_value"):
                    pt["max_value"] , pt["min_value"] = pt["min_value"] , pt["max_value"]
                point = ProductSpecPointModel(product_id=product.id, **pt)
                self.db.session.add(point)

            self.db.session.commit()
            return product
        except Exception as e:
            self.db.session.rollback()
            raise e

    def get_all_active_paginated(self, page: int, page_size: int, search: str = None):
        offset = (page - 1) * page_size

        stmt = select(ProductModel).options(
            load_only(
                ProductModel.id,
                ProductModel.product_name,
                ProductModel.image_url,
                ProductModel.created_at
                ),
            joinedload(ProductModel.spec_points)
            ).where(ProductModel.is_deleted == False)
        # stmt = select(ProductModel).where(ProductModel.is_deleted == False)

        if search:
            stmt = stmt.where(ProductModel.product_name.ilike(f"%{search}%"))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.session.execute(count_stmt).scalar()

        query = (
            stmt
            .order_by(ProductModel.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )

        products = self.db.session.execute(query).scalars().unique().all()
        # products = self.db.session.execute(query).mappings().all()
        return products, total

    def get_by_id(self, product_id):
        stmt = (
            select(ProductModel)
            .options(joinedload(ProductModel.spec_points))
            .where(ProductModel.id == product_id, ProductModel.is_deleted == False)
        )
        return self.db.session.execute(stmt).scalars().unique().first()

    def update_product(self, product_id, update_data: dict):
        try:
            product = self.get_by_id(product_id)
            if not product:
                return None
            old_image = set(product.image_url + [pt.point_image_url for pt in product.spec_points])
            if 'spec_points' in update_data:
                new_points = update_data.pop('spec_points')
                for pt in new_points:
                    if pt.get("max_value") < pt.get("min_value"):
                        pt["max_value"] , pt["min_value"] = pt["min_value"] , pt["max_value"]
                product.spec_points = [
                    ProductSpecPointModel(**pt) for pt in new_points
                ]

            for key, value in update_data.items():
                setattr(product, key, value)

            self.db.session.commit()
            new_image = set(product.image_url + [pt.point_image_url for pt in product.spec_points])
            listDelete = old_image - new_image
            return product , listDelete
        except Exception as e:
            self.db.session.rollback()
            raise e
    def update_product_without_image_tracking(self, product_id, update_data: dict):
        try:
            product = self.get_by_id(product_id)
            if not product:
                return None
                
            if 'spec_points' in update_data:
                new_points_data = update_data.pop('spec_points')
                
                # map existing points by ID for O(1) lookup
                existing_points = {pt.id: pt for pt in product.spec_points if pt.id}
                updated_points_list = []

                for pt_data in new_points_data:
                    # Validation Logic: Min/Max swap
                    if pt_data.get("max_value", 0) < pt_data.get("min_value", 0):
                        pt_data["max_value"], pt_data["min_value"] = pt_data["min_value"], pt_data["max_value"]

                    pt_id = pt_data.get('id')
                    if pt_id in existing_points:
                        # อัปเดตจุดที่มีอยู่เดิม
                        target_point = existing_points[pt_id]
                        for k, v in pt_data.items():
                            # ป้องกันการเขียนทับ image_url ถ้าใน JSON ไม่ได้ส่งมาหรือไม่อยากแก้
                            if k != 'point_image_url': 
                                setattr(target_point, k, v)
                        updated_points_list.append(target_point)
                    else:
                        # เพิ่มจุดใหม่ (ถ้ามี)
                        new_pt = ProductSpecPointModel(**pt_data)
                        updated_points_list.append(new_pt)

                # อัปเดต relationship (ตัวที่ไม่ถูกใส่ใน list นี้จะถูกลบถ้าตั้ง cascade delete-orphan ไว้)
                product.spec_points = updated_points_list

            # 2. อัปเดต Field อื่นๆ ของ Product (ยกเว้น image_url)
            for key, value in update_data.items():
                if key != 'image_url':
                    setattr(product, key, value)

            self.db.session.commit()
            
            # ส่งแค่ product กลับไป (ไม่ต้องมี listDelete แล้ว)
            return product

        except Exception as e:
            current_app.logger.error(e)
            self.db.session.rollback()
            raise e

    def hybrid_delete(self, product_id):
        product = self.db.session.get(ProductModel, product_id)
        if not product or product.is_deleted:
            return None

        try:
            self.db.session.delete(product)
            self.db.session.commit()
            return "hard_deleted"
        except IntegrityError:
            self.db.session.rollback()
            product.is_deleted = True
            self.db.session.commit()
            return "soft_deleted"