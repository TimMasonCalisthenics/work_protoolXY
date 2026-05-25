from flask import Flask, request, jsonify
import threading
import queue
import time
import os
import json
from flask_cors import CORS  # 🌟 1. เพิ่มบรรทัดนี้เข้ามา
import sys
app = Flask(__name__)
CORS(app)

if '__compiled__' in globals() or hasattr(sys, 'frozen'):
    # sys.argv[0] คือพิกัดเต็มของไฟล์ .exe ที่ถูกคลิกรันจากภายนอกเสมอ
    EXE_DIR = os.path.dirname(os.path.abspath(sys.argv[0]))
else:
    # ตอนพัฒนาพิมพ์รันด้วย python serialService.py ปกติ
    EXE_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_FILE = os.path.join(EXE_DIR, "config.json")

# --- DEFAULT CONFIGURATION (เพิ่ม SERVER_PORT สำหรับตัวแอป) ---
DEFAULT_CONFIG = {
    "SERVER_PORT": 5003,                # 🌐 พอร์ตของ Web Server
    "MOCK_MODE": False,
    "SERIAL_PORT": "COM3",
    "BAUD_RATE": 9600,
    "OK_COMMANDS": ["1,0,0,0"],
    "NG_COMMANDS": ["0,1,0,0"]
}

current_config = {}
config_lock = threading.Lock()

task_queue = queue.Queue()
ser_instance = None
ser_lock = threading.Lock() 


# --- CONFIGURATION FUNCTIONS (WITH HOT RELOAD) ---
def load_config():
    global current_config
    with config_lock:
        if not os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(DEFAULT_CONFIG, f, indent=4, ensure_ascii=False)
            current_config = DEFAULT_CONFIG.copy()
            print("📝 [CONFIG] Created default config.json")
        else:
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    current_config = json.load(f)
                print("🔄 [CONFIG] Configuration loaded/hot-reloaded successfully.")
            except Exception as e:
                print(f"❌ [CONFIG] Error loading config, using in-memory fallbacks: {e}")
                if not current_config:
                    current_config = DEFAULT_CONFIG.copy()

def save_config(new_config_data):
    global current_config, ser_instance
    with config_lock:
        for key, value in new_config_data.items():
            if key in DEFAULT_CONFIG:
                # ตรวจสอบประเภทข้อมูลของ SERVER_PORT ให้เป็นตัวเลขเสมอ
                if key == "SERVER_PORT":
                    current_config[key] = int(value)
                else:
                    current_config[key] = value
        
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(current_config, f, indent=4, ensure_ascii=False)
            
    print("💾 [CONFIG] Configuration saved to disk.")
    
    with ser_lock:
        if ser_instance is not None:
            try:
                ser_instance.close()
            except:
                pass
            globals()['ser_instance'] = None
            print("🔌 [SERIAL] Closed old connection to apply new config on next write.")


# --- MOCK SERIAL CLASS ---
class MockSerial:
    def __init__(self, port, baudrate, timeout=1):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.is_open = True
        print(f"📦 [MOCK SERIAL] Virtual Port {port} initialized at {baudrate} baud.")

    def write(self, data_bytes):
        if not self.is_open:
            raise Exception("Attempting to write to a closed port.")
        command_str = data_bytes.decode('utf-8').replace('\n', '\\n').replace('\r', '\\r')
        print(f"📡 [MOCK OUTPUT] -> {command_str}")
        return len(data_bytes)

    def close(self):
        self.is_open = False
        print(f"🔒 [MOCK SERIAL] Port {self.port} closed.")


# --- SERIAL CONNECTION MANAGEMENT WITH BACKOFF ---
def get_serial_connection():
    global ser_instance
    
    with config_lock:
        mock_mode = current_config.get("MOCK_MODE", True)
        port = current_config.get("SERIAL_PORT", "COM3")
        baud = current_config.get("BAUD_RATE", 9600)

    if ser_instance is not None:
        try:
            if mock_mode and ser_instance.is_open:
                return ser_instance
            elif not mock_mode and ser_instance.is_open:
                return ser_instance
        except Exception:
            print("⚠️ [SERIAL] Existing connection detected as broken.")
            ser_instance = None

    if mock_mode:
        ser_instance = MockSerial(port=port, baudrate=baud)
        return ser_instance
    else:
        import serial
        try:
            ser_instance = serial.Serial(port=port, baudrate=baud, timeout=1)
            print(f"🔌 [SERIAL] Connected to REAL Serial Port: {port}")
            return ser_instance
        except Exception as e:
            print(f"❌ [SERIAL] Cannot open real serial port {port}: {e}")
            ser_instance = None
            return None


# --- BACKGROUND WORKER ---
def serial_worker():
    print("🤖 Background Serial Worker Started.")
    
    backoff_time = 1.0
    max_backoff = 30.0

    while True:
        task = task_queue.get()
        commands = task['commands']

        success = False
        
        while not success:
            with ser_lock:
                ser = get_serial_connection()
                
            if ser is not None:
                try:
                    backoff_time = 1.0 
                    
                    with config_lock:
                        mode_label = "MOCK" if current_config.get("MOCK_MODE") else "REAL"
                        
                    print(f"\n--- Starting {mode_label} Sequence ({len(commands)} steps) ---")
                    print(commands)
                    for cmd in commands:
                        ser.write(f"{cmd}\n".encode('utf-8'))

                    print(f"--- {mode_label} Sequence Finished ---\n")
                    success = True 
                    
                except Exception as e:
                    print(f"❌ [WORKER] Error during write execution: {e}")
                    with ser_lock:
                        if ser_instance:
                            try:
                                ser_instance.close()
                            except:
                                pass
                        globals()['ser_instance'] = None
            
            if not success:
                print(f"💤 [SERIAL] Connection unavailable or lost. Retrying in {backoff_time}s...")
                time.sleep(backoff_time)
                backoff_time = min(backoff_time * 2, max_backoff)

        task_queue.task_done()


# --- HTTP ENDPOINTS ---

@app.route('/api/v1/signal/quality', methods=['POST'])
def send_quality_signal():
    data = request.get_json() or {}
    status = data.get('status', '').upper()

    if status not in ['OK', 'NG']:
        return jsonify({"error": "Invalid or missing 'status'. Must be 'OK' or 'NG'"}), 400

    with config_lock:
        cmd_key = f"{status}_COMMANDS"
        commands = current_config.get(cmd_key, [])

    task_queue.put({
        "commands": commands
    })

    return jsonify({
        "status": "queued",
        "signal_type": status,
        "commands_queued": commands,
        "items_in_queue": task_queue.qsize()
    }), 202


@app.route('/api/signal/plc', methods=['POST'])
def send_plc_command():
    data = request.get_json() or {}
    value = str(data.get('value', '1')) 
    plc_formatted_command = f",,{value},,,,,,,\r\n"

    task_queue.put({
        "commands": [plc_formatted_command]
    })

    return jsonify({
        "status": "queued",
        "source": "PLC_DIRECT",
        "command_queued": plc_formatted_command,
        "items_in_queue": task_queue.qsize()
    }), 202


@app.route('/api/config', methods=['GET', 'POST'])
def handle_config():
    if request.method == 'GET':
        with config_lock:
            return jsonify(current_config), 200
            
    elif request.method == 'POST':
        data = request.get_json() or {}
        if not data:
            return jsonify({"error": "No configuration data provided"}), 400
            
        # ตรวจสอบว่าพอร์ตมีการเปลี่ยนแปลงไหม เพื่อแจ้งเตือนผู้ใช้ใน Response
        old_server_port = current_config.get("SERVER_PORT", 8080)
        new_server_port = data.get("SERVER_PORT", old_server_port)
        
        save_config(data)
        
        response_msg = "Configuration updated and hot-reloaded."
        if int(old_server_port) != int(new_server_port):
            response_msg += f" ⚠️ Note: Server port changed to {new_server_port}. Please restart the application to bind onto the new port."
        
        with config_lock:
            return jsonify({
                "message": response_msg,
                "current_config": current_config
            }), 200


if __name__ == '__main__':
    # 1. โหลดข้อมูลตั้งค่ารวมถึง SERVER_PORT จากไฟล์ก่อน
    load_config()
    
    # ดึงค่าพอร์ตที่อ่านได้มาเก็บไว้เปิดเซิร์ฟเวอร์
    bind_port = current_config.get("SERVER_PORT", 8080)

    # 2. เริ่มทำงาน Worker Thread เบื้องหลัง
    worker_thread = threading.Thread(target=serial_worker, daemon=True)
    worker_thread.start()

    # 3. รันเซิร์ฟเวอร์ Flask ตามพอร์ตใน Config ดนยตรง
    print(f"🚀 [SERVER] Starting Flask Web Server on port {bind_port}...")
    app.run(host='0.0.0.0', port=bind_port, debug=False)