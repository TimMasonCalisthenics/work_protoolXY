from flask import jsonify
from application.dtos.responseCommon import GenericResponse

def json_response(data=None, message="Success", status_code=200):
    response = GenericResponse.success_res(data=data, message=message)
    return jsonify(response.to_json()), status_code