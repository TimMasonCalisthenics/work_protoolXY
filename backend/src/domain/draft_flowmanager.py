from flask import current_app
from enumCore.common import CommonEnum

class DraftFlowManager:

    # FLOW_ORDER = ['mitutoyo', 'air_gauge']
    FLOW_ORDER = [CommonEnum.Mitutoyo.value, CommonEnum.Airgauge.value , CommonEnum.Airgauge_X_axis.value , CommonEnum.Airgauge_Y_axis.value]

    @staticmethod
    def build_flow(product):
        used = {p.sensor_type for p in product.spec_points}        
        active_sensors = [s for s in DraftFlowManager.FLOW_ORDER if s in used]      
        return [CommonEnum.QrCode.value] + active_sensors

    @staticmethod
    def next_stage(flow, current):
        idx = flow.index(current)
        if idx + 1 >= len(flow):
            return CommonEnum.Completed.value
        return flow[idx + 1]