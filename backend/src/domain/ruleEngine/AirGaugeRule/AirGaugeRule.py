from enumCore.common import CommonEnum
from flask import current_app

class AirGaugeRule:
    def __init__(self, engine):
        self.engine = engine
    def _check_trigger(self, value, spec):
        if spec.rule_type == CommonEnum.LessThan.value:
            return value < spec.nominal_value
        elif spec.rule_type == CommonEnum.GreaterThan.value:
            return value > spec.nominal_value
        return True
        
    def evaluate(self, spec, values, context):
        if spec.status != CommonEnum.Pending.value:
            return self.engine._analyze_stable_average(spec, values)
        
        if not values:
            return None

        latest = values[0]

        if context.get("has_active"):
            if context.get("is_active"):
                if self._check_trigger(latest, spec):
                    return {"action": "broadcast_ready"}
        else:
            if self._check_trigger(latest, spec):
                return {
                    "action": "update_status",
                    "status": "ready"
                }

        return None
        