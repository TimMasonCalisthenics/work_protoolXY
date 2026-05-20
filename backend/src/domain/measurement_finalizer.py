class MeasurementFinalizer:

    @staticmethod
    def finalize(draft_specs):
        details = []
        final_result = "OK"

        for item in draft_specs:
            if not item.is_pass:
                final_result = "NG"

            details.append({
                "measurement_id": item.measurement_id,
                "point_name": item.point_name,
                "lower_limit": item.min_value,
                "upper_limit": item.max_value,
                "nominal_value": item.nominal_value,
                "measured_value": item.final_value,
                "is_pass": item.is_pass or False,
            })

        return details, final_result