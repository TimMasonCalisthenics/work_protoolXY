import { useState, useEffect, useRef, useMemo } from 'react';
import { useStep } from '@context/MeasurementContext';
import { showSuccess, showError, showWarning } from '@utils/toast';
import ComfirmModal from '@components/ComfirmModal';
import { IMAGE_BASE_URL } from '@services/interceptor';

import { clearTmp } from '@services/sensorService';
import { saveMeasurement, cancelMeasurementDraft, saveMeasurementWithoutCheck } from '@services/measurementService';
import { start_readSensor, stop_readSensor } from '@services/airgaugeSensor/airgaugeService';
import { getMeasurementsDraft, clearNgAndRawValueMeasurementsDraft } from '@services/measurements_draft_service';
import { API_AIRGAUGE_URL } from '@services/interceptor';

function QualityCheckGaugeMultiAxis() {
  const { zeroStep, product, draftMeasurement, goStep } = useStep();
  const [measurementData, setMeasurementData] = useState([]);
  const [showCancelDraft, setShowCancelDraft] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  // --- 1. ระบบเวลา & คลังความจำ Local Storage ---
  const [timeoutX, setTimeoutX] = useState(() => Number(localStorage.getItem('timer_axis_x')) || 5);
  const [timeoutY, setTimeoutY] = useState(() => Number(localStorage.getItem('timer_axis_y')) || 5);

  // --- 2. State สำหรับเก็บเวลาคงเหลือเพื่อโชว์บนหน้าจอ ---
  const [timeLeftX, setTimeLeftX] = useState(0);
  const [timeLeftY, setTimeLeftY] = useState(0);

  const hasLoggedTimeoutX = useRef(false);
  const hasLoggedTimeoutY = useRef(false);
  const intervalIdX = useRef(null);
  const intervalIdY = useRef(null);

  const hasAutoShowed = useRef(false);
  const hasLoggedX = useRef(false);
  const hasLoggedY = useRef(false);
  const precision = 4;

  // --- 3. การจัดกลุ่มข้อมูลให้ได้กล่องใหญ่ โดยจับคู่ผ่าน value_key และ sensor_type ---
  const uniqueSensorGroups = useMemo(() => {
    if (!measurementData || measurementData.length === 0) return [];

    const groups = {};

    measurementData.forEach(item => {
      const groupKey = item.value_key;
      if (!groupKey) return; 

      if (!groups[groupKey]) {
        groups[groupKey] = {
          value_key: groupKey,
          point_name: item.point_name, 
          pointNamesSet: new Set([item.point_name]),
          point_image_url: item.point_image_url || null,
          dataX: item.sensor_type === 'air_gauge_x' ? item : null,
          dataY: item.sensor_type === 'air_gauge_y' ? item : null,
        };
      } else {
        groups[groupKey].pointNamesSet.add(item.point_name);

        if (item.point_image_url && !groups[groupKey].point_image_url) {
          groups[groupKey].point_image_url = item.point_image_url;
        }
        if (item.sensor_type === 'air_gauge_x') groups[groupKey].dataX = item;
        if (item.sensor_type === 'air_gauge_y') groups[groupKey].dataY = item;
      }
    });

    return Object.values(groups).map(g => {
      const namesArray = Array.from(g.pointNamesSet);
      const displayCardName = namesArray.length > 1 ? namesArray.join(' / ') : namesArray[0];

      return {
        ...g,
        combined_point_name: displayCardName
      };
    });
  }, [measurementData]);

  const closeModal = () => {
    setModalConfig(null);
    hasAutoShowed.current = false;
  };

  // เปิด-ปิด บริการสตรีมมิ่งข้อมูลเซ็นเซอร์
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

  // ส่งสัญญาณ Beacon ตอนจบแอปหรือปิดหน้าเบราว์เซอร์
  useEffect(() => {
    const handleBeforeUnload = () => {
      const url = `${API_AIRGAUGE_URL}/airgauge/stop-send`;
      const data = JSON.stringify({ status: 'stop' });
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const checkIsValuePassed = (item, val) => {
    if (!item || val === '' || val === null || val === undefined || isNaN(val)) return false;
    const num = parseFloat(val);
    return (num >= item.min_value && num <= item.max_value);
  };

  const isAxisFilledAll = (targetSensorType) => {
    if (!measurementData || measurementData.length === 0) return false;
    const filtered = measurementData.filter(item => item.sensor_type === targetSensorType);
    if (filtered.length === 0) return false;
    return filtered.every(item => {
      const val = item?.final_value;
      return val !== '' && val !== null && val !== undefined && !isNaN(val);
    });
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
      return item?.final_value !== null && !checkIsValuePassed(item, item?.final_value);
    });
  };

  const saveTimerSettings = () => {
    localStorage.setItem('timer_axis_x', timeoutX);
    localStorage.setItem('timer_axis_y', timeoutY);
    showSuccess("Saved Timer Settings Successfully");
  };

  // --- 4. ⏱️ ส่วนควบคุม Logic Countdown และ Auto-Save อิงตามเวลาถอยหลังล้วน ๆ ---
  useEffect(() => {
    const startedX = isAxisStarted('air_gauge_x');
    const startedY = isAxisStarted('air_gauge_y');

    // === 🔴 Countdown แกน X ===
    if (startedX) {
      if (!intervalIdX.current && !hasLoggedTimeoutX.current) {
        setTimeLeftX(timeoutX);
        intervalIdX.current = setInterval(() => {
          setTimeLeftX((prev) => {
            if (prev <= 1) {
              clearInterval(intervalIdX.current);
              intervalIdX.current = null;
              
              // เมื่อเวลาหมดสนิท -> สั่งเซฟข้อมูลล็อกค่าแกน X ทันที
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

    // === 🟠 Countdown แกน Y ===
    if (startedY) {
      if (!intervalIdY.current && !hasLoggedTimeoutY.current) {
        setTimeLeftY(timeoutY);
        intervalIdY.current = setInterval(() => {
          setTimeLeftY((prev) => {
            if (prev <= 1) {
              clearInterval(intervalIdY.current);
              intervalIdY.current = null;
              
              // เมื่อเวลาหมดสนิท -> เช็คสภาพชิ้นงานของแกน Y แล้วส่งบันทึกปิดบิลชิ้นงาน (handleSave)
              if (!hasLoggedTimeoutY.current) {
                const isX_NG = isAxisNG('air_gauge_x');
                const isY_NG = isAxisNG('air_gauge_y');
                const overallPassed = !isX_NG && !isY_NG;
                handleSave(overallPassed);
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

  }, [measurementData, timeoutX, timeoutY]);

  // คืนค่าหน่วยความจำกรณีปิดคอมโพเนนต์ป้องกันปัญหาเอฟเฟกต์ค้าง (Memory Leak)
  useEffect(() => {
    return () => {
      if (intervalIdX.current) clearInterval(intervalIdX.current);
      if (intervalIdY.current) clearInterval(intervalIdY.current);
    };
  }, []);

  // วงจร Fetch ดึงสตรีมข้อมูลดราฟต์เรียลไทม์ (ป้องกันการสร้าง Loop ซ้อน)
  useEffect(() => {
    let isDataMounted = true;
    const fetchData = async () => {
      try {
        const response = await getMeasurementsDraft();
        const datas = response.data;
        if (isDataMounted && datas && Array.isArray(datas)) {
          setMeasurementData(datas);
        }
      } catch (error) {
        console.error("Error fetching measurements draft", error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 500);
    return () => {
      isDataMounted = false;
      clearInterval(intervalId);
    };
  }, [draftMeasurement?.id]);

  const handleClearTmp = async () => {
    try {
      await clearTmp();
      showSuccess("Tmp is cleared");
    } catch (error) {
      showError("Error clearing tmp");
    }
  };

  const handleSave = async (passed) => {
    try {
      await saveMeasurement("air_gauge_y");
      if (passed) {
        showSuccess("Air Gauge measurement is OK and saved successfully");
      } else {
        showWarning("Air Gauge measurement is NG and saved successfully");
      }
      goStep(-1);
    } catch (error) {
      showError("Error saving air gauge measurement");
    }
  };

  const handleReset = async () => {
    try {
      await clearNgAndRawValueMeasurementsDraft();
      showSuccess("Measurement reset successfully");
      hasAutoShowed.current = false;
      hasLoggedX.current = false;
      hasLoggedY.current = false;

      hasLoggedTimeoutX.current = false;
      hasLoggedTimeoutY.current = false;
      setTimeLeftX(0);
      setTimeLeftY(0);
    } catch (error) {
      showError("Error resetting measurement");
    }
  };

  const handleCancelDraft = async () => {
    try {
      await cancelMeasurementDraft();
      showSuccess("Measurement is canceled");
      zeroStep();

      hasAutoShowed.current = false;
      hasLoggedX.current = false;
      hasLoggedY.current = false;
      hasLoggedTimeoutX.current = false;
      hasLoggedTimeoutY.current = false;
      setTimeLeftX(0);
      setTimeLeftY(0);
    } catch (error) {
      showError("Error canceling draft measurement");
    }
    setShowCancelDraft(false);
  };

  const displayValue = (rawValue) => (rawValue !== undefined && rawValue !== null && rawValue !== "")
    ? Number(rawValue).toFixed(precision)
    : "---";

  return (
    <div className="w-full space-y-3">

      {/* Top Header Bar */}
      <div className="flex justify-between items-center bg-card p-3 rounded-xl border border-white/10 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-primary uppercase tracking-wider">
            Air Gauge Multi-Axis Measurement
          </h1>
          {draftMeasurement?.serial_a && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-mono">
              SN: {draftMeasurement.serial_a}
            </span>
          )}
        </div>

        {/* ระบบตั้งเวลาจับความเคลื่อนไหวแยกแกน */}
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

        <div className="flex gap-2">


          <button
            onClick={() => {
              setModalConfig({
                title: "Clear Tmp",
                message: "Do you want to clear tmp?",
                onClose: closeModal,
                onConfirmOk: handleClearTmp,
                onConfirmNo: closeModal,
                variant: "warning",
                buttonNo: "Cancel",
                buttonOK: "Confirm"
              });
            }}
            className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-500/20 transition-colors"
          >
            Clear Tmp
          </button>

          <button
            onClick={() => setShowCancelDraft(true)}
            className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors"
          >
            Cancel Draft
          </button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-2 gap-3">
        {uniqueSensorGroups.map((group, index) => {
          const dataX = group.dataX;
          const dataY = group.dataY;

          const passedX = dataX ? checkIsValuePassed(dataX, dataX?.final_value) : true;
          const passedY = dataY ? checkIsValuePassed(dataY, dataY?.final_value) : true;
          const isPointPassed = passedX && passedY;

          const hasValueX = dataX?.final_value !== undefined && dataX?.final_value !== null && dataX?.final_value !== "";
          const hasValueY = dataY?.final_value !== undefined && dataY?.final_value !== null && dataY?.final_value !== "";

          let boxClassX = "bg-black/10 border-dashed border-yellow-500/30";
          if (!dataX) {
            boxClassX = "bg-gray-500/5 border-solid border-white/5 opacity-30 select-none";
          } else if (hasValueX) {
            boxClassX = passedX ? "bg-green-500/5 border-solid border-green-500/20" : "bg-red-500/5 border-solid border-red-500/20";
          }

          let boxClassY = "bg-black/10 border-dashed border-yellow-500/30";
          if (!dataY) {
            boxClassY = "bg-gray-500/5 border-solid border-white/5 opacity-30 select-none";
          } else if (hasValueY) {
            boxClassY = passedY ? "bg-green-500/5 border-solid border-green-500/20" : "bg-red-500/5 border-solid border-red-500/20";
          }

          return (
            <div key={index} className="bg-card p-3 rounded-xl border border-white/5 space-y-3 shadow-sm flex flex-col justify-between">

              {/* Point Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">
                    {group.combined_point_name}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">
                    CH: {group.value_key}
                  </span>
                </div>

                {!hasValueX && !hasValueY ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse">
                    READY
                  </span>
                ) : (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isPointPassed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isPointPassed ? "PASS" : "NG"}
                  </span>
                )}
              </div>

              {/* Image */}
              {group.point_image_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-black/10 border border-white/5 flex items-center justify-center">
                  <img
                    src={IMAGE_BASE_URL + group.point_image_url}
                    alt={group.combined_point_name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              )}

              {/* Inside Value */}
              <div className="grid grid-cols-2 gap-2">
                {/* AXIS X */}
                <div className={`p-2 rounded-lg border text-center transition-all ${boxClassX}`}>
                  <span className="text-[9px] text-gray-400 font-medium block uppercase tracking-wider">Axis X</span>
                  <span className={`text-2xl font-mono font-black block ${hasValueX ? (passedX ? 'text-green-400' : 'text-red-400') : 'text-gray-600'}`}>
                    {dataX ? displayValue(dataX.final_value) : "---"}
                  </span>
                  <span className="text-[9px] text-gray-500 block mt-0.5">
                    Range: {dataX ? `${dataX.min_value} - ${dataX.max_value}` : '---'}
                  </span>
                </div>

                {/* AXIS Y */}
                <div className={`p-2 rounded-lg border text-center transition-all ${boxClassY}`}>
                  <span className="text-[9px] text-gray-400 font-medium block uppercase tracking-wider">Axis Y</span>
                  <span className={`text-2xl font-mono font-black block ${hasValueY ? (passedY ? 'text-green-400' : 'text-red-400') : 'text-gray-600'}`}>
                    {dataY ? displayValue(dataY.final_value) : "---"}
                  </span>
                  <span className="text-[9px] text-gray-500 block mt-0.5">
                    Range: {dataY ? `${dataY.min_value} - ${dataY.max_value}` : '---'}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Confirm Modal */}
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
  );
}

export default QualityCheckGaugeMultiAxis;