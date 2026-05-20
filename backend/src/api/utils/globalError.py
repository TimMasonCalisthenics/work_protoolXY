from flask import jsonify
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from domain.exceptions.base import AppError
from werkzeug.exceptions import HTTPException
from application.dtos.responseCommon import GenericResponse
def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def handle_http_error(e):
        return jsonify(GenericResponse.error_res(message=e.description).to_json()), e.code

    @app.errorhandler(AppError)
    def handle_app_error(e):
        return jsonify(GenericResponse.error_res(message=e.message).to_json()), e.status_code

    @app.errorhandler(ValidationError)
    def handle_pydantic_error(e):
        custom_errors = []        
        for error in e.errors():
            field_name = str(error['loc'][-1])
            msg = error.get('msg')

            custom_errors.append({
                "field": field_name,
                "message": msg,
                "type": error['type']
            })

        response = GenericResponse.error_res(
            message="Input validation failed",
            error=custom_errors
        )
        return jsonify(response.to_json()), 400
    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        if "1451" in str(error.orig):
            return jsonify({
                "status": "error",
                "message": "ไม่สามารถลบข้อมูลนี้ได้ เนื่องจากข้อมูลถูกนำไปใช้งานในส่วนอื่น (Measurement Values)"
            }), 400
        return jsonify({"status": "error", "message": "Database integrity error"}), 400

    @app.errorhandler(Exception)
    def handle_general_error(e):
        return jsonify(GenericResponse.error_res(message="Internal Server Error").to_json()), 500