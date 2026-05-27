import { useState, useEffect, useRef } from 'react';
import { useStep } from '@context/MeasurementContext';
import { showSuccess, showError, showWarning } from '@utils/toast';
import ComfirmModal from '@components/ComfirmModal';
import { IMAGE_BASE_URL } from '@services/interceptor';

import { clearTmp } from '@services/sensorService';
import {
  saveMeasurement,
  cancelMeasurementDraft,
  createMeasurementDraft,
  saveMeasurementWithoutCheck
} from '@services/measurementService';
import { start_readSensor, stop_readSensor } from '@services/airgaugeSensor/airgaugeService';
import { getMeasurementsDraft, clearNgAndRawValueMeasurementsDraft } from '@services/measurements_draft_service';
import { API_AIRGAUGE_URL } from '@services/interceptor';
import { sendQualitySignal } from '@/services/serialSensor/serialSensor';

function QualityCheckGaugeMultiAxis() {
  const { zeroStep, product, goStep, refreshDraft, draftMeasurement, setDraftMeasurement } = useStep();
  const [measurementData, setMeasurementData] = useState([]);
  const [showCancelDraft, setShowCancelDraft] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const precision = 3;
  const shortCutKey = "Space";

  // --- 📌 ระบบสวิตช์ควบคุม Flow หน้าจอ (เปิด-ปิด Polling และล็อกปุ่ม) ---
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [forceShowStartButton, setForceShowStartButton] = useState(false);

  // --- ⏱️ 1. ระบบเวลา & คลังความจำ Local Storage ---
  const [timeoutX, setTimeoutX] = useState(() => Number(localStorage.getItem('timer_axis_x')) || 5);
  const [timeoutY, setTimeoutY] = useState(() => Number(localStorage.getItem('timer_axis_y')) || 5);

  const [timeLeftX, setTimeLeftX] = useState(0);
  const [timeLeftY, setTimeLeftY] = useState(0);

  const hasLoggedTimeoutX = useRef(false);
  const hasLoggedTimeoutY = useRef(false);
  const intervalIdX = useRef(null);
  const intervalIdY = useRef(null);
  const hasAutoShowed = useRef(false);

  const closeModal = () => {
    setModalConfig(null);
    hasAutoShowed.current = false;
  };

  // --- 📦 2. จัดกลุ่มข้อมูลตามโครงสร้างเก่า (อิงจาก product.step4) ---
  const groupedPoints = Object.values(
    (product.step4 || []).reduce((acc, current) => {
      const key = current.sensor_value_key || current.value_key;
      if (!acc[key]) {
        acc[key] = {
          sensor_value_key: key,
          display_name: current.point_name.replace(/[XY]$/, ''),
          rawX: null,
          rawY: null
        };
      }

      if (current.sensor_type === 'air_gauge_x') {
        acc[key].rawX = current;
      } else if (current.sensor_type === 'air_gauge_y') {
        acc[key].rawY = current;
      }
      return acc;
    }, {})
  );

  // --- 📡 3. บริการสตรีมมิ่งเซ็นเซอร์ตอน Mount/Unmount ---
  useEffect(() => {
    let isMounted = true;
    const startService = async () => {
      try {
        await start_readSensor();
      } catch (err) {
        if (isMounted) showError("Failed to start sensor reading");
      }
    };
    startService();

    return () => {
      isMounted = false;
      const stopService = async () => {
        try {
          await stop_readSensor();
        } catch (err) {
          console.error("Failed to stop sensor reading", err);
        }
      };
      stopService();
    };
  }, []);

  // Beacon Signal ป้องกันข้อมูลค้างเมื่อปิดบราวเซอร์กะทันหัน
  useEffect(() => {
    const handleBeforeUnload = () => {
      const url = `${API_AIRGAUGE_URL}/airgauge/stop-send`;
      const data = JSON.stringify({ status: 'stop' });
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // --- 🕒 4. Polling ดึงข้อมูลเรียลไทม์จาก Draft หลังบ้าน ---
  useEffect(() => {
    // ต้องมี id ดราฟต์ และสวิตช์ Polling ต้องถูกเปิดเท่านั้น ถึงจะดึงค่าแบบเรียลไทม์
    if (!draftMeasurement?.id || !isPollingActive) {
      return;
    }

    const fetchData = async () => {
      try {
        const response = await getMeasurementsDraft();
        const datas = response.data;
        if (datas && Array.isArray(datas)) {
          setMeasurementData(datas);
        }
      } catch (error) {
        console.error("Error fetching measurements draft", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 500);
    return () => clearInterval(intervalId);
  }, [draftMeasurement?.id, isPollingActive]);

  // --- 🛠️ 5. ฟังก์ชันตรวจสอบเงื่อนไขทาง Logic สำหรับระบบ Timer ---
  const checkIsValuePassed = (config, val) => {
    if (!config || val === '' || val === null || val === undefined || isNaN(val)) return false;
    const num = parseFloat(val);
    return (num >= config.min_value && num <= config.max_value);
  };

  const isAxisStarted = (targetSensorType) => {
    if (!measurementData || measurementData.length === 0) return false;
    return measurementData.some(item => {
      if (item.sensor_type !== targetSensorType) return false;
      const val = item?.final_value;
      return val !== '' && val !== null && val !== undefined && !isNaN(val);
    });
  };

  const isAxisNG = (targetSensorType) => {
    if (!measurementData || measurementData.length === 0) return false;
    return measurementData.some(item => {
      if (item.sensor_type !== targetSensorType) return false;

      const matchedGroup = groupedPoints.find(g => g.sensor_value_key === item.value_key || g.sensor_value_key === item.sensor_value_key);
      const config = targetSensorType === 'air_gauge_x' ? matchedGroup?.rawX : matchedGroup?.rawY;

      return item?.final_value !== null && !checkIsValuePassed(config, item?.final_value);
    });
  };

  const saveTimerSettings = () => {
    localStorage.setItem('timer_axis_x', timeoutX);
    localStorage.setItem('timer_axis_y', timeoutY);
    showSuccess("Saved Timer Settings Successfully");
  };

  // --- ⏱️ 6. Logic ควบคุม Countdown แยกแกน และ Auto-Save ---
  useEffect(() => {
    if (!draftMeasurement?.id || forceShowStartButton) return;

    const startedX = isAxisStarted('air_gauge_x');
    const startedY = isAxisStarted('air_gauge_y');

    // === แกน X ===
    if (startedX) {
      if (!intervalIdX.current && !hasLoggedTimeoutX.current) {
        setTimeLeftX(timeoutX);
        intervalIdX.current = setInterval(() => {
          setTimeLeftX((prev) => {
            if (prev <= 1) {
              clearInterval(intervalIdX.current);
              intervalIdX.current = null;
              if (!hasLoggedTimeoutX.current) {
                saveMeasurementWithoutCheck("air_gauge_x");
                hasLoggedTimeoutX.current = true;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (intervalIdX.current) {
        clearInterval(intervalIdX.current);
        intervalIdX.current = null;
      }
      setTimeLeftX(0);
      hasLoggedTimeoutX.current = false;
    }

    // === แกน Y ===
    if (startedY) {
      if (!intervalIdY.current && !hasLoggedTimeoutY.current) {
        setTimeLeftY(timeoutY);
        intervalIdY.current = setInterval(() => {
          setTimeLeftY((prev) => {
            if (prev <= 1) {
              clearInterval(intervalIdY.current);
              intervalIdY.current = null;
              if (!hasLoggedTimeoutY.current) {
                const isX_NG = isAxisNG('air_gauge_x');
                const isY_NG = isAxisNG('air_gauge_y');
                handleSave(!isX_NG && !isY_NG);
                hasLoggedTimeoutY.current = true;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (intervalIdY.current) {
        clearInterval(intervalIdY.current);
        intervalIdY.current = null;
      }
      setTimeLeftY(0);
      hasLoggedTimeoutY.current = false;
    }
  }, [measurementData, timeoutX, timeoutY, draftMeasurement?.id, forceShowStartButton]);

  useEffect(() => {
    return () => {
      if (intervalIdX.current) clearInterval(intervalIdX.current);
      if (intervalIdY.current) clearInterval(intervalIdY.current);
    };
  }, []);

  // --- 🎬 7. Action Handlers ---
  const handleCreateDraft = async () => {
    if (isCreatingDraft) return;
    try {
      setIsCreatingDraft(true);

      // [จุดล้างค่าชิ้นเก่า] เคลียร์ข้อมูลชิ้นงานเก่าทั้งหลังบ้านและหน้าจอทันทีก่อนขึ้นชิ้นใหม่
      try {
        await clearNgAndRawValueMeasurementsDraft();
        setMeasurementData([]);
      } catch (clearErr) {
        console.error("Error clearing old measurements", clearErr);
      }

      const response = await createMeasurementDraft("", "", product.step1.id, 'draft');
      if (response && response.data) {
        setDraftMeasurement(response.data);
        setForceShowStartButton(false); // เอาสวิตช์ Force ออกเพื่อรันโหมดปกติ
        setIsPollingActive(true);        // เปิดช่องส่งข้อมูล Polling เรียลไทม์
      }
      await saveMeasurement("qrcode");
      showSuccess("Measurement Draft Created. Ready to receive values.");
      hasAutoShowed.current = false;

      if (typeof refreshDraft === 'function') refreshDraft();
    } catch (error) {
      showError("Failed to start measurement");
    } finally {
      setIsCreatingDraft(false);
    }
  };
  // --- ⌨️ 8. ระบบปุ่มลัด (Shortcut Keys) ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      // ตรวจสอบเงื่อนไข: ต้องเป็นจังหวะที่ปุ่ม Start Measurement แสดงขึ้นมา 
      // และต้องไม่เอื้อให้กดซ้ำซ้อนขณะกำลังบันทึก/สร้างดราฟต์อยู่ (isCreatingDraft)
      const canStart = !draftMeasurement?.id || forceShowStartButton;

      if (event.code === shortCutKey && canStart && !isCreatingDraft) {
        // ตรวจสอบเพื่อป้องกันหน้าจอเลื่อน (Scroll) ลงด้านล่างเมื่อกด Spacebar
        event.preventDefault();
        handleCreateDraft();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [draftMeasurement?.id, forceShowStartButton, isCreatingDraft, product?.step1?.id]);

  const handleClearTmp = async () => {
    try {
      await clearTmp();
      showSuccess("Tmp is cleared");
    } catch (error) {
      showError("Error clearing tmp");
    }
  };

  const handleReset = async () => {
    try {
      await clearNgAndRawValueMeasurementsDraft();
      setMeasurementData([]);
      showSuccess("Measurement reset successfully");
      hasAutoShowed.current = false;
      hasLoggedTimeoutX.current = false;
      hasLoggedTimeoutY.current = false;
      setTimeLeftX(0);
      setTimeLeftY(0);
    } catch (error) {
      showError("Error resetting measurement");
    }
  };

  const handleSave = async (passed) => {
    try {
      // [สับสวิตช์ปิดทันที] บล็อกการแอบ Polling รอบสุดท้ายวิ่งมาล้างค่าหน้าจอ
      setIsPollingActive(false);
      try {
        sendQualitySignal(passed);
      } catch {

      }
      await saveMeasurement("air_gauge_y");
      if (passed) {
        showSuccess("Air Gauge measurement passed and saved successfully");
      } else {
        showWarning("Air Gauge measurement failed and saved successfully");
      }

      setDraftMeasurement(null);
      setForceShowStartButton(true);

      hasAutoShowed.current = false;
      hasLoggedTimeoutX.current = false;
      hasLoggedTimeoutY.current = false;
      setTimeLeftX(0);
      setTimeLeftY(0);

    } catch (error) {
      showError("Error saving air gauge measurement");
    }
  };

  const handleCancelDraft = async () => {
    try {
      setIsPollingActive(false);
      await cancelMeasurementDraft();
      setDraftMeasurement(null);
      setForceShowStartButton(false);
      setMeasurementData([]);
      showSuccess("Measurement is canceled");
      hasAutoShowed.current = false;
      hasLoggedTimeoutX.current = false;
      hasLoggedTimeoutY.current = false;
      setTimeLeftX(0);
      setTimeLeftY(0);
      zeroStep();
    } catch (error) {
      showError("Error canceling draft measurement");
    }
    setShowCancelDraft(false);
  };

  const getBoxStatusClass = (hasValue, isPassed) => {
    if (!hasValue) return "bg-black/10 border-dashed border-yellow-500/30 text-gray-500";
    return isPassed
      ? "bg-green-500/5 border-solid border-green-500/20 text-green-400"
      : "bg-red-500/5 border-solid border-red-500/20 text-red-400";
  };

  const displayValue = (rawValue) => (rawValue !== undefined && rawValue !== null && rawValue !== "")
    ? Number(rawValue).toFixed(precision)
    : "---";

  return (
    <div className="min-h-screen bg-page p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Management Bar */}
        <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-white/10 shadow-md">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-primary uppercase tracking-wider">
              Quality Check (Multi-Axis)
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-[11px] text-gray-400">
                Status: {(draftMeasurement?.id && !forceShowStartButton) ? <span className="text-green-400 font-bold">MEASURING...</span> : <span className="text-yellow-500 font-bold">IDLE</span>}
              </p>
              {draftMeasurement?.serial_a && !forceShowStartButton && (
                <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-mono">
                  SN: {draftMeasurement.serial_a}
                </span>
              )}
            </div>
          </div>

          {/* ⏱️ ระบบตั้งเวลาความหน่วงแบบ Realtime แยกแกน */}
          {draftMeasurement?.id && !forceShowStartButton && (
            <div className="flex items-center gap-4 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 text-xs border-r border-white/10 pr-2">
                <span className="text-gray-400">X:</span>
                <input
                  type="number"
                  value={timeoutX}
                  onChange={(e) => setTimeoutX(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-10 bg-black/40 border border-white/10 rounded px-1 text-center text-green-400 font-mono focus:outline-none"
                />
                {timeLeftX > 0 ? (
                  <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 rounded font-mono font-bold animate-pulse">Remaining: {timeLeftX}s</span>
                ) : (
                  <span className="text-gray-500 text-[11px] font-mono">X Ready</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Y:</span>
                <input
                  type="number"
                  value={timeoutY}
                  onChange={(e) => setTimeoutY(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-10 bg-black/40 border border-white/10 rounded px-1 text-center text-green-400 font-mono focus:outline-none"
                />
                {timeLeftY > 0 ? (
                  <span className="px-1.5 py-0.2 bg-orange-500/20 text-orange-400 rounded font-mono font-bold animate-pulse">Remaining: {timeLeftY}s</span>
                ) : (
                  <span className="text-gray-500 text-[11px] font-mono">Y Ready</span>
                )}
              </div>

              <button
                onClick={saveTimerSettings}
                className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-[11px] font-bold hover:bg-primary/40 transition-colors"
              >
                Save Timer
              </button>
            </div>
          )}

          {/* ปุ่มคำสั่งหลักด้านขวา */}
          <div className="flex gap-2">
            {(!draftMeasurement?.id || forceShowStartButton) ? (
              <button
                onClick={handleCreateDraft}
                disabled={isCreatingDraft}
                className="px-6 py-2 bg-green-500 text-black text-xs font-black rounded-lg hover:bg-green-400 active:scale-95 transition-all shadow-lg uppercase tracking-wider"
              >
                {isCreatingDraft ? 'Starting...' : 'Start Measurement'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleReset}
                  className="px-5 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setModalConfig({
                    title: "Clear Tmp",
                    message: "Do you want to clear tmp?",
                    onClose: closeModal,
                    onConfirmOk: handleClearTmp,
                    onConfirmNo: closeModal,
                    variant: "warning",
                    buttonNo: "Cancel",
                    buttonOK: "Confirm"
                  })}
                  className="px-5 py-2 bg-yellow-400 text-black text-xs font-bold rounded-lg hover:bg-yellow-500 transition-colors"
                >
                  Clear Tmp
                </button>
                <button
                  onClick={() => setShowCancelDraft(true)}
                  className="px-5 py-2 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Cancel Draft
                </button>
              </>
            )}
          </div>
        </div>

        {/* 🛠️ Dashboard Grid */}
        <div className="grid grid-cols-2 gap-4">
          {groupedPoints.map((group, index) => {
            const streamX = measurementData.find(item =>
              (item.value_key === group.sensor_value_key || item.sensor_value_key === group.sensor_value_key) &&
              item.sensor_type === 'air_gauge_x'
            );

            const streamY = measurementData.find(item =>
              (item.value_key === group.sensor_value_key || item.sensor_value_key === group.sensor_value_key) &&
              item.sensor_type === 'air_gauge_y'
            );

            const hasValueX = streamX?.final_value !== undefined && streamX?.final_value !== null && streamX?.final_value !== "";
            const hasValueY = streamY?.final_value !== undefined && streamY?.final_value !== null && streamY?.final_value !== "";

            const passedX = hasValueX ? checkIsValuePassed(group.rawX, streamX.final_value) : true;
            const passedY = hasValueY ? checkIsValuePassed(group.rawY, streamY.final_value) : true;
            const isGroupPassed = passedX && passedY;

            const pointImage = group.rawX?.point_image_url || group.rawY?.point_image_url;

            return (
              <div key={index} className="bg-card p-2.5 rounded-lg border border-white/5 space-y-2 shadow-sm flex flex-col justify-between text-xs">
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-accent uppercase tracking-wider truncate">
                      {group.display_name}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono truncate">
                      Key: {group.sensor_value_key}
                    </span>
                  </div>

                  {!hasValueX && !hasValueY ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shrink-0">
                      WAITING
                    </span>
                  ) : (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${isGroupPassed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isGroupPassed ? "PASS" : "NG"}
                    </span>
                  )}
                </div>

                {pointImage && (
                  <div className="h-24 rounded-md overflow-hidden bg-black/10 border border-white/5 flex items-center justify-center">
                    <img
                      src={IMAGE_BASE_URL + pointImage}
                      alt={group.display_name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {/* กล่องแสดงผลแกน X */}
                  <div className={`p-1.5 rounded-md border text-center transition-all ${getBoxStatusClass(hasValueX, passedX)}`}>
                    <span className="text-[9px] text-gray-400 font-medium block uppercase tracking-wider">Axis X</span>
                    <span className="text-xl font-mono font-black block my-0.5">
                      {hasValueX ? displayValue(streamX.final_value) : "---"}
                    </span>
                    <span className="text-[9px] text-gray-500 block truncate">
                      {group.rawX ? `${group.rawX.min_value}-${group.rawX.max_value}` : 'N/A'}
                    </span>
                  </div>

                  {/* กล่องแสดงผลแกน Y */}
                  <div className={`p-1.5 rounded-md border text-center transition-all ${getBoxStatusClass(hasValueY, passedY)}`}>
                    <span className="text-[9px] text-gray-400 font-medium block uppercase tracking-wider">Axis Y</span>
                    <span className="text-xl font-mono font-black block my-0.5">
                      {hasValueY ? displayValue(streamY.final_value) : "---"}
                    </span>
                    <span className="text-[9px] text-gray-500 block truncate">
                      {group.rawY ? `${group.rawY.min_value}-${group.rawY.max_value}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modals Container */}
        {modalConfig && (
          <ComfirmModal
            title={modalConfig.title}
            message={modalConfig.message}
            variant={modalConfig.variant}
            onClose={closeModal}
            buttonNo={modalConfig.buttonNo}
            buttonOK={modalConfig.buttonOK}
            handleConfirmOK={modalConfig.onConfirmOk}
            handleConfirmNo={modalConfig.onConfirmNo}
          />
        )}

        {showCancelDraft && (
          <ComfirmModal
            title="Cancel Draft"
            message="Do you want to cancel this measurement draft?"
            variant="danger"
            buttonNo="No"
            buttonOK="Yes"
            onClose={() => setShowCancelDraft(false)}
            handleConfirmOK={handleCancelDraft}
            handleConfirmNo={() => setShowCancelDraft(false)}
          />
        )}

      </div>
    </div>
  );
}

export default QualityCheckGaugeMultiAxis;