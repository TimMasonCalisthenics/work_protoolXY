
const VARIANT_MAP = {
  success: {
    icon: "✓",
    header: "text-green-600 dark:text-green-400",
    accent: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
    button: "bg-green-600 hover:bg-green-700 text-white"
  },
  danger: {
    icon: "⚠",
    header: "text-red-600 dark:text-red-400",
    accent: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
    button: "bg-red-600 hover:bg-red-700 text-white"
  },
  warning: {
    icon: "!",
    header: "text-yellow-600 dark:text-yellow-400",
    accent: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400",
    button: "bg-yellow-600 hover:bg-yellow-700 text-white"
  },
  info: {
    icon: "i",
    header: "text-blue-600 dark:text-blue-400",
    accent: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 text-white"
  }
};

function ComfirmModal({ title = "", message = "Do you want to sava?",
  variant = "info", buttonOK = "SAVE", buttonNo = "CANCEL",
  handleConfirmOK, handleConfirmNo, onClose }) {
  const variantStyles = VARIANT_MAP[variant];
  const onConfirmClick = () => {
    handleConfirmOK();
    onClose();
  };

  const onNoClick = () => {
    handleConfirmNo();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/50 z-50 pt-20">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-96">
        <div className="flex items-center justify-right gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variantStyles.accent}`}>
            {variantStyles.icon}
          </div>
          {/* <h2 className="text-xl font-bold mb-4 text-red-500"> */}
          <h2 className={`text-xl font-bold ${variantStyles.header}`}>
            {title}
          </h2>
        </div>
        <p className="mb-6 text-primary">{message}</p>
        <div className="flex justify-end gap-4">
          {handleConfirmNo &&
            <button
              onClick={onNoClick}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
            >
              {buttonNo}
            </button>
          }
          <button
            onClick={onConfirmClick}
            className={`px-4 py-2 rounded-lg transition ${variantStyles.button}`}
          >
            {buttonOK}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComfirmModal