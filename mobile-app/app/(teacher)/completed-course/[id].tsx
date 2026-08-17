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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { completedCoursesApi } from '../../../services/api';
import DonutChart from '../../../components/DonutChart';

export default function CompletedCourseDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const contentWidth = isLargeScreen ? width - 290 : width;

  const [loading, setLoading] = useState(true);
  const [courseDetails, setCourseDetails] = useState<any>(null);

  // Edit Course Modal States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editCourseName, setEditCourseName] = useState('');
  const [editSlot, setEditSlot] = useState('');
  const [editExamType, setEditExamType] = useState('');
  const [editCompletionDate, setEditCompletionDate] = useState('');
  const [editSGrades, setEditSGrades] = useState('0');
  const [editAGrades, setEditAGrades] = useState('0');
  const [editBGrades, setEditBGrades] = useState('0');
  const [editCGrades, setEditCGrades] = useState('0');
  const [editDGrades, setEditDGrades] = useState('0');
  const [editEGrades, setEditEGrades] = useState('0');
  const [editFailGrades, setEditFailGrades] = useState('0');
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeBarIdx, setActiveBarIdx] = useState<number | null>(null);

  const fetchCourseDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await completedCoursesApi.getById(String(id));
      setCourseDetails(res);
      
      // Initialize edit fields
      setEditCourseName(res.course_full_name || res.course_details?.course_name || '');
      setEditSlot(res.slot || '');
      setEditExamType(res.exam_type || 'Final Exam');
      setEditCompletionDate(res.completion_date || '');
      setEditSGrades(String(res.s_grades || '0'));
      setEditAGrades(String(res.a_grades || '0'));
      setEditBGrades(String(res.b_grades || '0'));
      setEditCGrades(String(res.c_grades || '0'));
      setEditDGrades(String(res.d_grades || '0'));
      setEditEGrades(String(res.e_grades || '0'));
      setEditFailGrades(String(res.fail_grades || '0'));
    } catch (err) {
      console.error('Failed to load completed course details:', err);
      if (Platform.OS === 'web') alert('Failed to load completed course details.');
      else Alert.alert('Error', 'Failed to load completed course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const handleOpenEditModal = () => {
    setIsEditModalVisible(true);
  };

  const handleUpdateCourse = async () => {
    if (!id || !courseDetails) return;
    if (!editCourseName.trim()) {
      if (Platform.OS === 'web') alert('Course Name is required.');
      else Alert.alert('Validation Error', 'Course Name is required.');
      return;
    }

    try {
      setSaveLoading(true);
      const updatedData = {
        course_full_name: editCourseName,
        exam_type: editExamType,
        completion_date: editCompletionDate,
        slot: editSlot,
        s_grades: parseInt(editSGrades) || 0,
        a_grades: parseInt(editAGrades) || 0,
        b_grades: parseInt(editBGrades) || 0,
        c_grades: parseInt(editCGrades) || 0,
        d_grades: parseInt(editDGrades) || 0,
        e_grades: parseInt(editEGrades) || 0,
        fail_grades: parseInt(editFailGrades) || 0
      };

      const res = await completedCoursesApi.patch(String(id), updatedData);
      setCourseDetails(res);
      setIsEditModalVisible(false);
      
      if (Platform.OS === 'web') alert('Course details updated successfully!');
      else Alert.alert('Success', 'Course details updated successfully!');
    } catch (err: any) {
      console.error('Failed to update completed course:', err);
      const errMsg = err.message || 'An error occurred while saving updates. Please try again.';
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Error', errMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!id) return;
    
    const proceedWithDelete = async () => {
      try {
        setLoading(true);
        await completedCoursesApi.delete(String(id));
        if (Platform.OS === 'web') {
          alert('Course details deleted successfully.');
        } else {
          Alert.alert('Deleted', 'Course details deleted successfully.');
        }
        router.push('/(teacher)/courses' as any);
      } catch (err: any) {
        console.error('Failed to delete completed course:', err);
        const errMsg = err.message || 'An error occurred. Please try again.';
        if (Platform.OS === 'web') alert(errMsg);
        else Alert.alert('Error', errMsg);
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to permanently delete this completed course history? This cannot be undone.');
      if (confirm) proceedWithDelete();
    } else {
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to permanently delete this completed course history? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: proceedWithDelete }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Course Details...</Text>
      </View>
    );
  }

  if (!courseDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#94a3b8" />
        <Text style={styles.errorText}>Course Record Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(teacher)/courses')}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate distribution percentages
  const sCount = courseDetails.s_grades || 0;
  const aCount = courseDetails.a_grades || 0;
  const bCount = courseDetails.b_grades || 0;
  const cCount = courseDetails.c_grades || 0;
  const dCount = courseDetails.d_grades || 0;
  const eCount = courseDetails.e_grades || 0;
  const failCount = courseDetails.fail_grades || 0;
  
  const totalStuds = sCount + aCount + bCount + cCount + dCount + eCount + failCount || courseDetails.total_students || 1;
  const passStuds = sCount + aCount + bCount + cCount + dCount + eCount;
  const passRate = courseDetails.pass_percentage ? parseFloat(courseDetails.pass_percentage) : Math.round((passStuds / totalStuds) * 100);

  const barGrades = [
    { label: 'S Grade', count: sCount, color: '#10b981' },
    { label: 'A Grade', count: aCount, color: '#3b82f6' },
    { label: 'B Grade', count: bCount, color: '#06b6d4' },
    { label: 'C Grade', count: cCount, color: '#8b5cf6' },
    { label: 'D Grade', count: dCount, color: '#ec4899' },
    { label: 'E Grade', count: eCount, color: '#f59e0b' },
    { label: 'F Grade', count: failCount, color: '#ef4444' },
  ];

  const maxCount = Math.max(...barGrades.map(g => g.count), 5);
  const step = Math.ceil(maxCount / 4) || 1;
  const yAxisTicks = [step * 4, step * 3, step * 2, step, 0];

  const grades = barGrades.filter(g => g.count > 0);
  const cardWidth = isLargeScreen ? '23.8%' : '48%';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Course Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleOpenEditModal}>
            <Ionicons name="create-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerIconBtn, { marginLeft: 12 }]} onPress={handleDeleteCourse}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, { width: contentWidth }]}>
          
          {/* Details Banner Card */}
          <View style={styles.detailsCard}>
            <View style={styles.bannerIconWrapper}>
              <View style={styles.bannerIconBg}>
                <Ionicons name="library" size={36} color="#3b82f6" />
              </View>
            </View>

            <Text style={styles.courseTitleCentered}>
              {courseDetails.course_full_name || courseDetails.course_details?.course_name || 'Course Name'}
            </Text>

            <Text style={styles.deptTextCentered}>
              {courseDetails.course_details?.department || 'Academic Department'}
            </Text>

            {/* Badges row */}
            <View style={styles.badgesRow}>
              <View style={[styles.pillBadge, { borderColor: '#3b82f6', backgroundColor: '#eff6ff' }]}>
                <Ionicons name="barcode-outline" size={13} color="#3b82f6" style={{ marginRight: 4 }} />
                <Text style={[styles.pillBadgeText, { color: '#3b82f6' }]}>
                  {courseDetails.course_details?.course_code || 'CODE'}
                </Text>
              </View>

              <View style={[styles.pillBadge, { borderColor: '#10b981', backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="school-outline" size={13} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>
                  Credits
                </Text>
              </View>

              <View style={[styles.pillBadge, { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }]}>
                <Ionicons name="time-outline" size={13} color="#f59e0b" style={{ marginRight: 4 }} />
                <Text style={[styles.pillBadgeText, { color: '#f59e0b' }]}>
                  Slot {courseDetails.slot || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Course Performance Analytics */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bar-chart" size={20} color="#0a1930" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Course Performance Analytics</Text>
            </View>

            <View style={styles.perfGridRow}>
              {/* Total box */}
              <View style={[styles.perfBox, { backgroundColor: '#f0f7ff', borderColor: '#e0f0ff' }]}>
                <View style={[styles.perfIconBg, { backgroundColor: '#d0e7ff' }]}>
                  <Ionicons name="people" size={20} color="#3b82f6" />
                </View>
                <Text style={styles.perfValue}>{totalStuds}</Text>
                <Text style={styles.perfLabel}>Total</Text>
              </View>

              {/* Passed box */}
              <View style={[styles.perfBox, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
                <View style={[styles.perfIconBg, { backgroundColor: '#bbf7d0' }]}>
                  <Ionicons name="checkmark-sharp" size={20} color="#10b981" />
                </View>
                <Text style={[styles.perfValue, { color: '#10b981' }]}>{passStuds}</Text>
                <Text style={styles.perfLabel}>Passed</Text>
              </View>

              {/* Failed box */}
              <View style={[styles.perfBox, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}>
                <View style={[styles.perfIconBg, { backgroundColor: '#fecaca' }]}>
                  <Ionicons name="close-sharp" size={20} color="#ef4444" />
                </View>
                <Text style={[styles.perfValue, { color: '#ef4444' }]}>{failCount}</Text>
                <Text style={styles.perfLabel}>Failed</Text>
              </View>
            </View>

            {/* Radial Pass Gauge */}
            <View style={styles.radialGaugeContainer}>
              <View style={styles.radialCircle}>
                <Text style={styles.radialCircleText}>{passRate}%</Text>
                <Text style={styles.radialCircleSub}>Pass Rate</Text>
              </View>
              <View style={styles.radialInsightsContainer}>
                <View style={styles.averagePassAlert}>
                  <Text style={styles.averagePassText}>
                    {passRate >= 70 
                      ? `Average — more than 70% students passed this course history.` 
                      : `Alert — less than 70% students passed this course history.`
                    }
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Charts Row */}
          <View style={[styles.chartsRow, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
            {/* Bar Chart */}
            <View style={[styles.chartCard, { flex: 1.5 }]}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Grade Distribution Breakdown</Text>
                <Text style={styles.chartSubtitle}>BAR CHART</Text>
              </View>
              
              <View style={styles.barChartContainer}>
                {/* Y-axis labels and grids */}
                <View style={styles.yAxisGrid}>
                  {yAxisTicks.map((tick, idx) => (
                    <View key={idx} style={styles.gridLineRow}>
                      <Text style={styles.yAxisLabel}>{tick}</Text>
                      <View style={styles.gridLine} />
                    </View>
                  ))}
                </View>
                
                {/* Bars */}
                <View style={styles.barsArea}>
                  {barGrades.map((g, idx) => {
                    const percentage = maxCount > 0 ? (g.count / maxCount) * 100 : 0;
                    return (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.barColumn}
                        onPress={() => setActiveBarIdx(activeBarIdx === idx ? null : idx)}
                        activeOpacity={0.8}
                      >
                        {activeBarIdx === idx && (
                          <View style={styles.barTooltip}>
                            <Text style={styles.tooltipText}>{g.label}</Text>
                            <Text style={styles.tooltipSubtext}>count : {g.count}</Text>
                            <View style={styles.tooltipArrow} />
                          </View>
                        )}
                        <View style={styles.barTrack}>
                          <View 
                            style={[
                              styles.barFill, 
                              { 
                                height: `${percentage || 1}%`, 
                                backgroundColor: g.color 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.barLabel}>{g.label.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Donut Chart */}
            <View style={[styles.chartCard, { flex: 1 }]}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Grade Contribution Share</Text>
                <Text style={styles.chartSubtitle}>PIE CHART</Text>
              </View>
              
              <View style={styles.donutContainer}>
                <DonutChart grades={grades} totalStuds={totalStuds} />

                {/* Legend Grid with progress percentages */}
                <View style={[styles.legendGrid, { marginTop: 24 }]}>
                  {barGrades.map((g, idx) => {
                    const pct = totalStuds > 0 ? Math.round((g.count / totalStuds) * 100) : 0;
                    return (
                      <View key={idx} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: g.color }]} />
                        <Text style={styles.legendText}>
                          {g.label.split(' ')[0]}: <Text style={{ fontWeight: 'bold' }}>{g.count}</Text> ({pct}%)
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Outcome Table & Academic Review Row */}
          <View style={[styles.bottomRow, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
            {/* Left Column: Outcome Table */}
            <View style={[styles.chartCard, { flex: 1 }]}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderTitle}>Outcome Table</Text>
              </View>
              
              <View style={styles.tableContainer}>
                <View style={styles.tableRowHeader}>
                  <Text style={[styles.tableColLabel, { flex: 2 }]}>GRADE</Text>
                  <Text style={[styles.tableColLabel, { flex: 1, textAlign: 'center' }]}>STUDENTS</Text>
                  <Text style={[styles.tableColLabel, { flex: 1, textAlign: 'right' }]}>PERCENTAGE</Text>
                </View>
                
                {barGrades.map((g, idx) => {
                  const percentage = totalStuds > 0 ? Math.round((g.count / totalStuds) * 100) : 0;
                  return (
                    <View key={idx} style={styles.tableRow}>
                      <View style={[styles.tableCellGrade, { flex: 2 }]}>
                        <View style={[styles.legendDot, { backgroundColor: g.color }]} />
                        <Text style={styles.gradeRowName}>{g.label}</Text>
                      </View>
                      <Text style={[styles.gradeRowValue, { flex: 1, textAlign: 'center' }]}>{g.count}</Text>
                      <Text style={[styles.gradeRowPercent, { flex: 1, textAlign: 'right' }]}>{percentage}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Right Column: Academic Review */}
            <View style={[styles.chartCard, { flex: 1.5 }]}>
              <View style={styles.academicHeader}>
                <Text style={styles.tableHeaderTitle}>Academic Review & Recommendations</Text>
                <View style={[
                  styles.perfBadge, 
                  { 
                    backgroundColor: passRate >= 80 ? '#ecfdf5' : passRate >= 60 ? '#fffbeb' : '#fff5f5',
                    borderColor: passRate >= 80 ? '#a7f3d0' : passRate >= 60 ? '#fde68a' : '#fecaca'
                  }
                ]}>
                  <Text style={[
                    styles.perfBadgeText,
                    { color: passRate >= 80 ? '#047857' : passRate >= 60 ? '#b45309' : '#b91c1c' }
                  ]}>
                    {passRate >= 80 ? 'EXCELLENT' : passRate >= 60 ? 'GOOD' : 'NEEDS ATTENTION'}
                  </Text>
                </View>
              </View>

              <View style={styles.recommendationsContent}>
                <Text style={styles.evalHeading}>Teaching Methodology Evaluation</Text>
                <Text style={styles.evalParagraph}>
                  Based on the grade metrics, {passStuds} students successfully completed the course requirements out of {totalStuds} total enrolled.
                  There were {failCount} student failures ({Math.round((failCount / totalStuds) * 100)}% of the class), indicating specific conceptual barriers in the syllabus that should be evaluated.
                </Text>

                {/* Strategic insights box */}
                <View style={styles.insightsBox}>
                  <View style={styles.insightsHeader}>
                    <Ionicons name="bulb-outline" size={16} color="#047857" style={{ marginRight: 6 }} />
                    <Text style={styles.insightsTitle}>STRATEGIC INSIGHTS FOR FUTURE SEMESTERS</Text>
                  </View>
                  <Text style={styles.insightsText}>
                    {passRate >= 80 
                      ? 'The course shows excellent student outcomes. Consider introducing advanced topics or independent projects to further stimulate high performers.' 
                      : 'The course shows sound performance. Keep monitoring student participation & provide micro-quizzes or bridge assignments to target minor learning gaps.'
                    }
                  </Text>
                </View>

                {/* Syllabus note */}
                <View style={styles.syllabusNoteRow}>
                  <Ionicons name="book-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
                  <Text style={styles.syllabusNoteText}>
                    To modify grade inputs or update course syllabus info, navigate back to the <Text style={{ fontWeight: '600' }}>Course Management</Text> panel and update the database record.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay as any}>
          <View style={[styles.modalCard as any, isLargeScreen && { width: 550 } as any]}>
            <View style={styles.modalHeader as any}>
              <Text style={styles.modalTitle as any}>Edit Course Record</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll as any}>
              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Course Full Name</Text>
                <TextInput
                  style={styles.formInput as any}
                  value={editCourseName}
                  onChangeText={setEditCourseName}
                  placeholder="e.g. Computer Science Fundamentals"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formRow as any}>
                <View style={[styles.formGroup as any, { flex: 1 }]}>
                  <Text style={styles.formLabel as any}>Class Slot</Text>
                  <TextInput
                    style={styles.formInput as any}
                    value={editSlot}
                    onChangeText={setEditSlot}
                    placeholder="e.g. A1"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={[styles.formGroup as any, { flex: 1.5 }]}>
                  <Text style={styles.formLabel as any}>Exam Type</Text>
                  <TextInput
                    style={styles.formInput as any}
                    value={editExamType}
                    onChangeText={setEditExamType}
                    placeholder="e.g. Final Exam"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Completion Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.formInput as any}
                  value={editCompletionDate}
                  onChangeText={setEditCompletionDate}
                  placeholder="e.g. 2026-05-23"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <Text style={styles.gradeSectionTitle as any}>Grade Counters</Text>
              <View style={styles.gridFormRow as any}>
                <View style={styles.gridFormItem as any}>
                  <Text style={styles.gridFormLabel as any}>S Grades</Text>
                  <TextInput
                    style={styles.gridFormInput as any}
                    keyboardType="numeric"
                    value={editSGrades}
                    onChangeText={setEditSGrades}
                  />
                </View>
                <View style={styles.gridFormItem as any}>
                  <Text style={styles.gridFormLabel as any}>A Grades</Text>
                  <TextInput
                    style={styles.gridFormInput as any}
                    keyboardType="numeric"
                    value={editAGrades}
                    onChangeText={setEditAGrades}
                  />
                </View>
                <View style={styles.gridFormItem as any}>
                  <Text style={styles.gridFormLabel as any}>B Grades</Text>
                  <TextInput
                    style={styles.gridFormInput as any}
                    keyboardType="numeric"
                    value={editBGrades}
                    onChangeText={setEditBGrades}
                  />
                </View>
              </View>

              <View style={styles.gridFormRow as any}>
                <View style={styles.gridFormItem as any}>
                  <Text style={styles.gridFormLabel as any}>C Grades</Text>
                  <TextInput
                    style={styles.gridFormInput as any}
                    keyboardType="numeric"
                    value={editCGrades}
                    onChangeText={setEditCGrades}
                  />
                </View>
                <View style={styles.gridFormItem as any}>
                  <Text style={styles.gridFormLabel as any}>D Grades</Text>
                  <TextInput
                    style={styles.gridFormInput as any}
                    keyboardType="numeric"
                    value={editDGrades}
                    onChangeText={setEditDGrades}
                  />
                </View>
                <View style={styles.gridFormItem as any}>
                  <Text style={styles.gridFormLabel as any}>E Grades</Text>
                  <TextInput
                    style={styles.gridFormInput as any}
                    keyboardType="numeric"
                    value={editEGrades}
                    onChangeText={setEditEGrades}
                  />
                </View>
              </View>

              <View style={styles.gridFormRow as any}>
                <View style={[styles.gridFormItem as any, { maxWidth: '31%' }]}>
                  <Text style={styles.gridFormLabel as any}>Fail Grades</Text>
                  <TextInput
                    style={styles.gridFormInput as any}
                    keyboardType="numeric"
                    value={editFailGrades}
                    onChangeText={setEditFailGrades}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter as any}>
              <TouchableOpacity 
                style={styles.modalCancelBtn as any} 
                onPress={() => setIsEditModalVisible(false)}
                disabled={saveLoading}
              >
                <Text style={styles.modalCancelBtnText as any}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn as any} 
                onPress={handleUpdateCourse}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveBtnText as any}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBackBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a1930',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  mainWrapper: {
    maxWidth: '100%',
    gap: 24,
  },
  detailsCard: {
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
    alignItems: 'center',
  },
  bannerIconWrapper: {
    marginBottom: 16,
  },
  bannerIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTitleCentered: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a1930',
    marginBottom: 6,
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: '85%',
  },
  deptTextCentered: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 18,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaeaea',
    marginTop: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#475569',
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a1930',
  },
  perfGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  perfBox: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  perfIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  perfValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  perfLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  radialGaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  radialCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  radialCircleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1930',
  },
  radialCircleSub: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  radialInsightsContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  averagePassAlert: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averagePassText: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  chartsRow: {
    gap: 20,
    width: '100%',
  },
  bottomRow: {
    gap: 20,
    width: '100%',
  },
  chartCard: {
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  chartSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  barChartContainer: {
    height: 200,
    position: 'relative',
    flexDirection: 'row',
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
    width: 20,
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
    marginLeft: 28,
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
    position: 'relative',
  },
  barTrack: {
    flex: 1,
    width: 14,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  barTooltip: {
    position: 'absolute',
    bottom: '90%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 99,
    minWidth: 80,
  },
  tooltipText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
  },
  tooltipSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 1,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -4,
    width: 8,
    height: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    transform: [{ rotate: '45deg' }],
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  donutHole: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ffffff',
  },
  stackedBarContainer: {
    height: 24,
    width: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stackedBarSegment: {
    height: '100%',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '28%',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 12,
    marginBottom: 16,
  },
  tableHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tableContainer: {
    width: '100%',
  },
  tableRowHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 6,
  },
  tableColLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  tableCellGrade: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeRowName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  gradeRowValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  gradeRowPercent: {
    fontSize: 12,
    color: '#64748b',
  },
  academicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 12,
    marginBottom: 16,
  },
  perfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  perfBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recommendationsContent: {
    gap: 16,
  },
  evalHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  evalParagraph: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  insightsBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 16,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  insightsText: {
    fontSize: 12,
    color: '#14532d',
    lineHeight: 18,
  },
  syllabusNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  syllabusNoteText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    flex: 1,
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
    marginBottom: 4,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 4,
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
  gradeSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0a1930',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  gridFormRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 8,
  },
  gridFormItem: {
    flex: 1,
    gap: 4,
  },
  gridFormLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  gridFormInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    textAlign: 'center',
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
