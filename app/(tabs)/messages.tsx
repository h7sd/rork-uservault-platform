import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import colors from '@/constants/colors';
import { useMessengerChats } from '@/hooks/useApi';
import type { Chat } from '@/types';

function ChatItem({ chat }: { chat: Chat }) {
  const router = useRouter();
  
  const chatInfo = chat.chat_info;
  
  if (!chatInfo) {
    console.log('[Messages] No chat_info for chat:', chat);
    return null;
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
  };
  
  const isGroupChat = chatInfo.is_group || chat.type === 'group' || (chatInfo.members_count && chatInfo.members_count > 2);
  
  const otherUserAvatar = chatInfo.avatar_url || 'https://i.pravatar.cc/150';
  const fullAvatar = otherUserAvatar?.startsWith('http') 
    ? otherUserAvatar 
    : `https://uservault.net${otherUserAvatar?.startsWith('/') ? '' : '/'}${otherUserAvatar}`;
  
  const handlePress = () => {
    const chatIdValue = chat.chat_id || chat.id;
    console.log('[Messages] Opening chat:', chatIdValue, 'isGroup:', isGroupChat);
    
    if (isGroupChat) {
      router.push(`/group-chat/${chatIdValue}` as any);
    } else if (chatInfo.username) {
      router.push(`/chat/${chatInfo.username}`);
    } else if (chatInfo.id) {
      router.push(`/chat/${chatInfo.id}`);
    } else {
      router.push(`/group-chat/${chatIdValue}` as any);
    }
  };

  const lastMessage = chat.last_message || chat.messages?.[0];
  const displayName = isGroupChat 
    ? (chatInfo.name || `Group (${chatInfo.members_count || 0})`) 
    : (chatInfo.name || chatInfo.username || 'User');
  
  return (
    <TouchableOpacity style={styles.chatItem} onPress={handlePress}>
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: fullAvatar }} 
          style={styles.chatAvatar} 
        />
        {isGroupChat && (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{chatInfo.members_count || '+'}</Text>
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{displayName}</Text>
          {lastMessage && (
            <Text style={styles.chatTime}>
              {formatTime(lastMessage.created_at)}
            </Text>
          )}
        </View>
        {lastMessage && (
          <Text style={styles.chatMessage} numberOfLines={1}>
            {lastMessage.content}
          </Text>
        )}
      </View>
      {chat.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{chat.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const { data: chatsData, isLoading, refetch } = useMessengerChats();

  const chats = chatsData?.data || [];
  
  console.log('[Messages] === CHATS DEBUG ===');
  console.log('[Messages] Full chatsData:', JSON.stringify(chatsData));
  console.log('[Messages] Chats array length:', chats.length);
  console.log('[Messages] All chats:', chats.map((c: any, i: number) => ({
    index: i,
    id: c.id || c.chat_id,
    type: c.type,
    chat_info: c.chat_info ? {
      id: c.chat_info.id,
      name: c.chat_info.name,
      username: c.chat_info.username,
      is_group: c.chat_info.is_group
    } : null,
    last_message: c.last_message?.content?.slice(0, 30)
  })));
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log('[Messages] Auto-refetching chats');
      refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity>
          <Search color={colors.dark.text} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={() => refetch()}
            tintColor={colors.dark.accent}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.dark.text} />
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle color={colors.dark.textSecondary} size={60} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation with someone</Text>
          </View>
        ) : (
          chats.map((chat: Chat, index: number) => (
            <ChatItem key={chat.id || `chat-${index}`} chat={chat} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.dark.text,
  },
  content: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.dark.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.dark.background,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.dark.background,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.dark.text,
  },
  chatTime: {
    fontSize: 13,
    color: colors.dark.textSecondary,
  },
  chatMessage: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    lineHeight: 18,
  },
  unreadBadge: {
    backgroundColor: colors.dark.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.dark.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.dark.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginTop: 8,
  },
});
