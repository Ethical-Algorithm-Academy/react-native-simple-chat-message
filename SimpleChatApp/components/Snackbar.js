import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { RFValue } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";

// Define the possible snackbar types as constants
export const SNACKBAR_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

function Snackbar({ 
  visible, 
  message, 
  type = SNACKBAR_TYPES.INFO,
  duration = 3000,
  onDismiss 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const timeoutRef = useRef(null);

  const showSnackbar = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hideSnackbar();
      }, duration);
    }
  }, [fadeAnim, slideAnim, duration]);

  const hideSnackbar = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  }, [fadeAnim, slideAnim, onDismiss]);

  useEffect(() => {
    if (visible && !isVisible) {
      setIsVisible(true);
      // Use requestAnimationFrame to ensure the component is mounted
      requestAnimationFrame(() => {
        showSnackbar();
      });
      console.log('[Snackbar] Showing:', { message, type, duration });
    } else if (!visible && isVisible) {
      hideSnackbar();
    }
  }, [visible, isVisible, showSnackbar, hideSnackbar]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const typeStyles = {
    [SNACKBAR_TYPES.SUCCESS]: {
      backgroundColor: "#4CAF50",
      icon: "checkmark-circle-outline",
    },
    [SNACKBAR_TYPES.ERROR]: {
      backgroundColor: "#F44336",
      icon: "close-circle-outline",
    },
    [SNACKBAR_TYPES.WARNING]: {
      backgroundColor: "#FF9800",
      icon: "warning-outline",
    },
    [SNACKBAR_TYPES.INFO]: {
      backgroundColor: "#2196F3",
      icon: "information-circle-outline",
    },
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: typeStyles[type].backgroundColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={typeStyles[type].icon}
          size={RFValue(20)}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
      <Pressable onPress={hideSnackbar} style={styles.closeButton}>
        <Ionicons name="close" size={RFValue(20)} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: RFValue(100),
    left: RFValue(16),
    right: RFValue(16),
    borderRadius: RFValue(8),
    padding: RFValue(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: RFValue(12),
  },
  message: {
    color: "#fff",
    fontSize: RFValue(14),
    fontWeight: "500",
    flex: 1,
  },
  closeButton: {
    padding: RFValue(4),
  },
});

export default Snackbar; 