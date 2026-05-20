import io
import csv


class MeasurementCSVExporter:

    @staticmethod
    def export(measurements):

        all_points = []
        point_set = set()
        processed = []

        # 🔹 transform
        for item in measurements:
            details = item.get("details", [])            
            detail_map = {}

            for d in details:
                name = d.get("point_name")
                if not name:
                    continue

                if name not in point_set:
                    point_set.add(name)
                    all_points.append(name)

                detail_map[name] = d

            processed.append({
                "base": item,
                "details": detail_map
            })

        # 🔹 build csv
        output = io.StringIO()
        writer = csv.writer(output)

        header = ["ID", "Serial A", "Serial B", "Status", "Stage"]

        for p in all_points:
            header.append(f"{p} (Value)")
            header.append(f"{p} (Result)")

        header += ["Final Result", "Measured At"]
        writer.writerow(header)

        for entry in processed:
            base = entry["base"]
            detail_map = entry["details"]

            created_at = base.get("created_at", "")
            if hasattr(created_at, "strftime"):
                created_at = created_at.strftime("%Y-%m-%d %H:%M:%S")

            row = [
                base.get("id"),
                base.get("serial_a"),
                base.get("serial_b"),                
                base.get("status"),
                base.get("stage"),
            ]

            for p in all_points:
                d = detail_map.get(p, {})
                val = d.get("measured_value", "")
                res = "PASS" if d.get("is_pass") else "NG" if d.get("is_pass") is False else ""

                row.append(val)
                row.append(res)

            row.append(base.get("final_result"))
            row.append(created_at)

            writer.writerow(row)

        return output.getvalue()