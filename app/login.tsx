import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  ScrollView,
  Modal,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/contexts/AuthContext';

interface WelcomeOverlayProps {
  visible: boolean;
  username: string;
  onComplete: () => void;
}

function WelcomeOverlay({ visible, username, onComplete }: WelcomeOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const timeout = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onComplete());
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [visible, onComplete, fadeAnim, scaleAnim, checkScale]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.welcomeOverlay, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#0a0612', '#100a1a', '#0a0612']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.welcomeContent, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View
          style={[
            styles.welcomeCheckCircle,
            { transform: [{ scale: checkScale }] },
          ]}
        >
          <Check color="#FFFFFF" size={28} strokeWidth={2.5} />
        </Animated.View>
        <Text style={styles.welcomeTitle}>Welcome back</Text>
        <Text style={styles.welcomeUsername}>@{username}</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const [loginOrEmail, setLoginOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [welcomeUsername, setWelcomeUsername] = useState<string>('');
  const [showPasswordField, setShowPasswordField] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [inputFocused, setInputFocused] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const passwordFieldOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 10,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
          toValue: 0,
          friction: 10,
          tension: 45,
          delay: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, logoOpacity, logoScale, formSlide]);

  useEffect(() => {
    if (loginOrEmail.trim().length > 0 && !showPasswordField) {
      setShowPasswordField(true);
      Animated.timing(passwordFieldOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [loginOrEmail, showPasswordField, passwordFieldOpacity]);

  const shakeInput = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [shakeAnim]);

  const animateButtonPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonScale]);

  const handleLogin = async () => {
    if (!loginOrEmail.trim() || !password.trim()) {
      shakeInput();
      setErrorMessage('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    animateButtonPress();

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      console.log('[Login] Attempting login...');
      const result = await login(loginOrEmail.trim(), password);

      if (result.success) {
        console.log('[Login] Success! User:', result.user);
        const username = result.user?.username || loginOrEmail.split('@')[0];
        setWelcomeUsername(username);
        setShowWelcome(true);
      } else {
        console.error('[Login] Failed:', result.error);
        shakeInput();
        setErrorMessage(result.error || 'Login failed');
        Alert.alert('Login failed', result.error || 'Please check your credentials.');
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      shakeInput();
      const message = error instanceof Error ? error.message : 'An error occurred';
      setErrorMessage(message);
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    router.replace('/(tabs)');
  };

  const handleCreateAccount = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowRegisterModal(true);
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://uservault.net/register');
    setShowRegisterModal(false);
  };

  const handleForgotPassword = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL('https://uservault.net/forgot-password');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#12082a', '#1a0a2e', '#0d061a']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradientBackground}
      />
      <View style={styles.glowOrb} />
      <View style={styles.glowOrbSecondary} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View style={[styles.headerSection, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoGlow}>
              <Text style={styles.uvLogo}>UV</Text>
            </View>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Text style={styles.title}>USERVAULT</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={handleCreateAccount}
              activeOpacity={0.7}
            >
              <Text style={styles.createAccountText}>Create new account</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in</Text>
              <View style={styles.dividerLine} />
            </View>

            {errorMessage ? (
              <Animated.View
                style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}
              >
                <Text style={styles.errorText}>{errorMessage}</Text>
              </Animated.View>
            ) : null}

            <View style={styles.inputGroup}>
              <Animated.View
                style={[
                  styles.inputWrapper,
                  { transform: [{ translateX: shakeAnim }] },
                  inputFocused === 'email' && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Email or username"
                  placeholderTextColor="#4b5563"
                  value={loginOrEmail}
                  onChangeText={(text) => {
                    setLoginOrEmail(text);
                    setErrorMessage('');
                  }}
                  onFocus={() => setInputFocused('email')}
                  onBlur={() => setInputFocused(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                  returnKeyType="next"
                />
              </Animated.View>
            </View>

            {showPasswordField && (
              <Animated.View
                style={[
                  styles.inputGroup,
                  { opacity: passwordFieldOpacity },
                ]}
              >
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    { transform: [{ translateX: shakeAnim }] },
                    inputFocused === 'password' && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Password"
                    placeholderTextColor="#4b5563"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setErrorMessage('');
                    }}
                    onFocus={() => setInputFocused('password')}
                    onBlur={() => setInputFocused(null)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#6b7280" />
                    ) : (
                      <Eye size={18} color="#6b7280" />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            )}

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#7c3aed', '#6d28d9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://uservault.net/terms')}
              >
                Terms of Service
              </Text>
              {' and '}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://uservault.net/privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>

      <WelcomeOverlay
        visible={showWelcome}
        username={welcomeUsername}
        onComplete={handleWelcomeComplete}
      />

      <Modal
        visible={showRegisterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegisterModal(false)}
      >
        <View style={styles.modalOverlay}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="dark" style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create Account</Text>
                <Text style={styles.modalText}>
                  To create an account, please visit our website and complete registration:
                </Text>
                <View style={styles.modalSteps}>
                  <View style={styles.modalStepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.modalStep}>Visit uservault.net/register</Text>
                  </View>
                  <View style={styles.modalStepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.modalStep}>Create your account</Text>
                  </View>
                  <View style={styles.modalStepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.modalStep}>Verify your email</Text>
                  </View>
                  <View style={styles.modalStepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>4</Text>
                    </View>
                    <Text style={styles.modalStep}>Return here to sign in</Text>
                  </View>
                </View>
                <View style={styles.modalComingSoon}>
                  <Text style={styles.modalComingSoonText}>
                    In-app registration coming soon!
                  </Text>
                </View>
                <Text style={styles.modalTeamSignature}>— Uservault team</Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleOpenWebsite}>
                  <LinearGradient
                    colors={['#7c3aed', '#6d28d9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Open Website</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowRegisterModal(false)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          ) : (
            <View style={styles.modalContentAndroid}>
              <Text style={styles.modalTitle}>Create Account</Text>
              <Text style={styles.modalText}>
                To create an account, please visit our website and complete registration:
              </Text>
              <View style={styles.modalSteps}>
                <View style={styles.modalStepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.modalStep}>Visit uservault.net/register</Text>
                </View>
                <View style={styles.modalStepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.modalStep}>Create your account</Text>
                </View>
                <View style={styles.modalStepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.modalStep}>Verify your email</Text>
                </View>
                <View style={styles.modalStepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={styles.modalStep}>Return here to sign in</Text>
                </View>
              </View>
              <View style={styles.modalComingSoon}>
                <Text style={styles.modalComingSoonText}>In-app registration coming soon!</Text>
              </View>
              <Text style={styles.modalTeamSignature}>— Uservault team</Text>
              <TouchableOpacity style={styles.modalButton} onPress={handleOpenWebsite}>
                <LinearGradient
                  colors={['#7c3aed', '#6d28d9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Open Website</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowRegisterModal(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080510',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  glowOrbSecondary: {
    position: 'absolute',
    bottom: -50,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 140,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logoGlow: {
    marginBottom: 20,
  },
  uvLogo: {
    fontSize: 80,
    fontWeight: '700' as const,
    color: '#a78bfa',
    letterSpacing: 8,
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  title: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#9ca3af',
    letterSpacing: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  formSection: {
    gap: 12,
  },
  createAccountButton: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  createAccountText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#a78bfa',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dividerText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500' as const,
    marginHorizontal: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputWrapperFocused: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  input: {
    flex: 1,
    height: 54,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#f3f4f6',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    padding: 6,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  loginButtonGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  forgotButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#8b5cf6',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  termsText: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#8b5cf6',
  },
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#f3f4f6',
    marginBottom: 6,
  },
  welcomeUsername: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#a78bfa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBlur: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
  },
  modalContent: {
    padding: 24,
  },
  modalContentAndroid: {
    backgroundColor: '#0f0a1a',
    borderRadius: 14,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#f3f4f6',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  modalSteps: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  modalStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#a78bfa',
  },
  modalStep: {
    fontSize: 13,
    color: '#9ca3af',
    flex: 1,
  },
  modalComingSoon: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  modalComingSoonText: {
    fontSize: 12,
    color: '#8b5cf6',
    textAlign: 'center',
  },
  modalTeamSignature: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  modalButtonGradient: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#fff',
  },
  modalCloseButton: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    color: '#6b7280',
  },
});
