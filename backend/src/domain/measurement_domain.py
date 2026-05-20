class MeasurementDomain:

    @staticmethod
    def evaluate_point(spec, measured_value):
        upper = spec.nominal_value + spec.max_value
        lower = spec.nominal_value - spec.min_value

        is_pass = lower <= measured_value <= upper

        return {
            "point_name": spec.point_name,
            "measured_value": measured_value,
            "nominal_value": spec.nominal_value,
            "upper_limit": upper,
            "lower_limit": lower,
            "is_pass": is_pass
        }