import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { 
  ActivityIndicator, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  useWindowDimensions, 
  Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { authApi, teachersApi, getImageUrl } from '../../services/api';
import { APP_NAME, APP_LOGO } from '../../constants/config';

export default function TeacherLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          router.replace('/(auth)/login');
          return;
        }

        // Fetch profile to verify role
        const profile = await authApi.getProfile();
        if (profile?.role !== 'teacher') {
          setIsAuthenticated(false);
          router.replace('/(tabs)'); // Redirect students back to student portal
          return;
        }

        setIsAuthenticated(true);

        try {
          let matchedTeacher = profile.teacher_profile || null;
          if (!matchedTeacher) {
            const res = await teachersApi.getAll({ user_id: profile.id });
            const results = res.results || (Array.isArray(res) ? res : []);
            matchedTeacher = results.find((t: any) => t.user?.id === profile.id) || results[0] || null;
          }

          if (matchedTeacher) {
            setTeacherData(matchedTeacher);
            await AsyncStorage.setItem('teacher_id', String(matchedTeacher.id));
            await AsyncStorage.setItem('teacherProfile', JSON.stringify(matchedTeacher));
          }
        } catch (tErr) {
          console.warn('Failed to load teacher specific details:', tErr);
        }
      } catch (error) {
        console.error('Failed to check auth in TeacherLayout:', error);
        setIsAuthenticated(false);
        router.replace('/(auth)/login');
      } finally {
        setProfileLoading(false);
      }
    };

    checkAuthAndRole();
  }, [router]);

  useEffect(() => {
    const reloadProfileFromCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('teacherProfile');
        if (cached) {
          setTeacherData(JSON.parse(cached));
        }
      } catch (err) {
        console.warn('Failed to load profile in layout:', err);
      }
    };
    reloadProfileFromCache();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refresh_token');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (isAuthenticated === null || profileLoading) {
    return (
      <View style={styles.loadingContainer as any}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText as any}>Loading Teacher Portal...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Custom Sidebar Component for Desktop/Web
  const renderSidebar = () => {
    const navItems = [
      { name: 'index', label: 'Dashboard', icon: 'grid', route: '/(teacher)' },
      { name: 'profile', label: 'My Profile', icon: 'person', route: '/(teacher)/profile' },
      { name: 'courses', label: 'My Courses', icon: 'book', route: '/(teacher)/courses' },
      { name: 'events', label: 'Events', icon: 'calendar', route: '/(teacher)/events' },
      { name: 'messages', label: 'Messages', icon: 'chatbubbles', route: '/(teacher)/messages' },
      { name: 'settings', label: 'Settings', icon: 'settings', route: '/(teacher)/settings' },
    ];

    const currentTab = pathname === '/(teacher)' ? 'index' : pathname.split('/').pop() || 'index';

    return (
      <View 
        style={[
          styles.sidebar as any, 
          Platform.OS === 'web' && { height: '100vh', position: 'sticky', top: 0 } as any
        ]}
      >
        {/* Sidebar Header */}
        <View style={styles.sidebarHeader as any}>
          <Image 
            source={APP_LOGO} 
            style={{ width: 170, height: 40 }} 
            contentFit="contain"
          />
        </View>

        {/* Profile Card */}
        {teacherData ? (
          <View style={styles.profileCard as any}>
            <Image 
              source={{ uri: getImageUrl(teacherData.profile_image) }} 
              style={styles.avatar as any} 
            />
            <View style={styles.profileInfo as any}>
              <Text style={styles.teacherName as any} numberOfLines={1}>
                {`Dr. ${teacherData.first_name} ${teacherData.last_name}`}
              </Text>
              <Text style={styles.teacherDept as any} numberOfLines={1}>
                {teacherData.department ? String(teacherData.department).toUpperCase() : 'TEACHER'}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.profileCard as any}
            onPress={() => {
              AsyncStorage.setItem('autoOpenEditProfile', 'true');
              router.replace('/(teacher)/settings');
            }}
          >
            <Ionicons name="person-circle" size={40} color="#3b82f6" style={{ marginBottom: 8 }} />
            <View style={styles.profileInfo as any}>
              <Text style={styles.teacherName as any} numberOfLines={1}>
                Set Up Profile
              </Text>
              <Text style={styles.teacherDept as any} numberOfLines={1}>
                TEACHER
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Navigation Items */}
        <View style={styles.navGroup as any}>
          {navItems.map((item) => {
            const isActive = currentTab === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem as any, isActive && styles.navItemActive as any]}
                onPress={() => router.replace(item.route as any)}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={20} 
                  color={isActive ? '#ffffff' : '#94a3b8'} 
                />
                <Text style={[styles.navLabel as any, isActive && styles.navLabelActive as any]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button at Bottom */}
        <TouchableOpacity style={styles.logoutBtn as any} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#f87171" />
          <Text style={styles.logoutText as any}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Custom Bottom Bar Component for Mobile
  const renderCustomTabBar = (props: any) => {
    if (isLargeScreen) return null; // Rendered via Sidebar instead

    const { state, descriptors, navigation } = props;
    
    // Only render standard navigation tabs in the custom bottom tab bar
    const visibleRoutes = state.routes.filter((route: any) => 
      ['index', 'profile', 'courses', 'events', 'messages', 'settings'].includes(route.name)
    );

    return (
      <View style={styles.bottomBarContainer as any}>
        <View style={styles.bottomBar as any}>
          {visibleRoutes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.title !== undefined ? options.title : route.name;
            const isFocused = state.routes[state.index]?.name === route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            let iconName: any;
            if (route.name === 'index') iconName = isFocused ? 'grid' : 'grid-outline';
            else if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';
            else if (route.name === 'courses') iconName = isFocused ? 'book' : 'book-outline';
            else if (route.name === 'events') iconName = isFocused ? 'calendar' : 'calendar-outline';
            else if (route.name === 'messages') iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
            else if (route.name === 'settings') iconName = isFocused ? 'settings' : 'settings-outline';

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.bottomTabItemWrapper as any}
              >
                <View style={[styles.bottomTabItem as any, isFocused && styles.bottomTabItemActive as any]}>
                  <Ionicons 
                    name={iconName} 
                    size={18} 
                    color={isFocused ? '#3b82f6' : '#94a3b8'} 
                  />
                  <Text style={[
                    styles.bottomTabLabel as any, 
                    { color: isFocused ? '#3b82f6' : '#94a3b8' }
                  ]}>
                    {label === 'index' ? 'Dashboard' : label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container as any}>
      {isLargeScreen && renderSidebar()}
      <View style={styles.mainContent as any}>
          <Tabs
          tabBar={(props) => renderCustomTabBar(props)}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
          <Tabs.Screen name="courses" options={{ title: 'Courses' }} />
          <Tabs.Screen name="analytics" options={{ href: null, title: 'Analytics' }} />
          <Tabs.Screen name="events" options={{ title: 'Events' }} />
          <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
          <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
          <Tabs.Screen name="completed-course/[id]" options={{ href: null, title: 'Completed Course Details' }} />
          <Tabs.Screen name="event/[id]" options={{ href: null, title: 'Event Details' }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 12,
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 16,
  },
  sidebar: {
    width: 260,
    backgroundColor: '#0a1930', // Deep theme from image
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    gap: 20,
  },
  sidebarHeader: {
    marginBottom: 8,
    gap: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    flexShrink: 1,
  },
  logoSubtitle: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '700',
    letterSpacing: 1,
  },
  academicYear: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginTop: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  profileInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  teacherDept: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  navGroup: {
    flex: 1,
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#3b82f6', // Solid brand color
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  navLabelActive: {
    color: '#ffffff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 'auto',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87171',
  },
  mainContent: {
    flex: 1,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#0a1930',
    height: 60,
    borderRadius: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  bottomTabItemWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  bottomTabItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  bottomTabLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
});
