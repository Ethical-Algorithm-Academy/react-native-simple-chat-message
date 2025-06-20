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
const EVENT_TYPES = {
  INITIAL_SESSION: 'INITIAL_SESSION',
  SIGNED_IN: 'SIGNED_IN',
  SIGNED_OUT: 'SIGNED_OUT',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  USER_UPDATED: 'USER_UPDATED',
};


function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionType, setSessionType] = useState(null);
  const { snackbar, hideSnackbar } = useSnackbar();


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        console.log('User:', session?.user?.email);
        
        switch (event) {
          case EVENT_TYPES.INITIAL_SESSION:
            console.log('Initial session:', session ? 'Found' : 'None');
            setSession(session);
            setLoading(false);
            break;
            
          case EVENT_TYPES.SIGNED_IN:
            console.log('User signed in successfully!');
            setSession(session);
            break;
            
          case EVENT_TYPES.SIGNED_OUT:
            console.log('User signed out');
            setSession(null);
            setSessionType(null);
            break;
            
          case EVENT_TYPES.TOKEN_REFRESHED:
            console.log('Token refreshed');
            setSession(session);
            break;
            
          case EVENT_TYPES.USER_UPDATED:
            console.log('User updated');
            setSession(session);
            break;
          
          default:
            console.log('Other auth event:', event);
            setSession(session);
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
        {session ? (
          sessionType === 'recovery' ? (
            <Stack.Screen name={NAV_RESET_PASSWORD_SCREEN} component={ResetPasswordScreen} />
          ) : (
            <>
              <Stack.Screen name={NAV_MAIN_APP} component={MainApp} />
              <Stack.Screen name={NAV_MFA_SETUP_SCREEN} component={MFASetupScreen} />
              <Stack.Screen name={NAV_MFA_VERIFICATION_SCREEN} component={MFAVerificationScreen} />
            </>
          )
        ) : (
          <>
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
