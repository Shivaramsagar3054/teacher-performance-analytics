import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Platform,
  useWindowDimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { authApi, teachersApi, educationApi, researchInterestsApi, getImageUrl } from '../../services/api';

export default function TeacherSettings() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const contentWidth = isLargeScreen ? width - 290 : width;
  const router = useRouter();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Edit Profile States & Fetching
  const [teacher, setTeacher] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'education' | 'research'>('details');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  // Basic Profile details states
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBiography, setEditBiography] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Education Details form states
  const [isEduFormVisible, setIsEduFormVisible] = useState(false);
  const [selectedEdu, setSelectedEdu] = useState<any | null>(null);
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduInstitution, setEduInstitution] = useState('');
  const [eduUniversity, setEduUniversity] = useState('');
  const [eduStartYear, setEduStartYear] = useState('');
  const [eduEndYear, setEduEndYear] = useState('');
  const [eduGrade, setEduGrade] = useState('');

  // Research Interests form states
  const [isResearchFormVisible, setIsResearchFormVisible] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<any | null>(null);
  const [researchTopic, setResearchTopic] = useState('');

  const fetchFreshTeacher = async (teacherId: number) => {
    try {
      const fresh = await teachersApi.getById(teacherId);
      setTeacher(fresh);
      await AsyncStorage.setItem('teacherProfile', JSON.stringify(fresh));
    } catch (err) {
      console.warn('Failed to load fresh teacher details:', err);
    }
  };

  useEffect(() => {
    const loadTeacher = async () => {
      try {
        const profile = await authApi.getProfile();
        setUserProfile(profile);

        const cached = await AsyncStorage.getItem('teacherProfile');
        let currentTeacher = null;
        if (cached) {
          const parsed = JSON.parse(cached);
          setTeacher(parsed);
          currentTeacher = parsed;
          if (parsed && parsed.id) {
            try {
              const fresh = await teachersApi.getById(parsed.id);
              setTeacher(fresh);
              currentTeacher = fresh;
              await AsyncStorage.setItem('teacherProfile', JSON.stringify(fresh));
            } catch (err) {
              console.warn('Failed to load fresh teacher details:', err);
            }
          }
        } else {
          let matchedTeacher = profile.teacher_profile || null;
          if (!matchedTeacher) {
            const res = await teachersApi.getAll({ user_id: profile.id });
            const results = res.results || (Array.isArray(res) ? res : []);
            matchedTeacher = results.find((t: any) => t.user?.id === profile.id) || results[0] || null;
          }
          if (matchedTeacher) {
            const detailed = await teachersApi.getById(matchedTeacher.id);
            setTeacher(detailed);
            currentTeacher = detailed;
            await AsyncStorage.setItem('teacherProfile', JSON.stringify(detailed));
          }
        }

        // Check if we need to auto-open the edit modal
        const autoOpen = await AsyncStorage.getItem('autoOpenEditProfile');
        if (autoOpen === 'true') {
          await AsyncStorage.removeItem('autoOpenEditProfile');
          handleOpenEditModal(currentTeacher || { user: profile });
        }
      } catch (err) {
        console.warn('Failed to load profile for settings:', err);
      }
    };
    loadTeacher();
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') alert('Media library permission is required to choose an image.');
        else Alert.alert('Permission Denied', 'Media library permission is required to choose an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setProfileImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Failed to pick profile image:', err);
    }
  };

  const showValidationError = (msg: string) => {
    if (Platform.OS === 'web') alert(msg);
    else Alert.alert('Validation Error', msg);
  };

  const handleOpenEditModal = (overrideTeacher?: any) => {
    // Check if the argument is a Gesture Responder Event from onPress
    const isGestureEvent = overrideTeacher && (overrideTeacher.nativeEvent || overrideTeacher.target || typeof overrideTeacher.preventDefault === 'function');
    const validTeacher = isGestureEvent ? null : overrideTeacher;
    
    const activeTeacher = validTeacher || teacher || (userProfile ? { user: userProfile } : null);
    if (activeTeacher) {
      setEditFirstName(activeTeacher.first_name || activeTeacher.user?.first_name || '');
      setEditLastName(activeTeacher.last_name || activeTeacher.user?.last_name || '');
      setEditDepartment(activeTeacher.department || '');
      setEditPosition(activeTeacher.position || '');
      setEditPhoneNumber(activeTeacher.phone_number || '');
      setEditLocation(activeTeacher.location || '');
      setEditBiography(activeTeacher.biography || '');
      setEditExperience(String(activeTeacher.years_of_experience || '0'));
      setProfileImageUri(activeTeacher.profile_image ? getImageUrl(activeTeacher.profile_image) : null);
      setActiveTab('details');
      setIsEditModalVisible(true);
    } else {
      if (Platform.OS === 'web') alert('Could not load teacher profile. Please make sure you are logged in.');
      else Alert.alert('Error', 'Could not load teacher profile. Please make sure you are logged in.');
    }
  };

  const handleSaveProfile = async () => {
    if (!teacher && !userProfile) {
      showValidationError('User profile details not found. Please log in again.');
      return;
    }

    // Field Validations
    if (!editFirstName.trim()) {
      showValidationError('First name is required.');
      return;
    }
    if (!editLastName.trim()) {
      showValidationError('Last name is required.');
      return;
    }
    if (!editDepartment.trim()) {
      showValidationError('Department is required.');
      return;
    }
    if (!editPosition.trim()) {
      showValidationError('Designation/position is required.');
      return;
    }
    
    const expNum = parseInt(editExperience);
    if (isNaN(expNum) || expNum < 0 || expNum > 60) {
      showValidationError('Years of experience must be a valid number between 0 and 60.');
      return;
    }
    
    if (!editPhoneNumber.trim()) {
      showValidationError('Phone number is required.');
      return;
    }
    const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
    if (!phoneRegex.test(editPhoneNumber.trim())) {
      showValidationError('Please enter a valid phone number (7 to 15 digits).');
      return;
    }
    
    if (!editLocation.trim()) {
      showValidationError('Office location is required.');
      return;
    }
    
    if (!editBiography.trim() || editBiography.trim().length < 10) {
      showValidationError('Biography is required and must be at least 10 characters.');
      return;
    }

    try {
      setSaveLoading(true);
      
      let payload: any;
      const isNewImage = profileImageUri && !profileImageUri.startsWith('http');

      if (isNewImage) {
        const formData = new FormData();
        formData.append('first_name', editFirstName.trim());
        formData.append('last_name', editLastName.trim());
        formData.append('department', editDepartment.trim());
        formData.append('position', editPosition.trim());
        formData.append('phone_number', editPhoneNumber.trim());
        formData.append('location', editLocation.trim());
        formData.append('biography', editBiography.trim());
        formData.append('years_of_experience', String(expNum));
        
        if (!teacher) {
          formData.append('user_id', String(userProfile.id));
        }

        if (Platform.OS === 'web') {
          const response = await fetch(profileImageUri!);
          const blob = await response.blob();
          formData.append('profile_image', blob, 'profile.jpg');
        } else {
          const filename = profileImageUri!.split('/').pop() || 'profile.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('profile_image', {
            uri: profileImageUri,
            name: filename,
            type
          } as any);
        }
        payload = formData;
      } else {
        payload = {
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          department: editDepartment.trim(),
          position: editPosition.trim(),
          phone_number: editPhoneNumber.trim(),
          location: editLocation.trim(),
          biography: editBiography.trim(),
          years_of_experience: expNum
        };
        if (!teacher) {
          payload.user_id = userProfile.id;
        }
      }

      let res;
      if (teacher && teacher.id) {
        res = await teachersApi.patch(teacher.id, payload);
      } else {
        res = await teachersApi.create(payload);
      }

      const fullyUpdatedTeacher = { ...teacher, ...res };
      setTeacher(fullyUpdatedTeacher);
      await AsyncStorage.setItem('teacherProfile', JSON.stringify(fullyUpdatedTeacher));
      if (fullyUpdatedTeacher.id) {
        await AsyncStorage.setItem('teacher_id', String(fullyUpdatedTeacher.id));
      }
      setIsEditModalVisible(false);
      
      if (Platform.OS === 'web') {
        alert('Profile updated successfully!');
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errMsg = err.message || 'An error occurred while updating your profile. Please try again.';
      if (Platform.OS === 'web') {
        alert(errMsg);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // Education CRUD Handlers
  const handleOpenAddEdu = () => {
    setSelectedEdu(null);
    setEduDegree('');
    setEduField('');
    setEduInstitution('');
    setEduUniversity('');
    setEduStartYear('');
    setEduEndYear('');
    setEduGrade('');
    setIsEduFormVisible(true);
  };

  const handleOpenEditEdu = (edu: any) => {
    setSelectedEdu(edu);
    setEduDegree(edu.degree || '');
    setEduField(edu.field_of_study || '');
    setEduInstitution(edu.institution_name || '');
    setEduUniversity(edu.university_name || '');
    setEduStartYear(String(edu.start_year || ''));
    setEduEndYear(String(edu.end_year || ''));
    setEduGrade(edu.gradeOrCgpa || edu.grade || '');
    setIsEduFormVisible(true);
  };

  const handleSaveEdu = async () => {
    if (!teacher) return;

    // Field Validations
    if (!eduDegree.trim()) {
      showValidationError('Degree is required (e.g. B.E, M.Tech, Ph.D).');
      return;
    }
    if (!eduField.trim()) {
      showValidationError('Field of study is required (e.g. Computer Science).');
      return;
    }
    if (!eduInstitution.trim()) {
      showValidationError('Institution name is required.');
      return;
    }

    const startY = parseInt(eduStartYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(startY) || startY < 1950 || startY > currentYear + 10) {
      showValidationError('Please enter a valid start year (e.g. 2015).');
      return;
    }

    const endY = parseInt(eduEndYear);
    if (isNaN(endY) || endY < 1950 || endY > currentYear + 10) {
      showValidationError('Please enter a valid end year (e.g. 2019).');
      return;
    }

    if (endY < startY) {
      showValidationError('End year cannot be earlier than start year.');
      return;
    }

    if (!eduGrade.trim()) {
      showValidationError('Grade or CGPA is required.');
      return;
    }

    try {
      setSaveLoading(true);
      const payload = {
        teacher: teacher.id,
        degree: eduDegree.trim(),
        field_of_study: eduField.trim(),
        institution_name: eduInstitution.trim(),
        university_name: eduUniversity.trim(),
        start_year: startY,
        end_year: endY,
        grade: eduGrade.trim(),
        gradeOrCgpa: eduGrade.trim()
      };

      if (selectedEdu) {
        await educationApi.patch(selectedEdu.id, payload);
      } else {
        await educationApi.create(payload);
      }

      await fetchFreshTeacher(teacher.id);
      setIsEduFormVisible(false);

      const msg = selectedEdu ? 'Education details updated successfully!' : 'Education details added successfully!';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Success', msg);
    } catch (err: any) {
      console.error('Failed to save education details:', err);
      const msg = err.message || 'Failed to save education details. Please try again.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteEdu = (eduId: number) => {
    const confirmDelete = async () => {
      try {
        setSaveLoading(true);
        await educationApi.delete(eduId);
        await fetchFreshTeacher(teacher.id);
        const msg = 'Education history item deleted successfully!';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Success', msg);
      } catch (err: any) {
        console.error('Failed to delete education:', err);
        const msg = err.message || 'Failed to delete education item. Please try again.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Error', msg);
      } finally {
        setSaveLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this education record?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this education record?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  // Research CRUD Handlers
  const handleOpenAddResearch = () => {
    setSelectedResearch(null);
    setResearchTopic('');
    setIsResearchFormVisible(true);
  };

  const handleOpenEditResearch = (ri: any) => {
    setSelectedResearch(ri);
    setResearchTopic(ri.topic || '');
    setIsResearchFormVisible(true);
  };

  const handleSaveResearch = async () => {
    if (!teacher) return;
    if (!researchTopic.trim()) {
      showValidationError('Research topic/area is required.');
      return;
    }
    if (researchTopic.trim().length < 3) {
      showValidationError('Research topic must be at least 3 characters long.');
      return;
    }

    try {
      setSaveLoading(true);
      const payload = {
        teacher: teacher.id,
        topic: researchTopic.trim()
      };

      if (selectedResearch) {
        await researchInterestsApi.patch(selectedResearch.id, payload);
      } else {
        await researchInterestsApi.create(payload);
      }

      await fetchFreshTeacher(teacher.id);
      setIsResearchFormVisible(false);

      const msg = selectedResearch ? 'Research interest updated successfully!' : 'Research interest added successfully!';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Success', msg);
    } catch (err: any) {
      console.error('Failed to save research interest:', err);
      const msg = err.message || 'Failed to save research interest. Please try again.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteResearch = (riId: number) => {
    const confirmDelete = async () => {
      try {
        setSaveLoading(true);
        await researchInterestsApi.delete(riId);
        await fetchFreshTeacher(teacher.id);
        const msg = 'Research interest deleted successfully!';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Success', msg);
      } catch (err: any) {
        console.error('Failed to delete research interest:', err);
        const msg = err.message || 'Failed to delete research interest. Please try again.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Error', msg);
      } finally {
        setSaveLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this research interest?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this research interest?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refresh_token');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const renderSettingItem = (
    icon: any, 
    title: string, 
    subtitle?: string, 
    type: 'link' | 'switch' | 'danger' = 'link', 
    value?: boolean, 
    onValueChange?: (val: boolean) => void,
    onPress?: () => void
  ) => {
    const isDanger = type === 'danger';
    return (
      <TouchableOpacity 
        style={styles.settingItem} 
        disabled={type === 'switch'}
        onPress={onPress}
      >
        <View style={[styles.settingIconContainer, isDanger && styles.settingIconDanger]}>
          <Ionicons name={icon} size={22} color={isDanger ? '#ef4444' : '#3b82f6'} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, isDanger && styles.settingTitleDanger]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {type === 'link' && <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />}
        {type === 'danger' && <Ionicons name="log-out-outline" size={20} color="#ef4444" />}
        {type === 'switch' && (
          <Switch
            trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
            thumbColor={Platform.OS === 'ios' ? '#ffffff' : (value ? '#ffffff' : '#f8fafc')}
            onValueChange={onValueChange}
            value={value}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, { width: contentWidth }]}>
          
          {/* Account */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.settingsGroup}>
              {renderSettingItem('person-outline', 'Edit Profile', 'Update biography, position, location & phone', 'link', undefined, undefined, () => handleOpenEditModal())}
            </View>
          </View>

          {/* Security */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.settingsGroup}>
              {renderSettingItem(
                'lock-closed-outline', 
                'Change Password', 
                'Manage your security credentials', 
                'link', 
                undefined, 
                undefined, 
                () => router.push('/(teacher)/change-password')
              )}
            </View>
          </View>

          {/* Support */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.settingsGroup}>
              {renderSettingItem('document-text-outline', 'Terms & Service Policies')}
            </View>
          </View>

          {/* Logout */}
          <View style={styles.sectionContainer}>
            <View style={styles.settingsGroup}>
              {renderSettingItem('power', 'Log Out', undefined, 'danger', undefined, undefined, handleLogout)}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay as any}>
          <View style={[styles.modalCard as any, isLargeScreen && { width: 600 } as any]}>
            {/* Modal Header */}
            <View style={styles.modalHeader as any}>
              <Text style={styles.modalTitle as any}>Edit Professional Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Premium Tab Bar Segment Controls */}
            <View style={styles.tabContainer as any}>
              <TouchableOpacity 
                style={[styles.tabButton as any, activeTab === 'details' && styles.tabButtonActive as any]}
                onPress={() => setActiveTab('details')}
              >
                <Ionicons name="person-outline" size={16} color={activeTab === 'details' ? '#3b82f6' : '#64748b'} />
                <Text style={[styles.tabButtonText as any, activeTab === 'details' && styles.tabButtonTextActive as any]}>
                  Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.tabButton as any, activeTab === 'education' && styles.tabButtonActive as any]}
                onPress={() => setActiveTab('education')}
              >
                <Ionicons name="school-outline" size={16} color={activeTab === 'education' ? '#3b82f6' : '#64748b'} />
                <Text style={[styles.tabButtonText as any, activeTab === 'education' && styles.tabButtonTextActive as any]}>
                  Education
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.tabButton as any, activeTab === 'research' && styles.tabButtonActive as any]}
                onPress={() => setActiveTab('research')}
              >
                <Ionicons name="flask-outline" size={16} color={activeTab === 'research' ? '#3b82f6' : '#64748b'} />
                <Text style={[styles.tabButtonText as any, activeTab === 'research' && styles.tabButtonTextActive as any]}>
                  Research
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll as any}>
              {activeTab === 'details' && (
                <View style={{ gap: 16 }}>
                  {/* Profile Image Picker */}
                  <View style={{ alignItems: 'center', marginBottom: 8 }}>
                    <TouchableOpacity style={styles.avatarPickerContainer} onPress={pickImage}>
                      {profileImageUri ? (
                        <Image source={{ uri: profileImageUri }} style={styles.avatarPickerImage} />
                      ) : (
                        <View style={styles.avatarPickerPlaceholder}>
                          <Ionicons name="camera-outline" size={32} color="#94a3b8" />
                          <Text style={styles.avatarPickerPlaceholderText}>Upload</Text>
                        </View>
                      )}
                      <View style={styles.avatarPickerBadge}>
                        <Ionicons name="pencil" size={12} color="#ffffff" />
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.avatarPickerLabel}>Profile Picture</Text>
                  </View>

                  <View style={styles.formRow as any}>
                    <View style={[styles.formGroup as any, { flex: 1 }]}>
                      <Text style={styles.formLabel as any}>First Name</Text>
                      <TextInput
                        style={styles.formInput as any}
                        value={editFirstName}
                        onChangeText={setEditFirstName}
                        placeholder="e.g. Shiva"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={[styles.formGroup as any, { flex: 1 }]}>
                      <Text style={styles.formLabel as any}>Last Name</Text>
                      <TextInput
                        style={styles.formInput as any}
                        value={editLastName}
                        onChangeText={setEditLastName}
                        placeholder="e.g. Kumar"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow as any}>
                    <View style={[styles.formGroup as any, { flex: 1.5 }]}>
                      <Text style={styles.formLabel as any}>Department</Text>
                      <TextInput
                        style={styles.formInput as any}
                        value={editDepartment}
                        onChangeText={setEditDepartment}
                        placeholder="e.g. Computer Science"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={[styles.formGroup as any, { flex: 1 }]}>
                      <Text style={styles.formLabel as any}>Designation</Text>
                      <TextInput
                        style={styles.formInput as any}
                        value={editPosition}
                        onChangeText={setEditPosition}
                        placeholder="e.g. Professor"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow as any}>
                    <View style={[styles.formGroup as any, { flex: 1 }]}>
                      <Text style={styles.formLabel as any}>Experience (Years)</Text>
                      <TextInput
                        style={styles.formInput as any}
                        value={editExperience}
                        onChangeText={setEditExperience}
                        placeholder="e.g. 10"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.formGroup as any, { flex: 1.5 }]}>
                      <Text style={styles.formLabel as any}>Phone Number</Text>
                      <TextInput
                        style={styles.formInput as any}
                        value={editPhoneNumber}
                        onChangeText={setEditPhoneNumber}
                        placeholder="e.g. +91 94440 12345"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup as any}>
                    <Text style={styles.formLabel as any}>Office Location</Text>
                    <TextInput
                      style={styles.formInput as any}
                      value={editLocation}
                      onChangeText={setEditLocation}
                      placeholder="e.g. Block C, Cabin 402"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.formGroup as any}>
                    <Text style={styles.formLabel as any}>Biography</Text>
                    <TextInput
                      style={[styles.formInput as any, styles.formTextArea as any]}
                      value={editBiography}
                      onChangeText={setEditBiography}
                      placeholder="Describe your research, teaching philosophy, and background..."
                      placeholderTextColor="#94a3b8"
                      multiline={true}
                      numberOfLines={4}
                    />
                  </View>
                </View>
              )}

              {activeTab === 'education' && (
                <View style={{ gap: 16 }}>
                  <View style={styles.sectionHeaderRow as any}>
                    <Text style={styles.tabSectionTitle as any}>Education History</Text>
                    <TouchableOpacity style={styles.addInlineBtn as any} onPress={handleOpenAddEdu}>
                      <Ionicons name="add" size={16} color="#ffffff" />
                      <Text style={styles.addInlineBtnText as any}>Add Details</Text>
                    </TouchableOpacity>
                  </View>

                  {teacher && teacher.education_list && teacher.education_list.length > 0 ? (
                    teacher.education_list.map((edu: any, index: number) => (
                      <View key={edu.id || index} style={styles.listItemCard as any}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listItemTitle as any}>
                            {edu.degree} in {edu.field_of_study}
                          </Text>
                          <Text style={styles.listItemSubtitle as any}>{edu.institution_name}</Text>
                          <Text style={styles.listItemMeta as any}>
                            {edu.start_year} - {edu.end_year} | CGPA/Grade: {edu.gradeOrCgpa || edu.grade}
                          </Text>
                        </View>
                        <View style={styles.listItemActions as any}>
                          <TouchableOpacity onPress={() => handleOpenEditEdu(edu)} style={styles.actionIconBtn as any}>
                            <Ionicons name="pencil" size={16} color="#3b82f6" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteEdu(edu.id)} style={[styles.actionIconBtn as any, { backgroundColor: '#fef2f2' } as any]}>
                            <Ionicons name="trash" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyInlineText as any}>No education history listed. Click "Add Details" to add.</Text>
                  )}
                </View>
              )}

              {activeTab === 'research' && (
                <View style={{ gap: 16 }}>
                  <View style={styles.sectionHeaderRow as any}>
                    <Text style={styles.tabSectionTitle as any}>Research Interests</Text>
                    <TouchableOpacity style={styles.addInlineBtn as any} onPress={handleOpenAddResearch}>
                      <Ionicons name="add" size={16} color="#ffffff" />
                      <Text style={styles.addInlineBtnText as any}>Add Topic</Text>
                    </TouchableOpacity>
                  </View>

                  {teacher && teacher.research_interests && teacher.research_interests.length > 0 ? (
                    teacher.research_interests.map((ri: any, index: number) => (
                      <View key={ri.id || index} style={styles.listItemCard as any}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="flask-outline" size={16} color="#3b82f6" />
                          <Text style={styles.riTopicText as any}>{ri.topic}</Text>
                        </View>
                        <View style={styles.listItemActions as any}>
                          <TouchableOpacity onPress={() => handleOpenEditResearch(ri)} style={styles.actionIconBtn as any}>
                            <Ionicons name="pencil" size={16} color="#3b82f6" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteResearch(ri.id)} style={[styles.actionIconBtn as any, { backgroundColor: '#fef2f2' } as any]}>
                            <Ionicons name="trash" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyInlineText as any}>No research interests listed. Click "Add Topic" to add.</Text>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter as any}>
              {activeTab === 'details' ? (
                <>
                  <TouchableOpacity 
                    style={styles.modalCancelBtn as any} 
                    onPress={() => setIsEditModalVisible(false)}
                    disabled={saveLoading}
                  >
                    <Text style={styles.modalCancelBtnText as any}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalSaveBtn as any} 
                    onPress={handleSaveProfile}
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.modalSaveBtnText as any}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.modalSaveBtn as any, { backgroundColor: '#64748b', minWidth: 80 } as any]} 
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <Text style={styles.modalSaveBtnText as any}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Secondary Modal: Add/Edit Education Form */}
      <Modal
        visible={isEduFormVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEduFormVisible(false)}
      >
        <View style={styles.modalOverlay as any}>
          <View style={[styles.modalCard as any, { width: '90%', maxHeight: '80%' } as any, isLargeScreen && { width: 450 } as any]}>
            <View style={styles.modalHeader as any}>
              <Text style={styles.modalTitle as any}>
                {selectedEdu ? 'Edit Education Details' : 'Add Education Details'}
              </Text>
              <TouchableOpacity onPress={() => setIsEduFormVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll as any}>
              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Degree *</Text>
                <TextInput
                  style={styles.formInput as any}
                  value={eduDegree}
                  onChangeText={setEduDegree}
                  placeholder="e.g. Ph.D, M.Tech, B.E"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Field of Study *</Text>
                <TextInput
                  style={styles.formInput as any}
                  value={eduField}
                  onChangeText={setEduField}
                  placeholder="e.g. Computer Science, Robotics"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Institution Name *</Text>
                <TextInput
                  style={styles.formInput as any}
                  value={eduInstitution}
                  onChangeText={setEduInstitution}
                  placeholder="e.g. SIMATS"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>University Name (Optional)</Text>
                <TextInput
                  style={styles.formInput as any}
                  value={eduUniversity}
                  onChangeText={setEduUniversity}
                  placeholder="e.g. Anna University"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formRow as any}>
                <View style={[styles.formGroup as any, { flex: 1 }]}>
                  <Text style={styles.formLabel as any}>Start Year *</Text>
                  <TextInput
                    style={styles.formInput as any}
                    value={eduStartYear}
                    onChangeText={setEduStartYear}
                    placeholder="e.g. 2015"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup as any, { flex: 1 }]}>
                  <Text style={styles.formLabel as any}>End Year *</Text>
                  <TextInput
                    style={styles.formInput as any}
                    value={eduEndYear}
                    onChangeText={setEduEndYear}
                    placeholder="e.g. 2019"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Grade / CGPA</Text>
                <TextInput
                  style={styles.formInput as any}
                  value={eduGrade}
                  onChangeText={setEduGrade}
                  placeholder="e.g. 9.2 CGPA or A+"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter as any}>
              <TouchableOpacity 
                style={styles.modalCancelBtn as any} 
                onPress={() => setIsEduFormVisible(false)}
                disabled={saveLoading}
              >
                <Text style={styles.modalCancelBtnText as any}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn as any} 
                onPress={handleSaveEdu}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveBtnText as any}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Secondary Modal: Add/Edit Research Topic Form */}
      <Modal
        visible={isResearchFormVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsResearchFormVisible(false)}
      >
        <View style={styles.modalOverlay as any}>
          <View style={[styles.modalCard as any, { width: '90%', maxHeight: '40%' } as any, isLargeScreen && { width: 450 } as any]}>
            <View style={styles.modalHeader as any}>
              <Text style={styles.modalTitle as any}>
                {selectedResearch ? 'Edit Research Topic' : 'Add Research Topic'}
              </Text>
              <TouchableOpacity onPress={() => setIsResearchFormVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll as any}>
              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Research Topic / Area *</Text>
                <TextInput
                  style={styles.formInput as any}
                  value={researchTopic}
                  onChangeText={setResearchTopic}
                  placeholder="e.g. Natural Language Processing, VLSI Design"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter as any}>
              <TouchableOpacity 
                style={styles.modalCancelBtn as any} 
                onPress={() => setIsResearchFormVisible(false)}
                disabled={saveLoading}
              >
                <Text style={styles.modalCancelBtnText as any}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn as any} 
                onPress={handleSaveResearch}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveBtnText as any}>Save</Text>
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
  header: {
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
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  mainWrapper: {
    maxWidth: '100%',
    gap: 24,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIconDanger: {
    backgroundColor: '#fef2f2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  settingTitleDanger: {
    color: '#ef4444',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 68,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 16,
    backgroundColor: '#ffffff',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#3b82f6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#3b82f6',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tabSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addInlineBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginTop: 2,
  },
  listItemMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  riTopicText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyInlineText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
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
  avatarPickerContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f1f5f9',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  avatarPickerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  avatarPickerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPickerPlaceholderText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  avatarPickerBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarPickerLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 6,
  },
});
