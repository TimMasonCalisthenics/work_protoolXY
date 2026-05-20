from flask import Blueprint , request
from flask_jwt_extended import jwt_required , get_jwt_identity
from pydantic import TypeAdapter
from typing import List
from api.utils.jsonRespon import json_response
from api.middleware.middlewares import role_required

from application.services.mea_draft_service import MeasurementDraftService
from application.dtos.measurement_draft_DTO import  MeasurementDraftResponse

from infrastructure.repository.mea_repository import MeasurementRepository
from infrastructure.repository.MeasurementDraftSpec_repository import MeasurementDraftSpecRepository
from infrastructure.repository.MeasurementRawValue_repository import MeasurementRawValueRepository
from infrastructure.repository.setting_repository import SettingRepository

from flask import current_app
from app import db

measurement_draft_bp = Blueprint('measurement_draft', __name__)
measurement_draft_service = MeasurementDraftService(MeasurementRepository(db)
                                                    , MeasurementDraftSpecRepository(db)
                                                    , MeasurementRawValueRepository(db)
                                                    , SettingRepository(db))

@measurement_draft_bp.route('', methods=['GET'])
@jwt_required()
@role_required('operator', 'supervisor' , 'admin')
def get_measurements_draft():
    data = measurement_draft_service.get_measurements_draft()
    try:
        adapter = TypeAdapter(List[MeasurementDraftResponse])
        dataResponse = adapter.dump_python(data)
        return json_response(
            data = dataResponse,
            message="Get measurements draft successfully"
        )
    except Exception as e:
        return json_response(
            message=str(e),
            status_code=500
        )

@measurement_draft_bp.route('/clear-ng', methods=['PATCH'])
@jwt_required()
@role_required('operator', 'supervisor' , 'admin')
def clear_measurement_draft_ng_value():    
    data = measurement_draft_service.clear_ng_value_measurement_draft()    
    return json_response(        
        message="Clear ng value measurement draft successfully"
    )
    
@measurement_draft_bp.route('/clear-all-value-in-stage', methods=['PATCH'])
@jwt_required()
@role_required('operator', 'supervisor' , 'admin')
def clear_measurement_draft_all_value_in_stage():    
    data = measurement_draft_service.clear_all_value_in_stage_measurement_draft()    
    return json_response(        
        message="Clear all value in stage measurement draft successfully"
    )
    

@measurement_draft_bp.route('/clear-ng-raw', methods=['PATCH'])
@jwt_required()
@role_required('operator', 'supervisor' , 'admin')
def clear_measurement_draft_ng_and_raw_value():
    
    data = measurement_draft_service.clear_ng_and_raw_value_measurement_draft()    
    return json_response(        
        message="Clear ng and raw value measurement draft successfully"
    )
