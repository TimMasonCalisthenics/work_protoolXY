from flask import Blueprint , request
from flask_jwt_extended import jwt_required
from api.middleware.middlewares import role_required
from api.utils.jsonRespon import json_response
from app import db
from application.services.product_service import ProductService
from infrastructure.repository.product_repository import ProductRepository
from application.dtos.productDTO import ProductCreate , ProductUpdate, ProductResponse ,ProductUpdateActive
import json

from flask import current_app


#helper function to save file
from api.utils.file_utils import save_uploaded_file
from api.utils.product_request_parser import parse_product_request

product_bp = Blueprint('products', __name__)
product_service = ProductService(ProductRepository(db))


@product_bp.route('', methods=['POST'])
@jwt_required()
@role_required('admin', 'supervisor')
def create_product():
    try:
        data = parse_product_request(ProductCreate)
        product_service.create_product(data)
        return json_response(
            message="Create product successfully",
            status_code=201
        )
    except Exception as e:
        current_app.logger.error(f"Error creating product: {e}")
        return json_response(
            message="Failed to create product",
            status_code=400
        )


@product_bp.route('', methods=['GET'])
@jwt_required()
@role_required('admin', 'supervisor', 'operator')
def get_products():
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', None)
        products , total_count = product_service.get_all_active_paginated(page , limit , search)
        data = [ProductResponse.model_validate(u).model_dump(exclude_none=True) for u in products]
        return json_response(
            message="Get products list successfully",
            status_code=200,
            data={
            "products": data,
            "total_count": total_count
        })
    except Exception as e:
        current_app.logger.error(e)
        return json_response(
            message="Get products list failed",
            status_code=500
        )




@product_bp.route('/<int:product_id>', methods=['GET'])
@jwt_required()
@role_required('admin', 'supervisor', 'operator')
def get_product_by_id(product_id):
    product = product_service.get_by_id(product_id)
    if product is not None :
        data = ProductResponse.model_validate(product).model_dump(exclude_none=True)
    else:
        data = {}

    return json_response(
        message="Get product by id successfully",
        status_code=200,
        data=data
    )


#patch prodcut
@product_bp.route('/<int:product_id>', methods=['PATCH'])
@jwt_required()
@role_required('admin', 'supervisor')
def update_product(product_id):

    data = parse_product_request(ProductUpdate)
    product_service.update_product(product_id, data)

    return json_response(
        message="Update product successfully",
        status_code=200
    )

@product_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin', 'supervisor')
def delete_product(product_id):
    product_service.delete_product(product_id)
    return json_response(
        message="Delete product successfully",
        status_code=204
    )


#get active product
@product_bp.route('/active-product', methods=['GET'])
@jwt_required()
@role_required('admin', 'supervisor', 'operator')
def get_active_product():
    product = product_service.get_active_product()
    if product is not None :
        data = ProductResponse.model_validate(product).model_dump(exclude_none=True)
    else:
        data = {}

    return json_response(
        message="Get active product successfully",
        status_code=200,
        data=data
    )

@product_bp.route('/edit-active-product', methods=['PATCH'])
@jwt_required()
@role_required('admin', 'supervisor')
def update_active_product():    
    # data = ProductUpdateActive(**request.json)
    data = ProductUpdateActive.model_validate(request.json)
    product_service.update_product_active(data)
    return json_response(
        message="Update product successfully",
        status_code=204
    )
    