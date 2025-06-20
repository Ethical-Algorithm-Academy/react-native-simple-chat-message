import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
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

function CreateAccountScreen() {
  const navigation = useNavigation();
  const { showSuccess, showError } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      showSuccess("Account created successfully! Please check your email for verification.");
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const { data, error } = await signInWithGoogle();
      
      if (error) throw error;
      
      showSuccess('Account created with Google successfully!');
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
      />
      
      <FormLabel>Email</FormLabel>
      <TextInput
        placeholder="john@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <FormLabel>Password</FormLabel>
      <PasswordInput
        showPassword={showPassword}
        onPress={() => setShowPassword(!showPassword)}
        secureTextEntry={!showPassword}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
      />

      <FormLabel>Confirm Password</FormLabel>
      <PasswordInput
        showPassword={showConfirmPassword}
        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        secureTextEntry={!showConfirmPassword}
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <PrimaryButton
        iconName="person-add-outline"
        title={loading ? "Creating..." : "Create Account"}
        onPress={handleCreateAccount}
        loading={loading}
      />
      
      <Divider text="OR CONTINUE WITH" />
      
      <SecondaryButton
        iconName="logo-google"
        title={loading ? 'Creating account...' : 'Sign up with Google'}
        onPress={handleGoogleSignUp}
        loading={loading}
      />
      
      <NavigationLink
        text="Already have an account? "
        linkText="Sign in"
        onPress={() => navigation.navigate(NAV_LOGIN_SCREEN)}
      />
    </ScreenContainer>
  );
}

export default CreateAccountScreen;
