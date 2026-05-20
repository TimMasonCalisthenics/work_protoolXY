import { useState, useEffect, useRef } from 'react';
import { useStep } from '@context/MeasurementContext';
import { showSuccess, showError, showWarning } from '@utils/toast';
import ComfirmModal from '@components/ComfirmModal';
import { IMAGE_BASE_URL } from '@services/interceptor';

import { clearTmp } from '@services/sensorService';
import { saveMeasurement, cancelMeasurementDraft } from '@services/measurementService';
import { start_readSensor, stop_readSensor } from '@services/airgaugeSensor/airgaugeService'
import { getMeasurementsDraft, clearNgValueMeasurementsDraft, clearNgAndRawValueMeasurementsDraft } from '@services/measurements_draft_service';
import { API_AIRGAUGE_URL } from '@services/interceptor';
function QualityCheckGauge() {
  // Air Gauge Configuration & State
  const { zeroStep, nextStep, product, draftMeasurement, goStep } = useStep();
  const [measurementData, setMeasurementData] = useState([]);
  const [showCancelDraft, setShowCancelDraft] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const hasAutoShowed = useRef(false);
  const precision = 3;

  const closeModal = () => {
    setModalConfig(null);
    hasAutoShowed.current = false;
  };

  useEffect(() => async () => {
    product.step3.map((point, index) => {
      console.log("point", index + 1, point)
    })
  }, []);


  useEffect(() => {

    const startService = async () => {
      try {
        await start_readSensor();

      } catch (err) {
        showError("Failed to start sensor reading")
      }
    };
    startService();
    return () => {
      const stopService = async () => {
        try {
          await stop_readSensor();

        } catch (err) {
          showError("Failed to stop sensor reading")
        }
      };

      stopService();
    };
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (event) => {
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

  useEffect(() => {

    const filled = isAllFieldsFilled();
    const isSomePoint = isSomePointNG();
    if (!hasAutoShowed.current && !modalConfig && filled) {
      console.log("pass all value ?");
      const passed = isEverythingOK();
      if (passed) {
        handleSave(true);
        return;
      }
      else if (isSomePoint) {
        setModalConfig({
          title: "Warning: NG Detected",
          message: "Some points are OUT OF RANGE. Do you still want to save this record?",
          variant: "danger",
          buttonNo: "Reset",
          buttonOK: "Save",
          onConfirmOk: () => handleSave(false),
          onConfirmNo: handleReset,
        });
        hasAutoShowed.current = true;
      }


    }
  }, [measurementData, product.step3]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getMeasurementsDraft();
        const datas = response.data;
        if (datas && Array.isArray(datas)) {
          setMeasurementData(datas);

        }
      } catch (error) {
      }
    };
    fetchData();
    const intervalId = setInterval(fetchData, 500);
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

  }, [draftMeasurement.id]);

  const checkIsPointPassed = (point, val) => {
    if (val === '' || val === null || isNaN(val)) return false;
    const num = parseFloat(val);
    // console.log("error", val, point.min_value, point.max_value)
    return (num >= point.min_value && num <= point.max_value);
  };

  const isAllFieldsFilled = () => {
    if (product.step3.length === 0) return false;
    return product.step3.every(point => {
      const detail = measurementData.find(item => item.point_name === point.point_name);
      const val = detail?.final_value;
      return val !== '' && val !== null && val !== undefined && !isNaN(val);
    });
  };

  const isSomePointNG = () => {

    return product.step3.some(point => {
      const detail = measurementData.find(item => item.point_name === point.point_name);
      if (detail?.final_value === '' || detail?.final_value === null || isNaN(detail?.final_value)) return false;
      return !checkIsPointPassed(detail, detail?.final_value);
    });
  };
  const isEverythingOK = () => {
    return product.step3.every(point => {
      const detail = measurementData.find(item => item.point_name === point.point_name);
      return checkIsPointPassed(detail, detail?.final_value);
    });
  };


  const isNGApplied = () => {
    return product.step3.every(point => {
      const detail = measurementData.find(item => item.point_name === point.point_name);
      return checkIsPointPassed(point, detail?.final_value);
    });
  };

  const handleStop = () => {
    setIsRunning(false);
  };
  const handleStart = () => {
    setIsRunning(true);
  };
  const handleClearTmp = () => {
    try {
      const clearTmpAsync = async () => {
        const response = await clearTmp();
        showSuccess("Tmp is cleared");
      }
      clearTmpAsync();
    } catch (error) {
      showError("Error clearing tmp");
    }
  };
  const handleSave = (passed) => {
    try {
      const measurementSave = async () => {
        try {
          await saveMeasurement("air_gauge");
          if (passed) {
            showSuccess("Air Gauge measurement passed and saved successfully");
          } else {
            showWarning("Air Gauge measurement failed and saved successfully");
          }
          goStep(-1);
        } catch (error) {
          showError("Error saving air gauge measurement");
        }
      };
      measurementSave();
    } catch (error) {
      showError("Error saving air gauge measurement");
    }

  };
  const handleReset = async () => {
    try {
      // await clearNgValueMeasurementsDraft();
      await clearNgAndRawValueMeasurementsDraft();

      showSuccess("Measurement reset successfully");
    } catch (error) {
      showError("Error resetting measurement");
    }
  };


  const handleCancelDraft = () => {
    const draftMeasurementCancel = async () => {
      try {
        await cancelMeasurementDraft();
        showSuccess("Measurement is canceled");
        zeroStep();
      } catch (error) {
        showError("Error canceling draft measurement");
      }
    };
    draftMeasurementCancel();
    setShowCancelDraft(false);
  };

  // Helper to check range and return color class
  const getStatusColorAirgauge = (val, min, max
    , rule_type, nominal_value
    , ctrl_min, ctrl_max) => {
    if (val === '' || val === null || isNaN(val)) return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    const num = parseFloat(val);

    if (ctrl_max != null && ctrl_min != null) {
      if (num >= ctrl_min && num <= ctrl_max) return 'bg-green-500 text-white border-green-600';
      else if (num >= min && num < ctrl_min) return 'bg-yellow-500 text-white border-yellow-600';
      else if (num > ctrl_max && num <= max) return 'bg-yellow-500 text-white border-yellow-600';
    }
    else {
      if (num >= min && num <= max) return 'bg-green-500 text-white border-green-600';
      else if (num >= min && num <= max) return 'bg-yellow-500 text-white border-yellow-600';
    }
    return 'bg-red-500 text-white border-red-600';

  };

  const displayValue = (rawValue) => (rawValue !== undefined && rawValue !== null && rawValue !== "")
    ? Number(rawValue).toFixed(precision)
    : "";

  return (
    <div className="min-h-screen bg-page p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Quality Check</h1>
          <article className='flex gap-5'>
            <div className='flex items-center gap-2'>
              <div className='text-2xl'>Timer</div>
              <input className='text-center' type="number" value={50}></input>
              <div>Secs</div>
              <button className=''>Set</button>
            </div>
            <div className='flex items-center gap-2'>
              <button className=''>Reset</button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setModalConfig({ title: "Clear Tmp", message: "Do you want to clear tmp?", onClose: closeModal, onConfirmOk: handleClearTmp, onConfirmNo: closeModal, variant: "warning", buttonNo: "Cancel", buttonOK: "Confirm" }) }}
                className="px-10 py-4 bg-yellow-400 text-black font-bold text-xl border border-yellow-500 rounded-lg hover:bg-yellow-500/30 transition font-medium"

              >
                Clear tmp
              </button>
            </div>
          </article>
        </div>

        {/* Section 1: Air Gauge Check */}
        <div className="glass-card p-6 rounded-xl space-y-6">
          <h2 className="text-xl font-bold text-center border-b pb-2 mb-4 border-gray-200 dark:border-gray-700">
            Air Gauge Check
          </h2>

          <div className="grid grid-cols-1 gap-8">
            {/* Image Placeholder */}
            <div className='flex flex-wrap justify-center gap-8'>
              {product.step3.map((point, index) => (
                point.point_image_url && (
                  <div key={index} className="aspect-video w-[calc(30%-2rem)] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <img className="text-secondary w-1/2 object-contain" src={IMAGE_BASE_URL + point.point_image_url} alt="Part Image" />
                  </div>
                )
              ))}
            </div>

            {/* Grid of Values */}
            <div className="grid grid-cols-2 gap-6 content-center">
              {product.step3.map((point, index) => {
                const currentDetail = measurementData.find(item => item.point_name === point.point_name);
                return (<div key={index} className="relative group">
                  {/* Tooltip for Range */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-secondary opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    Range: {point.min_value} - {point.max_value}
                  </div>

                  <input
                    type="text"
                    step="0.001"
                    // value={currentDetail?.final_value ?? ""}
                    value={displayValue(currentDetail?.final_value)}
                    onChange={(e) => handleAirGaugeChange(point.point_name, e.target.value)}
                    disabled
                    placeholder="0.000" // Hint at min value
                    className={`w-full h-24 text-4xl text-center font-bold border-2 rounded transition-colors duration-300 shadow-md
                                        ${getStatusColorAirgauge(currentDetail?.final_value
                      , point.min_value
                      , point.max_value
                      , point.rule_type, point.nominal_value
                      , point.ctrl_min_value
                      , point.ctrl_max_value)}`}
                  />
                </div>)
              }
              )}
            </div>

            {/* cancel draft */}
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
          </div>
        </div>

      </div>
    </div >
  );
}

export default QualityCheckGauge;
