import React, { useState, useRef, useEffect } from 'react';
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
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import Silk from '@/components/Silk';

interface WelcomeOverlayProps {
  visible: boolean;
  username: string;
  onComplete: () => void;
}

function WelcomeOverlay({ visible, username, onComplete }: WelcomeOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(checkScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(textSlide, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
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
      }, 2200);

      return () => clearTimeout(timeout);
    }
  }, [visible, onComplete, fadeAnim, scaleAnim, checkScale, textSlide]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.welcomeOverlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.welcomeContent, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[styles.welcomeCheckCircle, { transform: [{ scale: checkScale }] }]}>
          <Check color="#FFFFFF" size={36} strokeWidth={3} />
        </Animated.View>
        <Animated.Text 
          style={[
            styles.welcomeTitle, 
            { transform: [{ translateY: textSlide }], opacity: fadeAnim }
          ]}
        >
          Welcome back
        </Animated.Text>
        <Animated.Text 
          style={[
            styles.welcomeUsername,
            { transform: [{ translateY: textSlide }], opacity: fadeAnim }
          ]}
        >
          @{username}
        </Animated.Text>
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
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const passwordFieldOpacity = useRef(new Animated.Value(0)).current;
  const passwordFieldSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (loginOrEmail.trim().length > 0 && !showPasswordField) {
      setShowPasswordField(true);
      Animated.parallel([
        Animated.timing(passwordFieldOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(passwordFieldSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loginOrEmail, showPasswordField, passwordFieldOpacity, passwordFieldSlide]);

  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
        console.log('[Login] Setting welcome username:', username);
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
    console.log('[Login] Welcome complete, navigating...');
    setShowWelcome(false);
    router.replace('/(tabs)');
  };

  const handleCreateAccount = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/register');
  };

  const handleForgotPassword = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL('https://uservault.net/forgot-password');
  };

  return (
    <View style={styles.container}>
      <View style={styles.silkBackground}>
        <Silk 
          speed={2} 
          scale={1.2} 
          color="#4338CA" 
          noiseIntensity={1.2} 
          rotation={0.3}
          paused={keyboardVisible}
        />
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View 
            style={[
              styles.headerSection,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.uvLogo}>UV</Text>
            </View>
            
            <Text style={styles.title}>Login to USER VAULT</Text>
            <Text style={styles.subtitle}>We are glad to see you again!</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.formSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={handleCreateAccount}
              activeOpacity={0.7}
            >
              <Text style={styles.createAccountText}>Create account</Text>
            </TouchableOpacity>

            {errorMessage ? (
              <Animated.View 
                style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}
              >
                <Text style={styles.errorText}>{errorMessage}</Text>
              </Animated.View>
            ) : null}

            <View style={styles.inputGroup}>
              <Animated.View style={[styles.inputWrapper, { transform: [{ translateX: shakeAnim }] }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Login or Email"
                  placeholderTextColor="#6B7280"
                  value={loginOrEmail}
                  onChangeText={(text) => {
                    setLoginOrEmail(text);
                    setErrorMessage('');
                  }}
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
                  {
                    opacity: passwordFieldOpacity,
                    transform: [{ translateY: passwordFieldSlide }]
                  }
                ]}
              >
                <Animated.View style={[styles.inputWrapper, { transform: [{ translateX: shakeAnim }] }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#6B7280"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setErrorMessage('');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                  />
                </Animated.View>
              </Animated.View>
            )}

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonLoading,
                ]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Continue with Email</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
              <Text style={styles.forgotLink}>I forgot my password</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View 
            style={[
              styles.footer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.termsText}>
              By continuing, you agree to the terms of the main documents USER VAULT{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://uservault.net/terms')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
  },
  headerSection: {
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  uvLogo: {
    fontSize: 64,
    fontWeight: '800' as const,
    color: '#8B5CF6',
    letterSpacing: -2,
    textShadowColor: 'rgba(139, 92, 246, 0.9)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 22,
    textAlign: 'center',
  },
  formSection: {
    gap: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  inputGroup: {
    marginBottom: 4,
  },
  forgotButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400' as const,
  },
  inputWrapper: {
    backgroundColor: '#2D2D30',
    borderRadius: 12,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 20,
    fontSize: 15,
    color: '#FFFFFF',
  },

  loginButton: {
    height: 56,
    backgroundColor: '#1D9BF0',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#1D9BF0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonLoading: {
    opacity: 0.8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
  },

  createAccountButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 48,
    paddingTop: 0,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeCheckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeUsername: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: '#A1A1AA',
  },
  silkBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
