from flask import Blueprint
from flask_jwt_extended import jwt_required 
from pydantic import TypeAdapter
from typing import List
from api.utils.jsonRespon import json_response
from api.middleware.middlewares import role_required

from application.services.mea_raw_value_log_service import MeasurementRawValueLogService
from application.dtos.measurement_raw_value_log_DTO import MeasurementRawValueLogResponse

from infrastructure.repository.MeasurementRawValue_log_repository import MeasurementRawValueLogRepository
from app import db
from flask import request

measurement_rawValueLog_bp = Blueprint('measurement_rawValueLog', __name__)
measurement_raw_value_log_service = MeasurementRawValueLogService(MeasurementRawValueLogRepository(db))




# get log with query parameters
@measurement_rawValueLog_bp.route('', methods=['GET'])
@jwt_required()
@role_required('supervisor' , 'admin')
def get_raw_values_log():
    try:
        measurement_id = request.args.get('measurement_id', type=int)
        spec_point_id = request.args.get('spec_point_id', type=int)
        point_name = request.args.get('point_name', default=None, type=str)
        sensor_device_id = request.args.get('sensor_device_id', type=str)
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=20, type=int)
        
        result = measurement_raw_value_log_service.get_logs_with_query(
            measurement_id=measurement_id,
            spec_point_id=spec_point_id,
            point_name=point_name,
            sensor_device_id=sensor_device_id,
            page=page,
            limit=limit
        )
        
        adapter = TypeAdapter(List[MeasurementRawValueLogResponse])
        validated_items = adapter.validate_python(result["items"])
        dataResponse = adapter.dump_python(validated_items)
        
        return json_response(
            data={
                "items": dataResponse,
                "total": result["total"],
                "page": result["page"],
                "limit": result["limit"]
            },
            message="Get raw values log successfully"
        )
    except Exception as e:
        return json_response(
            message=str(e),
            status_code=500
        )

@measurement_rawValueLog_bp.route('', methods=['DELETE'])
@jwt_required()
@role_required('supervisor', 'admin')
def clear_all_raw_values_log():
    try:
        measurement_raw_value_log_service.clear_all_logs()
        return json_response(
            message="Clear all raw values log successfully"
        )
    except Exception as e:
        return json_response(
            message=str(e),
            status_code=500
        )

