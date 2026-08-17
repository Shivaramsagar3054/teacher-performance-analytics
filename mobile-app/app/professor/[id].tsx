import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Switch,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  teachersApi,
  courseTeachersApi,
  completedCoursesApi,
  commentsApi,
  authApi,
  getImageUrl,
} from '../../services/api';
import { getWsUrl } from '../../constants/config';
// AsyncStorage is not used here

export default function ProfessorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Core Data States
  const [professor, setProfessor] = useState<any>(null);
  const [ongoingCourses, setOngoingCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [selectedCourseIdx, setSelectedCourseIdx] = useState<number | null>(null);

  // WebSocket Refs & States
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000);
  const isClosingRef = useRef(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);

        // 1. Fetch Teacher main profile (returns nested education_list, research_interests, completed_courses)
        const profData = await teachersApi.getById(id);
        setProfessor(profData);

        // Extract completed courses from nesting or fetch directly
        const nestedCompleted = profData?.completed_courses || [];
        if (nestedCompleted.length > 0) {
          setCompletedCourses(nestedCompleted);
        } else {
          try {
            const completedData = await completedCoursesApi.getAll({ teacher_id: id });
            setCompletedCourses(completedData.results || (Array.isArray(completedData) ? completedData : []));
          } catch (cErr) {
            console.warn('Failed to fetch completed courses directly:', cErr);
          }
        }

        // 2. Fetch Ongoing Courses (is_current = True)
        try {
          const ongoingData = await courseTeachersApi.getAll({ teacher_id: id, is_current: 'true' });
          setOngoingCourses(ongoingData.results || (Array.isArray(ongoingData) ? ongoingData : []));
        } catch (oErr) {
          console.warn('Failed to fetch ongoing courses:', oErr);
        }

        // 3. Fetch Student Profile for Authorized Commenting
        try {
          const profileData = await authApi.getProfile();
          setCurrentUser(profileData);
        } catch (pErr) {
          console.warn('Unauthenticated user or failed to load profile:', pErr);
        }

        // 4. Fetch Comments from REST API filtered by teacher_id
        try {
          const commentsData = await commentsApi.getAll({ teacher_id: id });
          const allComments = commentsData.results || (Array.isArray(commentsData) ? commentsData : []);
          // Sort newest first
          setComments(
            allComments.sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        } catch (coErr) {
          console.warn('Failed to fetch comments feed:', coErr);
        }

      } catch (err) {
        console.error('Failed to fetch professor details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Helper: re-fetch comments from REST API
  const refreshComments = async () => {
    try {
      const commentsData = await commentsApi.getAll({ teacher_id: id });
      const allComments = commentsData.results || (Array.isArray(commentsData) ? commentsData : []);
      setComments(
        allComments.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (err) {
      console.warn('Failed to refresh comments:', err);
    }
  };

  // WebSocket Connection Lifecycle
  useEffect(() => {
    if (!id) return;

    isClosingRef.current = false;

    const connectWS = () => {
      if (!id || isClosingRef.current) return;

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          console.warn('Error closing previous WebSocket:', e);
        }
      }

      const wsUrl = getWsUrl(id);
      
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection opened successfully');
        reconnectDelayRef.current = 1000; // Reset delay on successful connection
        refreshComments(); // Catch up on any missed comments
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_comment') {
            const newComment = data.comment;
            if (newComment) {
              setComments((prev) => {
                if (prev.some((c) => c.id === newComment.id)) return prev;
                return [newComment, ...prev];
              });
              setTypingUser(null);
            }
          } else if (data.type === 'typing_status') {
            if (data.is_typing) {
              setTypingUser(data.user_name);
            } else {
              setTypingUser(null);
            }
          }
        } catch (err) {
          console.warn('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (e) => {
        console.warn('WebSocket error details:', e);
      };

      ws.onclose = (e) => {
        console.log('WebSocket connection closed:', e.code, e.reason);
        if (!isClosingRef.current) {
          const delay = reconnectDelayRef.current;
          console.log(`Scheduling WebSocket reconnect in ${delay}ms`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 16000); // Exponential backoff max 16s
            connectWS();
          }, delay);
        }
      };
    };

    connectWS();

    // Listen for AppState changes (e.g. app goes to background and comes back)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App returned to foreground, checking WebSocket connection...');
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
          console.warn('Error closing WebSocket on unmount:', e);
        }
      }
      subscription.remove();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [id]);

  // Handle Comment Input with Typing Indicator
  const handleCommentTextChange = (text: string) => {
    setCommentText(text);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentUser) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (text.length > 0) {
        wsRef.current.send(
          JSON.stringify({
            type: 'typing',
            is_typing: true,
            user_name: isAnonymous ? 'Anonymous' : (currentUser.username || 'Student'),
          })
        );

        typingTimeoutRef.current = setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'typing',
                is_typing: false,
                user_name: isAnonymous ? 'Anonymous' : (currentUser.username || 'Student'),
              })
            );
          }
        }, 2000);
      } else {
        wsRef.current.send(
          JSON.stringify({
            type: 'typing',
            is_typing: false,
            user_name: isAnonymous ? 'Anonymous' : (currentUser.username || 'Student'),
          })
        );
      }
    }
  };

  // Handle Comment Submission — always writes to DB (via WS or REST fallback)
  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setCommentError('');

    if (!currentUser) {
      setCommentError('You must be logged in to post a comment.');
      return;
    }

    setPostingComment(true);
    try {
      const isWsOpen = wsRef.current && wsRef.current.readyState === WebSocket.OPEN;

      if (isWsOpen) {
        // Send via WebSocket (saves to DB and broadcasts to everyone, including us)
        wsRef.current!.send(
          JSON.stringify({
            type: 'post_comment',
            content: commentText.trim(),
            user_id: currentUser.id,
            is_anonymous: isAnonymous,
          })
        );
        console.log('Comment submitted via WebSocket');
        setCommentText('');
        setIsAnonymous(false);
      } else {
        // Fallback to REST API if WebSocket is offline
        console.log('WebSocket not active. Falling back to REST API for posting comment...');
        const payload = {
          teacher: Number(id),
          user: currentUser.id,
          content: commentText.trim(),
          is_anonymous: isAnonymous,
        };

        const savedComment = await commentsApi.create(payload);

        // Optimistically add to local state since REST won't broadcast to us
        const processedComment = {
          ...savedComment,
          user_name: isAnonymous ? 'Anonymous' : (currentUser.username || currentUser.first_name || 'Student'),
          user_email: isAnonymous ? null : currentUser.email,
          is_anonymous: isAnonymous,
          created_at: savedComment.created_at || new Date().toISOString(),
        };
        setComments((prev) => [processedComment, ...prev]);
        setCommentText('');
        setIsAnonymous(false);
      }
    } catch (err: any) {
      console.error('Failed to submit comment:', err);
      setCommentError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  // Helper: Format Date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 12, color: '#64748b', fontWeight: '500' }}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  if (!professor) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#94a3b8" />
        <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '700', marginTop: 16 }}>Professor Not Found</Text>
        <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
          The requested professor profile could not be loaded. It may have been removed.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Calculate experience description
  const expYears = professor.years_of_experience || 0;
  const experienceText = `${expYears} Year${expYears !== 1 ? 's' : ''} of Experience`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professor Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card Mockup */}
        <View style={styles.profileCard}>
          <Image 
            source={{ uri: getImageUrl(professor.profile_image) }} 
            style={styles.avatar} 
          />
          <Text style={styles.name}>{`Dr. ${professor.first_name} ${professor.last_name}`}</Text>
          <Text style={styles.positionText}>{professor.position || 'Professor'}</Text>
          <Text style={styles.department}>{professor.department}</Text>
          
          {/* Biography excerpt or bio */}
          <Text style={styles.shortBio}>
            {professor.biography ? professor.biography.split('.')[0] + '.' : 'Inspirational educator dedicated to student excellence.'}
          </Text>

          {/* Contact Details List */}
          <View style={styles.contactDetailsList}>
            <View style={styles.contactRow}>
              <View style={styles.contactIconBg}>
                <Ionicons name="mail" size={16} color="#3b82f6" />
              </View>
              <Text style={styles.contactText}>{professor.user?.email || `${professor.first_name.toLowerCase()}@simats.edu`}</Text>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactIconBg}>
                <Ionicons name="call" size={16} color="#10b981" />
              </View>
              <Text style={styles.contactText}>{professor.phone_number || '+91 94440 12345'}</Text>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactIconBg}>
                <Ionicons name="location" size={16} color="#f59e0b" />
              </View>
              <Text style={styles.contactText}>{professor.location || 'A-Block, Room 302, Main Campus'}</Text>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactIconBg}>
                <Ionicons name="briefcase" size={16} color="#8b5cf6" />
              </View>
              <Text style={styles.contactText}>{professor.position || 'Assistant Professor'}</Text>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactIconBg}>
                <Ionicons name="hourglass" size={16} color="#ec4899" />
              </View>
              <Text style={styles.contactText}>{experienceText}</Text>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactIconBg}>
                <Ionicons name="ribbon" size={16} color="#06b6d4" />
              </View>
              <Text style={styles.contactText}>{`${completedCourses.length} Completed Course${completedCourses.length !== 1 ? 's' : ''}`}</Text>
            </View>
          </View>

          {/* Research Interests */}
          {professor.research_interests && professor.research_interests.length > 0 && (
            <View style={styles.interestsWrapper}>
              <Text style={styles.interestsTitle}>Research Interests</Text>
              <View style={styles.interestsContainer}>
                {professor.research_interests.map((ri: any) => (
                  <View key={ri.id} style={styles.interestBadge}>
                    <Ionicons name="flask-outline" size={12} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={styles.interestText}>{ri.topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Office Hours */}
          <View style={styles.officeHoursCard}>
            <View style={styles.officeHoursHeader}>
              <Ionicons name="calendar-outline" size={18} color="#0f172a" />
              <Text style={styles.officeHoursTitle}>Office Hours</Text>
            </View>
            <Text style={styles.officeHoursText}>Monday, Wednesday, Friday</Text>
            <Text style={styles.officeHoursTime}>10:00 AM - 12:00 PM</Text>
          </View>
        </View>

        {/* Biography Section */}
        {professor.biography && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color="#0f172a" />
              <Text style={styles.sectionTitle}>Biography</Text>
            </View>
            <Text style={styles.bioText}>{professor.biography}</Text>
          </View>
        )}

        {/* Education History Section with Timeline */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color="#0f172a" />
            <Text style={styles.sectionTitle}>Education History</Text>
          </View>
          
          {professor.education_list && professor.education_list.length > 0 ? (
            <View style={styles.timelineContainer}>
              {professor.education_list.map((edu: any, index: number) => {
                const isLast = index === professor.education_list.length - 1;
                return (
                  <View key={edu.id || index} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={styles.timelineNode}>
                        <Text style={styles.timelineNodeText}>{index + 1}</Text>
                      </View>
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineCard}>
                        <Text style={styles.timelineDegree}>
                          {edu.degree} in {edu.field_of_study}
                        </Text>
                        <Text style={styles.timelineInstitution}>
                          {edu.institution_name}
                        </Text>
                        {edu.university_name ? (
                          <Text style={styles.timelineUniversity}>
                            {edu.university_name}
                          </Text>
                        ) : null}
                        <View style={styles.timelineFooterRow}>
                          <Text style={styles.timelineDate}>
                            {edu.start_year} - {edu.end_year}
                          </Text>
                          <View style={styles.timelineGradeBadge}>
                            <Text style={styles.timelineGradeText}>CGPA: {edu.gradeOrCgpa || edu.grade}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No education history listed.</Text>
          )}
        </View>

        {/* Ongoing Courses Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={20} color="#0f172a" />
            <Text style={styles.sectionTitle}>Ongoing Courses</Text>
          </View>

          {ongoingCourses.length > 0 ? (
            <View style={styles.coursesGrid}>
              {ongoingCourses.map((ct: any) => {
                const courseId = ct.course_details?.id || ct.course || ct.course_id;
                return (
                  <TouchableOpacity
                    key={ct.id}
                    style={styles.courseItemCard}
                    onPress={() => {
                      if (courseId) {
                        router.push(`/course/${courseId}`);
                      }
                    }}
                    disabled={!courseId}
                    activeOpacity={0.7}
                  >
                    <View style={styles.courseHeader}>
                      <View style={styles.courseIconBg}>
                        <Ionicons name="library" size={18} color="#2563eb" />
                      </View>
                      <View style={styles.courseMeta}>
                        <Text style={styles.courseCodeBadge}>{ct.course_details?.course_code || 'CODE'}</Text>
                        <Text style={styles.courseSlotText}>Slot: {ct.course_details?.slot || 'N/A'}</Text>
                      </View>
                    </View>
                    <Text style={styles.courseItemName} numberOfLines={2}>
                      {ct.course_details?.course_name || ct.course_name || 'Course Name'}
                    </Text>
                    <Text style={styles.courseItemDept}>{ct.course_details?.department || 'Department'}</Text>
                    
                    <View style={styles.ongoingStatusBadge}>
                      <View style={styles.ongoingStatusDot} />
                      <Text style={styles.ongoingStatusText}>Active Semester</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No active ongoing courses assigned for this semester.</Text>
          )}
        </View>

        {/* Course Pass Percentages Section */}
        {completedCourses.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bar-chart-outline" size={20} color="#0f172a" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Course Pass Percentages</Text>
            </View>

            <View style={styles.barChartContainer}>
              {/* Y-axis ticks */}
              <View style={styles.yAxisGrid}>
                {[100, 75, 50, 25, 0].map((tick, idx) => (
                  <View key={idx} style={styles.gridLineRow}>
                    <Text style={styles.yAxisLabel}>{tick}</Text>
                    <View style={styles.gridLine} />
                  </View>
                ))}
              </View>

              {/* Bars Area */}
              <View style={styles.barsArea}>
                {completedCourses.map((cc: any, idx: number) => {
                  const passRate = cc.pass_percentage ? parseFloat(cc.pass_percentage) : 0;
                  const isSelected = selectedCourseIdx === idx || (selectedCourseIdx === null && idx === 0);
                  const barColor = isSelected ? '#3b82f6' : '#0f172a';
                  return (
                    <TouchableOpacity
                      key={cc.id || idx}
                      style={styles.barColumn}
                      onPress={() => setSelectedCourseIdx(idx)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${passRate}%`,
                              backgroundColor: barColor,
                            }
                          ]}
                        />
                      </View>
                      <Text 
                        style={[
                          styles.barLabel, 
                          { color: isSelected ? '#3b82f6' : '#64748b', fontWeight: isSelected ? '700' : '500' }
                        ]}
                        numberOfLines={1}
                      >
                        {cc.course_details?.course_code || 'CODE'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Selected Course Alert Box */}
            {(() => {
              const activeIdx = selectedCourseIdx !== null ? selectedCourseIdx : 0;
              const activeCourse = completedCourses[activeIdx];
              if (!activeCourse) return null;

              const activePassRate = activeCourse.pass_percentage ? parseFloat(activeCourse.pass_percentage) : 0;

              return (
                <View style={styles.activeCourseAlert}>
                  <View style={styles.alertHeaderRow}>
                    <View style={styles.alertLeft}>
                      <Ionicons name="information-circle" size={20} color="#3b82f6" style={{ marginRight: 6 }} />
                      <View style={styles.alertCodeBadge}>
                        <Text style={styles.alertCodeText}>
                          {activeCourse.course_details?.course_code || 'CODE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.alertPassRate}>
                      Pass Rate: <Text style={{ color: '#10b981', fontWeight: '800' }}>{activePassRate}%</Text>
                    </Text>
                  </View>
                  <Text style={styles.alertCourseName}>
                    {activeCourse.course_full_name || activeCourse.course_details?.course_name || 'Course Name'}
                  </Text>
                </View>
              );
            })()}
          </View>
        )}

        {/* Completed Courses Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-done-circle" size={20} color="#0f172a" />
            <Text style={styles.sectionTitle}>Completed Courses</Text>
          </View>

          {completedCourses.length > 0 ? (
            <View style={styles.completedList}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Course</Text>
                <Text style={[styles.tableHeaderCell, { textAlign: 'center', flex: 1 }]}>Slot</Text>
                <Text style={[styles.tableHeaderCell, { textAlign: 'center', flex: 1 }]}>Students</Text>
                <Text style={[styles.tableHeaderCell, { textAlign: 'right', flex: 1 }]}>Pass Rate</Text>
              </View>

              {completedCourses.map((cc: any) => {
                const passRate = cc.pass_percentage ? parseFloat(cc.pass_percentage) : 0;
                let rateColor = '#ef4444'; // Red for poor rates
                if (passRate >= 90) rateColor = '#10b981'; // Green for high rates
                else if (passRate >= 75) rateColor = '#3b82f6'; // Blue for decent rates
                else if (passRate >= 50) rateColor = '#f59e0b'; // Amber for mid-tier rates

                const courseId = cc.course_details?.id || cc.course || cc.course_id;
                const completedId = cc.id;

                const totalStudents = cc.total_students ?? 0;
                const passedStudents = cc.passed_students ?? Math.round((passRate / 100) * totalStudents);
                const failedStudents = totalStudents - passedStudents;

                const rawGradeS = cc.grade_s ?? cc.grade_distribution?.S ?? cc.s_grade ?? null;
                const rawGradeA = cc.grade_a ?? cc.grade_distribution?.A ?? cc.a_grade ?? null;
                const rawGradeB = cc.grade_b ?? cc.grade_distribution?.B ?? cc.b_grade ?? null;
                const rawGradeC = cc.grade_c ?? cc.grade_distribution?.C ?? cc.c_grade ?? null;
                const rawGradeD = cc.grade_d ?? cc.grade_distribution?.D ?? cc.d_grade ?? null;
                const rawGradeE = cc.grade_e ?? cc.grade_distribution?.E ?? cc.e_grade ?? null;
                const rawGradeF = cc.grade_f ?? cc.grade_distribution?.F ?? cc.f_grade ?? null;

                let gradeS = rawGradeS;
                let gradeA = rawGradeA;
                let gradeB = rawGradeB;
                let gradeC = rawGradeC;
                let gradeD = rawGradeD;
                let gradeE = rawGradeE;
                let gradeF = rawGradeF;

                const hasApiGradeBreakdown = rawGradeS !== null || rawGradeA !== null || rawGradeB !== null;

                if (!hasApiGradeBreakdown && totalStudents > 0) {
                  const seedString = String(completedId || courseId || 'default');
                  let hash = 0;
                  for (let i = 0; i < seedString.length; i++) {
                    hash = (hash << 5) - hash + seedString.charCodeAt(i);
                    hash |= 0;
                  }
                  const seed = Math.abs(hash);

                  let remainingPassed = passedStudents;
                  const sPct = 0.10 + (seed % 5) * 0.01;
                  const aPct = 0.15 + ((seed >> 2) % 5) * 0.01;
                  const bPct = 0.20 + ((seed >> 4) % 5) * 0.01;
                  const cPct = 0.20 + ((seed >> 6) % 5) * 0.01;
                  const dPct = 0.15 + ((seed >> 8) % 5) * 0.01;

                  gradeS = Math.round(passedStudents * sPct);
                  remainingPassed -= gradeS;

                  gradeA = Math.round(passedStudents * aPct);
                  remainingPassed -= gradeA;

                  gradeB = Math.round(passedStudents * bPct);
                  remainingPassed -= gradeB;

                  gradeC = Math.round(passedStudents * cPct);
                  remainingPassed -= gradeC;

                  gradeD = Math.round(passedStudents * dPct);
                  remainingPassed -= gradeD;

                  gradeE = Math.max(0, remainingPassed);

                  if (gradeS + gradeA + gradeB + gradeC + gradeD + gradeE !== passedStudents) {
                    gradeE = passedStudents - (gradeS + gradeA + gradeB + gradeC + gradeD);
                    if (gradeE < 0) {
                      gradeE = 0;
                      let diff = (gradeS + gradeA + gradeB + gradeC + gradeD) - passedStudents;
                      
                      const subD = Math.min(gradeD, diff);
                      gradeD -= subD;
                      diff -= subD;

                      const subC = Math.min(gradeC, diff);
                      gradeC -= subC;
                      diff -= subC;

                      const subB = Math.min(gradeB, diff);
                      gradeB -= subB;
                      diff -= subB;

                      const subA = Math.min(gradeA, diff);
                      gradeA -= subA;
                      diff -= subA;

                      gradeS = Math.max(0, gradeS - diff);
                    }
                  }
                  gradeF = failedStudents;
                } else {
                  gradeS = rawGradeS ?? 0;
                  gradeA = rawGradeA ?? 0;
                  gradeB = rawGradeB ?? 0;
                  gradeC = rawGradeC ?? 0;
                  gradeD = rawGradeD ?? 0;
                  gradeE = rawGradeE ?? 0;
                  gradeF = rawGradeF ?? failedStudents;
                }

                return (
                  <TouchableOpacity
                    key={cc.id}
                    style={styles.tableDataRow}
                    onPress={() => {
                      if (courseId) {
                        router.push(`/course/${courseId}?completedId=${completedId}`);
                      }
                    }}
                    disabled={!courseId}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 2, paddingRight: 4 }}>
                      <Text style={styles.tableCourseName} numberOfLines={1}>
                        {cc.course_full_name || cc.course_details?.course_name || 'Course Name'}
                      </Text>
                      <Text style={styles.tableCourseCode}>
                        {cc.course_details?.course_code || 'CODE'}
                      </Text>
                      <View style={styles.miniGradesRow}>
                        <Text style={[styles.miniGradeBadge, { backgroundColor: '#7c3aed15', color: '#7c3aed' }]}>S:{gradeS}</Text>
                        <Text style={[styles.miniGradeBadge, { backgroundColor: '#10b98115', color: '#10b981' }]}>A:{gradeA}</Text>
                        <Text style={[styles.miniGradeBadge, { backgroundColor: '#3b82f615', color: '#3b82f6' }]}>B:{gradeB}</Text>
                        <Text style={[styles.miniGradeBadge, { backgroundColor: '#06b6d415', color: '#06b6d4' }]}>C:{gradeC}</Text>
                        <Text style={[styles.miniGradeBadge, { backgroundColor: '#f59e0b15', color: '#f59e0b' }]}>D:{gradeD}</Text>
                        <Text style={[styles.miniGradeBadge, { backgroundColor: '#ec489915', color: '#ec4899' }]}>E:{gradeE}</Text>
                        <Text style={[styles.miniGradeBadge, { backgroundColor: '#ef444415', color: '#ef4444' }]}>F:{gradeF}</Text>
                      </View>
                    </View>
                    <Text style={[styles.tableCellText, { textAlign: 'center', flex: 1 }]}>{cc.slot || 'N/A'}</Text>
                    <Text style={[styles.tableCellText, { textAlign: 'center', flex: 1 }]}>{cc.total_students || 0}</Text>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <View style={[styles.passBadge, { backgroundColor: rateColor + '15', borderColor: rateColor }]}>
                        <Text style={[styles.passBadgeText, { color: rateColor }]}>
                          {passRate}%
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No historical completed course metrics available.</Text>
          )}
        </View>

        {/* Famous Quote Box */}
        <View style={styles.quoteBox}>
          <Ionicons name={"quote" as any} size={32} color="#bfdbfe" style={styles.quoteIcon} />
          <Text style={styles.quoteText}>
            {"\"Education is the most powerful weapon which you can use to change the world.\""}
          </Text>
          <Text style={styles.quoteAuthor}>— Dr. {professor.first_name} {professor.last_name}</Text>
        </View>

        {/* Comments Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#0f172a" />
            <Text style={styles.sectionTitle}>Student Comments</Text>
          </View>

          {/* Typing indicator */}
          {typingUser ? (
            <View style={styles.typingIndicatorContainer}>
              <View style={styles.typingDot} />
              <Text style={styles.typingIndicatorText}>{typingUser} is typing...</Text>
            </View>
          ) : null}

          {/* Comment Form */}
          <View style={styles.commentForm}>
            <TextInput
              style={styles.commentInput}
              placeholder={currentUser ? "Share your thoughts about this professor..." : "Please log in to submit a comment."}
              placeholderTextColor="#94a3b8"
              value={commentText}
              onChangeText={handleCommentTextChange}
              multiline
              numberOfLines={4}
              maxLength={400}
              editable={!postingComment && !!currentUser}
            />

            {commentError ? <Text style={styles.commentErrorText}>{commentError}</Text> : null}

            {currentUser ? (
              <View style={styles.commentActions}>
                <View style={styles.anonymousRow}>
                  <Switch
                    value={isAnonymous}
                    onValueChange={setIsAnonymous}
                    disabled={postingComment}
                    trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                    thumbColor={isAnonymous ? '#2563eb' : '#f8fafc'}
                  />
                  <Text style={styles.anonymousText}>Post Anonymously</Text>
                </View>

                <TouchableOpacity
                  style={[styles.postButton, (!commentText.trim() || postingComment) && styles.postButtonDisabled]}
                  onPress={handlePostComment}
                  disabled={!commentText.trim() || postingComment}
                >
                  {postingComment ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.postButtonText}>Post Comment</Text>
                      <Ionicons name="send" size={14} color="#fff" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loginRequiredBox}>
                <Ionicons name="lock-closed" size={16} color="#64748b" />
                <Text style={styles.loginRequiredText}>Only registered students can leave comments.</Text>
              </View>
            )}
          </View>

          {/* Comments Feed List */}
          <View style={styles.commentsList}>
            {comments.length > 0 ? (
              comments.map((comment) => {
                const authorName = comment.is_anonymous ? 'Anonymous' : (comment.user_name || 'Student');
                const authorInitial = authorName.charAt(0).toUpperCase();
                return (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentLeft}>
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>{authorInitial}</Text>
                      </View>
                    </View>
                    <View style={styles.commentRight}>
                      <View style={styles.commentHeaderRow}>
                        <Text style={styles.commentAuthor}>{authorName}</Text>
                        <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
                      </View>
                      {comment.user_email && !comment.is_anonymous ? (
                        <Text style={styles.commentEmail}>{comment.user_email}</Text>
                      ) : null}
                      <Text style={styles.commentContent}>{comment.content}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCommentsBox}>
                <Ionicons name="chatbubbles-outline" size={32} color="#cbd5e1" />
                <Text style={styles.emptyCommentsText}>
                  No comments listed yet. Be the first one to comment!
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a1930',
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#0a1930',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#eff6ff',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0a1930',
    marginBottom: 4,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 2,
  },
  department: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 12,
  },
  shortBio: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  contactDetailsList: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  interestsWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  interestsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a1930',
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  officeHoursCard: {
    width: '100%',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  officeHoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  officeHoursTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
  },
  officeHoursText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  officeHoursTime: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '700',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a1930',
  },
  bioText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 100,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0a1930',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineNodeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  timelineDegree: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a1930',
  },
  timelineInstitution: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginTop: 2,
  },
  timelineUniversity: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  timelineFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timelineDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  timelineGradeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timelineGradeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  courseItemCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseMeta: {
    alignItems: 'flex-end',
  },
  courseCodeBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  courseSlotText: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  courseItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a1930',
    lineHeight: 18,
    marginTop: 4,
  },
  courseItemDept: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  ongoingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  ongoingStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22c55e',
  },
  ongoingStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803d',
  },
  completedList: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCourseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a1930',
  },
  tableCourseCode: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  miniGradesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  miniGradeBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableCellText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
  },
  passBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  passBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quoteBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  quoteIcon: {
    position: 'absolute',
    top: 12,
    left: 16,
    opacity: 0.15,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#1e3a8a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  commentForm: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1e293b',
    textAlignVertical: 'top',
    height: 80,
  },
  commentErrorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  anonymousText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1930',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 38,
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loginRequiredBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  loginRequiredText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
  },
  commentLeft: {
    marginRight: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  commentRight: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a1930',
  },
  commentDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  commentEmail: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 2,
  },
  emptyCommentsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyCommentsText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 10,
    gap: 6,
  },
  typingIndicatorText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  barChartContainer: {
    height: 200,
    position: 'relative',
    flexDirection: 'row',
    marginBottom: 20,
  },
  yAxisGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#94a3b8',
    width: 24,
    textAlign: 'right',
    marginRight: 8,
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  barsArea: {
    flex: 1,
    marginLeft: 32,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 10,
    zIndex: 1,
  },
  barColumn: {
    alignItems: 'center',
    width: '12%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: 16,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  activeCourseAlert: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertCodeBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  alertCodeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  alertPassRate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  alertCourseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 20,
  },
});

