from flask import Blueprint , request
from flask_jwt_extended import jwt_required, verify_jwt_in_request, get_jwt
from api.utils.jsonRespon import json_response
from app import db
from flask import current_app

from application.services.sensor_service import SensorService



from domain.ruleEngine.RuleEngine import RuleEngine as RuleEngineDomain
from infrastructure.repository.sensor_repository import SensorRepository
from infrastructure.repository.setting_repository import SettingRepository
from infrastructure.repository.MeasurementRawValue_repository import MeasurementRawValueRepository
from infrastructure.repository.MeasurementDraftSpec_repository import MeasurementDraftSpecRepository
from infrastructure.repository.mea_repository import MeasurementRepository

from application.dtos.sensorDTO import SensorBase

sensor_bp = Blueprint('sensors', __name__)

sensor_service = SensorService(SensorRepository(db), MeasurementRepository(db), MeasurementRawValueRepository(db) \
                                , MeasurementDraftSpecRepository(db), SettingRepository(db), RuleEngineDomain())

@sensor_bp.route('/raw', methods=['POST'])
def save_sensor():
    try:
        data = SensorBase.model_validate(request.json)
        result = sensor_service.ingest_sensor_data(data)
        return json_response(
            message=f"Processed {result} measurements successfully"
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(e)
        return json_response(message=str(e), status_code=400)

@sensor_bp.route('/id/<int:sensor_id>', methods=['GET'])
def get_sensor_by_id(sensor_id):
    return json_response(
        message="Get sensor by id successfully"
    )
@sensor_bp.route('/name/<string:sensor_name>', methods=['GET'])
def get_sensor_by_name(sensor_name):
    return json_response(
        message="Get sensor by name successfully"
    )

@sensor_bp.route('/clearTmp', methods=['DELETE'])
@jwt_required()
def clear_tmp():
    sensor_service.clear_tmp()
    return json_response(
        message="Clear tmp successfully"
    )



#### for sensor air gauge
@sensor_bp.route('/airGauge', methods=['GET'])
def get_air_gauge():
    return json_response(
        message="Get air gauge successfully"
    )

@sensor_bp.route('/setting-airGauge', methods=['POST'])
def get_setting_air_gauge():
    return json_response(
        message="Get setting air gauge successfully"
    )

@sensor_bp.route('/status-airGauge', methods=['GET'])
def get_status_air_gauge():
    return json_response(
        message="Get status air gauge successfully"
    )