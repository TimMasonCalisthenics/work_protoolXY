from flask import Blueprint
from .auth_routes import auth_bp
from .user_routes import user_bp
from .product_routes import product_bp
from .measurement_routes import measurement_bp
from .measurement_draft_routes import measurement_draft_bp
from .image_routes import image_bp
from .sensor_routes import sensor_bp
from .systemSettings_routes import system_bp
from .measurement_rawValueLog_routes import measurement_rawValueLog_bp

v1_bp = Blueprint('v1', __name__)
v1_bp.register_blueprint(auth_bp, url_prefix='/auth')
v1_bp.register_blueprint(user_bp, url_prefix='/users')
v1_bp.register_blueprint(product_bp, url_prefix='/products')
v1_bp.register_blueprint(measurement_bp, url_prefix='/measurements')
v1_bp.register_blueprint(measurement_draft_bp, url_prefix='/measurements_draft')
v1_bp.register_blueprint(image_bp, url_prefix='/images')
v1_bp.register_blueprint(sensor_bp, url_prefix='/sensors')
v1_bp.register_blueprint(system_bp, url_prefix='/system')
v1_bp.register_blueprint(measurement_rawValueLog_bp, url_prefix='/measurement_raw_value_logs')
