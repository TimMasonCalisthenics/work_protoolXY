import { StepProvider, useStep } from "@context/MeasurementContext";
import SerialNumberPage from "@pages/SerialNumberPage/SerialNumberPage";
import BarcodeCheck from "@pages/BarcodeCheckPage/BarcodeCheck";
import QualityCheckMitutoyo from "@pages/QualityCheckMitutoyoPage/QualityCheckMitutoyo";
import QualityCheckGaugeMultiAxis from "@pages/QualityCheckGaugeMultiAxisPage/QualityCheckGaugeMultiAxis";
import ComfirmModal from "@components/ComfirmModal";
const StepContent = () => {
  const { currentStep, product, nextStep, goStep, zeroStep, lastStep } = useStep();
  if (currentStep) {
  }
  switch (currentStep) {
    case 1:
      return <SerialNumberPage />;
    case 2:
      if (product.step2.length == 0) {
        goStep(3);
      }
      return <QualityCheckMitutoyo />;
    case 3:
      if (product.step3.length == 0) {
        goStep(4);
      }
      return <QualityCheckGaugeMultiAxis />;
    case 4:
      if (product.step4.length == 0) {
        lastStep();
      }
      return <QualityCheckGaugeMultiAxis />;
    case -1:
      zeroStep();
    default:
      return <BarcodeCheck />;
  }
};

export default function Measurement() {
  return (
    <StepProvider>
      <div className="w-auto mx-auto p-6 bg-page">
        <StepContent />
      </div>
    </StepProvider>
  );
}
