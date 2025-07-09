import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useSnackbar } from "../contexts/SnackbarContext";

import { NAV_LOGIN_SCREEN, DEEPLINK_MAIN_APP } from "../constants/navigation";

import ScreenContainer from "../components/ScreenContainer";
import IconHeader from "../components/IconHeader";
import ScreenTitle from "../components/ScreenTitle";
import FormLabel from "../components/FormLabel";
import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import BackToLoginButton from "../components/BackToLoginButton";

function MagicLinkScreen() {
  const navigation = useNavigation();
  const { showSuccess, showError } = useSnackbar();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSendMagicLink = async () => {
    if (!email) {
      showError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: DEEPLINK_MAIN_APP,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
      navigation.goBack();
      showSuccess("Magic link sent! Check your email.");
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <IconHeader iconName="mail-outline" />
      
      <ScreenTitle 
        title="Send Magic Link"
        subtitle="Enter your email address and we'll send you a magic link to sign in"
      />
      
      <FormLabel>Email</FormLabel>
      <TextInput
        placeholder="john@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      
      <PrimaryButton
        iconName="mail-outline"
        title={
          loading
            ? "Sending..."
            : magicLinkSent
            ? "Check your email!"
            : "Send Magic Link"
        }
        onPress={handleSendMagicLink}
        loading={loading}
      />
      
      <BackToLoginButton 
        onPress={() => navigation.goBack()}
      />
    </ScreenContainer>
  );
}

export default MagicLinkScreen;
