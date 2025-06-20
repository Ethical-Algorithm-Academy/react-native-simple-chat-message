import { createContext, useContext, useState } from "react";
import { SNACKBAR_TYPES } from '../components/Snackbar';

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
    type: SNACKBAR_TYPES.INFO,
    duration: 3000,
  });

  const showSnackbar = (message, type = SNACKBAR_TYPES.INFO, duration = 3000) => {
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
    showSnackbar(message, SNACKBAR_TYPES.SUCCESS, duration);
  };

  const showError = (message, duration = 4000) => {
    showSnackbar(message, SNACKBAR_TYPES.ERROR, duration);
  };

  const showWarning = (message, duration = 3000) => {
    showSnackbar(message, SNACKBAR_TYPES.WARNING, duration);
  };

  const showInfo = (message, duration = 3000) => {
    showSnackbar(message, SNACKBAR_TYPES.INFO, duration);
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