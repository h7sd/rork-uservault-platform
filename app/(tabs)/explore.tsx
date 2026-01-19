import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  TextInput,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Heart, Users, BadgeCheck, MessageCircle, Share2, MoreHorizontal, Eye, X, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import colors from '@/constants/colors';
import { useExplorePosts, useSearchPeople, useFollowUser, useLikePost } from '@/hooks/useApi';
import { Video, ResizeMode } from 'expo-av';
import type { Post, User } from '@/types';
import { FREQUENTLY_USED_EMOJIS, EMOJI_CATEGORIES, getEmojiByUnified, type Emoji } from '@/constants/emojis';

const { width } = Dimensions.get('window');

function PostItem({ post }: { post: Post }) {
  const [showReactionPicker, setShowReactionPicker] = useState<boolean>(false);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState<boolean>(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fullscreenVideoRef = useRef<Video>(null);
  const likeMutation = useLikePost();
  const router = useRouter();

  const user = post.relations.user;
  const username = user.username || 'unknown';
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.first_name || user.last_name || username;
  let avatar = user.avatar_url || `https://i.pravatar.cc/150?u=${post.id}`;
  if (avatar && !avatar.startsWith('http://') && !avatar.startsWith('https://')) {
    avatar = `https://uservault.net${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  }

  const reactions = post.relations.reactions || [];
  
  const reactionCounts = reactions.reduce((acc: Record<string, { emoji: string; count: number }>, reaction: any, index: number) => {
    const unifiedId = reaction.unified_id || `fallback-${index}`;
    const emojiData = getEmojiByUnified(unifiedId);
    const emojiChar = emojiData?.emoji || '❤️';
    
    if (!acc[unifiedId]) {
      acc[unifiedId] = { emoji: emojiChar, count: 0 };
    }
    acc[unifiedId].count += 1;
    return acc;
  }, {} as Record<string, { emoji: string; count: number }>);

  const handleReactionPress = () => {
    setShowReactionPicker(true);
  };

  const handleSelectReaction = (emojiData: Emoji) => {
    setShowReactionPicker(false);
    likeMutation.mutate({ postId: post.id, unifiedId: emojiData.unified });
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const postMedia = post.relations.media && post.relations.media.length > 0 ? post.relations.media[0] : null;
  const mediaType = postMedia?.type?.toUpperCase();
  const isVideo = mediaType === 'VIDEO';
  
  const normalizeUrl = (url: any): string | null => {
    if (!url || typeof url !== 'string' || url.length === 0) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://uservault.net${url.startsWith('/') ? '' : '/'}${url}`;
  };
  
  let mediaUrl = normalizeUrl(postMedia?.source_url);
  let thumbnailUrl = normalizeUrl(postMedia?.thumbnail_url);
  
  const postImage = isVideo ? (thumbnailUrl || mediaUrl) : mediaUrl;
  const videoUrl = isVideo ? mediaUrl : null;
  
  console.log('[Explore] Post:', post.id, 'mediaType:', mediaType, 'isVideo:', isVideo);
  console.log('[Explore] Post:', post.id, 'mediaUrl:', mediaUrl);
  console.log('[Explore] Post:', post.id, 'thumbnailUrl:', thumbnailUrl);
  console.log('[Explore] Post:', post.id, 'finalImage:', postImage, 'finalVideo:', videoUrl);

  const handleVideoPress = React.useCallback(() => {
    setShowFullscreenVideo(true);
  }, []);

  const handleCloseFullscreen = React.useCallback(async () => {
    if (fullscreenVideoRef.current) {
      await fullscreenVideoRef.current.pauseAsync();
    }
    setShowFullscreenVideo(false);
  }, []);

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.postUser} onPress={() => {
          console.log('[Explore] Navigate to user profile:', user.username || user.id);
          router.push(`/user/${user.username || user.id}`);
        }}>
          <Image 
            source={{ uri: avatar }} 
            style={styles.postAvatar} 
          />
          <View>
            <View style={styles.usernameRow}>
              <Text style={styles.postUsername}>{displayName}</Text>
              {user.verified && (
                <BadgeCheck color="#1DA1F2" size={16} fill="#1DA1F2" />
              )}
            </View>
            <Text style={styles.postTimestamp}>{post.date.time_ago}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <MoreHorizontal color={colors.dark.text} size={20} />
        </TouchableOpacity>
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      {postMedia && isVideo && videoUrl ? (
        <TouchableOpacity 
          style={styles.videoContainer}
          onPress={handleVideoPress}
          activeOpacity={0.95}
        >
          <Image
            source={{ uri: thumbnailUrl || videoUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
          <View style={styles.videoPlayButton}>
            <View style={styles.playButtonCircle}>
              <Play color={colors.dark.text} size={32} fill={colors.dark.text} />
            </View>
          </View>
        </TouchableOpacity>
      ) : postImage ? (
        <Image 
          source={{ uri: postImage }} 
          style={styles.postImage}
          resizeMode="cover"
          onError={(error) => {
            console.error('[Explore] Image load error for post', post.id, ':', error.nativeEvent.error);
            console.error('[Explore] Failed image URL:', postImage);
          }}
          onLoad={() => {
            console.log('[Explore] Image loaded successfully for post', post.id);
          }}
        />
      ) : null}

      <View style={styles.postFooter}>
        {Object.keys(reactionCounts).length > 0 && (
          <View style={styles.reactionsBar}>
            {Object.entries(reactionCounts).map(([unifiedId, data]) => (
              <View key={unifiedId} style={styles.reactionBadge}>
                <Text style={styles.reactionEmoji}>{data.emoji}</Text>
                <Text style={styles.reactionCount}>{data.count}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.postActions}>
          <TouchableOpacity onPress={handleReactionPress} style={styles.actionButton}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Heart 
                color={colors.dark.text} 
                size={22} 
                fill="none"
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share2 color={colors.dark.text} size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle color={colors.dark.text} size={22} />
          </TouchableOpacity>
          <View style={styles.viewCount}>
            <Eye color={colors.dark.text} size={18} />
            <Text style={styles.viewCountText}>{post.views_count.formatted}</Text>
          </View>
        </View>
        <Text style={styles.leaveComment}>Leave a comment</Text>
      </View>

      <Modal
        visible={showFullscreenVideo}
        transparent={false}
        animationType="fade"
        onRequestClose={handleCloseFullscreen}
        statusBarTranslucent
      >
        <View style={styles.fullscreenVideoContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleCloseFullscreen}
          >
            <X color={colors.dark.text} size={28} />
          </TouchableOpacity>
          {videoUrl && (
            <Video
              ref={fullscreenVideoRef}
              source={{ uri: videoUrl }}
              style={styles.fullscreenVideo}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={true}
              useNativeControls={true}
              onError={(error) => {
                console.error('[Explore] Fullscreen video error:', error);
              }}
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={showReactionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReactionPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowReactionPicker(false)}
        >
          <Pressable style={styles.emojiPickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.emojiPickerHeader}>
              <Text style={styles.emojiPickerTitle}>React to this post</Text>
              <TouchableOpacity onPress={() => setShowReactionPicker(false)}>
                <X color={colors.dark.text} size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.emojiPickerContent} showsVerticalScrollIndicator={false}>
              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>Frequently Used</Text>
                <View style={styles.emojiGrid}>
                  {FREQUENTLY_USED_EMOJIS.map((emojiData) => (
                    <TouchableOpacity
                      key={emojiData.unified}
                      style={styles.emojiButton}
                      onPress={() => handleSelectReaction(emojiData)}
                    >
                      <Text style={styles.emojiButtonText}>{emojiData.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>Smileys & People</Text>
                <View style={styles.emojiGrid}>
                  {EMOJI_CATEGORIES.smileys.map((emojiData) => (
                    <TouchableOpacity
                      key={emojiData.unified}
                      style={styles.emojiButton}
                      onPress={() => handleSelectReaction(emojiData)}
                    >
                      <Text style={styles.emojiButtonText}>{emojiData.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>Emotions</Text>
                <View style={styles.emojiGrid}>
                  {EMOJI_CATEGORIES.emotions.map((emojiData) => (
                    <TouchableOpacity
                      key={emojiData.unified}
                      style={styles.emojiButton}
                      onPress={() => handleSelectReaction(emojiData)}
                    >
                      <Text style={styles.emojiButtonText}>{emojiData.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>Gestures</Text>
                <View style={styles.emojiGrid}>
                  {EMOJI_CATEGORIES.gestures.map((emojiData) => (
                    <TouchableOpacity
                      key={emojiData.unified}
                      style={styles.emojiButton}
                      onPress={() => handleSelectReaction(emojiData)}
                    >
                      <Text style={styles.emojiButtonText}>{emojiData.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>Hearts</Text>
                <View style={styles.emojiGrid}>
                  {EMOJI_CATEGORIES.hearts.map((emojiData) => (
                    <TouchableOpacity
                      key={emojiData.unified}
                      style={styles.emojiButton}
                      onPress={() => handleSelectReaction(emojiData)}
                    >
                      <Text style={styles.emojiButtonText}>{emojiData.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>Symbols</Text>
                <View style={styles.emojiGrid}>
                  {EMOJI_CATEGORIES.symbols.map((emojiData) => (
                    <TouchableOpacity
                      key={emojiData.unified}
                      style={styles.emojiButton}
                      onPress={() => handleSelectReaction(emojiData)}
                    >
                      <Text style={styles.emojiButtonText}>{emojiData.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function UserItem({ user }: { user: User }) {
  const router = useRouter();
  const followMutation = useFollowUser();
  const [isFollowing, setIsFollowing] = useState(false);

  let avatar = user.avatar || `https://i.pravatar.cc/150?u=${user.id}`;
  if (avatar && !avatar.startsWith('http://') && !avatar.startsWith('https://')) {
    avatar = `https://uservault.net${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  }

  const handleFollow = async () => {
    console.log('[Explore] Follow button pressed for user:', user.id);
    console.log('[Explore] User ID type:', typeof user.id);
    console.log('[Explore] Current isFollowing state:', isFollowing);
    
    if (!user.id || typeof user.id !== 'number') {
      console.error('[Explore] Invalid user ID:', user.id);
      return;
    }
    
    try {
      setIsFollowing(!isFollowing);
      await followMutation.mutateAsync(user.id);
      console.log('[Explore] Follow mutation successful');
    } catch (error) {
      console.error('[Explore] Follow mutation failed:', error);
      setIsFollowing(isFollowing);
    }
  };

  return (
    <View style={styles.userItem}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => router.push(`/user/${user.username || user.id}`)}
      >
        <Image source={{ uri: avatar }} style={styles.userAvatar} />
        <View style={styles.userDetails}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{user.name}</Text>
            {user.verified && (
              <BadgeCheck color="#1DA1F2" size={16} fill="#1DA1F2" />
            )}
          </View>
          <Text style={styles.userUsername}>@{user.username}</Text>
          {user.bio && (
            <Text style={styles.userBio} numberOfLines={1}>{user.bio}</Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.followButton, isFollowing && styles.followingButton]}
        onPress={handleFollow}
      >
        <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useExplorePosts();
  const { data: peopleData, isLoading: peopleLoading } = useSearchPeople(searchQuery);

  const posts = postsData?.data || [];
  const people = peopleData?.data || [];

  const isSearching = searchQuery.length >= 1;
  const isLoading = isSearching ? peopleLoading : postsLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchPosts();
    } catch (e) {
      console.error('[Explore] Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={styles.searchBar}>
        <Search color={colors.dark.textSecondary} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
          placeholderTextColor={colors.dark.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.dark.text} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.dark.text} />
          </View>
        ) : isSearching && people.length > 0 ? (
          <View style={styles.peopleList}>
            {people.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </View>
        ) : isSearching && people.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users color={colors.dark.textSecondary} size={60} />
            <Text style={styles.emptyText}>No people found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        ) : (
          <View style={styles.postsSection}>
            {posts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts found</Text>
              </View>
            ) : (
              posts.map((post: Post) => (
                <PostItem key={post.id} post={post} />
              ))
            )}
          </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.card,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.dark.text,
  },
  content: {
    flex: 1,
  },
  postsSection: {
    paddingTop: 8,
  },
  post: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postUsername: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.dark.text,
  },
  postTimestamp: {
    fontSize: 13,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: colors.dark.text,
    lineHeight: 21,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: colors.dark.card,
  },
  videoContainer: {
    position: 'relative' as 'relative',
    width: width,
    height: width,
    backgroundColor: colors.dark.card,
  },
  videoPlayButton: {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    zIndex: 2,
  },
  playButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    borderWidth: 3,
    borderColor: colors.dark.text,
  },
  fullscreenVideoContainer: {
    flex: 1,
    backgroundColor: colors.dark.background,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  fullscreenVideo: {
    width: width,
    height: '100%',
  },
  closeButton: {
    position: 'absolute' as 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
  },

  postFooter: {
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto' as 'auto',
  },
  viewCountText: {
    fontSize: 14,
    color: colors.dark.text,
    fontWeight: '500' as const,
  },
  leaveComment: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  reactionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.dark.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  emojiPickerModal: {
    backgroundColor: colors.dark.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.dark.text,
  },
  emojiPickerContent: {
    paddingHorizontal: 20,
  },
  emojiSection: {
    marginTop: 20,
  },
  emojiSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.dark.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.dark.background,
  },
  emojiButtonText: {
    fontSize: 32,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    width: '100%',
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
  peopleList: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.dark.text,
  },
  userUsername: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginBottom: 2,
  },
  userBio: {
    fontSize: 13,
    color: colors.dark.textSecondary,
    lineHeight: 17,
  },
  followButton: {
    backgroundColor: colors.dark.accent,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.dark.text,
  },
  followingButtonText: {
    color: colors.dark.textSecondary,
  },
});
