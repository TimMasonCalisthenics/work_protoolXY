import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getProductById } from "@services/productService";
import { getActiveProduct } from "@services/settingService";
import { getMeasurementsDraft } from "@services/measurementService";
import { showWarning } from "@utils/toast";
type FormData = {
  measurement_id: number;
  serial_a: string;
  product_id: number;
  serial_b: string;
};

type StepContextType = {
  currentStep: number;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  nextStep: () => void;
  lastStep: () => void;
  goStep: (step: number) => void;
  prevStep: () => void;
  zeroStep: () => void;
  product: any;
  setDraftMeasurement: React.Dispatch<React.SetStateAction<any>>;
  draftMeasurement: any;
};

const StepContext = createContext<StepContextType | null>(null);

export const useStep = () => {
  const context = useContext(StepContext);
  if (!context) throw new Error("useStep must be used inside StepProvider");
  return context;
};

export const StepProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    measurement_id: 0,
    serial_a: "",
    product_id: 0,
    serial_b: "",
  });

  const [product, setProduct] = useState(
    {
      step1: {},
      step2: {},
      step3: {},
      step4: {},
    }
  );
  const [draftMeasurement, setDraftMeasurement] = useState({});
  useEffect(() => {
    const fetchData = async (activeProduct: any) => {
      if (activeProduct == null) {
        const activeProductData = await getActiveProduct();
        activeProduct = activeProductData.data;
      }

      if (activeProduct != null) {
        const productRes = await getProductById(activeProduct);
        const specPoints = productRes.data.spec_points;
        setProduct({
          step1: {
            id: productRes.data.id,
            product_name: productRes.data.product_name,
            image_url: productRes.data.image_url,
            option_condition: productRes.data.option_condition,
            option_save: productRes.data.option_save,

          },
          step2: specPoints.filter((p: any) => p.sensor_type === "mitutoyo"),
          step3: specPoints.filter((p: any) => p.sensor_type === "air_gauge"),
          step4: specPoints.filter((p: any) => p.sensor_type === "air_gauge_x" || p.sensor_type === "air_gauge_y"),
        });

      }
      //throw error of something went wrong
      else {
        showWarning("Please select active product");
        throw new Error("Something went wrong");
      }

    };
    //check if draftMeasurement is not empty
    const fetchDraftMeasurement = async () => {
      const draftMeasurementData = await getMeasurementsDraft();
      if (draftMeasurementData.data != null) {
        setDraftMeasurement(draftMeasurementData.data);
        await fetchData(draftMeasurementData.data.product_id);
        if (draftMeasurementData.data.stage == "mitutoyo") {
          goStep(2);
        }
        else if (draftMeasurementData.data.stage == "air_gauge") {
          goStep(3);
        }
        else if (draftMeasurementData.data.stage == "air_gauge_x" || draftMeasurementData.data.stage == "air_gauge_y") {
          goStep(4);
        }
        else {
          goStep(-1);
        }
      }
      else {
        await fetchData(null);
      }
    }
    fetchDraftMeasurement();
  }, []);



  const zeroStep = () => setCurrentStep(1);
  const lastStep = () => setCurrentStep(-1);
  const goStep = (step: number) => setCurrentStep(step);
  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  return (
    <StepContext.Provider
      value={{
        currentStep, formData, setFormData, nextStep, goStep, prevStep, zeroStep, lastStep
        , product, draftMeasurement, setDraftMeasurement
      }}
    >
      {children}
    </StepContext.Provider>
  );
};
