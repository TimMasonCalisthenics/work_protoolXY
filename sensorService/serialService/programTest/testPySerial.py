import tkinter as tk
from tkinter import ttk, messagebox
import serial
import serial.tools.list_ports
import time

# =========================
# Global Serial
# =========================
ser = None

# =========================
# Scan COM Ports
# =========================
def refresh_ports():

    ports = serial.tools.list_ports.comports()

    port_list = [port.device for port in ports]

    com_dropdown['values'] = port_list

    if port_list:
        com_dropdown.current(0)

# =========================
# Connect Serial
# =========================
def connect_serial():

    global ser

    selected_port = com_var.get()

    if selected_port == "":
        messagebox.showwarning("Warning", "Select COM Port")
        return

    try:

        ser = serial.Serial(
            port=selected_port,
            baudrate=9600,
            timeout=1
        )

        time.sleep(2)

        status_label.config(
            text=f"Connected : {selected_port}",
            fg="green"
        )

        print(f"[SUCCESS] Connected to {selected_port}")

    except Exception as e:

        messagebox.showerror("Connection Error", str(e))

        status_label.config(
            text="Disconnected",
            fg="red"
        )

# =========================
# Send Command
# =========================
def send_command(cmd):

    global ser

    if ser is None or not ser.is_open:

        messagebox.showerror(
            "Error",
            "Serial not connected"
        )

        return

    try:

        send_data = cmd + "\n"

        ser.write(send_data.encode())

        print("Send:", send_data.strip())

        status_send.config(
            text=f"Last Send : {cmd}",
            fg="blue"
        )

    except Exception as e:

        messagebox.showerror("Send Error", str(e))

# =========================
# Relay Commands
# =========================
def relay1():
    send_command("1,0,0,0")

def relay2():
    send_command("0,1,0,0")

def relay3():
    send_command("0,0,1,0")

def relay4():
    send_command("0,0,0,1")

# =========================
# Close Program
# =========================
def on_close():

    global ser

    if ser and ser.is_open:
        ser.close()

    root.destroy()

# =========================
# UI
# =========================
root = tk.Tk()

root.title("ESP32 Relay Controller")
root.geometry("450x400")

# =========================
# Title
# =========================
title = tk.Label(
    root,
    text="ESP32 Relay Controller",
    font=("Arial", 18, "bold")
)

title.pack(pady=15)

# =========================
# COM Frame
# =========================
com_frame = tk.Frame(root)

com_frame.pack(pady=10)

tk.Label(
    com_frame,
    text="COM Port:"
).grid(row=0, column=0, padx=5)

com_var = tk.StringVar()

com_dropdown = ttk.Combobox(
    com_frame,
    textvariable=com_var,
    width=15,
    state="readonly"
)

com_dropdown.grid(row=0, column=1, padx=5)

refresh_btn = tk.Button(
    com_frame,
    text="Refresh",
    command=refresh_ports
)

refresh_btn.grid(row=0, column=2, padx=5)

connect_btn = tk.Button(
    com_frame,
    text="Connect",
    bg="lightgreen",
    command=connect_serial
)

connect_btn.grid(row=0, column=3, padx=5)

# =========================
# Connection Status
# =========================
status_label = tk.Label(
    root,
    text="Disconnected",
    fg="red",
    font=("Arial", 12, "bold")
)

status_label.pack(pady=10)

# =========================
# Relay Buttons
# =========================
button_frame = tk.Frame(root)

button_frame.pack(pady=10)

btn1 = tk.Button(
    button_frame,
    text="Relay 1",
    width=15,
    height=2,
    command=relay1
)

btn1.grid(row=0, column=0, padx=10, pady=10)

btn2 = tk.Button(
    button_frame,
    text="Relay 2",
    width=15,
    height=2,
    command=relay2
)

btn2.grid(row=0, column=1, padx=10, pady=10)

btn3 = tk.Button(
    button_frame,
    text="Relay 3",
    width=15,
    height=2,
    command=relay3
)

btn3.grid(row=1, column=0, padx=10, pady=10)

btn4 = tk.Button(
    button_frame,
    text="Relay 4",
    width=15,
    height=2,
    command=relay4
)

btn4.grid(row=1, column=1, padx=10, pady=10)

# =========================
# Last Send Status
# =========================
status_send = tk.Label(
    root,
    text="Last Send : None",
    font=("Arial", 11)
)

status_send.pack(pady=20)

# =========================
# Initial Scan
# =========================
refresh_ports()

# =========================
# Close Event
# =========================
root.protocol("WM_DELETE_WINDOW", on_close)

# =========================
# Start App
# =========================
root.mainloop()