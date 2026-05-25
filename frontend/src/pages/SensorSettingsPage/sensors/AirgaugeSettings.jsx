import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    HiPlus, HiTrash, HiArrowDownTray,
    HiOutlineCog, HiArrowPath, HiWrenchScrewdriver,
    HiArrowUpTray, HiPlay, HiStop
} from "react-icons/hi2";
import { get_all_settings, update_all_settings, get_raw_value } from '../../../services/airgaugeSensor/airgaugeService';
import { showSuccess, showError } from '../../../utils/toast';
import ComfirmModal from '../../../components/ComfirmModal';

function AirGaugeSettings() {
    const fileInputRef = useRef(null);
    const intervalRef = useRef(null);
    const [isPolling, setIsPolling] = useState(false); // เพิ่ม state นี้
    const { register, control, handleSubmit, reset, getValues, setValue, watch } = useForm({
        defaultValues: { airgauge_list: [] }
    });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [detailModal, setDetailModal] = useState(null);

    const precision = 3;
    const { fields, append, remove } = useFieldArray({
        control,
        name: "airgauge_list"
    });

    useEffect(() => {
        const intialConfig = async () => {
            try {
                const res = await get_all_settings();
                reset(mapDataToForm(res.data));
            } catch (error) {
                console.error("API Load error:", error);
            }
        }
        intialConfig();
    }, [])

    useEffect(() => {

    }, []);

    const fetchRealtimeData = async () => {
        try {
            const result = await get_raw_value();
            if (result.success && result.data) {
                const currentList = getValues("airgauge_list");

                currentList.forEach((item, index) => {
                    const sensorValues = result.data[item.key];

                    if (Array.isArray(sensorValues) && sensorValues.length >= 2) {
                        const valX = parseFloat(sensorValues[0]);
                        const valXCal = parseFloat(sensorValues[1]);

                        if (!isNaN(valX)) {
                            setValue(`airgauge_list.${index}.x`, valX.toFixed(precision));
                        }
                        if (!isNaN(valXCal)) {
                            setValue(`airgauge_list.${index}.x_cal`, valXCal.toFixed(precision));
                        }
                    }
                }
                );
            }
        } catch (error) {
            console.error("Polling error:", error);
        }
    };

    const handleStartPolling = () => {
        if (intervalRef.current) return;
        const pollInterval = 100;
        setIsPolling(true);
        intervalRef.current = setInterval(fetchRealtimeData, pollInterval);
        console.log("Polling started...");
    };

    const handleStopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsPolling(false);
            console.log("Polling stopped.");
        }
    };

    // 4. Cleanup เมื่อ Component ถูกทำลาย
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const mapDataToForm = (json) => {
        const list = Object.entries(json.airgauge || {}).map(([id, data]) => ({
            id: id,
            ...data
        }));
        return { ...json, airgauge_list: list };
    };

    // แปลงจาก Form (Array format) -> API/JSON (Object format)
    const mapFormToPayload = (formData) => {
        const airgaugeObject = formData.airgauge_list.reduce((acc, item) => {
            const { id, x, x_cal, ...rest } = item;
            const key = id || (Object.keys(acc).length + 1).toString();
            acc[key] = {
                ...rest,
                x0: Number(rest.x0),
                y0: Number(rest.y0),
                x1: Number(rest.x1),
                y1: Number(rest.y1),
                iscalmax: String(rest.iscalmax) === 'true',
                iscalmin: String(rest.iscalmin) === 'true'
            };
            return acc;
        }, {});

        return {
            main_service_url: formData.main_service_url,
            retry: {
                max_attempts: Number(formData.retry.max_attempts),
                delay_ms: Number(formData.retry.delay_ms),
                backoff: Number(formData.retry.backoff)
            },
            "settings-airgauge": {
                ...formData["settings-airgauge"],
                number_module: Number(formData["settings-airgauge"].number_module),
                number_device: formData.airgauge_list.length,
                interval: Number(formData["settings-airgauge"].interval)
            },
            airgauge: airgaugeObject
        };
    };

    /**
     * 2. Action Handlers
     */

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                reset(mapDataToForm(JSON.parse(e.target.result)));
            } catch (err) {
                alert("Invalid JSON format");
            }
        };
        reader.readAsText(file);
    };

    const handleLoadJsonFromAPI = async () => {
        try {
            const res = await get_all_settings();
            reset(mapDataToForm(res.data));
            showSuccess("Load successfully!");
        } catch (error) {
            showError("Load failed!");
        }
    };

    const handleUpdateJsonFromAPI = async (data) => {
        const finalPayload = mapFormToPayload(data);
        // console.log("Payload to Send:", JSON.stringify(finalPayload, null, 2)); // <--- ตรวจสอบตรงนี้
        try {
            const res = await update_all_settings(finalPayload);
            if (res.success) {
                showSuccess("Update successfully!");
            }
        } catch (error) {
            console.error("Update failed:", error);
            showError("Update failed.");
        }
    };

    const handleSaveJson = () => {
        const finalJson = mapFormToPayload(getValues());
        const blob = new Blob([JSON.stringify(finalJson, null, 4)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `airgauge_config_${getValues("settings-airgauge.Sensor-ID") || 'export'}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };
    const handleSetMax = (index) => {
        const currentX = getValues(`airgauge_list.${index}.x`);

        setValue(`airgauge_list.${index}.x0`, currentX);
        setValue(`airgauge_list.${index}.iscalmax`, true);
    };

    const handleResetMax = (index) => {
        setValue(`airgauge_list.${index}.iscalmax`, false);
    };
    const handleSetMin = (index) => {
        const currentX = getValues(`airgauge_list.${index}.x`);
        setValue(`airgauge_list.${index}.x1`, currentX);
        setValue(`airgauge_list.${index}.iscalmin`, true);
    };
    const handleResetMin = (index) => {
        console.log('reset min');
        setValue(`airgauge_list.${index}.iscalmin`, false);

    };

    const handleSetAllMax = () => {
        fields.forEach((field, index) => {
            const currentX = getValues(`airgauge_list.${index}.x`);
            setValue(`airgauge_list.${index}.x0`, currentX);
            setValue(`airgauge_list.${index}.iscalmax`, true);
        });
        showSuccess("Set Max for all devices successfully!");
    };

    const handleResetAllMax = () => {
        fields.forEach((field, index) => {
            setValue(`airgauge_list.${index}.iscalmax`, false);
        });
        showSuccess("Reset Max for all devices successfully!");
    };

    const handleSetAllMin = () => {
        fields.forEach((field, index) => {
            const currentX = getValues(`airgauge_list.${index}.x`);
            setValue(`airgauge_list.${index}.x1`, currentX);
            setValue(`airgauge_list.${index}.iscalmin`, true);
        });
        showSuccess("Set Min for all devices successfully!");
    };

    const handleResetAllMin = () => {
        fields.forEach((field, index) => {
            setValue(`airgauge_list.${index}.iscalmin`, false);
        });
        showSuccess("Reset Min for all devices successfully!");
    };

    const setConfirmModal = (title, message, onConfirm) => {
        setDetailModal({
            title: title,
            message: message,
            onConfirm: onConfirm,
            onCancel: () => { setShowConfirmModal(false); setDetailModal(null) }
        })
        setShowConfirmModal(true);
    }

    const handleFormat = (index, value) => {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            const fixedValue = num.toFixed(precision);
            setValue(`airgauge_list.${index}.x`, fixedValue);
        }
    };
    // React-hook-form handles onSubmit validation before calling our update function
    const onSubmit = (data) => handleUpdateJsonFromAPI(data);
    return (
        <div className="min-h-screen bg-page p-6 text-primary transition-colors">
            {/* Background Animations */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-blob animate-delay-2000"></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-6">

                <div className="flex justify-between items-center glass-card p-4 rounded-xl shadow-sm">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <HiWrenchScrewdriver className="text-accent" /> AirGauge Config
                    </h1>
                    <div className="flex gap-2">
                        <div className='flex flex-row gap-2'>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="flex items-center gap-2 glass-input px-4 py-2 rounded-lg hover:bg-card-hover transition-all text-sm font-semibold"
                            >
                                <HiArrowDownTray /> Load File
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveJson}
                                className="flex items-center gap-2 glass-input px-4 py-2 rounded-lg hover:bg-card-hover transition-all text-sm font-semibold"
                            >
                                <HiArrowUpTray /> Save File
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
                        <button
                            type="button"
                            // onClick={handleLoadJsonFromAPI}
                            onClick={() => setConfirmModal("Confirm", "Are you sure you want to load from API?", handleLoadJsonFromAPI)}
                            className="btn-primary px-6 py-2 rounded-lg text-sm transition-all flex flex-1 md:flex-none flex items-center justify-center gap-2  transition-all text-sm font-semibold"
                        >
                            <HiArrowPath className="animate-spin-slow" /> Load from API
                        </button>
                        <button
                            // type="submit"
                            // onClick={handleUpdateJsonFromAPI}
                            type="button"
                            onClick={() => setConfirmModal("Confirm", "Are you sure you want to update configuration?",
                                () => {
                                    handleSubmit(handleUpdateJsonFromAPI)();
                                })}
                            className="btn-primary px-6 py-2 rounded-lg text-sm transition-all"

                        >

                            Save Configuration
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Connection & Retry */}
                    <div className="glass-card p-6 rounded-xl space-y-4">
                        <h2 className="font-bold flex items-center gap-2 text-primary border-b border-border-color pb-2"><HiArrowPath /> Connectivity</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-secondary uppercase">Service URL</label>
                                <input {...register("main_service_url")} className="w-full p-2 glass-input rounded-md mt-1" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-secondary">Max Retry</label>
                                    <input type="number" {...register("retry.max_attempts")} className="w-full p-2 glass-input rounded-md mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-secondary">Delay (ms)</label>
                                    <input type="number" {...register("retry.delay_ms")} className="w-full p-2 glass-input rounded-md mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-secondary">Backoff</label>
                                    <input type="number" step="0.1" {...register("retry.backoff")} className="w-full p-2 glass-input rounded-md mt-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AirGauge Settings */}
                    <div className="glass-card p-6 rounded-xl space-y-4">
                        <h2 className="font-bold flex items-center gap-2 text-primary border-b border-border-color pb-2"><HiOutlineCog /> Gauge Settings</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-secondary">Sensor ID</label>
                                <input {...register("settings-airgauge.Sensor-ID")} className="w-full p-2 glass-input rounded-md mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary">Module Count</label>
                                <input type="number" {...register("settings-airgauge.number_module")} className="w-full p-2 glass-input rounded-md mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary">Device Count</label>
                                <input type="number" {...register("settings-airgauge.number_device")} className="w-full p-2 glass-input rounded-md mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-secondary">Interval(second)</label>
                                <input type="number" step="0.1" {...register("settings-airgauge.interval")} className="w-full p-2 glass-input rounded-md mt-1" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Device List (AirGauge Data) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <h2 className="text-lg font-bold text-primary">Device Calibration ({fields.length})</h2>
                        <div className='flex flex-row gap-4 items-center'>
                            {/* สถานะ Live Indicator */}
                            {isPolling && (
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            )}

                            <div className='flex flex-row gap-2'>
                                {/* ปุ่ม START */}
                                <button
                                    type="button"
                                    onClick={handleStartPolling}
                                    disabled={isPolling}
                                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-bold transition-all
                ${isPolling
                                            ? 'bg-gray-500/5 text-gray-500 border-gray-500/20 cursor-not-allowed'
                                            : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 active:scale-95'
                                        }`}
                                >
                                    <HiPlay className={isPolling ? "" : "animate-pulse"} /> START LIVE
                                </button>

                                {/* ปุ่ม STOP */}
                                <button
                                    type="button"
                                    onClick={handleStopPolling}
                                    disabled={!isPolling}
                                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-bold transition-all
                ${!isPolling
                                            ? 'bg-gray-500/5 text-gray-500 border-gray-500/20 cursor-not-allowed'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                        }`}
                                >
                                    <HiStop /> STOP
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => append({ id: (fields.length + 1).toString(), key: "new_sensor", x0: 0, y0: 0, x1: 0, y1: 0, x: 0, iscalmax: true, iscalmin: true })}
                            className="bg-accent/10 text-accent px-4 py-2 rounded-lg border border-accent/20 hover:bg-accent/20 flex items-center gap-1 text-sm font-bold transition-all"
                        >
                            <HiPlus /> Add Device
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {fields.map((field, index) => {
                            const isCalMax = watch(`airgauge_list.${index}.iscalmax`);
                            const isCalMin = watch(`airgauge_list.${index}.iscalmin`);
                            return (
                                <div key={field.id} className="glass-card p-5 rounded-xl border border-border-color shadow-sm hover:border-accent transition-all relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                                    {/* <div className="flex flex-wrap md:flex-nowrap gap-4 items-start"> */}
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        <div className="w-20">
                                            <label className="text-[10px] font-bold text-secondary uppercase">ID</label>
                                            <input {...register(`airgauge_list.${index}.id`)} className="w-full p-1 bg-transparent border-b border-border-color font-bold text-accent outline-none" />
                                        </div>
                                        <div className="flex-1 min-w-[150px]">
                                            <label className="text-[10px] font-bold text-secondary uppercase">Key Name</label>
                                            <input {...register(`airgauge_list.${index}.key`)} className="w-full p-1 bg-transparent border-b border-border-color outline-none" />
                                        </div>

                                        {/* <div className="grid grid-cols-5  gap-3 flex-[3]"> */}
                                        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:flex-[4] items-start">
                                            {/* section x value or realtime value   */}
                                            <div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-secondary uppercase">real time</label>
                                                    {/* <input type="number" step="any" {...register(`airgauge_list.${index}.x`)} className="w-full p-1 bg-transparent border-b border-border-color outline-none text-sm font-mono" /> */}
                                                    <input
                                                        type="number"
                                                        {...register(`airgauge_list.${index}.x`)}
                                                        disabled
                                                        className="w-full p-1 bg-transparent border-b border-border-color outline-none text-sm font-mono" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-secondary uppercase">real time cal</label>
                                                    <input
                                                        type="number"
                                                        {...register(`airgauge_list.${index}.x_cal`)}
                                                        disabled
                                                        className="w-full p-1 bg-transparent border-b border-border-color outline-none text-sm font-mono" />
                                                </div>
                                            </div>
                                            {/* section y value   */}
                                            <div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Master Max (y0)</label>
                                                    <input type="number"
                                                        disabled={isCalMax} step="0.0001" {...register(`airgauge_list.${index}.y0`)} className="w-full p-1 bg-transparent border-b border-border-color outline-none text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Master Min (y1)</label>
                                                    <input type="number"
                                                        disabled={isCalMin} step="0.0001" {...register(`airgauge_list.${index}.y1`)} className="w-full p-1 bg-transparent border-b border-border-color outline-none text-sm" />
                                                </div>

                                            </div>
                                            {/* section x value   */}
                                            <div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Sensor Max (x0)</label>
                                                    <input type="number"
                                                        disabled={isCalMax} step="0.0001" {...register(`airgauge_list.${index}.x0`)} className="w-full p-1 bg-transparent border-b border-border-color outline-none text-sm" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-secondary uppercase">Sensor Min (x1)</label>
                                                    <input type="number"
                                                        disabled={isCalMin} step="0.0001" {...register(`airgauge_list.${index}.x1`)} className="w-full p-1 bg-transparent border-b border-border-color outline-none text-sm" />
                                                </div>
                                            </div>
                                            <div className='flex flex-row gap-2 col-span-3  lg:col-span-2 h-full'>
                                                {/* section set max min*/}
                                                <div className="w-1/2 grid grid-cols-1 md:grid-row gap-2">
                                                    <button type="button"
                                                        className=

                                                        {`px-4 py-2 rounded-lg border flex items-center gap-1 text-sm font-bold justify-center transition-all ${isCalMax ? 'bg-gray-500/10 text-gray-400 border-transparent cursor-not-allowed' : 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
                                                            }`}
                                                        disabled={isCalMax}
                                                        onClick={() => handleSetMax(index)}
                                                    >
                                                        <HiPlus />Set max
                                                    </button>
                                                    <button type="button" className={`px-4 py-2 rounded-lg border flex items-center gap-1 text-sm font-bold justify-center transition-all ${isCalMin ? 'bg-gray-500/10 text-gray-400 border-transparent cursor-not-allowed' : 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
                                                        }`}
                                                        disabled={isCalMin}
                                                        onClick={() => handleSetMin(index)}
                                                    >
                                                        <HiPlus />Set min
                                                    </button>
                                                </div>
                                                {/* section reset max min*/}
                                                <div className="w-1/2 grid grid-cols-1 md:flex-row gap-2">
                                                    <button type="button" className={`flex items-center gap-1 text-sm font-bold justify-center transition-all duration-200 px-4 py-2 rounded-lg border
                                                            ${isCalMax
                                                            ? "bg-slate-500/20 text-secondary border-slate-500/30 hover:bg-slate-500/30 hover:shadow-md cursor-pointer"
                                                            : "bg-slate-500/5 text-secondary/30 border-transparent opacity-40 cursor-not-allowed"}
                                                            `}
                                                        disabled={!isCalMax}
                                                        onClick={() => handleResetMax(index)}
                                                    >
                                                        <HiPlus /> Reset max
                                                    </button>
                                                    <button type="button" className={`flex items-center gap-1 text-sm font-bold justify-center transition-all duration-200 px-4 py-2 rounded-lg border
                                                            ${isCalMin
                                                            ? "bg-slate-500/20 text-secondary border-slate-500/30 hover:bg-slate-500/30 hover:shadow-md cursor-pointer"
                                                            : "bg-slate-500/5 text-secondary/30 border-transparent opacity-40 cursor-not-allowed"}
                                                            `}
                                                        disabled={!isCalMin}
                                                        onClick={() => handleResetMin(index)}
                                                    >

                                                        <HiPlus /> Reset min
                                                    </button>
                                                </div>
                                            </div>
                                        </div>


                                        <button type="button" onClick={() => remove(index)} className="text-secondary hover:text-red-500 transition-colors p-2 self-center">
                                            <HiTrash size={22} />
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                        )}

                    </div>
                    {fields.length > 0 && (
                        <div className="glass-card p-4 rounded-xl border border-dashed border-accent/30 bg-accent/5 flex flex-col md:flex-row justify-between items-center gap-4 mt-4 shadow-sm">
                            <div className="text-left">
                                <span className="text-sm font-bold text-primary block">Bulk Device Operations</span>
                                <span className="text-xs text-secondary block">Command to set all min/max and reset all min/max</span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto">
                                {/* ปุ่มกลุ่มควบคุมฝั่ง MAX */}
                                <button type="button" onClick={handleSetAllMax} className="bg-accent/10 text-accent px-4 py-2 rounded-lg border border-accent/20 hover:bg-accent/20 text-xs font-bold transition-all flex items-center justify-center gap-1">
                                    <HiPlus /> Set All Max
                                </button>
                                <button type="button" onClick={handleResetAllMax} className="bg-slate/10 text-slate px-4 py-2 rounded-lg border border-slate/20 hover:bg-accent/20 text-xs font-bold transition-all flex items-center justify-center gap-1">
                                    <HiPlus /> Reset All Max
                                </button>

                                {/* ปุ่มกลุ่มควบคุมฝั่ง MIN */}
                                <button type="button" onClick={handleSetAllMin} className="bg-accent/10 text-accent px-4 py-2 rounded-lg border border-accent/20 hover:bg-accent/20 text-xs font-bold transition-all flex items-center justify-center gap-1">
                                    <HiPlus /> Set All Min
                                </button>
                                <button type="button" onClick={handleResetAllMin} className="bg-slate/10 text-slate px-4 py-2 rounded-lg border border-slate/20 hover:bg-accent/20 text-xs font-bold transition-all flex items-center justify-center gap-1">
                                    <HiPlus /> Reset All Min
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </form >
            {detailModal && (
                <ComfirmModal
                    title={detailModal.title}
                    message={detailModal.message}
                    variant='warning'
                    handleConfirmOK={detailModal.onConfirm}
                    handleConfirmNo={detailModal.onCancel}
                    buttonNo='No'
                    buttonOK='Yes'
                    onClose={() => setDetailModal(null)}
                />
            )}
        </div >
    );
}

export default AirGaugeSettings;