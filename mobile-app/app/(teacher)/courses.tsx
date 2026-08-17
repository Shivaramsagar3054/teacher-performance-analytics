import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  useWindowDimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { authApi, teachersApi, courseTeachersApi, completedCoursesApi, coursesApi } from '../../services/api';

export default function TeacherCourses() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const contentWidth = isLargeScreen ? width - 290 : width;

  const [teacher, setTeacher] = useState<any>(null);
  const [ongoingCourses, setOngoingCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Master Courses for Suggestions
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Add Course Modal States
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [status, setStatus] = useState<'active' | 'completed'>('active');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [department, setDepartment] = useState('Academic');
  const [slot, setSlot] = useState('');
  const [description, setDescription] = useState('');
  
  // Completed Course specific states
  const [completionDate, setCompletionDate] = useState('2026-05-23');
  const [examType, setExamType] = useState('Final Exam');
  const [sGrades, setSGrades] = useState('0');
  const [aGrades, setAGrades] = useState('0');
  const [bGrades, setBGrades] = useState('0');
  const [cGrades, setCGrades] = useState('0');
  const [dGrades, setDGrades] = useState('0');
  const [eGrades, setEGrades] = useState('0');
  const [failGrades, setFailGrades] = useState('0');

  const [saveLoading, setSaveLoading] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
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
        
        // Always fetch completed courses directly from API to ensure fresh data
        let completed = [];
        try {
          const res = await completedCoursesApi.getAll({ teacher_id: matchedTeacher.id });
          completed = res.results || (Array.isArray(res) ? res : []);
        } catch (err) {
          console.warn('Failed to fetch completed courses:', err);
        }
        setCompletedCourses(completed);

        // Fetch ongoing
        try {
          const res = await courseTeachersApi.getAll({ teacher_id: matchedTeacher.id, is_current: 'true' });
          const ongoing = res.results || (Array.isArray(res) ? res : []);
          setOngoingCourses(ongoing);
        } catch (err) {
          console.warn(err);
        }
      }

      // Fetch master list for suggestions
      try {
        const masterRes = await coursesApi.getAll();
        const masterList = masterRes.results || (Array.isArray(masterRes) ? masterRes : []);
        setAllCourses(masterList);
      } catch (err) {
        console.warn('Failed to load master courses:', err);
      }
    } catch (err) {
      console.error('Failed to load courses data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCourseCodeChange = (text: string) => {
    setCourseCode(text);
    if (text.length > 0) {
      const filtered = allCourses.filter(c => 
        c.course_code.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestedCourse = (course: any) => {
    setCourseName(course.course_name || '');
    setCourseCode(course.course_code || '');
    setDepartment(course.department || 'Academic');
    setDescription(course.description || '');
    setSlot(course.slot || '');
    setShowSuggestions(false);
  };

  const handleDeleteCourse = async (id: number, type: 'active' | 'completed') => {
    const confirmMsg = 'Are you sure you want to delete this course record?';
    
    const proceedWithDelete = async () => {
      try {
        setLoading(true);
        const api = type === 'active' ? courseTeachersApi : completedCoursesApi;
        await api.delete(id);
        
        if (Platform.OS === 'web') alert('Record deleted successfully!');
        else Alert.alert('Success', 'Record deleted successfully!');
        
        await fetchAllData();
      } catch (err) {
        console.error(err);
        if (Platform.OS === 'web') alert('Failed to delete record.');
        else Alert.alert('Error', 'Failed to delete record.');
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        await proceedWithDelete();
      }
    } else {
      Alert.alert(
        'Confirm Delete',
        confirmMsg,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: proceedWithDelete }
        ]
      );
    }
  };

  const handleSaveCourse = async () => {
    if (!teacher) return;
    if (!courseCode || !courseName || !department || !slot) {
      if (Platform.OS === 'web') alert('Please fill in Code, Name, Department, and Slot!');
      else Alert.alert('Error', 'Please fill in Code, Name, Department, and Slot!');
      return;
    }

    try {
      setSaveLoading(true);
      
      // Find or create course
      let courseId = null;
      const existing = allCourses.find(c => 
        c.course_code.toLowerCase() === courseCode.toLowerCase()
      );
      
      if (existing) {
        courseId = existing.id;
      } else {
        const newCourse = await coursesApi.create({
          course_name: courseName,
          course_code: courseCode,
          department: department,
          description: description || `Created for ${courseName}`,
          slot: slot.substring(0, 3)
        });
        courseId = newCourse.id;
      }

      if (status === 'active') {
        await courseTeachersApi.create({
          teacher: teacher.id,
          course: courseId,
          is_current: true
        });
      } else {
        await completedCoursesApi.create({
          teacher: teacher.id,
          course: courseId,
          course_full_name: courseName,
          exam_type: examType,
          completion_date: completionDate,
          slot: slot,
          s_grades: parseInt(sGrades) || 0,
          a_grades: parseInt(aGrades) || 0,
          b_grades: parseInt(bGrades) || 0,
          c_grades: parseInt(cGrades) || 0,
          d_grades: parseInt(dGrades) || 0,
          e_grades: parseInt(eGrades) || 0,
          fail_grades: parseInt(failGrades) || 0
        });
      }

      if (Platform.OS === 'web') alert('Course record added successfully!');
      else Alert.alert('Success', 'Course record added successfully!');

      // Reset Form & Refresh
      setCourseCode('');
      setCourseName('');
      setDepartment('Academic');
      setSlot('');
      setDescription('');
      setSGrades('0');
      setAGrades('0');
      setBGrades('0');
      setCGrades('0');
      setDGrades('0');
      setEGrades('0');
      setFailGrades('0');
      setIsAddModalVisible(false);
      
      await fetchAllData();
    } catch (err: any) {
      console.error('Failed to save course:', err);
      const errMsg = err.message || 'Failed to save course. Verify fields.';
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Error', errMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading && ongoingCourses.length === 0 && completedCourses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Courses...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Management</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setIsAddModalVisible(true)}>
          <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.createBtnText}>Add Record</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, { width: contentWidth }]}>
          
          {/* Ongoing Courses Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={20} color="#0f172a" />
              <Text style={styles.sectionTitle}>Ongoing Courses (Active Semester)</Text>
            </View>

            {ongoingCourses.length > 0 ? (
              <View style={styles.coursesGrid}>
                {ongoingCourses.map((ct) => (
                  <View key={ct.id} style={styles.courseItemCard}>
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
                    
                    <View style={styles.ongoingFooterRow}>
                      <View style={styles.ongoingStatusBadge}>
                        <View style={styles.ongoingStatusDot} />
                        <Text style={styles.ongoingStatusText}>Active Load</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.deleteCourseBtn}
                        onPress={() => handleDeleteCourse(ct.id, 'active')}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No active ongoing courses assigned for this semester.</Text>
            )}
          </View>

          {/* Completed Courses Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-done-circle" size={20} color="#0f172a" />
              <Text style={styles.sectionTitle}>Completed Courses History</Text>
            </View>

            {completedCourses.length > 0 ? (
              <View style={styles.completedList}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>Course</Text>
                  <Text style={[styles.tableHeaderCell, { textAlign: 'center', flex: 0.8 }]}>Slot</Text>
                  <Text style={[styles.tableHeaderCell, { textAlign: 'center', flex: 0.8 }]}>Students</Text>
                  <Text style={[styles.tableHeaderCell, { textAlign: 'center', flex: 1 }]}>Pass Rate</Text>
                  <Text style={[styles.tableHeaderCell, { textAlign: 'right', flex: 0.4 }]}></Text>
                </View>

                {completedCourses.map((cc) => {
                  const passRate = cc.pass_percentage ? parseFloat(cc.pass_percentage) : 0;
                  let rateColor = '#ef4444'; 
                  if (passRate >= 90) rateColor = '#10b981'; 
                  else if (passRate >= 75) rateColor = '#3b82f6'; 
                  else if (passRate >= 50) rateColor = '#f59e0b'; 

                  return (
                    <View key={cc.id} style={styles.tableDataRow}>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', flex: 4.8, alignItems: 'center' }} 
                        activeOpacity={0.7}
                        onPress={() => router.push(`/(teacher)/completed-course/${cc.id}` as any)}
                      >
                        <View style={{ flex: 2.2, paddingRight: 4 }}>
                          <Text style={styles.tableCourseName} numberOfLines={1}>
                            {cc.course_full_name || cc.course_details?.course_name || 'Course Name'}
                          </Text>
                          <Text style={styles.tableCourseCode}>
                            {cc.course_details?.course_code || 'CODE'}
                          </Text>
                        </View>
                        <Text style={[styles.tableCellText, { textAlign: 'center', flex: 0.8 }]}>{cc.slot || 'N/A'}</Text>
                        <Text style={[styles.tableCellText, { textAlign: 'center', flex: 0.8 }]}>{cc.total_students || 0}</Text>
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <View style={[styles.passBadge, { backgroundColor: rateColor + '15', borderColor: rateColor }]}>
                            <Text style={[styles.passBadgeText, { color: rateColor }]}>
                              {passRate}%
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 0.4, alignItems: 'flex-end', justifyContent: 'center' }}
                        onPress={() => handleDeleteCourse(cc.id, 'completed')}
                      >
                        <Ionicons name="trash-outline" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>No historical completed course metrics available.</Text>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Add Course Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay as any}>
          <View style={[styles.modalCard as any, isLargeScreen && { width: 550 } as any]}>
            <View style={styles.modalHeader as any}>
              <Text style={styles.modalTitle as any}>Add New Course Entry</Text>
              <TouchableOpacity onPress={resetForm}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll as any}>
              
              {/* Status Selector */}
              <View style={styles.statusToggleGroup as any}>
                <TouchableOpacity 
                  style={[styles.statusToggleBtn as any, status === 'active' && styles.statusToggleBtnActive as any]}
                  onPress={() => setStatus('active')}
                >
                  <Text style={[styles.statusToggleText as any, status === 'active' && styles.statusToggleTextActive as any]}>Current Load</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.statusToggleBtn as any, status === 'completed' && styles.statusToggleBtnActive as any]}
                  onPress={() => setStatus('completed')}
                >
                  <Text style={[styles.statusToggleText as any, status === 'completed' && styles.statusToggleTextActive as any]}>Past History</Text>
                </TouchableOpacity>
              </View>

              {/* Course Code with suggestions dropdown */}
              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Course Code</Text>
                <View style={{ zIndex: 99 }}>
                  <TextInput
                    style={styles.formInput as any}
                    value={courseCode}
                    onChangeText={handleCourseCodeChange}
                    placeholder="e.g. CS101"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                  />
                  
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <View style={styles.suggestionsDropdown as any}>
                      {filteredSuggestions.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.suggestionItem as any}
                          onPress={() => selectSuggestedCourse(c)}
                        >
                          <View>
                            <Text style={styles.suggestionCodeText as any}>{c.course_code}</Text>
                            <Text style={styles.suggestionNameText as any}>{c.course_name}</Text>
                          </View>
                          <Ionicons name="add-circle-outline" size={18} color="#10b981" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Course Name</Text>
                <TextInput
                  style={styles.formInput as any}
                  value={courseName}
                  onChangeText={setCourseName}
                  placeholder="e.g. Intro to Computer Science"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formRow as any}>
                <View style={[styles.formGroup as any, { flex: 1 }]}>
                  <Text style={styles.formLabel as any}>Department</Text>
                  <TextInput
                    style={styles.formInput as any}
                    value={department}
                    onChangeText={setDepartment}
                    placeholder="e.g. Computer Science"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.formGroup as any, { flex: 1 }]}>
                  <Text style={styles.formLabel as any}>Slot</Text>
                  <TextInput
                    style={styles.formInput as any}
                    value={slot}
                    onChangeText={setSlot}
                    placeholder="e.g. A1"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Description</Text>
                <TextInput
                  style={[styles.formInput as any, styles.formTextArea as any]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter course overview..."
                  placeholderTextColor="#94a3b8"
                  multiline={true}
                  numberOfLines={2}
                />
              </View>

              {status === 'completed' && (
                <View style={styles.completedFormSection as any}>
                  <Text style={styles.completedSectionTitle as any}>Completed Performance Metrics</Text>
                  
                  <View style={styles.formRow as any}>
                    <View style={[styles.formGroup as any, { flex: 1 }]}>
                      <Text style={styles.formLabel as any}>Completion Date</Text>
                      <TextInput
                        style={styles.formInput as any}
                        value={completionDate}
                        onChangeText={setCompletionDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={[styles.formGroup as any, { flex: 1 }]}>
                      <Text style={styles.formLabel as any}>Exam Type</Text>
                      <TextInput
                        style={styles.formInput as any}
                        value={examType}
                        onChangeText={setExamType}
                        placeholder="e.g. Final Exam"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  <Text style={[styles.formLabel as any, { marginTop: 10, marginBottom: 6, textAlign: 'center' }]}>Grade Count Distribution</Text>
                  <View style={styles.gradeGridRow as any}>
                    {['S', 'A', 'B', 'C', 'D', 'E', 'Fail'].map((g) => {
                      const val = 
                        g === 'S' ? sGrades :
                        g === 'A' ? aGrades :
                        g === 'B' ? bGrades :
                        g === 'C' ? cGrades :
                        g === 'D' ? dGrades :
                        g === 'E' ? eGrades : failGrades;
                      const setter = 
                        g === 'S' ? setSGrades :
                        g === 'A' ? setAGrades :
                        g === 'B' ? setBGrades :
                        g === 'C' ? setCGrades :
                        g === 'D' ? setDGrades :
                        g === 'E' ? setEGrades : setFailGrades;
                      return (
                        <View key={g} style={styles.gradeInputCol as any}>
                          <Text style={styles.gradeTextLabel as any}>{g}</Text>
                          <TextInput
                            style={styles.gradeTextInput as any}
                            value={val}
                            onChangeText={setter}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#cbd5e1"
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter as any}>
              <TouchableOpacity 
                style={styles.modalCancelBtn as any} 
                onPress={resetForm}
                disabled={saveLoading}
              >
                <Text style={styles.modalCancelBtnText as any}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn as any} 
                onPress={handleSaveCourse}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveBtnText as any}>Confirm Record</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  function resetForm() {
    setCourseCode('');
    setCourseName('');
    setDepartment('Academic');
    setSlot('');
    setDescription('');
    setSGrades('0');
    setAGrades('0');
    setBGrades('0');
    setCGrades('0');
    setDGrades('0');
    setEGrades('0');
    setFailGrades('0');
    setIsAddModalVisible(false);
    setShowSuggestions(false);
  }
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a1930',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnText: {
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
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  courseItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '47%',
    minWidth: 260,
    gap: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  courseCodeBadge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    color: '#334155',
  },
  courseSlotText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  courseItemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 20,
  },
  courseItemDept: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  ongoingFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  ongoingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  ongoingStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  ongoingStatusText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteCourseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  completedList: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCourseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tableCourseCode: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  tableCellText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  passBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  passBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Modal & Form Styling
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
  statusToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    width: '100%',
    marginBottom: 8,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusToggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statusToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  statusToggleTextActive: {
    color: '#3b82f6',
    fontWeight: 'bold',
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
    width: '100%',
  },
  formTextArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 999,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionCodeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  suggestionNameText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  completedFormSection: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    gap: 12,
    marginTop: 8,
  },
  completedSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a1930',
    textAlign: 'center',
    marginBottom: 4,
  },
  gradeGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  gradeInputCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  gradeTextLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  gradeTextInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    width: '100%',
    textAlign: 'center',
    paddingVertical: 4,
    fontSize: 12,
    color: '#1e293b',
    backgroundColor: '#ffffff',
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
