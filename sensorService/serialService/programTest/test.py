import serial
import sys
import time

def send_serial_and_exit():
    # --- FULL CONFIGURATION ---
    # ปรับแต่งค่าต่างๆ ตรงนี้ให้ตรงกับอุปกรณ์ปลายทางของคุณ
    config = {
        'port': 'COM3',              # พอร์ตที่ใช้งาน (Windows: 'COMx', Linux/Mac: '/dev/ttyUSB0')
        'baudrate': 9600,            # ความเร็วในการส่ง (9600, 115200, etc.)
        'bytesize': serial.EIGHTBITS, # ขนาดข้อมูล: FIVEBITS, SIXBITS, SEVENBITS, EIGHTBITS
        'parity': serial.PARITY_NONE, # การตรวจสอบความผิดพลาด: PARITY_NONE, PARITY_EVEN, PARITY_ODD, PARITY_MARK, PARITY_SPACE
        'stopbits': serial.STOPBITS_ONE, # บิตสิ้นสุด: STOPBITS_ONE, STOPBITS_ONE_POINT_FIVE, STOPBITS_TWO
        'timeout': 1,                # Read timeout (วินาที)
        'write_timeout': 1,          # Write timeout (วินาที) ป้องกันโปรแกรมค้างถ้าส่งไม่ไป
        'xonxoff': False,            # Software Flow Control (True/False)
        'rtscts': False,             # Hardware Flow Control RTS/CTS (True/False)
        'dsrdtr': False              # Hardware Flow Control DSR/DTR (True/False)
    }

    try:
        # 1. เปิด Serial Port พร้อม Config ทั้งหมด
        print(f"กำลังเปิดพอร์ต {config['port']}...")
        ser = serial.Serial(**config)
        
        # 2. Hardware Handshaking Lines (ถ้าจำเป็นต้องใช้ สามารถสั่ง On/Off ตรงนี้ได้)
        # ser.rts = True
        # ser.dtr = True

        # 3. หน่วงเวลาเล็กน้อยหลังเปิดพอร์ต
        # บอร์ดอย่าง Arduino มักจะ รีเซ็ต ตัวเองเมื่อเปิดพอร์ต การรอ 2 วินาทีช่วยให้บอร์ดพร้อมรับข้อมูล
        time.sleep(1) 

        # 4. ล้างข้อมูลเก่าที่ค้างใน Buffer (เคลียร์ขยะก่อนส่ง)
        ser.reset_input_buffer()
        ser.reset_output_buffer()

        # 5. เตรียมข้อมูลและส่ง (จบด้วย \n)
        message = "1,,,,,,,,,"
        # data_to_send = f"{message}\n".encode('utf-8') # แปลงเป็น Bytes
        data_to_send = f"1,,,,,,,,,\n".encode('utf-8') # แปลงเป็น Bytes
        
        print(f"กำลังส่งข้อมูล: {repr(message)}\\n")
        ser.write(data_to_send)
        
        # 6. รอให้ข้อมูลถูกส่งออกไปจาก Buffer ของคอมพิวเตอร์จนหมดจริงๆ
        ser.flush()
        print("ส่งข้อมูลเรียบร้อยแล้ว!")

    except serial.SerialException as e:
        print(f"เกิดข้อผิดพลาดเกี่ยวกับ Serial Port: {e}", file=sys.stderr)
    except Exception as e:
        print(f"เกิดข้อผิดพลาดอื่นๆ: {e}", file=sys.stderr)
        
    finally:
        # 7. ปิดพอร์ตอย่างปลอดภัยและจบโปรแกรม
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print("ปิด Serial Port เรียบร้อย.")
        
        print("จบโปรแกรม.")

if __name__ == "__main__":
    send_serial_and_exit()