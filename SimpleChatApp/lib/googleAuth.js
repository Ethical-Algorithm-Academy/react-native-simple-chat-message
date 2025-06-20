import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { DEEPLINK_MAIN_APP } from '../constants/navigation';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

export const signInWithGoogle = async () => {
  try {
    // Try different redirect URL formats
    const redirectUrl = DEEPLINK_MAIN_APP;
    
    // Alternative: Use the development URL if needed
    // const redirectUrl = 'exp://192.168.100.15:8081/--/auth/callback';

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

    if (error) throw error;

    console.log('OAuth URL:', data.url);
    console.log('Redirect URL:', redirectUrl);

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    console.log('WebBrowser result:', result);

    if (result.type === 'success') {
      const url = result.url;
      console.log('Success URL:', url);
      
      // Parse the URL to get the tokens
      const urlParts = url.split('#');
      if (urlParts.length > 1) {
        const hashParams = urlParts[1];
        const params = new URLSearchParams(hashParams);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        console.log('Access token found:', !!accessToken);
        console.log('Refresh token found:', !!refreshToken);
        
        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) throw sessionError;
          
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