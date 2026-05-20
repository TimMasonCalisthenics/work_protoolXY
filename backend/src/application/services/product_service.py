from application.dtos.productDTO import ProductCreate , ProductUpdate , ProductUpdateActive
from infrastructure.persistence.models.product_model import ProductModel
from domain.exceptions.base import AppError, ConflictError
from flask import current_app
from api.utils.file_utils import delete_file
class ProductService:
    def __init__(self, product_repo):
        self.repo = product_repo


    def create_product(self, product: ProductCreate):
        # product_model = ProductModel(**product.model_dump())
        product_model = product.model_dump()
        try:
            self.repo.save(product_model)
            return product_model
        except Exception as e:
            current_app.logger.error(f"Error creating product: {str(e)}")
            raise AppError("Failed to create product")

    def get_all_active_paginated(self, page: int, page_size: int , search: str = None):
        return self.repo.get_all_active_paginated(page , page_size , search)

    def get_by_id(self, product_id):
        return self.repo.get_by_id(product_id)

    def update_product(self, product_id, product: ProductUpdate):
        update_data = product.model_dump(exclude_unset=True)
        if not update_data:
            return None
        product , listDelete = self.repo.update_product(product_id, update_data)
        delete_file(listDelete)
        return product
    def update_product_active(self , product:ProductUpdateActive):
        update_data = product.model_dump(exclude_unset=True)        
        if not update_data:
            return None        
        return self.repo.update_product_without_image_tracking(product_id=update_data.get('id') ,update_data= update_data)
    def delete_product(self, product_id):
        self.repo.hybrid_delete(product_id)
        return product_id