import React, { useEffect, useRef, useState } from 'react';
import { HiOutlineQrCode } from "react-icons/hi2";
import { useStep } from '@context/MeasurementContext';
import { createMeasurementDraft, saveMeasurement } from '@services/measurementService';
import { showError, showSuccess, showWarning } from '@utils/toast';

function SerialNumberPage() {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  const {
    product,
    nextStep,
    setDraftMeasurement,
  } = useStep();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleStart = async (e) => {
    e.preventDefault();

    if (!serial.trim()) {
      showWarning('Please scan serial number');
      return;
    }

    try {
      setLoading(true);

      const res = await createMeasurementDraft(
        serial,
        serial,
        product.step1.id,
        'draft'
      );
      await saveMeasurement("qrcode");
      setDraftMeasurement(res.data);

      showSuccess('Start measurement successfully');

      nextStep();
    } catch (error) {
      showError('Failed to start measurement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-start justify-center px-4 py-10">
      <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center space-y-5 shadow-2xl border border-white/10">

        <HiOutlineQrCode className="text-6xl text-primary mx-auto" />

        <div>
          <h1 className="text-3xl font-bold">
            Start New Inspection
          </h1>

          <p className="mt-2 text-secondary">
            Scan serial number to start measurement
          </p>
        </div>

        <form
          onSubmit={handleStart}
          className="space-y-4"
        >
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Scan Serial Number..."
            autoComplete="off"
            disabled={loading}
            className="
              w-full
              text-center
              text-xl
              font-bold
              p-4
              glass-input
              rounded-xl
              outline-none
              transition
              focus:ring-2
              focus:ring-primary/50
              disabled:opacity-50
            "
          />

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              btn-primary
              py-3
              rounded-xl
              font-bold
              text-lg
              shadow-lg
              disabled:opacity-50
            "
          >
            {loading ? 'Starting...' : 'Start Measurement'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SerialNumberPage;