
import serial.tools.list_ports

def scan_serial_ports():
    """Scans for and prints information about available serial ports."""
    print("Scanning for serial ports...")
    ports = serial.tools.list_ports.comports()

    if not ports:
        print("No serial ports found.")
        return

    for i, port in enumerate(ports):
        print(f"\n--- Port {i+1} ---")
        print(f"  Device: {port.device}")
        print(f"  Description: {port.description}")
        print(f"  Hardware ID: {port.hwid}")
        # Additional attributes like vendor_id, product_id, serial_number can also be accessed
        # if available for the specific port.

if __name__ == "__main__":
    scan_serial_ports()