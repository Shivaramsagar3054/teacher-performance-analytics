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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { eventsApi, authApi, teachersApi, getImageUrl } from '../../services/api';

export default function TeacherEvents() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const contentWidth = isLargeScreen ? width - 290 : width;
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);

  // Event Form States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState('Seminar');
  const [eventDate, setEventDate] = useState('2026-06-15');
  const [eventStartTime, setEventStartTime] = useState('10:00');
  const [eventEndTime, setEventEndTime] = useState('12:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventRegistrationLink, setEventRegistrationLink] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Field-level validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!eventTitle.trim()) newErrors.title = 'Event title is required.';
    else if (eventTitle.trim().length < 4) newErrors.title = 'Title must be at least 4 characters.';

    if (!eventType.trim()) newErrors.type = 'Event type is required (e.g. Seminar, Workshop).';

    if (!eventLocation.trim()) newErrors.location = 'Venue / location is required.';

    if (!eventDate.trim()) {
      newErrors.date = 'Event date is required.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate.trim())) {
      newErrors.date = 'Date must be in YYYY-MM-DD format (e.g. 2026-06-15).';
    }

    if (!eventStartTime.trim()) {
      newErrors.startTime = 'Start time is required.';
    } else if (!/^\d{2}:\d{2}$/.test(eventStartTime.trim())) {
      newErrors.startTime = 'Start time must be in HH:MM format (e.g. 10:00).';
    }

    if (!eventEndTime.trim()) {
      newErrors.endTime = 'End time is required.';
    } else if (!/^\d{2}:\d{2}$/.test(eventEndTime.trim())) {
      newErrors.endTime = 'End time must be in HH:MM format (e.g. 12:00).';
    } else if (eventStartTime && eventEndTime && eventEndTime <= eventStartTime) {
      newErrors.endTime = 'End time must be after start time.';
    }

    if (eventRegistrationLink.trim() && !/^https?:\/\/.+/.test(eventRegistrationLink.trim())) {
      newErrors.regLink = 'Registration URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventType('Seminar');
    setEventDate('2026-06-15');
    setEventStartTime('10:00');
    setEventEndTime('12:00');
    setEventLocation('');
    setEventRegistrationLink('');
    setImageUri(null);
    setErrors({});
    setSubmitError(null);
  };

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
        allowsEditing: false,   // No cropping — take full image as-is
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Failed to pick image:', err);
    }
  };

  useEffect(() => {
    const loadTeacherAndEvents = async () => {
      try {
        setLoading(true);
        // Load teacher profile traversely across paginated results
        let matchedTeacher = null;
        try {
          const profile = await authApi.getProfile();
          
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
            await AsyncStorage.setItem('teacher_id', String(matchedTeacher.id));
            await AsyncStorage.setItem('teacherProfile', JSON.stringify(matchedTeacher));
          }
        } catch (tErr) {
          console.warn('Failed to fetch teacher profile context for organizer:', tErr);
        }

        // Fetch events for this teacher directly
        const teacherId = matchedTeacher ? matchedTeacher.id : null;
        let filteredEvents: any[] = [];
        if (teacherId) {
          const res = await eventsApi.getAll({ organizer_id: teacherId });
          filteredEvents = res.results || (Array.isArray(res) ? res : []);
        } else {
          const res = await eventsApi.getAll();
          filteredEvents = res.results || (Array.isArray(res) ? res : []);
        }
        setEvents(filteredEvents);
      } catch (err) {
        console.warn('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherAndEvents();
  }, []);

  const format24Hour = (t: string, defaultTime: string) => {
    if (!t || !t.trim()) return defaultTime;
    const clean = t.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const numOnly = clean.replace(/[^\d:]/g, '');
    const parts = numOnly.split(':');
    let h = parseInt(parts[0] || '9', 10);
    let m = parseInt(parts[1] || '0', 10);
    if (isNaN(h)) h = 9;
    if (isNaN(m)) m = 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleCreateEvent = async () => {
    setSubmitError(null);
    if (!validate()) return;  // stop if inline validation fails

    if (!teacher) {
      setSubmitError('Teacher profile is not loaded yet. Please close and reopen the form.');
      return;
    }
    
    try {
      setCreateLoading(true);
      
      // Build properly formatted ISO date-times (YYYY-MM-DDTHH:MM:00Z)
      const startTime = format24Hour(eventStartTime, '09:00');
      const endTime = format24Hour(eventEndTime, '17:00');
      const cleanDate = eventDate.trim();
      const startIso = `${cleanDate}T${startTime}:00Z`;
      const endIso = `${cleanDate}T${endTime}:00Z`;

      let payload: any;

      if (imageUri) {
        // Use FormData only when image is attached
        const formData = new FormData();
        formData.append('title', eventTitle.trim());
        formData.append('description', eventDescription?.trim() || 'No description provided.');
        formData.append('event_type', eventType?.trim() || 'Seminar');
        formData.append('start_date', startIso);
        formData.append('end_date', endIso);
        formData.append('location', eventLocation.trim());
        formData.append('organizer', String(teacher.id));
        if (eventRegistrationLink?.trim()) {
          formData.append('registration_link', eventRegistrationLink.trim());
        }

        if (Platform.OS === 'web') {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append('image_path', blob, 'event_banner.jpg');
        } else {
          const filename = imageUri.split('/').pop() || 'event_banner.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('image_path', {
            uri: imageUri,
            name: filename,
            type
          } as any);
        }
        payload = formData;
      } else {
        // Use plain JSON when no image — avoids FormData type coercion issues
        payload = {
          title: eventTitle.trim(),
          description: eventDescription?.trim() || 'No description provided.',
          event_type: eventType?.trim() || 'Seminar',
          start_date: startIso,
          end_date: endIso,
          location: eventLocation.trim(),
          organizer: teacher.id,  // integer, not string
          ...(eventRegistrationLink?.trim() ? { registration_link: eventRegistrationLink.trim() } : {}),
        };
      }

      await eventsApi.create(payload);
      
      // Reload events for this teacher directly
      const teacherId = teacher.id;
      const res = await eventsApi.getAll({ organizer_id: teacherId });
      const filteredEvents = res.results || (Array.isArray(res) ? res : []);
      setEvents(filteredEvents);

      // Reset Form & Close Modal
      setIsModalVisible(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to create event:', err);
      if (err.body) console.error('Backend error body:', JSON.stringify(err.body));
      
      let msg = err.message || 'Something went wrong. Please check your inputs and try again.';
      if (err.body && typeof err.body === 'object') {
        const firstField = Object.keys(err.body)[0];
        if (firstField) {
          const val = err.body[firstField];
          msg = `${firstField}: ${Array.isArray(val) ? val[0] : val}`;
        }
      }
      setSubmitError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEventIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('exam') || t.includes('test')) return 'document-text';
    if (t.includes('meeting') || t.includes('discussion')) return 'people';
    if (t.includes('holiday') || t.includes('break')) return 'flag';
    return 'calendar';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Events Hub</Text>
          <Text style={styles.headerSubtitle}>Events you have scheduled & published</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.createBtnText}>New Event</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, { width: contentWidth }]}>
          
          {/* Events List */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleDot} />
              <Text style={styles.sectionTitle}>Your Published Events</Text>
              {events.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{events.length}</Text>
                </View>
              )}
            </View>

            {loading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={{ fontSize: 13, color: '#94a3b8' }}>Loading your events...</Text>
              </View>
            ) : events.length > 0 ? (
              <View style={styles.eventsList}>
                {events.map((event) => {
                  const eventImage = event.image_path ? getImageUrl(event.image_path) : null;
                  const startDate = event.start_date || event.date || event.created_at;
                  const startTime = startDate ? new Date(startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                  const dateStr = startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventItemCard}
                      onPress={() => router.push(`/(teacher)/event/${event.id}` as any)}
                      activeOpacity={0.85}
                    >
                      {/* Banner */}
                      {eventImage ? (
                        <Image
                          source={{ uri: eventImage }}
                          style={styles.eventBanner}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.eventDefaultBanner}>
                          <Ionicons name="megaphone-outline" size={30} color="#3b82f6" />
                          <Text style={styles.eventDefaultBannerText}>{event.event_type || 'Faculty Event'}</Text>
                        </View>
                      )}

                      {/* Card Body */}
                      <View style={styles.eventCardBody}>
                        <View style={styles.eventHeaderRow}>
                          <Text style={styles.eventTitleText} numberOfLines={2}>{event.title}</Text>
                          <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{event.event_type || 'Event'}</Text>
                          </View>
                        </View>

                        {event.description ? (
                          <Text style={styles.eventDescText} numberOfLines={2}>{event.description}</Text>
                        ) : null}

                        <View style={styles.eventDetailsRow}>
                          {dateStr ? (
                            <View style={styles.detailChip}>
                              <Ionicons name="calendar-outline" size={12} color="#3b82f6" />
                              <Text style={styles.detailChipText}>{dateStr}</Text>
                            </View>
                          ) : null}
                          {startTime ? (
                            <View style={styles.detailChip}>
                              <Ionicons name="time-outline" size={12} color="#3b82f6" />
                              <Text style={styles.detailChipText}>{startTime}</Text>
                            </View>
                          ) : null}
                          {event.location ? (
                            <View style={styles.detailChip}>
                              <Ionicons name="location-outline" size={12} color="#3b82f6" />
                              <Text style={styles.detailChipText} numberOfLines={1}>{event.location}</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* View Details CTA */}
                        <View style={styles.viewDetailsCta}>
                          <Text style={styles.viewDetailsText}>View Full Details</Text>
                          <Ionicons name="arrow-forward" size={14} color="#3b82f6" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="megaphone-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No Events Yet</Text>
                <Text style={styles.emptyText}>Tap "New Event" to schedule your first faculty event.</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Create Event Modal */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => { setIsModalVisible(false); resetForm(); }}
      >
        <View style={styles.modalOverlay as any}>
          <View style={[styles.modalCard as any, isLargeScreen && { width: 520 } as any]}>
            <View style={styles.modalHeader as any}>
              <Text style={styles.modalTitle as any}>Schedule New Event</Text>
              <TouchableOpacity onPress={() => { setIsModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll as any}>

              {/* Top-level API error banner */}
              {submitError && (
                <View style={styles.errorBanner as any}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorBannerText as any}>{submitError}</Text>
                </View>
              )}

              {/* Title */}
              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Event Title <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.formInput as any, errors.title ? styles.inputError as any : null]}
                  value={eventTitle}
                  onChangeText={(v) => { setEventTitle(v); if (errors.title) setErrors(e => ({ ...e, title: '' })); }}
                  placeholder="e.g. AI in Education Guest Lecture"
                  placeholderTextColor="#94a3b8"
                />
                {errors.title ? <Text style={styles.fieldError as any}><Ionicons name="warning-outline" size={12} /> {errors.title}</Text> : null}
              </View>

              {/* Type + Location */}
              <View style={styles.formRow as any}>
                <View style={[styles.formGroup as any, { flex: 1 }]}>
                  <Text style={styles.formLabel as any}>Event Type <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.formInput as any, errors.type ? styles.inputError as any : null]}
                    value={eventType}
                    onChangeText={(v) => { setEventType(v); if (errors.type) setErrors(e => ({ ...e, type: '' })); }}
                    placeholder="Seminar, Workshop..."
                    placeholderTextColor="#94a3b8"
                  />
                  {errors.type ? <Text style={styles.fieldError as any}>{errors.type}</Text> : null}
                </View>
                <View style={[styles.formGroup as any, { flex: 1 }]}>
                  <Text style={styles.formLabel as any}>Location / Venue <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.formInput as any, errors.location ? styles.inputError as any : null]}
                    value={eventLocation}
                    onChangeText={(v) => { setEventLocation(v); if (errors.location) setErrors(e => ({ ...e, location: '' })); }}
                    placeholder="e.g. Auditorium B"
                    placeholderTextColor="#94a3b8"
                  />
                  {errors.location ? <Text style={styles.fieldError as any}>{errors.location}</Text> : null}
                </View>
              </View>

              {/* Date */}
              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Event Date <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.formInput as any, errors.date ? styles.inputError as any : null]}
                  value={eventDate}
                  onChangeText={(v) => { setEventDate(v); if (errors.date) setErrors(e => ({ ...e, date: '' })); }}
                  placeholder="YYYY-MM-DD (e.g. 2026-06-15)"
                  placeholderTextColor="#94a3b8"
                />
                {errors.date ? <Text style={styles.fieldError as any}>{errors.date}</Text> : null}
              </View>

              {/* Start + End Time */}
              <View style={styles.formRow as any}>
                <View style={[styles.formGroup as any, { flex: 1 }]}>
                  <Text style={styles.formLabel as any}>Start Time <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.formInput as any, errors.startTime ? styles.inputError as any : null]}
                    value={eventStartTime}
                    onChangeText={(v) => { setEventStartTime(v); if (errors.startTime) setErrors(e => ({ ...e, startTime: '' })); }}
                    placeholder="HH:MM (e.g. 10:00)"
                    placeholderTextColor="#94a3b8"
                  />
                  {errors.startTime ? <Text style={styles.fieldError as any}>{errors.startTime}</Text> : null}
                </View>
                <View style={[styles.formGroup as any, { flex: 1 }]}>
                  <Text style={styles.formLabel as any}>End Time <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.formInput as any, errors.endTime ? styles.inputError as any : null]}
                    value={eventEndTime}
                    onChangeText={(v) => { setEventEndTime(v); if (errors.endTime) setErrors(e => ({ ...e, endTime: '' })); }}
                    placeholder="HH:MM (e.g. 12:00)"
                    placeholderTextColor="#94a3b8"
                  />
                  {errors.endTime ? <Text style={styles.fieldError as any}>{errors.endTime}</Text> : null}
                </View>
              </View>

              {/* Registration Link */}
              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Registration URL <Text style={styles.optionalTag}>(Optional)</Text></Text>
                <TextInput
                  style={[styles.formInput as any, errors.regLink ? styles.inputError as any : null]}
                  value={eventRegistrationLink}
                  onChangeText={(v) => { setEventRegistrationLink(v); if (errors.regLink) setErrors(e => ({ ...e, regLink: '' })); }}
                  placeholder="https://example.com/register"
                  placeholderTextColor="#94a3b8"
                />
                {errors.regLink ? <Text style={styles.fieldError as any}>{errors.regLink}</Text> : null}
              </View>

              {/* Description */}
              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Description <Text style={styles.optionalTag}>(Optional)</Text></Text>
                <TextInput
                  style={[styles.formInput as any, styles.formTextArea as any]}
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  placeholder="Enter event outline, requirements or dynamic goals..."
                  placeholderTextColor="#94a3b8"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              {/* Image */}
              <View style={styles.formGroup as any}>
                <Text style={styles.formLabel as any}>Event Banner Image <Text style={styles.optionalTag}>(Optional)</Text></Text>
                {imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                      <Ionicons name="trash" size={14} color="#ffffff" />
                      <Text style={styles.removeImageText}>Remove Image</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadPlaceholder} onPress={pickImage}>
                    <Ionicons name="image-outline" size={24} color="#3b82f6" />
                    <Text style={styles.uploadPlaceholderText}>Tap to select a banner image</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter as any}>
              <TouchableOpacity 
                style={styles.modalCancelBtn as any} 
                onPress={() => { setIsModalVisible(false); resetForm(); }}
                disabled={createLoading}
              >
                <Text style={styles.modalCancelBtnText as any}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn as any} 
                onPress={handleCreateEvent}
                disabled={createLoading}
              >
                {createLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveBtnText as any}>Create Event</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a1930',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
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
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  eventsList: {
    gap: 16,
  },
  eventItemCard: {
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
  eventBanner: {
    width: '100%',
    height: 160,
    backgroundColor: '#f1f5f9',
  },
  eventDefaultBanner: {
    width: '100%',
    height: 160,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  eventDefaultBannerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
    textTransform: 'uppercase',
  },
  eventCardBody: {
    padding: 16,
    gap: 8,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
  },
  typeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  eventLeft: {
    justifyContent: 'center',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventRight: {
    flex: 1,
    gap: 6,
  },
  eventTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  eventDescText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  eventDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  detailChipText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '600',
  },
  viewDetailsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
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
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  fieldError: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '600',
    flex: 1,
  },
  required: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  optionalTag: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0,
  },
  formTextArea: {
    height: 80,
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
  imagePreviewContainer: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  removeImageText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  uploadPlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadPlaceholderText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
});
