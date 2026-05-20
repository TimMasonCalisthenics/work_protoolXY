from flask import current_app
from enumCore.common import CommonEnum
from domain.ruleEngine.MitutoyoRule.MitutoyoRule import MitutoyoRule
from domain.ruleEngine.AirGaugeRule.AirGaugeRule import AirGaugeRule

class RuleEngine:
    def __init__(self):
        self.tolerance = 0.001

        self.mitutoyo_rule = MitutoyoRule(self)
        self.air_gauge_rule = AirGaugeRule(self)
    def _analyze_stable_average(self, spec, values):
        current_app.logger.info(f"Values: {values}")
        current_app.logger.info(f"Required count: {spec.required_count}")
        if len(values) < spec.required_count:
            return None

        window = values[-spec.required_count:]
        if max(window) - min(window) > self.tolerance:
            return None

        avg_value = sum(window) / len(window)
        is_pass = spec.min_value <= avg_value <= spec.max_value

        return {
            "value": avg_value,
            "is_pass": is_pass
        }
    def evaluate(self, spec, values , context=None):

        if spec.is_pass != None:
                return None
        if spec.sensor_type == CommonEnum.Airgauge.value or spec.sensor_type == CommonEnum.Airgauge_X_axis.value or spec.sensor_type == CommonEnum.Airgauge_Y_axis.value:            
            result = self.air_gauge_rule.evaluate(spec, values, context or {})
            current_app.logger.info(f"Result: {result}")
            return result
        elif spec.sensor_type == CommonEnum.Mitutoyo.value:
            result = self.mitutoyo_rule.evaluate(spec, values, context or {})
            current_app.logger.info(f"Result: {result}")
            return result

        return None