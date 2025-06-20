import { createContext, useContext, useState } from "react";

const SnackbarContext = createContext();

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
    duration: 3000,
  });

  const showSnackbar = (message, type = "info", duration = 3000) => {
    setSnackbar({
      visible: true,
      message,
      type,
      duration,
    });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, visible: false }));
  };

  const showSuccess = (message, duration = 3000) => {
    showSnackbar(message, "success", duration);
  };

  const showError = (message, duration = 4000) => {
    showSnackbar(message, "error", duration);
  };

  const showWarning = (message, duration = 3000) => {
    showSnackbar(message, "warning", duration);
  };

  const showInfo = (message, duration = 3000) => {
    showSnackbar(message, "info", duration);
  };

  return (
    <SnackbarContext.Provider
      value={{
        snackbar,
        showSnackbar,
        hideSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
    </SnackbarContext.Provider>
  );
}; 