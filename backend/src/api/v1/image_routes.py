from flask import Blueprint, send_from_directory
from api.utils.jsonRespon import json_response
image_bp = Blueprint('image', __name__)

@image_bp.route('/static/uploads/points/<string:filename>', methods=['GET'])
def upload_image_points(filename):    
    try:
        return send_from_directory('static/uploads/points', filename)
    except Exception as e:
        return json_response(
            message=str(e),
            status_code=500
        )
@image_bp.route('/static/uploads/products/<string:filename>', methods=['GET'])
def upload_image(filename):    
    try:
        return send_from_directory('static/uploads/products', filename)
    except Exception as e:
        return json_response(
            message=str(e),
            status_code=500
        )