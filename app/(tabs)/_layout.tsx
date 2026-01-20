import { Tabs, useRouter } from "expo-router";
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react-native";
import React, { useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Modal, Image, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";

import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

function AnimatedTabIcon({ 
  IconComponent, 
  color, 
  size, 
  focused 
}: { 
  IconComponent: any; 
  color: string; 
  size: number; 
  focused: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.7,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View style={{ 
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim,
    }}>
      <IconComponent color={color} size={size} />
    </Animated.View>
  );
}

function CreateButton({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[
        styles.plusButtonGlow,
        { opacity: glowAnim }
      ]} />
      <Animated.View style={[
        styles.plusButton,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <Plus color="#FFF" size={26} strokeWidth={2.5} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function AnimatedMenuItem({ 
  title, 
  onPress, 
  delay,
  isCancel = false 
}: { 
  title: string; 
  onPress: () => void; 
  delay: number;
  isCancel?: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
    }}>
      <TouchableOpacity
        style={[styles.menuItem, isCancel && styles.cancelItem]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={[styles.menuItemText, isCancel && styles.cancelText]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showCreateMenu) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      overlayOpacity.setValue(0);
    }
  }, [showCreateMenu]);

  const handleCreateOption = (type: 'post' | 'photo' | 'story') => {
    setShowCreateMenu(false);
    if (type === 'story') {
      router.push('/create-story');
    } else {
      router.push('/create-post');
    }
  };

  return (
    <>
      <Modal
        visible={showCreateMenu}
        transparent
        animationType="none"
        onRequestClose={() => setShowCreateMenu(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowCreateMenu(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create</Text>
            
            <AnimatedMenuItem 
              title="Text Post" 
              onPress={() => handleCreateOption('post')} 
              delay={50}
            />
            <AnimatedMenuItem 
              title="Photo Post" 
              onPress={() => handleCreateOption('photo')} 
              delay={100}
            />
            <AnimatedMenuItem 
              title="Story" 
              onPress={() => handleCreateOption('story')} 
              delay={150}
            />
            <AnimatedMenuItem 
              title="Cancel" 
              onPress={() => setShowCreateMenu(false)} 
              delay={200}
              isCancel
            />
          </View>
        </Animated.View>
      </Modal>

    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.dark.text,
        tabBarInactiveTintColor: colors.dark.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark.surface,
          borderTopColor: colors.dark.border,
          borderTopWidth: 0.5,
          height: 85,
          paddingBottom: 28,
          paddingTop: 12,
          position: 'absolute',
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              IconComponent={Home} 
              color={color} 
              size={size} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              IconComponent={Compass} 
              color={color} 
              size={size} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarButton: () => (
            <View style={styles.createButtonWrapper}>
              <CreateButton onPress={() => setShowCreateMenu(true)} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon 
              IconComponent={MessageCircle} 
              color={color} 
              size={size} 
              focused={focused} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => {
            const avatarUrl = currentUser?.avatar || `https://i.pravatar.cc/200?u=${currentUser?.username || 'user'}`;
            return (
              <View style={[styles.avatarIcon, focused && styles.avatarIconActive]}>
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={styles.avatarImage}
                />
              </View>
            );
          },
        }}
      />
    </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  createButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  plusButtonGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.dark.accent,
    top: -5,
    left: -5,
  },
  plusButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.dark.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.dark.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.dark.text,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginVertical: 4,
    backgroundColor: colors.dark.surface,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.dark.text,
    textAlign: 'center',
  },
  cancelItem: {
    marginTop: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  cancelText: {
    color: colors.dark.textSecondary,
  },
  avatarIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarIconActive: {
    borderColor: colors.dark.accent,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
