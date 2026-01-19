import { Tabs, useRouter } from "expo-router";
import { Home, Compass, Plus, MessageCircle } from "lucide-react-native";
import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Modal, Image } from "react-native";

import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);

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
        animationType="fade"
        onRequestClose={() => setShowCreateMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateMenu(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleCreateOption('post')}
            >
              <Text style={styles.menuItemText}>Text Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleCreateOption('photo')}
            >
              <Text style={styles.menuItemText}>Photo Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleCreateOption('story')}
            >
              <Text style={styles.menuItemText}>Story</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              onPress={() => setShowCreateMenu(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.dark.accent,
        tabBarInactiveTintColor: colors.dark.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark.surface,
          borderTopColor: colors.dark.border,
          borderTopWidth: 1,
          height: 75,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.plusButton}>
              <Plus color={colors.dark.background} size={size} strokeWidth={3} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            setShowCreateMenu(true);
          },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: colors.dark.card,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.dark.text,
    textAlign: 'center',
  },
  cancelItem: {
    marginTop: 12,
    backgroundColor: colors.dark.background,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.dark.error,
    textAlign: 'center',
  },
  avatarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
