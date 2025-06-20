import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./lib/supabase";
import * as Linking from "expo-linking";
import { View, Text } from "react-native";

import {
  NAV_LOGIN_SCREEN,
  NAV_CREATE_ACCOUNT_SCREEN,
  NAV_FORGOT_PASSWORD_SCREEN,
  NAV_MAGIC_LINK_SCREEN,
  NAV_RESET_PASSWORD_SCREEN,
  NAV_MAIN_APP,
  NAV_MFA_SETUP_SCREEN,
  NAV_MFA_VERIFICATION_SCREEN,
} from "./constants/navigation";

import LoginScreen from "./screens/LoginScreen";
import CreateAccountScreen from "./screens/CreateAccountScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import MagicLinkScreen from "./screens/MagicLinkScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import MainApp from "./screens/MainApp";
import MFASetupScreen from "./screens/MFASetupScreen";
import MFAVerificationScreen from "./screens/MFAVerificationScreen";
import { SnackbarProvider, useSnackbar } from "./contexts/SnackbarContext";
import Snackbar from "./components/Snackbar";

const Stack = createNativeStackNavigator();

function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState(null);
  const [pendingMfa, setPendingMfa] = useState(null); // { ticket, factorId }
  const [mfaVerified, setMfaVerified] = useState(false); // new flag
  const [requiresMfa, setRequiresMfa] = useState(false); // new flag
  const { snackbar, hideSnackbar } = useSnackbar();

  // Check if the user has a verified TOTP factor after login/session
  const checkIfRequiresMfa = async (user) => {
    if (!user) {
      setRequiresMfa(false);
      setMfaVerified(false);
      return;
    }
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setRequiresMfa(false);
        setMfaVerified(false);
        return;
      }
      const hasVerifiedTOTP = factors.totp?.some(factor => factor.status === 'verified');
      setRequiresMfa(!!hasVerifiedTOTP);
      if (!hasVerifiedTOTP) setMfaVerified(false);
    } catch (e) {
      setRequiresMfa(false);
      setMfaVerified(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isValidSession = session && session.user && session.access_token;
        switch (event) {
          case 'INITIAL_SESSION':
            setSession(isValidSession ? session : null);
            setLoading(false);
            if (isValidSession) await checkIfRequiresMfa(session.user);
            break;
          case 'SIGNED_IN':
            if (isValidSession) {
              setSession(session);
              setPendingMfa(null);
              await checkIfRequiresMfa(session.user);
            }
            break;
          case 'SIGNED_OUT':
            setSession(null);
            setSessionType(null);
            setPendingMfa(null);
            setMfaVerified(false);
            setRequiresMfa(false);
            break;
          case 'TOKEN_REFRESHED':
            if (isValidSession) setSession(session);
            break;
          case 'USER_UPDATED':
            if (isValidSession) setSession(session);
            break;
          default:
            if (isValidSession) setSession(session);
        }
      }
    );

    // Handle deep links when app is running
    const handleDeepLink = async (url) => {
      if (url) {
        console.log('Deep link received:', url);
        
        // Extract the URL from the event object
        const deepLinkUrl = url.url || url;
        
        // Check if this is a magic link (contains access_token)
        if (deepLinkUrl.includes('access_token=')) {
          try {
            console.log('Processing deep link...');
            
            // Parse the URL to extract tokens
            const urlParts = deepLinkUrl.split('#');
            if (urlParts.length > 1) {
              const hashParams = urlParts[1];
              const params = new URLSearchParams(hashParams);
              
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              const type = params.get('type');
              
              if (accessToken && refreshToken) {
                console.log('Found authentication tokens, setting session...');
                
                // Set the session manually
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                
                if (error) {
                  console.error('Error setting session:', error);
                } else {
                  if (type === 'recovery') {
                    console.log('Reset password link detected');
                    setSessionType('recovery');
                  } else {
                    console.log('Magic link detected');
                    setSessionType('magic');
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error processing deep link:', error);
          }
        }
      }
    };

    const linkSubscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL if app was opened via deep link
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          console.log('App opened with URL:', initialURL);
          
          // Handle the initial deep link
          await handleDeepLink(initialURL);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
      }
    };

    handleInitialURL();

    return () => {
      subscription.unsubscribe();
      linkSubscription?.remove();
    };
  }, []);

  // Handler to be passed to LoginScreen
  const handlePendingMfa = ({ ticket, factorId }) => {
    setPendingMfa({ ticket, factorId });
  };

  // Handler to be passed to MFAVerificationScreen
  const handleMfaVerified = (session) => {
    setSession(session);
    setPendingMfa(null);
    setMfaVerified(true);
  };

  // If session exists and user requires MFA but hasn't verified, show MFA screen
  useEffect(() => {
    if (session && requiresMfa && !mfaVerified && !pendingMfa) {
      // Start MFA challenge for the user
      (async () => {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verifiedTOTP = factors.totp?.find(factor => factor.status === 'verified');
        if (verifiedTOTP) {
          // Start challenge
          const { data: mfaChallenge } = await supabase.auth.mfa.challenge({ factorId: verifiedTOTP.id });
          setPendingMfa({ challengeId: mfaChallenge.id, factorId: verifiedTOTP.id });
        }
      })();
    }
  }, [session, requiresMfa, mfaVerified, pendingMfa]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "rgb(255, 255, 255)",
          },
          cardStyle: {
            backgroundColor: "rgb(255, 255, 255)",
          }
        }}
      >
        {/* Centralized navigation logic for authentication and MFA */}
        {pendingMfa ? (
          <Stack.Screen
            name={NAV_MFA_VERIFICATION_SCREEN}
            children={() => (
              <MFAVerificationScreen
                challengeId={pendingMfa.challengeId}
                factorId={pendingMfa.factorId}
                onVerified={handleMfaVerified}
              />
            )}
          />
        ) : session && (!requiresMfa || mfaVerified) ? (
          sessionType === 'recovery' ? (
            <Stack.Screen name={NAV_RESET_PASSWORD_SCREEN} component={ResetPasswordScreen} />
          ) : (
            <>
              <Stack.Screen name={NAV_MAIN_APP} component={MainApp} />
              <Stack.Screen name={NAV_MFA_SETUP_SCREEN} component={MFASetupScreen} />
            </>
          )
        ) : (
          <>
            <Stack.Screen
              name={NAV_LOGIN_SCREEN}
              children={() => <LoginScreen onPendingMfa={handlePendingMfa} />}
            />
            <Stack.Screen name={NAV_CREATE_ACCOUNT_SCREEN} component={CreateAccountScreen} />
            <Stack.Screen name={NAV_FORGOT_PASSWORD_SCREEN} component={ForgotPasswordScreen} />
            <Stack.Screen name={NAV_MAGIC_LINK_SCREEN} component={MagicLinkScreen} />
            <Stack.Screen name={NAV_RESET_PASSWORD_SCREEN} component={ResetPasswordScreen} />
          </>
        )}
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

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading...</Text>
    </View>
  );
}
