import React from "react";

const ToastContent = ({ title, message }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <strong style={{ fontSize: "16px" }}>{title}</strong>
      <span style={{ opacity: 0.9 }}>{message}</span>
    </div>
  );
};

export default ToastContent;