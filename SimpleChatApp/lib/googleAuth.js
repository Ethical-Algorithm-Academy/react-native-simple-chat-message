import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { DEEPLINK_MAIN_APP } from '../constants/navigation';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async () => {
  console.log("[SigninWithGoogle]started sign in goole");
  try {
    console.log("[SigninWithGoogle]inside try");
    // Try different redirect URL formats
    const redirectUrl = DEEPLINK_MAIN_APP;
    
    // Alternative: Use the development URL if needed
    // const redirectUrl = 'exp://192.168.100.15:8081/--/auth/callback';
    console.log("[SigninWithGoogle]before signinwithoauth");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    console.log("[SigninWithGoogle]after signinwithoauth");
    if (error) throw error;
    console.log("[SigninWithGoogle]after possible error trow signinwithoauth");
    console.log('OAuth URL:', data.url);
    console.log('Redirect URL:', redirectUrl);

    console.log("[SigninWithGoogle]before openAuthSessionAsync");
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    console.log('WebBrowser result:', result);
    console.log("[SigninWithGoogle]before result type if");
    if (result.type === 'success') {
      console.log("[SigninWithGoogle]inside result type if");
      const url = result.url;
      console.log('Success URL:', url);
      
      // Parse the URL to get the tokens
      const urlParts = url.split('#');
      if (urlParts.length > 1) {
        console.log("[SigninWithGoogle]inside result type if urlparts if");
        const hashParams = urlParts[1];
        const params = new URLSearchParams(hashParams);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        console.log('Access token found:', !!accessToken);
        console.log('Refresh token found:', !!refreshToken);
        console.log("[SigninWithGoogle]before entering if access token");
        if (accessToken && refreshToken) {
          console.log("[SigninWithGoogle]inside access token if");
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          console.log("[SigninWithGoogle]before session error");
          if (sessionError) throw sessionError;
          console.log("[SigninWithGoogle]after session error");
          console.log('[Supabase] here (Google):', currentSession);
          // Log the current session after setSession
          const { data: currentSession } = await supabase.auth.getSession();
          console.log('[Supabase] Current session after setSession (Google):', currentSession);
          return { data: sessionData, error: null };
        }
      }
    }
    
    return { data: null, error: new Error('Authentication was cancelled or failed') };
    
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { data: null, error };
  }
};