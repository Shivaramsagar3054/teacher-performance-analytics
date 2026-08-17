import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { aboutUsHeroApi } from '../services/api';

const aboutHeroImg = require('../assets/images/about_hero.png');

const OFFERS = [
  {
    title: 'Performance Analytics',
    desc: 'Track and analyze teacher performance with detailed reports.',
    icon: 'bar-chart',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    title: 'Teacher Insights',
    desc: 'Get individual insights and feedback for each teacher.',
    icon: 'people',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    title: 'Data-Driven Reports',
    desc: 'Generate accurate reports for better decision making.',
    icon: 'clipboard',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    title: 'Continuous Improvement',
    desc: 'Identify strengths and areas to improve teaching quality.',
    icon: 'trending-up',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
];

const FEATURES = [
  {
    title: 'Performance Overview',
    desc: 'View overall performance metrics at a glance.',
    icon: 'bar-chart-outline',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    title: 'Evaluation Criteria',
    desc: 'Evaluate teachers on multiple parameters.',
    icon: 'star-outline',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    title: 'Feedback Analysis',
    desc: 'Analyze student feedback and suggest improvements.',
    icon: 'chatbubble-ellipses-outline',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    title: 'Custom Reports',
    desc: 'Create and download customized performance reports.',
    icon: 'download-outline',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    title: 'Secure & Reliable',
    desc: 'Your data is safe with us. We ensure privacy and security.',
    icon: 'shield-checkmark-outline',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    title: 'Real-time Updates',
    desc: 'Get real-time updates and notifications.',
    icon: 'notifications-outline',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
];

export default function AboutCollegeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  // States
  const [heroData, setHeroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAboutData = async () => {
    try {
      const heroRes = await aboutUsHeroApi.getAll();
      const heroes = heroRes.results || (Array.isArray(heroRes) ? heroRes : []);
      const activeHero = heroes.find((h: any) => h.is_active) || heroes[0] || null;
      setHeroData(activeHero);
    } catch (err) {
      console.warn('Error fetching about us hero from API:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAboutData();
  };

  // Build Hero Content with Fallbacks
  const currentHero = {
    title: heroData?.title || 'Teacher\nPerformance Analyzer',
    subtitle: heroData?.subtitle || 'About',
    description: heroData?.description || 'Teacher Performance Analyzer is a smart analytics platform designed to evaluate, monitor and improve teacher performance using data-driven insights.',
  };

  // Responsiveness width calculations
  const offerCardWidth = isLargeScreen 
    ? (768 - 40 - 36) / 4 // 4 columns on wide screens
    : (width - 40 - 12) / 2; // 2 columns on mobile

  const featureWidth = isLargeScreen 
    ? (768 - 40 - 16) / 2 // 2 columns on wide screens
    : '100%'; // 1 column on mobile

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header overlay */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0A1930" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>About</Text>
        <TouchableOpacity 
          style={styles.bellButton}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color="#0A1930" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      >
        <View style={[styles.responsiveWrapper, { width: isLargeScreen ? 768 : '100%' }]}>
          
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : (
            <View style={styles.bodyContent}>
              
              {/* Hero illustration card */}
              <View style={styles.heroCard}>
                <View style={styles.heroLeft}>
                  <Text style={styles.heroTag}>{currentHero.subtitle}</Text>
                  <Text style={styles.heroTitle}>{currentHero.title}</Text>
                  <Text style={styles.heroDesc}>{currentHero.description}</Text>
                </View>
                <View style={styles.heroRight}>
                  <Image
                    source={aboutHeroImg}
                    style={styles.heroImage}
                    contentFit="contain"
                  />
                </View>
              </View>

              {/* Mission Vision Row */}
              <View style={styles.missionVisionRow}>
                {/* Our Mission */}
                <View style={styles.mvCard}>
                  <View style={[styles.mvIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="disc-outline" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.mvTextContainer}>
                    <Text style={styles.mvTitle}>Our Mission</Text>
                    <Text style={styles.mvDesc}>
                      To empower educational institutions by providing powerful analytics and insights that help in recognizing strengths, improving teaching effectiveness, and enhancing overall academic excellence.
                    </Text>
                  </View>
                </View>

                {/* Our Vision */}
                <View style={styles.mvCard}>
                  <View style={[styles.mvIconContainer, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="eye-outline" size={24} color="#10B981" />
                  </View>
                  <View style={styles.mvTextContainer}>
                    <Text style={styles.mvTitle}>Our Vision</Text>
                    <Text style={styles.mvDesc}>
                      To become the most trusted platform for teacher performance evaluation and analytics, fostering a culture of continuous improvement in education worldwide.
                    </Text>
                  </View>
                </View>
              </View>

              {/* What We Offer */}
              <Text style={styles.sectionHeader}>What We Offer</Text>
              <View style={styles.offerGrid}>
                {OFFERS.map((item, idx) => (
                  <View 
                    key={idx} 
                    style={[styles.offerCard, { width: offerCardWidth }]}
                  >
                    <View style={[styles.offerIconContainer, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.icon as any} size={22} color={item.color} />
                    </View>
                    <Text style={styles.offerTitle}>{item.title}</Text>
                    <Text style={styles.offerDesc}>{item.desc}</Text>
                  </View>
                ))}
              </View>

              {/* Key Features */}
              <Text style={styles.sectionHeader}>Key Features</Text>
              <View style={styles.featuresGrid}>
                {FEATURES.map((item, idx) => (
                  <View 
                    key={idx} 
                    style={[styles.featureRow, { width: featureWidth }]}
                  >
                    <View style={[styles.featureIconContainer, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <View style={styles.featureTextContainer}>
                      <Text style={styles.featureTitle}>{item.title}</Text>
                      <Text style={styles.featureDesc}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

            </View>
          )}

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  bellButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A1930',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  responsiveWrapper: {
    maxWidth: '100%',
  },
  loaderContainer: {
    padding: 60,
    alignItems: 'center',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  heroLeft: {
    flex: 1.3,
    paddingRight: 10,
  },
  heroTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A1930',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  heroRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 120,
  },
  missionVisionRow: {
    gap: 16,
    marginBottom: 24,
  },
  mvCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  mvIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mvTextContainer: {
    flex: 1,
  },
  mvTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A1930',
    marginBottom: 4,
  },
  mvDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1930',
    marginBottom: 16,
    marginTop: 8,
  },
  offerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  offerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0A1930',
    textAlign: 'center',
    marginBottom: 6,
  },
  offerDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0A1930',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
