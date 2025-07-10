import { useNavigation } from "@react-navigation/native";
import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { signInWithGoogle } from '../lib/googleAuth';
import { useSnackbar } from "../contexts/SnackbarContext";

import { NAV_LOGIN_SCREEN } from "../constants/navigation";

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
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native';

function CreateAccountScreen() {
  const navigation = useNavigation();
  const { showSuccess, showError } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const handleCreateAccount = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      showError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: fullName,
          },
          emailRedirectTo: 'simplechatapp://confirm-account',
        },
      });

      if (error) throw error;

      showSuccess("Account created successfully! Please check your email for verification.");
      navigation.navigate(NAV_LOGIN_SCREEN);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await signInWithGoogle();
      
      if (error) throw error;
      
      showSuccess('Account created with Google successfully!');
    } catch (error) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenContainer>
          <IconHeader iconName="person-add-outline" />
          
          <ScreenTitle 
            title="Create an Account"
            subtitle="Enter your details below to create an account"
          />
          
          <FormLabel>Full Name</FormLabel>
          <TextInput
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          
          <FormLabel>Email</FormLabel>
          <TextInput
            ref={emailInputRef}
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
          />

          <FormLabel>Password</FormLabel>
          <PasswordInput
            ref={passwordInputRef}
            showPassword={showPassword}
            onPress={() => setShowPassword(!showPassword)}
            secureTextEntry={!showPassword}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            blurOnSubmit={false}
          />

          <FormLabel>Confirm Password</FormLabel>
          <PasswordInput
            ref={confirmPasswordInputRef}
            showPassword={showConfirmPassword}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            secureTextEntry={!showConfirmPassword}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleCreateAccount}
          />

          <PrimaryButton
            iconName="person-add-outline"
            title={isLoading ? "Creating..." : "Create Account"}
            onPress={handleCreateAccount}
            isLoading={isLoading}
          />
          
          <Divider text="OR CONTINUE WITH" />
          
          <SecondaryButton
            iconName="logo-google"
            title={isLoading ? 'Creating account...' : 'Sign up with Google'}
            onPress={handleGoogleSignUp}
            isLoading={isLoading}
          />
          
          <NavigationLink
            text="Already have an account? "
            linkText="Sign in"
            onPress={() => navigation.goBack()}
          />
        </ScreenContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default CreateAccountScreen;
