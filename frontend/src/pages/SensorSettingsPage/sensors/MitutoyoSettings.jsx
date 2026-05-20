import { useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { HiPlus, HiTrash, HiCpuChip, HiArrowsRightLeft, HiCog6Tooth, HiArrowDownTray, HiArrowUpTray } from "react-icons/hi2";
function MitutoyoSettings() {
    const fileInputRef = useRef(null);

    const { register, control, handleSubmit, reset } = useForm({
        defaultValues: {
            machine_id: "M01",
            post_url: "http://localhost:5000/api/v1/sensors/raw",
            mapping: [],
            serial: {
                mode: "auto",
                port: "COM1",
                baudrate: 115200,
                timeout: 1,
                vid: "",
                pid: "",
                serial_number: ""
            }
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "mapping"
    });

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                const transformedMapping = Object.entries(json.mapping || {}).map(([key, value]) => ({
                    key,
                    value
                }));

                reset({
                    ...json,
                    mapping: transformedMapping,
                    serial: {
                        ...json.serial,
                        serial_number: json.serial?.serial_number || ""
                    }
                });
                alert("โหลดข้อมูลสำเร็จ!");
            } catch (error) {
                alert("ไฟล์ JSON ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
            }
        };
        reader.readAsText(file);
        event.target.value = "";
    };
    const handleSaveJson = () => {
        // ดึงข้อมูลปัจจุบันจาก useForm
        const data = control._formValues;

        // ทำการ Transform ข้อมูล mapping จาก array กลับเป็น object (เหมือนใน onSubmit)
        const formattedMapping = data.mapping.reduce((acc, curr) => {
            if (curr.key) acc[curr.key] = curr.value;
            return acc;
        }, {});

        const finalJson = {
            ...data,
            mapping: formattedMapping,
            serial: {
                ...data.serial,
                timeout: Number(data.serial.timeout),
                baudrate: Number(data.serial.baudrate),
                serial_number: data.serial.serial_number || null
            }
        };

        // --- ส่วนการสร้างไฟล์สำหรับดาวน์โหลด ---
        const jsonString = JSON.stringify(finalJson, null, 4); // null, 4 ช่วยให้ไฟล์อ่านง่าย (pretty print)
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `config_${data.machine_id || 'mitutoyo'}.json`; // ตั้งชื่อไฟล์
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    const onSubmit = (data) => {
        const formattedMapping = data.mapping.reduce((acc, curr) => {
            if (curr.key) acc[curr.key] = curr.value;
            return acc;
        }, {});

        const finalJson = {
            ...data,
            mapping: formattedMapping,
            serial: {
                ...data.serial,
                timeout: Number(data.serial.timeout),
                baudrate: Number(data.serial.baudrate),
                serial_number: data.serial.serial_number || null
            }
        };

        // console.log("Generated JSON:", finalJson);
        alert("บันทึกเรียบร้อย! ดูผลลัพธ์ที่ Console");
    };

    return (
        <div className="min-h-screen bg-page p-8 text-primary font-sans transition-colors duration-300">
            {/* Background Animations (Blobs) */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-1/4 -left-10 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-blob"></div>
                <div className="absolute bottom-1/4 -right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-blob animate-delay-4000"></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-6">

                {/* Hidden File Input */}
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                />

                {/* Section: General & Actions */}
                <div className="glass-card p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-accent">
                            <HiCpuChip size={24} /> General Configuration
                        </h2>
                        <div className='flex flex-row gap-3'>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="flex items-center gap-2 glass-input px-4 py-2 rounded-lg hover:bg-card-hover transition-all font-semibold border-border-color shadow-sm text-sm"
                            >
                                <HiArrowDownTray /> Load JSON
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveJson}
                                className="flex items-center gap-2 glass-input px-4 py-2 rounded-lg hover:bg-card-hover transition-all font-semibold border-border-color shadow-sm text-sm"
                            >
                                <HiArrowUpTray /> Save JSON
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold mb-1 text-secondary uppercase tracking-wider">Sensor ID</label>
                            <input {...register("machine_id")} className="w-full p-2 glass-input rounded-md focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 text-secondary uppercase tracking-wider">Post URL</label>
                            <input {...register("post_url")} className="w-full p-2 glass-input rounded-md focus:ring-accent" />
                        </div>
                    </div>
                </div>

                {/* Section: Mapping */}
                <div className="glass-card p-6 rounded-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-accent">
                            <HiArrowsRightLeft size={24} /> Sensor Mapping
                        </h2>
                        <button
                            type="button"
                            onClick={() => append({ key: "", value: "" })}
                            className="flex items-center gap-1 bg-accent/10 text-accent px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors font-bold text-sm border border-accent/20"
                        >
                            <HiPlus /> Add Pair
                        </button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-4 items-center group">
                                <input
                                    {...register(`mapping.${index}.key`)}
                                    placeholder="Key (e.g. AB123)"
                                    className="flex-1 p-2 glass-input rounded-md focus:ring-1 focus:ring-accent"
                                />
                                <span className="text-accent font-black animate-pulse">→</span>
                                <input
                                    {...register(`mapping.${index}.value`)}
                                    placeholder="Value (e.g. D100)"
                                    className="flex-1 p-2 glass-input rounded-md focus:ring-1 focus:ring-accent"
                                />
                                <button type="button" onClick={() => remove(index)} className="text-secondary hover:text-red-500 p-2 transition-colors">
                                    <HiTrash size={20} />
                                </button>
                            </div>
                        ))}
                        {fields.length === 0 && (
                            <div className="text-center py-4 border-2 border-dashed border-border-color rounded-xl text-secondary text-sm">
                                No mapping pairs added. Click "Add Pair" to start.
                            </div>
                        )}
                    </div>
                </div>

                {/* Section: Serial Port */}
                <div className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-accent">
                        <HiCog6Tooth size={24} /> Serial Port Settings
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold mb-1 text-secondary uppercase tracking-wider">Port</label>
                            <input {...register("serial.port")} className="w-full p-2 glass-input rounded-md" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 text-secondary uppercase tracking-wider">Mode</label>
                            <select {...register("serial.mode")} className="w-full p-2 glass-input rounded-md">
                                <option value="auto" className="bg-card">Auto</option>
                                <option value="manual" className="bg-card">Manual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 text-secondary uppercase tracking-wider">Baudrate</label>
                            {/* <input type="number" {...register("serial.baudrate")} className="w-full p-2 glass-input rounded-md" /> */}
                            <select
                                {...register("serial.baudrate")}
                                className="w-full p-2 glass-input rounded-md"
                                defaultValue="9600"
                            >
                                <option value="300">300</option>
                                <option value="600">600</option>
                                <option value="1200">1200</option>
                                <option value="2400">2400</option>
                                <option value="4800">4800</option>
                                <option value="9600">9600</option>
                                <option value="19200">19200</option>
                                <option value="38400">38400</option>
                                <option value="57600">57600</option>
                                <option value="115200">115200</option>
                                <option value="230400">230400</option>
                                <option value="460800">460800</option>
                                <option value="921600">921600</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 text-secondary uppercase tracking-wider">VID</label>
                            <input {...register("serial.vid")} className="w-full p-2 glass-input rounded-md" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 text-secondary uppercase tracking-wider">PID</label>
                            <input {...register("serial.pid")} className="w-full p-2 glass-input rounded-md" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 text-secondary uppercase tracking-wider">Timeout</label>
                            <input type="number" {...register("serial.timeout")} className="w-full p-2 glass-input rounded-md" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 text-secondary uppercase tracking-wider">Serial No.</label>
                            <input {...register("serial.serial_number")} className="w-full p-2 glass-input rounded-md" />
                        </div>
                    </div>
                </div>

                {/* <button
                    type="submit"
                    className="btn-primary w-full py-4 text-lg"
                >
                    Save Configuration
                </button> */}
            </form>
        </div>
    );
}

export default MitutoyoSettings;