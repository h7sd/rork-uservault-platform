import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Animated,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Share2, MoreHorizontal, Eye, X, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';

import colors from '@/constants/colors';
import { useTimelineApi, useStoriesApi, useLikePost, useCurrentUserProfile } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import type { Story, Post } from '@/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import { FREQUENTLY_USED_EMOJIS, EMOJI_CATEGORIES, getEmojiByUnified, type Emoji } from '@/constants/emojis';

const { width } = Dimensions.get('window');

function StoryItem({ story }: { story: Story }) {
  const router = useRouter();
  const user = story.relations.user;
  const username = user.name || 'user';
  let avatar = user.avatar_url || `https://i.pravatar.cc/150?u=${story.story_uuid}`;
  if (avatar && !avatar.startsWith('http://') && !avatar.startsWith('https://')) {
    avatar = `https://uservault.net${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  }

  const handlePress = () => {
    router.push(`/story-viewer?storyUuid=${story.story_uuid}`);
  };

  return (
    <TouchableOpacity style={styles.storyItem} onPress={handlePress}>
      <View style={[styles.storyBorder, story.is_seen && styles.storyBorderViewed]}>
        <Image source={{ uri: avatar }} style={styles.storyAvatar} />
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {username}
      </Text>
    </TouchableOpacity>
  );
}



function PostItem({ post }: { post: Post }) {
  const [showReactionPicker, setShowReactionPicker] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState<boolean>(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fullscreenVideoRef = useRef<Video>(null);
  const likeMutation = useLikePost();
  const router = useRouter();

  const user = post.relations.user;
  const username = user.username || 'unknown';
  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : username;
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
  
  console.log('[Home] Post:', post.id, 'mediaType:', mediaType, 'isVideo:', isVideo);
  console.log('[Home] Post:', post.id, 'mediaUrl:', mediaUrl);
  console.log('[Home] Post:', post.id, 'thumbnailUrl:', thumbnailUrl);
  console.log('[Home] Post:', post.id, 'finalImage:', postImage, 'finalVideo:', videoUrl);

  const handleVideoPress = useCallback(() => {
    setShowFullscreenVideo(true);
  }, []);

  const handleCloseFullscreen = useCallback(async () => {
    if (fullscreenVideoRef.current) {
      await fullscreenVideoRef.current.pauseAsync();
    }
    setShowFullscreenVideo(false);
  }, []);

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.postUser} onPress={() => {
          console.log('[Home] Navigate to user profile:', user.username || user.id);
          router.push(`/user/${user.username || user.id}`);
        }}>
          <Image 
            source={{ uri: avatar }} 
            style={styles.postAvatar} 
          />
          <View>
            <View style={styles.usernameRow}>
              <Text style={styles.postUsername}>{displayName}</Text>
              {user.verified && <VerifiedBadge size={16} />}
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
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: postImage }} 
            style={styles.postImage}
            resizeMode="cover"
            onError={(error) => {
              console.error('[Home] Image load error for post', post.id, ':', error.nativeEvent.error);
              console.error('[Home] Failed image URL:', postImage);
              setImageError(true);
              setImageLoading(false);
            }}
            onLoadStart={() => {
              setImageLoading(true);
              setImageError(false);
            }}
            onLoad={() => {
              console.log('[Home] Image loaded successfully for post', post.id);
              setImageLoading(false);
              setImageError(false);
            }}
          />
          {imageLoading && !imageError && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="large" color={colors.dark.accent} />
            </View>
          )}
          {imageError && (
            <View style={styles.imageErrorOverlay}>
              <Text style={styles.imageErrorText}>Failed to load image</Text>
              <Text style={styles.imageErrorUrl} numberOfLines={2}>{postImage}</Text>
            </View>
          )}
        </View>
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
                console.error('[Home] Fullscreen video error:', error);
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

export default function HomeScreen() {
  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts, error: postsError } = useTimelineApi();
  const { data: storiesData, isLoading: storiesLoading, refetch: refetchStories } = useStoriesApi();
  const { refetch: refetchProfile } = useCurrentUserProfile();
  const { currentUser, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPosts(),
        refetchStories(),
        refetchProfile(),
      ]);
    } catch (e) {
      console.error('[Home] Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  console.log('[Home] Posts data:', postsData?.data?.length, 'Loading:', postsLoading, 'Error:', postsError);
  console.log('[Home] Stories data:', storiesData?.data?.length);
  console.log('[Home] User authenticated:', isAuthenticated, 'User:', currentUser?.username);

  const posts = postsData?.data || [];
  const stories = storiesData?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>USER VAULT</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.dark.text} />
        }
      >
        <View style={styles.storiesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContent}
          >
            <TouchableOpacity style={styles.storyItem}>
              <View style={styles.addStoryBorder}>
                <Image 
                  source={{ uri: currentUser?.avatar || 'https://i.pravatar.cc/150' }} 
                  style={styles.storyAvatar} 
                />
                <View style={styles.addStoryButton}>
                  <Text style={styles.addStoryText}>+</Text>
                </View>
              </View>
              <Text style={styles.storyUsername}>Your Story</Text>
            </TouchableOpacity>
            {storiesLoading ? (
              <ActivityIndicator color={colors.dark.text} style={{ marginLeft: 20 }} />
            ) : (
              stories.map((story: Story) => (
                <StoryItem key={story.story_uuid} story={story} />
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.postsSection}>
          {postsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.dark.text} />
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : (
            posts.map((post: Post) => (
              <PostItem key={post.id} post={post} />
            ))
          )}
        </View>
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
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  storiesSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingVertical: 12,
  },
  storiesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  storyBorder: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.dark.accent,
  },
  storyBorderViewed: {
    borderColor: colors.dark.border,
  },
  addStoryBorder: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.dark.border,
    position: 'relative',
  },
  storyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.dark.background,
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.dark.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.dark.background,
  },
  addStoryText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
  storyUsername: {
    fontSize: 12,
    color: colors.dark.text,
    marginTop: 6,
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
  imageWrapper: {
    width: width,
    height: width,
    backgroundColor: colors.dark.card,
    position: 'relative' as const,
  },
  postImage: {
    width: width,
    height: width,
  },
  imageLoadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageErrorText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  imageErrorUrl: {
    color: colors.dark.textSecondary,
    fontSize: 11,
    textAlign: 'center' as const,
    opacity: 0.6,
  },
  videoContainer: {
    position: 'relative',
    width: width,
    height: width,
    backgroundColor: colors.dark.card,
  },
  videoPlayButton: {
    position: 'absolute',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.dark.textSecondary,
  },
});
