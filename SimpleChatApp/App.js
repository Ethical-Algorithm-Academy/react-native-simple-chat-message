import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "./lib/supabase";
import { reinitSupabase } from "./lib/supabase";
import * as Linking from "expo-linking";
import { navigationRef } from './navigationRef';
import { NAV_LOGIN_SCREEN } from './constants/navigation';
import crashlytics from '@react-native-firebase/crashlytics';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  NAV_CREATE_ACCOUNT_SCREEN,
  NAV_FORGOT_PASSWORD_SCREEN,
  NAV_MAGIC_LINK_SCREEN,
  NAV_RESET_PASSWORD_SCREEN,
  NAV_MAIN_APP,
  NAV_MFA_SETUP_SCREEN,
  NAV_MFA_VERIFICATION_SCREEN,  
  NAV_ADDMESSAGE_SCREEN ,
  NAV_CONFIGURATIONS_SCREEN ,
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
import ConfigurationsScreen from './screens/ConfigurationsScreen';
import AddMessageScreen from './screens/AddMessageScreen';
import MessageDetailsScreen from './screens/MessageDetailsScreen'

import { SnackbarProvider, useSnackbar } from "./contexts/SnackbarContext";

import Snackbar from "./components/Snackbar";
import LoadingScreen from "./components/LoadingScreen";
import { View } from 'react-native';

const Stack = createNativeStackNavigator();

function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // for other loading, e.g. login
  const [startupLoading, setStartupLoading] = useState(true); // for app startup only
  const [sessionType, setSessionType] = useState(null);
  const [pendingMfa, setPendingMfa] = useState(null); // { ticket, factorId }
  const [mfaVerified, setMfaVerified] = useState(false); // new flag
  const [requiresMfa, setRequiresMfa] = useState(false); // new flag
  const [checkingMfa, setCheckingMfa] = useState(false); // new state for MFA check
  const [mfaFlowStarted, setMfaFlowStarted] = useState(false); // new state for MFA flow
  const { snackbar, hideSnackbar, showSuccess, showError, showInfo } = useSnackbar();

  // Add this function inside AppContent so it can access setSessionType
  const setSessionTypeWithLog = (type) => {
    console.log('[setSessionType]', type);
    setSessionType(type);
  };

  // Check if the user has a verified TOTP factor after login/session
  const checkIfRequiresMfa = async (user) => {
    setCheckingMfa(true); // Start checking MFA
    if (!user) {
      setRequiresMfa(false);
      setMfaVerified(false);
      setCheckingMfa(false); // Done checking MFA
      return;
    }
    // Only enforce MFA for email/password logins (not Google or magic link)
    if (user.app_metadata?.provider !== 'email' || sessionType === 'magic') {
      setRequiresMfa(false);
      setMfaVerified(false);
      setCheckingMfa(false); // Done checking MFA
      return;
    }
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setRequiresMfa(false);
        setMfaVerified(false);
        setCheckingMfa(false); // Done checking MFA
        return;
      }
      const hasVerifiedTOTP = factors.totp?.some(factor => factor.status === 'verified');
      setRequiresMfa(!!hasVerifiedTOTP);
      if (!hasVerifiedTOTP) setMfaVerified(false);
    } catch (e) {
      setRequiresMfa(false);
      setMfaVerified(false);
    } finally {
      setCheckingMfa(false); // Done checking MFA
    }
  };

  useEffect(() => {
    //console.log('[App.js] supabase instance:', supabase);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          //console.log('[AuthStateChange] Event received:', event, session);
          const isValidSession = session && session.user && session.access_token;
          //console.log(`[AuthStateChange] Event: ${event}, isValidSession: ${!!isValidSession}`, session);
          if (event === 'SIGNED_IN' && isValidSession) {
            try {
          //    console.log('[Supabase] onAuthStateChange: About to call reinitSupabase');
              reinitSupabase();
            //  console.log('[Supabase] onAuthStateChange: Called reinitSupabase');
            } catch (e) {
              console.log('[Supabase] onAuthStateChange: Error calling reinitSupabase:', e);
            }
          }
          switch (event) {
            case 'INITIAL_SESSION':
              setSession(isValidSession ? session : null);
              if (isValidSession) {
                await checkIfRequiresMfa(session.user);
              }
              setStartupLoading(false);
              break;
            case 'SIGNED_IN':
              if (isValidSession) {
                setSession(session);
                setPendingMfa(null);
                await checkIfRequiresMfa(session.user);
              }
              break;
            case 'SIGNED_OUT':
              console.log('[AuthStateChange] Event: SIGNED_OUT, session set to null');
              setSession(null);
              setSessionType(null);
              setPendingMfa(null);
              setMfaVerified(false);
              setRequiresMfa(false);
              AsyncStorage.removeItem('mfa_verified').then(() => {
                console.log('[MFA] mfa_verified removed from storage on logout');
              });
              break;
            case 'TOKEN_REFRESHED':
              if (isValidSession) setSession(session);
              break;
            case 'USER_UPDATED':
              if (isValidSession) setSession(session);
              break;
            default:
              console.log('[AuthStateChange] Default case for event:', event);
              if (isValidSession) setSession(session);
          }
        } catch (err) {
          console.error('[AuthStateChange] Handler error:', err);
        }
      }
    );

    // Handle deep links when app is running
    const handleDeepLink = async (url) => {
      if (url) {
        console.log('Deep link received:', url);
        const deepLinkUrl = url.url || url;

        // Only handle magic link and password reset with setSession
        if (deepLinkUrl.includes('access_token=')) {
          try {
            console.log('Processing deep link...');
            const urlParts = deepLinkUrl.split('#');
            if (urlParts.length > 1) {
              const hashParams = urlParts[1];
              const params = new URLSearchParams(hashParams);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              const type = params.get('type');

              if (deepLinkUrl.startsWith('simplechatapp://confirm-account')) {
                console.log('[DeepLink] Handling confirm-account link');
                console.log('[DeepLink] Calling showSuccess for Account confirmed!');
                showSuccess('Account confirmed! Please log in.');
                setSession(null);
                setSessionType(null);
                setPendingMfa(null);
                setMfaVerified(false);
                setRequiresMfa(false);
                if (navigationRef.isReady()) {
                  console.log('[DeepLink] Navigating to login screen');
                  navigationRef.navigate(NAV_LOGIN_SCREEN);
                } else {
                  console.log('[DeepLink] Navigation ref not ready');
                }
                return;
              } else if (accessToken && refreshToken) {
                // Only set session for magic link or password reset
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                try {
                  reinitSupabase();
                } catch (e) {
                  console.log('[Supabase] Error calling reinitSupabase:', e);
                }

                // Log the current session after setSession
                if (error) {
                  console.error('Error setting session:', error);
                } else {
                  console.log("[RECOVERY ??]");
                  console.log("[RECOVERY ??]");
                  console.log("[RECOVERY ??]");
                  console.log("[RECOVERY ??]");
                  console.log("[RECOVERY ??]");
                  if (type === 'recovery') {
                    console.log("[RECOVERY sim]");
                    setSessionTypeWithLog('recovery');
                    
                  } else {
                    console.log("[RECOVERY nao]");
                    setSessionTypeWithLog('magic');
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
         // console.log('App opened with URL:', initialURL);
          
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
  }, [supabase]);

  // Restore mfaVerified from storage on app start if session exists
  useEffect(() => {
    const restoreMfaVerified = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const mfaFlag = await AsyncStorage.getItem('mfa_verified');
        console.log('[MFA] Restoring mfa_verified from storage:', mfaFlag);
        if (mfaFlag === 'true') {
          setMfaVerified(true);
          console.log('[MFA] mfaVerified set to true from storage');
        } else {
          console.log('[MFA] mfaVerified not set from storage');
        }
      } else {
        console.log('[MFA] No session found on restore');
      }
    };
    restoreMfaVerified();
  }, []);

  // Handler to be passed to LoginScreen
  const handlePendingMfa = ({ ticket, factorId }) => {
    setPendingMfa({ ticket, factorId });
  };

  const handleMfaFlowStarted = () => {
    setMfaFlowStarted(true);
  };

  // Handler to be passed to MFAVerificationScreen
  const handleMfaVerified = (session) => {
    setSession(session);
    setPendingMfa(null);
    setMfaVerified(true);
    setMfaFlowStarted(false); // Reset MFA flow state
    AsyncStorage.setItem('mfa_verified', 'true').then(() => {
      console.log('[MFA] mfa_verified set to true in storage');
    });
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

  if (startupLoading) {
    return <View style={{ flex: 1, backgroundColor: 'rgb(255,255,255)' }} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
        {/* Debug logs for navigation state */}
        {(() => {
          //console.log('[NAV] session:', session);
          console.log('[NAV] requiresMfa:', requiresMfa);
          console.log('[NAV] mfaVerified:', mfaVerified);
          console.log('[NAV] mfaFlowStarted:', mfaFlowStarted);
          console.log('[NAV] pendingMfa:', pendingMfa);
          if (pendingMfa) {
            console.log('[NAV] Rendering: MFAVerificationScreen');
          } else if (session && (!requiresMfa || mfaVerified) && !(mfaFlowStarted && !pendingMfa)) {
            if (sessionType === 'recovery') {
              console.log('[NAV] Rendering: ResetPasswordScreen (recovery)');
            } else {
              console.log('[NAV] Rendering: MainApp and other main screens');
            }
          } else {
            console.log('[NAV] Rendering: Login and auth screens');
          }
          return null;
        })()}
        {/* Centralized navigation logic for authentication and MFA */}
        {checkingMfa ? (
          <Stack.Screen
            name={NAV_LOGIN_SCREEN}
            children={() => (
              <LoginScreen
                onPendingMfa={handlePendingMfa}
                onMfaFlowStarted={handleMfaFlowStarted}
                disableSignIn={true}
              />
            )}
          />
        ) : pendingMfa ? (
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
        ) : session && (!requiresMfa || mfaVerified) && !(mfaFlowStarted && !pendingMfa) ? (
          sessionType === 'recovery' ? (
            <Stack.Screen name={NAV_RESET_PASSWORD_SCREEN} component={ResetPasswordScreen} />
          ) : (
            <>
              <Stack.Screen name={NAV_MAIN_APP} component={MainApp} />
              <Stack.Screen name={NAV_MFA_SETUP_SCREEN} component={MFASetupScreen} />
              <Stack.Screen name={NAV_CONFIGURATIONS_SCREEN} component={ConfigurationsScreen} />
              <Stack.Screen name={NAV_ADDMESSAGE_SCREEN} component={AddMessageScreen} />
              <Stack.Screen name={NAV_MESSAGEDETAILS_SCREEN} component={MessageDetailsScreen} />
            </>
          )
        ) : (
          <>
            <Stack.Screen
              name={NAV_LOGIN_SCREEN}
              children={() => (
                <LoginScreen
                  onPendingMfa={handlePendingMfa}
                  onMfaFlowStarted={handleMfaFlowStarted}
                  disableSignIn={mfaFlowStarted && !pendingMfa}
                />
              )}
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
