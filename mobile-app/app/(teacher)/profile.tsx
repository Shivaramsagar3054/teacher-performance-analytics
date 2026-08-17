import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  useWindowDimensions,
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useNavigation } from 'expo-router';
import { authApi, teachersApi, completedCoursesApi, getImageUrl } from '../../services/api';

export default function TeacherProfile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const contentWidth = isLargeScreen ? width - 290 : width;

  const [teacher, setTeacher] = useState<any>(null);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);



  const fetchProfileData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
        setTeacher(matchedTeacher);
        
        // Always fetch completed courses directly from API to ensure fresh data
        let completed = [];
        try {
          const res = await completedCoursesApi.getAll({ teacher_id: matchedTeacher.id });
          completed = res.results || (Array.isArray(res) ? res : []);
        } catch (err) {
          console.warn('Failed to fetch completed courses:', err);
        }
        setCompletedCourses(completed);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData(true);
  }, []);

  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfileData(false);
    });
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!teacher) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-add-outline" size={64} color="#3b82f6" style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>Profile Not Set Up</Text>
        <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
          You do not have a profile set up yet. Please go to settings to set up your profile details.
        </Text>
        <TouchableOpacity 
          style={{ 
            marginTop: 24, 
            backgroundColor: '#3b82f6', 
            paddingHorizontal: 24, 
            paddingVertical: 12, 
            borderRadius: 10 
          }}
          onPress={async () => {
            try {
              await AsyncStorage.setItem('autoOpenEditProfile', 'true');
            } catch (err) {}
            router.replace('/(teacher)/settings');
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Set Up Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const expYears = teacher.years_of_experience || 0;
  const experienceText = `${expYears} Year${expYears !== 1 ? 's' : ''} of Experience`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, { width: contentWidth }]}>
          
          {/* Main Info Card */}
          <View style={styles.profileCard}>
            <Image 
              source={{ uri: getImageUrl(teacher.profile_image) }} 
              style={styles.avatar} 
            />
            <Text style={styles.name}>{`Dr. ${teacher.first_name} ${teacher.last_name}`}</Text>
            <Text style={styles.positionText}>{teacher.position || 'Professor'}</Text>
            <Text style={styles.department}>{teacher.department}</Text>
            
            <Text style={styles.shortBio}>
              {teacher.biography ? teacher.biography.split('.')[0] + '.' : 'Dedicated educator shaping future minds.'}
            </Text>

            {/* Contact Details List */}
            <View style={styles.contactDetailsList}>
              <View style={styles.contactRow}>
                <View style={styles.contactIconBg}>
                  <Ionicons name="mail" size={16} color="#3b82f6" />
                </View>
                <Text style={styles.contactText}>{teacher.user?.email || teacher.email || 'teacher@university.edu'}</Text>
              </View>

              <View style={styles.contactRow}>
                <View style={styles.contactIconBg}>
                  <Ionicons name="call" size={16} color="#10b981" />
                </View>
                <Text style={styles.contactText}>{teacher.phone_number || '+91 94440 12345'}</Text>
              </View>

              <View style={styles.contactRow}>
                <View style={styles.contactIconBg}>
                  <Ionicons name="location" size={16} color="#f59e0b" />
                </View>
                <Text style={styles.contactText}>{teacher.location || 'Main Campus Office'}</Text>
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
            {teacher.research_interests && teacher.research_interests.length > 0 && (
              <View style={styles.interestsWrapper}>
                <Text style={styles.interestsTitle}>Research Interests</Text>
                <View style={styles.interestsContainer}>
                  {teacher.research_interests.map((ri: any) => (
                    <View key={ri.id} style={styles.interestBadge}>
                      <Ionicons name="flask-outline" size={12} color="#2563eb" style={{ marginRight: 4 }} />
                      <Text style={styles.interestText}>{ri.topic}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Biography Box */}
          {teacher.biography && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={20} color="#0f172a" />
                <Text style={styles.sectionTitle}>Biography</Text>
              </View>
              <Text style={styles.bioText}>{teacher.biography}</Text>
            </View>
          )}

          {/* Education timeline */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school" size={20} color="#0f172a" />
              <Text style={styles.sectionTitle}>Education History</Text>
            </View>
            
            {teacher.education_list && teacher.education_list.length > 0 ? (
              <View style={styles.timelineContainer}>
                {teacher.education_list.map((edu: any, index: number) => {
                  const isLast = index === teacher.education_list.length - 1;
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a1930',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  mainWrapper: {
    maxWidth: '100%',
    gap: 24,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
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
    backgroundColor: '#ffffff',
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
  },
  interestsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a1930',
    marginBottom: 10,
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
    borderRadius: 8,
  },
  interestText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  bioText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  timelineContainer: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 100,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineNodeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  timelineDegree: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  timelineInstitution: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  timelineUniversity: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  timelineFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  timelineDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  timelineGradeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timelineGradeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a1930',
  },
  modalScroll: {
    padding: 24,
    gap: 16,
  },
  formGroup: {
    gap: 6,
    width: '100%',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
