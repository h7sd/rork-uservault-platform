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
  Dimensions,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingOrbProps {
  delay: number;
  startX: number;
  startY: number;
  size: number;
  color: string;
}

function FloatingOrb({ delay, startX, startY, size, color }: FloatingOrbProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 1000,
          delay,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: -40,
                duration: 4000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: 20 - Math.random() * 40,
                duration: 3000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 1.2,
                duration: 4000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: 40,
                duration: 4000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: -20 + Math.random() * 40,
                duration: 3000 + Math.random() * 2000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 0.8,
                duration: 4000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
          ])
        ),
      ]).start();
    };
    startAnimation();
  }, [delay, opacity, translateY, translateX, scale]);

  return (
    <Animated.View
      style={[
        styles.floatingOrb,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
}

interface ParticleProps {
  delay: number;
}

function Particle({ delay }: ParticleProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const translateX = useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_HEIGHT + 50);
      translateX.setValue(Math.random() * SCREEN_WIDTH);
      opacity.setValue(0);
      scale.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -50,
            duration: 8000 + Math.random() * 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.delay(5000),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.spring(scale, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, [delay, translateY, translateX, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
}

interface AnimatedTextProps {
  text: string;
  style: object;
  delay?: number;
}

function AnimatedText({ text, style, delay = 0 }: AnimatedTextProps) {
  const characters = text.split('');
  const animatedValues = useRef(characters.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: delay + index * 40,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    );
    Animated.stagger(30, animations).start();
  }, [animatedValues, delay]);

  return (
    <View style={styles.animatedTextContainer}>
      {characters.map((char, index) => (
        <Animated.Text
          key={index}
          style={[
            style,
            {
              opacity: animatedValues[index],
              transform: [
                {
                  translateY: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: animatedValues[index].interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.1, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {char === ' ' ? '\u00A0' : char}
        </Animated.Text>
      ))}
    </View>
  );
}

interface WelcomeOverlayProps {
  visible: boolean;
  username: string;
  onComplete: () => void;
}

function WelcomeOverlay({ visible, username, onComplete }: WelcomeOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(1)).current;

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
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(checkRotate, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 2,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 800,
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
          duration: 300,
          useNativeDriver: true,
        }).start(() => onComplete());
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [visible, onComplete, fadeAnim, scaleAnim, checkScale, checkRotate, ringScale, ringOpacity]);

  if (!visible) return null;

  const rotation = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.welcomeOverlay, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#1a0a2e', '#0d0619', '#1a0a2e']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.welcomeContent, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.checkContainer}>
          <Animated.View
            style={[
              styles.checkRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.welcomeCheckCircle,
              { transform: [{ scale: checkScale }, { rotate: rotation }] },
            ]}
          >
            <Check color="#FFFFFF" size={36} strokeWidth={3} />
          </Animated.View>
        </View>
        <AnimatedText text="Welcome back" style={styles.welcomeTitle} delay={400} />
        <Animated.Text style={styles.welcomeUsername}>@{username}</Animated.Text>
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
  const slideAnim = useRef(new Animated.Value(60)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;
  const passwordFieldHeight = useRef(new Animated.Value(0)).current;
  const passwordFieldOpacity = useRef(new Animated.Value(0)).current;
  const inputGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, logoScale, logoRotate, buttonGlow]);

  useEffect(() => {
    if (loginOrEmail.trim().length > 0 && !showPasswordField) {
      setShowPasswordField(true);
      Animated.parallel([
        Animated.spring(passwordFieldHeight, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(passwordFieldOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loginOrEmail, showPasswordField, passwordFieldHeight, passwordFieldOpacity]);

  useEffect(() => {
    Animated.timing(inputGlow, {
      toValue: inputFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [inputFocused, inputGlow]);

  const shakeInput = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [shakeAnim]);

  const animateButtonPress = useCallback(() => {
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.92,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 4,
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

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  const glowOpacity = buttonGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0a2e', '#16082a', '#0d0619', '#1a0a2e']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradientBackground}
      />

      <FloatingOrb delay={0} startX={-50} startY={100} size={200} color="rgba(139, 92, 246, 0.2)" />
      <FloatingOrb delay={500} startX={SCREEN_WIDTH - 100} startY={200} size={180} color="rgba(59, 130, 246, 0.18)" />
      <FloatingOrb delay={1000} startX={50} startY={SCREEN_HEIGHT - 300} size={150} color="rgba(168, 85, 247, 0.2)" />
      <FloatingOrb delay={1500} startX={SCREEN_WIDTH - 150} startY={SCREEN_HEIGHT - 400} size={120} color="rgba(99, 102, 241, 0.15)" />

      {[...Array(12)].map((_, i) => (
        <Particle key={i} delay={i * 600} />
      ))}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View style={styles.headerSection}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: logoScale }, { rotate: logoRotation }],
                },
              ]}
            >
              <LinearGradient
                colors={['#8b5cf6', '#6366f1', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={styles.uvLogo}>UV</Text>
              </LinearGradient>
              <View style={styles.logoGlow} />
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <AnimatedText text="USER VAULT" style={styles.title} delay={600} />
              <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.15)', 'rgba(99, 102, 241, 0.08)']}
                style={styles.createAccountGradient}
              >
                <Text style={styles.createAccountText}>Create new account</Text>
              </LinearGradient>
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
                  placeholderTextColor="#4a5568"
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
                  {
                    opacity: passwordFieldOpacity,
                    transform: [
                      {
                        translateY: passwordFieldHeight.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  },
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
                    placeholderTextColor="#4a5568"
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
                      <EyeOff size={20} color="#4a5568" />
                    ) : (
                      <Eye size={20} color="#4a5568" />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            )}

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                <Animated.View style={[styles.buttonGlow, { opacity: glowOpacity }]} />
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
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
            <BlurView intensity={40} tint="dark" style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.15)', 'transparent']}
                  style={styles.modalHeaderGlow}
                />
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
                    colors={['#8b5cf6', '#6366f1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
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
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.15)', 'transparent']}
                style={styles.modalHeaderGlow}
              />
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
                  colors={['#8b5cf6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
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
    backgroundColor: '#1a0a2e',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingOrb: {
    position: 'absolute',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 100,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uvLogo: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: '#000',
    letterSpacing: -2,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    top: -20,
    left: -20,
    zIndex: -1,
  },
  animatedTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
  },
  formSection: {
    gap: 16,
  },
  createAccountButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  createAccountGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 10,
  },
  
  createAccountText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#4a5568',
    fontSize: 13,
    marginHorizontal: 16,
    fontWeight: '500' as const,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperFocused: {
    borderColor: 'rgba(139, 92, 246, 0.5)',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  input: {
    flex: 1,
    height: 58,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
  },
  passwordInput: {
    paddingRight: 56,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 26,
    zIndex: -1,
  },
  loginButtonGradient: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  forgotButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
  },
  termsText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#a78bfa',
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
  checkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  checkRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#8b5cf6',
  },
  welcomeCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  welcomeUsername: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 380,
  },
  modalContent: {
    padding: 28,
  },
  modalContentAndroid: {
    backgroundColor: '#1a0a2e',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  modalHeaderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalSteps: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  modalStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#a78bfa',
  },
  modalStep: {
    fontSize: 14,
    color: '#e2e8f0',
    flex: 1,
  },
  modalComingSoon: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  modalComingSoonText: {
    fontSize: 13,
    color: '#a78bfa',
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  modalTeamSignature: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic' as const,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  modalButtonGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalCloseButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500' as const,
  },
});
