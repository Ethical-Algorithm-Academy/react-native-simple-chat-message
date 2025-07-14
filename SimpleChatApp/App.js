import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase, reinitSupabase } from "./lib/supabase";
import * as Linking from "expo-linking";
import { navigationRef } from "./navigationRef";
import { NAV_LOGIN_SCREEN } from "./constants/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  NAV_CREATE_ACCOUNT_SCREEN,
  NAV_FORGOT_PASSWORD_SCREEN,
  NAV_MAGIC_LINK_SCREEN,
  NAV_RESET_PASSWORD_SCREEN,
  NAV_MAIN_APP,
  NAV_MFA_SETUP_SCREEN,
  NAV_MFA_VERIFICATION_SCREEN,
  NAV_ADDMESSAGE_SCREEN,
  NAV_CONFIGURATIONS_SCREEN,
  NAV_MESSAGEDETAILS_SCREEN,
} from "./constants/navigation";

import LoginScreen from "./screens/LoginScreen";
import CreateAccountScreen from "./screens/CreateAccountScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import MagicLinkScreen from "./screens/MagicLinkScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import MainApp from "./screens/MainApp";
import MFASetupScreen from "./screens/MFASetupScreen";
import MFAVerificationScreen from "./screens/MFAVerificationScreen";
import ConfigurationsScreen from "./screens/ConfigurationsScreen";
import AddMessageScreen from "./screens/AddMessageScreen";
import MessageDetailsScreen from "./screens/MessageDetailsScreen";

import { SnackbarProvider, useSnackbar } from "./contexts/SnackbarContext";
import Snackbar from "./components/Snackbar";
import { View } from "react-native";

const Stack = createNativeStackNavigator();

function AppContent() {
  console.log('[AppContent] Rendered');
  const navigation = useNavigationContainerRef(); // imperative navigation
  const [session, setSession] = useState(null);
  const [pendingMfa, setPendingMfa] = useState(null);
  const [sessionType, setSessionType] = useState(null);
  const [loading, setLoading] = useState(true);
  const { snackbar, hideSnackbar, showSuccess } = useSnackbar();

  // --- 1. On app start, check for existing session ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- 2. Listen for auth state changes (login/logout) ---
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        console.log("Signed in?");
        reinitSupabase();
        setSession(session);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setSessionType(null);
        setPendingMfa(null);
        navigation.reset({
          index: 0,
          routes: [{ name: NAV_LOGIN_SCREEN }],
        });
        AsyncStorage.removeItem("mfa_verified");
        AsyncStorage.removeItem("last_login_method");
      } else if (event === "TOKEN_REFRESHED" && session) {
        setSession(session);
      } else if (event === "USER_UPDATED" && session) {
        setSession(session);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, navigation]);

  // --- 3. Handle deep links for magic link and password reset ---
  useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;
      const deepLinkUrl = url.url || url;
      if (deepLinkUrl.includes("access_token=")) {
        const urlParts = deepLinkUrl.split("#");
        if (urlParts.length > 1) {
          const hashParams = urlParts[1];
          const params = new URLSearchParams(hashParams);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          const type = params.get("type");
          if (deepLinkUrl.startsWith("simplechatapp://confirm-account")) {
            showSuccess("Account confirmed! Please log in.");
            setSession(null);
            setSessionType(null);
            setPendingMfa(null);
            navigation.reset({
              index: 0,
              routes: [{ name: NAV_LOGIN_SCREEN }],
            });
            return;
          } else if (accessToken && refreshToken) {
            console.log("[SetSession - App.js] AccessToken: ", accessToken);
            console.log("[SetSession - App.js] ResfreshToken: ", refreshToken);
            if (type === "magic") {
              await AsyncStorage.setItem("last_login_method", "magic");
            }
            setSessionType(type === "recovery" ? "recovery" : "magic");
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              // Clean up if session failed
              if (type === "magic") {
                await AsyncStorage.removeItem("last_login_method");
              }
              setSessionType(null);
              return;
            }
            reinitSupabase();
            // Log the session object for debugging
            const { data: { session } } = await supabase.auth.getSession();
            console.log('[App.js][DeepLink] session after setSession:', session);
            console.log("[SetType - App.js] Type: ", type);
            // Procedural navigation after deep link login
            if (type === "recovery") {
              console.log("recovery");
              navigation.reset({
                index: 0,
                routes: [{ name: NAV_RESET_PASSWORD_SCREEN }],
              });
            }
          }
        }
      }
    };
    const sub = Linking.addEventListener("url", handleDeepLink);
    (async () => {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) await handleDeepLink(initialURL);
    })();
    return () => sub?.remove();
  }, [navigation]);

  // --- 4. After login, check if 2FA is required (only for email/password) ---
  useEffect(() => {
    if (!session) {
      setPendingMfa(null);
      return;
    }
    // Early return if in recovery flow
    if (sessionType === "recovery") {
      return;
    }

    (async () => {
      const mfaVerified = await AsyncStorage.getItem("mfa_verified");
      if (mfaVerified === "true") {
        setPendingMfa(null);
        navigation.reset({ index: 0, routes: [{ name: NAV_MAIN_APP }] });        
        return;
      }

      const lastLoginMethod = await AsyncStorage.getItem("last_login_method");
      if (lastLoginMethod !== "email") {
        setPendingMfa(null);
        navigation.reset({ index: 0, routes: [{ name: NAV_MAIN_APP }] });
        return;
      }

      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error || !factors.totp?.some((f) => f.status === "verified")) {
        setPendingMfa(null);
        navigation.reset({ index: 0, routes: [{ name: NAV_MAIN_APP }] });
        return;
      }
      // If we get here, 2FA is required
      const verifiedTOTP = factors.totp.find((f) => f.status === "verified");
      const { data: mfaChallenge } = await supabase.auth.mfa.challenge({
        factorId: verifiedTOTP.id,
      });
      setPendingMfa({
        challengeId: mfaChallenge.id,
        factorId: verifiedTOTP.id,
      });
      if (navigation.getCurrentRoute()?.name !== NAV_MFA_VERIFICATION_SCREEN) {
        navigation.reset({ index: 0, routes: [{ name: NAV_MFA_VERIFICATION_SCREEN }] });
      }
    })();
  }, [session, sessionType]);


  if (loading) {
    return <View style={{ flex: 1, backgroundColor: "white" }} />;
  }

  return (
    <NavigationContainer ref={navigation}>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "rgb(255,255,255)" },
          cardStyle: { backgroundColor: "rgb(255,255,255)" },
        }}
      >
        {/* Login and Auth Screens */}
        <Stack.Screen name={NAV_LOGIN_SCREEN} component={LoginScreen} />
        <Stack.Screen
          name={NAV_CREATE_ACCOUNT_SCREEN}
          component={CreateAccountScreen}
        />
        <Stack.Screen
          name={NAV_FORGOT_PASSWORD_SCREEN}
          component={ForgotPasswordScreen}
        />
        <Stack.Screen
          name={NAV_MAGIC_LINK_SCREEN}
          component={MagicLinkScreen}
        />
        <Stack.Screen
          name={NAV_RESET_PASSWORD_SCREEN}
          component={ResetPasswordScreen}
        />
        {/* 2FA Screen */}
        <Stack.Screen
          name={NAV_MFA_VERIFICATION_SCREEN}
          children={() => {
            console.log("[App] Rendering MFAVerificationScreen with props:", {
              challengeId: pendingMfa?.challengeId,
              factorId: pendingMfa?.factorId,
            });
            return (
              <MFAVerificationScreen
                challengeId={pendingMfa?.challengeId}
                factorId={pendingMfa?.factorId}
              />
            );
          }}
        />
        {/* Main App Screens */}
        <Stack.Screen name={NAV_MAIN_APP} component={MainApp} />
        <Stack.Screen name={NAV_MFA_SETUP_SCREEN} component={MFASetupScreen} />
        <Stack.Screen
          name={NAV_CONFIGURATIONS_SCREEN}
          component={ConfigurationsScreen}
        />
        <Stack.Screen
          name={NAV_ADDMESSAGE_SCREEN}
          component={AddMessageScreen}
        />
        <Stack.Screen
          name={NAV_MESSAGEDETAILS_SCREEN}
          component={MessageDetailsScreen}
        />
      </Stack.Navigator>
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        duration={snackbar.duration}
        onDismiss={hideSnackbar}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SnackbarProvider>
      <AppContent />
    </SnackbarProvider>
  );
}
