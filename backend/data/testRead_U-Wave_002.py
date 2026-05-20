import serial
import time
from typing import List


class OrbitUSBIM:
    def __init__(
        self,
        port: str,
        baudrate: int = 115200,
        timeout: float = 1.0
    ):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.ser: serial.Serial | None = None
        self.values: List[float] = []

    def open(self):
        """เปิดการเชื่อมต่อ"""
        if self.ser and self.ser.is_open:
            return

        self.ser = serial.Serial(
            port=self.port,
            baudrate=self.baudrate,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=self.timeout
        )
        time.sleep(0.5)  # รอ device ready

    def read_value(self) -> float | None:
        """อ่านค่า 1 ค่า จาก DPR"""
        if not self.ser or not self.ser.is_open:
            raise RuntimeError("Serial port not opened")

        # คำสั่งอ่านค่า (ลอง ?D หรือ R)
        self.ser.write(b"?D\r")

        response = self.ser.readline().decode("ascii", errors="ignore").strip()

        if not response:
            return None

        try:
            value = float(response)
            self.values.append(value)
            return value
        except ValueError:
            print("Invalid response:", response)
            return None

    def close(self):
        """ปิดการเชื่อมต่อ"""
        if self.ser and self.ser.is_open:
            self.ser.close()
            self.ser = None


if __name__ == "__main__":
    orbit = OrbitUSBIM(port="COM5")  # แก้ COM ให้ตรงเครื่องคุณ

    try:
        orbit.open()

        for i in range(10):
            val = orbit.read_value()
            print(f"Value {i}: {val}")
            time.sleep(0.5)

        print("All values:", orbit.values)

    finally:
        orbit.close()
