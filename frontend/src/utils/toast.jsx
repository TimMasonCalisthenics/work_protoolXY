import { toast } from "react-toastify";
import ToastContent from "@components/ToastContent";

export const showSuccess = (message) => {
  toast.success(
    <ToastContent title="Success" message={message} />
  );
};
export const showInfo = (message) => {
  toast.info(
    <ToastContent title="Info" message={message} />
  );
};
export const showWarning = (message) => {
  toast.warning(
    <ToastContent title="Warning" message={message} />
  );
};
export const showError = (message) => {
  toast.error(
    <ToastContent title="Error" message={message} />
  );
};