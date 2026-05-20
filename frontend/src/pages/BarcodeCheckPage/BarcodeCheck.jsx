import React, { useState, useRef, useEffect } from 'react';
import { useStep } from '@context/MeasurementContext';
import ComfirmModal from '@components/ComfirmModal';
import { createMeasurement, createMeasurementDraft, saveMeasurement } from '@services/measurementService';
import { showSuccess, showError, showWarning } from '@utils/toast';
function BarcodeCheck() {
  const delay_checkBarcode = 500;
  const [barcode1, setBarcode1] = useState('');
  const [barcode2, setBarcode2] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [disabledBarcode1, setDisabledBarcode1] = useState(false);
  const [disabledBarcode2, setDisabledBarcode2] = useState(false);
  const [debouncedBarcode2, setDebouncedBarcode2] = useState(barcode2);
  const [status, setStatus] = useState('IDLE'); // IDLE, OK, NG
  const inputFirstBarcodeRef = useRef(null);
  const inputSecondBarcodeRef = useRef(null);


  //for go to next step
  // const { formData, setFormData, product, nextStep, goStep, setDraftMeasurement, currentStep } = useStep();
  const {
    product,
    nextStep,
    setDraftMeasurement,
  } = useStep();

  // Focus input 1 on mount
  useEffect(() => {
    if (inputFirstBarcodeRef.current) {
      inputFirstBarcodeRef.current.focus();
    }

  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBarcode2(barcode2);
    }, delay_checkBarcode);

    return () => {
      clearTimeout(handler);
    };
  }, [barcode2]);

  useEffect(() => {
    if (debouncedBarcode2) {
      if (barcode1 === barcode2) {
        setStatus('OK');
      }
      else {
        setStatus('NG');
      }
    }
  }, [debouncedBarcode2]);

  useEffect(() => {
    if (status === 'NG') {
      setDisabledBarcode1(true);
      setDisabledBarcode2(true);
      setShowConfirm(true);
    }
    else if (status === 'OK') {
      //call api to save data
      const createDraft = async () => {
        try {
          const res = await createMeasurementDraft(barcode1, barcode2, product.step1.id, 'draft');
          await saveMeasurement("qrcode");
          setDraftMeasurement(res.data);
          showSuccess('Barcode check pass and saved successfully');
          nextStep();
        } catch (error) {
          showError('Barcode check pass and save fail');
        }
      }
      createDraft();
    }
  }, [status]);

  const keepFocusBarCodeInput = () => {
    if (barcode1 == "" || barcode1 == null) {
      inputFirstBarcodeRef.current?.focus();
    } else {
      inputSecondBarcodeRef.current?.focus();
    }
  };

  const handleConfirmOK = async () => {
    try {
      const res = await createMeasurement(barcode1, barcode2, product.step1.id, 'complete');
      setDisabledBarcode1(false);
      setDisabledBarcode2(false);
      setShowConfirm(false);
      setBarcode1('');
      setBarcode2('');
      setStatus('IDLE');
      showWarning('Barcode check NG and save successfully');
      // await saveMeasurement("qrcode");
      // showWarning('Barcode check fail and saved successfully');
      goStep(-1);
    } catch (error) {
      // toast.error('failed to save');
      showError('Barcode check fail and save fail');
    }

  };

  const handleConfirmNo = () => {
    setDisabledBarcode1(false);
    setDisabledBarcode2(false);
    setShowConfirm(false);
    handleReset();
  };
  const handleInput1KeyDown = (e) => {
    if (e.key === 'Enter' && barcode1.trim() !== '') {
      e.preventDefault();
      inputSecondBarcodeRef.current.focus();
    }
  };

  const handleReset = () => {
    setBarcode1('');
    setBarcode2('');
    setStatus('IDLE');
    setTimeout(() => {
      inputFirstBarcodeRef.current?.focus();
    }, 0);

  };

  // Determine background color based on status
  const getStatusColor = () => {
    if (status === 'OK') return 'bg-green-500/20 border-green-500 text-green-500';
    if (status === 'NG') return 'bg-red-500/20 border-red-500 text-red-500';
    return 'bg-card/50 border-white/10 text-secondary';
  };

  const getLeftBoxColor = () => {
    if (status === 'OK') return 'bg-green-500/10 border-green-500';
    if (status === 'NG') return 'bg-red-500/10 border-red-500';
    return 'glass-card';
  };

  return (
    // <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in bg-white dark:bg-black">
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in bg-page">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              Barcode Check
            </h1>
            <p className="mt-2 text-secondary">
              Scan two barcodes to verify they match.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-primary text-white dark:text-black rounded-lg hover:opacity-90 transition shadow-lg shadow-primary/20 font-medium"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Inputs */}
          <div className={`p-8 rounded-2xl border transition-colors duration-300 ${getLeftBoxColor()}`}>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">First Barcode</label>
                <input
                  ref={inputFirstBarcodeRef}
                  onBlur={keepFocusBarCodeInput}
                  type="text"
                  value={barcode1}
                  disabled={disabledBarcode1}
                  onChange={(e) => setBarcode1(e.target.value)}
                  onKeyDown={handleInput1KeyDown}
                  className="w-full px-4 py-3 text-lg glass-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition"
                  placeholder="Scan first barcode..."
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Second Barcode</label>
                <input
                  ref={inputSecondBarcodeRef}
                  onBlur={keepFocusBarCodeInput}
                  type="text"
                  value={barcode2}
                  onChange={(e) => setBarcode2(e.target.value)}
                  disabled={!barcode1 || disabledBarcode2}
                  className="w-full px-4 py-3 text-lg glass-input rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Scan second barcode..."
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Status */}
          <div className={`p-8 rounded-2xl border flex items-center justify-center transition-colors duration-300 ${getStatusColor()}`}>
            <div className="text-center">
              <div className="text-9xl font-black tracking-tighter">
                {status === 'IDLE' ? 'WAIT' : status}
              </div>
              <p className="mt-4 text-xl font-medium opacity-80">
                {status === 'IDLE' && 'Waiting for input...'}
                {status === 'OK' && 'Barcodes Match'}
                {status === 'NG' && 'Barcodes Do Not Match'}
              </p>
            </div>
          </div>
        </div>
      </div>
      {showConfirm && (
        <ComfirmModal
          title="Barcodes Do Not Match"
          message="Do you want to sava?"
          variant='warning'
          handleConfirmOK={handleConfirmOK}
          onClose={() => setShowConfirm(false)}
          handleConfirmNo={handleConfirmNo}

        />
      )}


    </div>
  );
}

export default BarcodeCheck;
