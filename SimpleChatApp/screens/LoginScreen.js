import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useState } from "react";
import { RFValue } from "react-native-responsive-fontsize";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { signInWithGoogle } from '../lib/googleAuth';
import { useSnackbar } from "../contexts/SnackbarContext";
import Snackbar, { SNACKBAR_TYPES } from '../components/Snackbar';

import {
  NAV_FORGOT_PASSWORD_SCREEN,
  NAV_CREATE_ACCOUNT_SCREEN,
  NAV_MAGIC_LINK_SCREEN,
} from "../constants/navigation";

import ScreenContainer from "../components/ScreenContainer";
import IconHeader from "../components/IconHeader";
import ScreenTitle from "../components/ScreenTitle";
import FormLabel from "../components/FormLabel";
import TextInput from "../components/TextInput";
import PasswordInput from "../components/PasswordInput";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import Divider from "../components/Divider";
import NavigationLink from "../components/NavigationLink";


function LoginScreen() {
  const navigation = useNavigation();
  const { showSuccess, showError } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      showSuccess("Logged in successfully!");
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await signInWithGoogle();
      
      if (error) throw error;
      
      showSuccess('Signed in with Google successfully!');
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <IconHeader image={require("../assets/images/luis.png")} />
      
      <ScreenTitle 
        title="Welcome Back"
        subtitle="Enter your credentials to access your account"
      />
      
      <FormLabel>Email</FormLabel>
      <TextInput
        placeholder="john@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      
      <View style={styles.passwordContainer}>
        <FormLabel>Password</FormLabel>
        <Pressable onPress={() => navigation.navigate(NAV_FORGOT_PASSWORD_SCREEN)}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </Pressable>
      </View>
      
      <PasswordInput
        showPassword={showPassword}
        onPress={() => setShowPassword(!showPassword)}
        secureTextEntry={!showPassword}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
      />
      
      <PrimaryButton
        iconName="log-in-outline"
        title={loading ? "Signing in..." : "Sign in"}
        onPress={handleLogin}
        loading={loading}
      />
      
      <SecondaryButton
        iconName="mail-outline"
        title="Send magic link instead"
        onPress={() => navigation.navigate(NAV_MAGIC_LINK_SCREEN)}
        style={styles.magicLinkButton}
      />
      
      <Divider text="OR CONTINUE WITH" />
      
      <SecondaryButton
        iconName="logo-google"
        title={loading ? 'Signing in...' : 'Sign in with Google'}
        onPress={handleGoogleSignIn}
        loading={loading}
      />
      
      <NavigationLink
        text="Don't have an account? "
        linkText="Sign up"
        onPress={() => navigation.navigate(NAV_CREATE_ACCOUNT_SCREEN)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  forgotPasswordText: {
    fontSize: RFValue(14),
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  magicLinkButton: {
    marginTop: RFValue(16),
  },
});

export default LoginScreen;
