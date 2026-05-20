import React, { useState, useEffect } from 'react';
import ProductCardMitutoyoMap from '@components/ProductCardMitutoyoMap';
import { useStep } from '@context/MeasurementContext';
import ComfirmModal from '@components/ComfirmModal';

import { IMAGE_BASE_URL } from '@services/interceptor';
import { updateMeasurementDraft, cancelMeasurementDraft, saveMeasurement } from '@services/measurementService';
import { getMeasurementsDraft, clearNgValueMeasurementsDraft } from '@services/measurements_draft_service';
import { clearTmp } from '@services/sensorService';

import { showSuccess, showError, showWarning } from '@utils/toast';
function QualityCheckMitutoyo() {
  //for go to next step
  const [showConfirm, setShowConfirm] = useState(false);
  const [measurementData, setMeasurementData] = useState([]);
  const [showCancelDraft, setShowCancelDraft] = useState(false);
  const { product, draftMeasurement, nextStep, zeroStep, lastStep } = useStep();
  const [mitutoyoStatus, setMitutoyoStatus] = useState({});
  const [modalConfig, setModalConfig] = useState(null);
  const precision = 3;
  const closeModal = () => {
    setModalConfig(null);
  };


  useEffect(() => {

    if (!product?.step2?.length) return;
    const keysLength = Object.keys(mitutoyoStatus).length;
    const hasFail = Object.values(mitutoyoStatus).includes(false);
    if (hasFail) {
      handleConfirmStep("Warning: NG Detected");
      return;
    }
    if (keysLength !== product.step2.length) return;
    updateDraftMeasurement();
    handleConfirmStep("Measurement is OK");


  }, [mitutoyoStatus]);

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
      clearInterval(intervalId);
    };
  }, [draftMeasurement.id]);

  const updateDraftMeasurement = async () => {
    try {
      await saveMeasurement("mitutoyo");

      if (Object.values(mitutoyoStatus).every(Boolean) && (Object.keys(mitutoyoStatus).length === product.step2.length)) {
        showSuccess("Mitutoyo measurement OK and saved successfully");
        nextStep();
      }
      else {
        showWarning("Mitutoyo measurement NG and saved successfully");
        lastStep();
      }

    } catch (error) {
      showError("Error updating draft measurement");
    }
  };

  const handleConfirmStep = (textConfirm) => {
    const isPass = Object.values(mitutoyoStatus).every(Boolean) && (Object.keys(mitutoyoStatus).length === product.step2.length);
    setModalConfig({
      title: textConfirm,
      message: isPass ? "Do you want to go to next step?" : "Some points are OUT OF RANGE. Do you still want to save this record?",
      variant: isPass ? "success" : "danger",
      buttonNo: "RESET",
      buttonOK: "Confirm",
      onConfirm: async () => {
        await updateDraftMeasurement();
      },
      onConfirmNo: async () => {
        await handleReset();
      }
    });
  };
  const handleReset = async () => {

    try {
      await clearNgValueMeasurementsDraft();

      showSuccess("Measurement reset successfully");
    } catch (error) {
      showError("Error resetting measurement");
    }
  };
  const handleConfirmOK = async () => {
    await updateDraftMeasurement();
    setShowConfirm(false);
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
  const showConfirmModal = (title, message, variant, onConfirm, onConfirmNo) => {
    setModalConfig({
      title,
      message,
      variant,
      onConfirm,
      onConfirmNo
    });
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

  return (
    <div className="min-h-screen bg-page p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Quality Check</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { showConfirmModal("Clear Tmp", "Do you want to clear tmp?", "warning", handleClearTmp, () => { }) }}
              // className="px-10 py-4 bg-yellow-500/20 text-yellow-600 border border-yellow-500 rounded-lg hover:bg-yellow-500/30 transition font-medium"
              className="px-10 py-4 bg-yellow-400 text-black font-bold text-xl border border-yellow-500 rounded-lg hover:bg-yellow-500/30 transition font-medium"
            >
              Clear tmp
            </button>

          </div>
        </div>

        {/* Section 1: Mitutoyo Check */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 glass-card p-6 rounded-xl">
          <h2 className="col-span-1 md:col-span-2 text-xl font-bold text-center border-b pb-2  border-gray-200 dark:border-gray-700">
            Mitutoyo Check
          </h2>

          {product.step2.map((point, index) => {
            const currentDetail = measurementData.find(item => item.point_name === point.point_name);
            return (
              <ProductCardMitutoyoMap
                key={index}
                actualValue={currentDetail?.final_value || ""}
                image={IMAGE_BASE_URL + point.point_image_url}
                name={point.point_name}
                detail={point}
                precision={precision}
                onComplete={(key, isOk) => {
                  setMitutoyoStatus(prev => ({
                    ...prev,
                    [index]: isOk
                  }));
                }}
              />
            )
          })}
        </div>
        {modalConfig && (
          <ComfirmModal
            title={modalConfig.title}
            message={modalConfig.message}
            variant={modalConfig.variant}
            handleConfirmOK={modalConfig.onConfirm}
            buttonNo={modalConfig.buttonNo}
            buttonOK={modalConfig.buttonOK}
            onClose={closeModal}
            handleConfirmNo={modalConfig.onConfirmNo}
          />
        )}
      </div>
    </div>
  );
}

export default QualityCheckMitutoyo;
