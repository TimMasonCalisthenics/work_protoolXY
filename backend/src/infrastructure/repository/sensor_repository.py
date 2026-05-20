from infrastructure.persistence.models import SensorModel
from sqlalchemy.exc import IntegrityError


class SensorRepository:
    def __init__(self , db):
        self.db = db
    def get_all_sensors(self):
        return SensorModel.query.all()

    def get_sensor_by_id(self, id):
        return SensorModel.query.get(id)

    def get_by_measurement_and_device(self, measurement_id, device_id):
        return SensorModel.query.filter_by(
            measurement_id=measurement_id,
            sensor_device_id=device_id
        ).all()
    def create_sensor(self, sensor: SensorModel):
        self.db.session.add(sensor)
        self.db.session.commit()

    def update_sensor(self, sensor: SensorModel , id ):
        sensor = SensorModel.query.get(id)
        if not sensor:
            return None
        sensor.sensor_data = sensor.sensor_data
        self.db.session.commit()

    def delete_sensor(self, sensor):
        self.db.session.delete(sensor)
        self.db.session.commit()
    def flush(self):
        self.db.session.flush()
    def commit(self):
        self.db.session.commit()