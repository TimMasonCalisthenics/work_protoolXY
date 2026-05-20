import serial
import time

# Configure the serial port
# Replace 'PORT_NAME' with your actual port (e.g., '/dev/ttyUSB0', 'COM3')
# Replace BAUD_RATE with the baud rate of your device (e.g., 9600, 115200)
ser = serial.Serial(
    port='COM3',  
    baudrate=57600,  
    timeout=1  # Timeout in seconds
)

time.sleep(2)  # Give the connection time to establish

try:
    while True:
        if ser.in_waiting > 0:  # Check if there's data in the buffer
            line = ser.readline()  # Read a line from the serial port
            try:
                decoded_line = line.decode('utf-8').rstrip()    # Decode and remove trailing whitespace
            except UnicodeDecodeError:
                try:
                    decoded_line = line.decode('latin-1').rstrip()
                except UnicodeDecodeError:
                    decoded_line = line.decode('cp1252').rstrip() # Or another common encoding
            print(decoded_line)

except KeyboardInterrupt:
    print("Program terminated by user.")
finally:
    ser.close()  # Close the serial port