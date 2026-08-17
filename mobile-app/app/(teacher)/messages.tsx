import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  useWindowDimensions,
  RefreshControl,
  AppState,
  AppStateStatus
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { authApi, teachersApi, commentsApi } from '../../services/api';
import { getWsUrl } from '../../constants/config';

export default function TeacherMessages() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const contentWidth = isLargeScreen ? width - 290 : width;

  const [teacher, setTeacher] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000);
  const isClosingRef = useRef(false);

  const fetchMessages = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setLoading(true);
      const profile = await authApi.getProfile();
      
      let matchedTeacher = null;
      try {
        const cached = await AsyncStorage.getItem('teacherProfile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.user?.id === profile.id) {
            matchedTeacher = parsed;
          }
        }
      } catch (cErr) {
        console.warn('Failed to read cached profile:', cErr);
      }

      if (!matchedTeacher) {
        matchedTeacher = profile.teacher_profile || null;
        if (!matchedTeacher) {
          const res = await teachersApi.getAll({ user_id: profile.id });
          const results = res.results || (Array.isArray(res) ? res : []);
          matchedTeacher = results.find((t: any) => t.user?.id === profile.id) || results[0] || null;
        }
      }

      if (matchedTeacher) {
        await AsyncStorage.setItem('teacher_id', String(matchedTeacher.id));
        await AsyncStorage.setItem('teacherProfile', JSON.stringify(matchedTeacher));
      }

      if (matchedTeacher) {
        setTeacher(matchedTeacher);
        
        // Fetch all comments and filter for this teacher
        const commentsList = await commentsApi.getAll();
        const allComments = commentsList.results || (Array.isArray(commentsList) ? commentsList : []);
        const teacherComments = allComments.filter((c: any) => c.teacher === matchedTeacher.id);
        
        // Sort comments by created_at descending (latest first)
        teacherComments.sort((a: any, b: any) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setComments(teacherComments);
      }
    } catch (err) {
      console.error('Failed to load teacher comments/messages:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (!teacher?.id) return;

    isClosingRef.current = false;

    const connectWS = () => {
      if (!teacher?.id || isClosingRef.current) return;

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          console.warn('Error closing previous teacher WebSocket:', e);
        }
      }

      const wsUrl = getWsUrl(teacher.id);
      
      console.log('Teacher connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Teacher WebSocket connection opened successfully');
        reconnectDelayRef.current = 1000;
        // Refresh messages to catch up on anything missed
        fetchMessages(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_comment') {
            const newComment = data.comment;
            if (newComment && newComment.teacher === teacher.id) {
              setComments((prev) => {
                if (prev.some((c) => c.id === newComment.id)) return prev;
                return [newComment, ...prev];
              });
            }
          }
        } catch (err) {
          console.warn('Error parsing Teacher WebSocket message:', err);
        }
      };

      ws.onerror = (e) => {
        console.warn('Teacher WebSocket error:', e);
      };

      ws.onclose = (e) => {
        console.log('Teacher WebSocket connection closed:', e.code, e.reason);
        if (!isClosingRef.current) {
          const delay = reconnectDelayRef.current;
          console.log(`Scheduling Teacher WebSocket reconnect in ${delay}ms`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 16000);
            connectWS();
          }, delay);
        }
      };
    };

    connectWS();

    // Listen for AppState changes to reconnect when returning to active/foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App returned to foreground, checking Teacher WebSocket connection...');
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
          reconnectDelayRef.current = 1000;
          connectWS();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isClosingRef.current = true;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          console.warn('Error closing Teacher WebSocket on unmount:', e);
        }
      }
      subscription.remove();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [teacher?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Feed...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Student Messages</Text>
          <Text style={styles.headerSubtitle}>Anonymous reviews & course feedback</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchMessages(true)}>
          <Ionicons name="refresh" size={16} color="#475569" />
          {isLargeScreen && <Text style={styles.refreshBtnText}>Reload Feed</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        <View style={[styles.mainWrapper, { width: contentWidth }]}>
          {comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="chatbubbles-outline" size={48} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>No Messages Yet</Text>
              <Text style={styles.emptySubtitle}>Student comments and ratings feedback will show up here once submitted.</Text>
            </View>
          ) : (
            <View style={styles.feedWrapper}>
              <Text style={styles.feedCount}>{comments.length} Feedback Message{comments.length !== 1 ? 's' : ''}</Text>
              
              {comments.map((comment) => {
                const isAnon = comment.is_anonymous;
                return (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.userIconBg}>
                        <Ionicons 
                          name={isAnon ? "eye-off" : "person"} 
                          size={20} 
                          color={isAnon ? "#64748b" : "#3b82f6"} 
                        />
                      </View>
                      
                      <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.userName}>
                            {isAnon ? "Anonymous Student" : (comment.user_name || "Student")}
                          </Text>
                          {isAnon ? (
                            <View style={styles.anonBadge}>
                              <Text style={styles.anonBadgeText}>Anonymous</Text>
                            </View>
                          ) : (
                            <View style={styles.verifiedBadge}>
                              <Text style={styles.verifiedBadgeText}>Verified Student</Text>
                            </View>
                          )}
                        </View>
                        {!isAnon && comment.user_email && (
                          <Text style={styles.userEmail}>{comment.user_email}</Text>
                        )}
                        <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.cardBody}>
                      <Text style={styles.commentContent}>{comment.content}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a1930',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refreshBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  mainWrapper: {
    maxWidth: '100%',
    gap: 24,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 20,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a1930',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
  },
  feedWrapper: {
    gap: 16,
    width: '100%',
  },
  feedCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
  },
  commentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  userIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  anonBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  anonBadgeText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  verifiedBadgeText: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  commentDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
  cardBody: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  commentContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '500',
  },
});
