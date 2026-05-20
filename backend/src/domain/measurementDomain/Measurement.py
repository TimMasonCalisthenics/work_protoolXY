from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class Measurement:
    id: int
    product_id: int
    serial_a: str
    serial_b: str
    final_result: str
    details: Dict[str, Any]
    spec_config: Dict[str, Any]
    final_result: str
    updated_at: datetime

    def check_final_result(self) -> str:
        detailed_results = []
        is_all_pass = True
        spec_dict = {s['point']: s for s in self.spec_config}

        for entry in self.entry_data:
            point_name = entry['point']
            measured_val = entry['value']
            spec = spec_dict.get(point_name)

            if spec:
                is_pass = spec['min'] <= measured_val <= spec['max']
                if not is_pass:
                    is_all_pass = False

                detailed_results.append({
                    "point": point_name,
                    "value": measured_val,
                    "min": spec['min'],
                    "max": spec['max'],
                    "result": "PASS" if is_pass else "NG"
                })

        self.final_result = "PASS" if is_all_pass else "NG"
        self.details = detailed_results
        return self.final_result

    def update_measurement(self, data: Dict[str, Any]) -> None:
        self.updated_at = datetime.now()