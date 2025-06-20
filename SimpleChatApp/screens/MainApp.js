import { View, Text, StyleSheet, Pressable } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import { useSnackbar } from "../contexts/SnackbarContext";
import { useNavigation } from "@react-navigation/native";

import { NAV_MFA_SETUP_SCREEN } from "../constants/navigation";

function MainApp() {
  const [user, setUser] = useState(null);
  const [hasMFA, setHasMFA] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  
  const navigation = useNavigation();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    checkUserAndMFA();
  }, []);

  const checkUserAndMFA = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Only check MFA if user exists
      if (currentUser) {
        // Check MFA factors
        const { data: factors, error } = await supabase.auth.mfa.listFactors();
        
        if (error) {
          console.error('Error checking MFA factors:', error);
          return;
        }

        // Check if user has verified TOTP factors
        const hasVerifiedTOTP = factors.totp?.some(factor => factor.status === 'verified');
        setHasMFA(hasVerifiedTOTP);
      } else {
        // User is not authenticated, clear MFA state
        setHasMFA(false);
      }
    } catch (error) {
      console.error('Error checking user and MFA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
      showSnackbar('Signed out successfully', 'success');
    } catch (error) {
      console.error('Error signing out:', error);
      showSnackbar('Failed to sign out', 'error');
    } finally {
      setSigningOut(false);
    }
  };

  const handleMFASetup = () => {
    navigation.navigate(NAV_MFA_SETUP_SCREEN);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={RFValue(60)} color="rgb(0, 0, 0)" />
        <Text style={styles.welcomeText}>Welcome!</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.mfaSection}>
          <View style={styles.mfaHeader}>
            <Ionicons 
              name={hasMFA ? "shield-checkmark" : "shield-outline"} 
              size={RFValue(24)} 
              color={hasMFA ? "rgb(34, 197, 94)" : "rgb(156, 163, 175)"} 
            />
            <Text style={styles.mfaTitle}>Two-Factor Authentication</Text>
          </View>
          
          <Text style={styles.mfaStatus}>
            {hasMFA ? "Enabled" : "Not enabled"}
          </Text>
          
          <Pressable
            style={[styles.mfaButton, hasMFA && styles.mfaButtonDisabled]}
            onPress={hasMFA ? null : handleMFASetup}
            disabled={hasMFA}
          >
            <Text style={[styles.mfaButtonText, hasMFA && styles.mfaButtonTextDisabled]}>
              {hasMFA ? "MFA Already Enabled" : "Set Up MFA"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.signOutButton, signingOut && styles.signOutButtonDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          <Ionicons name="log-out-outline" size={RFValue(20)} color="rgb(255, 255, 255)" />
          <Text style={styles.signOutButtonText}>
            {signingOut ? "Signing Out..." : "Sign Out"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(255, 255, 255)",
    padding: RFValue(20),
  },
  header: {
    alignItems: "center",
    marginTop: RFValue(60),
    marginBottom: RFValue(40),
  },
  welcomeText: {
    fontSize: RFValue(24),
    fontWeight: "bold",
    color: "rgb(0, 0, 0)",
    marginTop: RFValue(16),
  },
  emailText: {
    fontSize: RFValue(16),
    color: "rgb(107, 114, 128)",
    marginTop: RFValue(8),
  },
  content: {
    flex: 1,
  },
  mfaSection: {
    backgroundColor: "rgb(248, 248, 248)",
    borderRadius: RFValue(12),
    padding: RFValue(20),
    marginBottom: RFValue(24),
  },
  mfaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFValue(12),
  },
  mfaTitle: {
    fontSize: RFValue(18),
    fontWeight: "600",
    color: "rgb(0, 0, 0)",
    marginLeft: RFValue(12),
  },
  mfaStatus: {
    fontSize: RFValue(14),
    color: "rgb(107, 114, 128)",
    marginBottom: RFValue(16),
  },
  mfaButton: {
    backgroundColor: "rgb(59, 130, 246)",
    borderRadius: RFValue(8),
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(16),
    alignItems: "center",
  },
  mfaButtonDisabled: {
    backgroundColor: "rgb(156, 163, 175)",
  },
  mfaButtonText: {
    color: "rgb(255, 255, 255)",
    fontSize: RFValue(16),
    fontWeight: "600",
  },
  mfaButtonTextDisabled: {
    color: "rgb(229, 231, 235)",
  },
  signOutButton: {
    backgroundColor: "rgb(239, 68, 68)",
    borderRadius: RFValue(8),
    paddingVertical: RFValue(12),
    paddingHorizontal: RFValue(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signOutButtonDisabled: {
    backgroundColor: "rgb(156, 163, 175)",
  },
  signOutButtonText: {
    color: "rgb(255, 255, 255)",
    fontSize: RFValue(16),
    fontWeight: "600",
    marginLeft: RFValue(8),
  },
  loadingText: {
    fontSize: RFValue(18),
    color: "rgb(107, 114, 128)",
    textAlign: "center",
    marginTop: RFValue(100),
  },
});

export default MainApp;
