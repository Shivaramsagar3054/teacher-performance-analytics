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
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path, G, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ratingsApi, teachersApi, coursesApi, usersApi } from '../services/api';

export default function PerformanceOverviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  // Filter tab state: 'semester' (This Semester) | 'last_semester' (Last Semester) | 'year' (This Year)
  const [filterTab, setFilterTab] = useState<'semester' | 'last_semester' | 'year'>('semester');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Raw data from backend
  const [ratings, setRatings] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teacherUserCount, setTeacherUserCount] = useState(0);

  // Computed state
  const [stats, setStats] = useState({
    avgPerformance: 0,
    avgPerformanceChange: 0,
    avgPassRate: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    trendData: [0, 0, 0, 0, 0, 0],
    distribution: [
      { label: 'Excellent (90–100%)', percent: 0, count: 0, color: '#10B981' },
      { label: 'Very Good (75–89%)', percent: 0, count: 0, color: '#84CC16' },
      { label: 'Good (60–74%)', percent: 0, count: 0, color: '#F59E0B' },
      { label: 'Average (40–59%)', percent: 0, count: 0, color: '#F97316' },
      { label: 'Needs Improvement (<40%)', percent: 0, count: 0, color: '#EF4444' },
    ],
    deptData: [] as any[],
    criteriaData: [
      { name: 'Subject Knowledge', score: 0, color: '#3B82F6', icon: 'shield-checkmark-outline' },
      { name: 'Teaching Effectiveness', score: 0, color: '#10B981', icon: 'school-outline' },
      { name: 'Communication', score: 0, color: '#8B5CF6', icon: 'chatbubble-ellipses-outline' },
      { name: 'Punctuality', score: 0, color: '#F59E0B', icon: 'time-outline' },
      { name: 'Student Engagement', score: 0, color: '#EC4899', icon: 'people-outline' },
    ],
  });

  const fetchData = async () => {
    try {
      const [ratingsRes, teachersRes, coursesRes, teacherUsersRes] = await Promise.all([
        ratingsApi.getAll({ limit: 1000 }),
        teachersApi.getAll({ limit: 1000 }),
        coursesApi.getAll({ limit: 1000 }),
        usersApi.getAll({ role: 'teacher' }),
      ]);

      const ratingsList = ratingsRes.results || (Array.isArray(ratingsRes) ? ratingsRes : []);
      const teachersList = teachersRes.results || (Array.isArray(teachersRes) ? teachersRes : []);
      const coursesList = coursesRes.results || (Array.isArray(coursesRes) ? coursesRes : []);
      const tUserCount = teacherUsersRes.count ?? (teacherUsersRes.results || (Array.isArray(teacherUsersRes) ? teacherUsersRes : [])).length;

      setRatings(ratingsList);
      setTeachers(teachersList);
      setCourses(coursesList);
      setTeacherUserCount(tUserCount);
      calculateStats(ratingsList, teachersList, coursesList, tUserCount, filterTab);
    } catch (err) {
      console.warn('Error fetching ratings and teachers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && ratings.length > 0) {
      calculateStats(ratings, teachers, courses, teacherUserCount, filterTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const calculateStats = (
    ratingsList: any[],
    teachersList: any[],
    coursesList: any[],
    teacherUserCountVal: number,
    filter: string
  ) => {
    const now = new Date();
    
    // Filter ratings based on date
    let filteredRatings = ratingsList.filter((r) => {
      if (!r.created_at) return true;
      const date = new Date(r.created_at);
      const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      
      if (filter === 'semester') {
        return diffMonths <= 6;
      } else if (filter === 'last_semester') {
        return diffMonths > 6 && diffMonths <= 12;
      } else {
        return diffMonths <= 12;
      }
    });

    // Fallback if filtered results are empty
    if (filteredRatings.length === 0) {
      filteredRatings = ratingsList;
    }

    const totalRatings = filteredRatings.length;
    const totalTeachersCount = teacherUserCountVal || teachersList.length || 0;

    let avgOverall = 0;
    let avgSubject = 0;
    let avgTeaching = 0;
    let avgComm = 0;
    let avgApproach = 0;

    if (totalRatings > 0) {
      const sumOverall = filteredRatings.reduce((sum, r) => sum + parseFloat(r.overall_score || 0), 0);
      avgOverall = sumOverall / totalRatings;

      const sumSubject = filteredRatings.reduce((sum, r) => sum + parseInt(r.subject_knowledge || 0), 0);
      avgSubject = sumSubject / totalRatings;

      const sumTeaching = filteredRatings.reduce((sum, r) => sum + parseInt(r.teaching_skill || 0), 0);
      avgTeaching = sumTeaching / totalRatings;

      const sumComm = filteredRatings.reduce((sum, r) => sum + parseInt(r.communication || 0), 0);
      avgComm = sumComm / totalRatings;

      const sumApproach = filteredRatings.reduce((sum, r) => sum + parseInt(r.approachability || 0), 0);
      avgApproach = sumApproach / totalRatings;
    }

    const avgPerfPct = avgOverall > 0 ? Math.round((avgOverall / 5) * 100) : 0;

    // Calculate performance trend difference for the KPI card description
    const lastSemRatings = ratingsList.filter((r) => {
      if (!r.created_at) return false;
      const date = new Date(r.created_at);
      const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      return diffMonths > 6 && diffMonths <= 12;
    });

    let lastSemAvgOverall = 0;
    if (lastSemRatings.length > 0) {
      const sum = lastSemRatings.reduce((sum, r) => sum + parseFloat(r.overall_score || 0), 0);
      lastSemAvgOverall = sum / lastSemRatings.length;
    }
    const lastSemAvgPerfPct = lastSemAvgOverall > 0 ? Math.round((lastSemAvgOverall / 5) * 100) : 0;
    const perfTrendDiff = lastSemAvgPerfPct > 0 ? avgPerfPct - lastSemAvgPerfPct : 0;

    // Distribution calculation (Excellent, Very Good, Good, Average, Needs Improvement)
    // Group overall rating scores
    const teacherScores: Record<number, number[]> = {};
    filteredRatings.forEach((r) => {
      const tId = r.teacher;
      if (tId) {
        if (!teacherScores[tId]) teacherScores[tId] = [];
        teacherScores[tId].push(parseFloat(r.overall_score || 0));
      }
    });

    let excellent = 0;
    let veryGood = 0;
    let good = 0;
    let average = 0;
    let needsImp = 0;

    const teacherAvgs = Object.values(teacherScores).map(scores => scores.reduce((a,b)=>a+b, 0) / scores.length);
    
    teacherAvgs.forEach((score) => {
      const pct = (score / 5) * 100;
      if (pct >= 90) excellent++;
      else if (pct >= 75) veryGood++;
      else if (pct >= 60) good++;
      else if (pct >= 40) average++;
      else needsImp++;
    });

    const distData = [
      { label: 'Excellent (90–100%)', count: excellent, color: '#10B981' },
      { label: 'Very Good (75–89%)', count: veryGood, color: '#84CC16' },
      { label: 'Good (60–74%)', count: good, color: '#F59E0B' },
      { label: 'Average (40–59%)', count: average, color: '#F97316' },
      { label: 'Needs Improvement (<40%)', count: needsImp, color: '#EF4444' },
    ];

    const distTotal = distData.reduce((sum, d) => sum + d.count, 0) || 1;
    const finalDist = distData.map((d) => ({
      ...d,
      percent: distTotal > 0 ? Math.round((d.count / distTotal) * 100) : 0,
    }));

    // Performance by Department Calculation
    const deptScores: Record<string, { sum: number; count: number }> = {};
    
    // Extract unique departments from courses and teachers dynamically
    const uniqueDepts = new Set<string>();
    coursesList.forEach((c: any) => c.department && uniqueDepts.add(c.department));
    teachersList.forEach((t: any) => t.department && uniqueDepts.add(t.department));

    uniqueDepts.forEach(d => {
      deptScores[d] = { sum: 0, count: 0 };
    });

    filteredRatings.forEach((r) => {
      const teacherObj = teachersList.find(t => t.id === r.teacher);
      if (teacherObj && teacherObj.department) {
        const dept = teacherObj.department;
        if (!deptScores[dept]) {
          deptScores[dept] = { sum: 0, count: 0 };
        }
        deptScores[dept].sum += parseFloat(r.overall_score || 0);
        deptScores[dept].count += 1;
      }
    });

    const deptColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444', '#06B6D4', '#84CC16'];
    const deptIcons = ['laptop-outline', 'calculator-outline', 'flask-outline', 'settings-outline', 'flash-outline', 'school-outline', 'book-outline', 'business-outline'];

    const finalDept = Object.keys(deptScores).map((name, index) => {
      const { sum, count } = deptScores[name];
      const avg = count > 0 ? (sum / count) : 0;
      const pct = avg > 0 ? Math.round((avg / 5) * 100) : 0;

      return {
        name,
        pct,
        color: deptColors[index % deptColors.length],
        icon: deptIcons[index % deptIcons.length],
      };
    });

    finalDept.sort((a, b) => b.pct - a.pct);

    // Performance Trend: 6-month historical calculations
    const trendValues = [0, 0, 0, 0, 0, 0];
    const monthScores: Record<number, number[]> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthScores[d.getMonth()] = [];
    }

    filteredRatings.forEach((r) => {
      if (!r.created_at) return;
      const date = new Date(r.created_at);
      const m = date.getMonth();
      if (monthScores[m]) {
        monthScores[m].push(parseFloat(r.overall_score || 0));
      }
    });

    const sortedMonths = Object.keys(monthScores)
      .map(Number)
      .sort((a, b) => {
        const diffA = (now.getMonth() - a + 12) % 12;
        const diffB = (now.getMonth() - b + 12) % 12;
        return diffB - diffA;
      });

    sortedMonths.forEach((m, idx) => {
      const scores = monthScores[m];
      if (scores && scores.length > 0) {
        const avg = scores.reduce((a,b)=>a+b, 0) / scores.length;
        trendValues[idx] = Math.round((avg / 5) * 100);
      } else {
        trendValues[idx] = avgPerfPct || 0;
      }
    });

    // Average Pass Rate from teachers list
    const validTeachersWithPass = teachersList.filter(t => (t.avg_pass_percentage || 0) > 0);
    const avgPassRateVal = validTeachersWithPass.length > 0 
      ? Math.round(validTeachersWithPass.reduce((sum, t) => sum + parseFloat(t.avg_pass_percentage), 0) / validTeachersWithPass.length)
      : 0;

    // Total unique departments
    const totalDepartmentsVal = uniqueDepts.size || 0;

    setStats({
      avgPerformance: avgPerfPct,
      avgPerformanceChange: perfTrendDiff,
      avgPassRate: avgPassRateVal,
      totalTeachers: totalTeachersCount,
      totalDepartments: totalDepartmentsVal,
      trendData: trendValues,
      distribution: finalDist,
      deptData: finalDept.slice(0, 5),
      criteriaData: [
        { name: 'Subject Knowledge', score: parseFloat(avgSubject.toFixed(1)) || 0, color: '#3B82F6', icon: 'shield-checkmark-outline' },
        { name: 'Teaching Effectiveness', score: parseFloat(avgTeaching.toFixed(1)) || 0, color: '#10B981', icon: 'school-outline' },
        { name: 'Communication', score: parseFloat(avgComm.toFixed(1)) || 0, color: '#8B5CF6', icon: 'chatbubble-ellipses-outline' },
        { name: 'Punctuality', score: parseFloat(avgApproach.toFixed(1)) || 0, color: '#F59E0B', icon: 'time-outline' },
        { name: 'Student Engagement', score: parseFloat(((avgTeaching + avgComm) / 2).toFixed(1)) || 0, color: '#EC4899', icon: 'people-outline' },
      ],
    });
  };

  // SVG Calculations for Donut Chart
  let currentOffset = 0;
  const segments = stats.distribution.map((item) => {
    const strokeDashoffset = 301.6 - (item.percent / 100) * 301.6;
    const rotation = currentOffset;
    currentOffset += (item.percent / 100) * 360;
    return {
      ...item,
      strokeDashoffset,
      rotation,
    };
  });

  // SVG Calculations for Area Line Chart
  const chartWidth = 300;
  const chartHeight = 120;
  const paddingX = 22;
  const paddingY = 20;
  const graphWidth = chartWidth - 2 * paddingX;
  const graphHeight = chartHeight - 2 * paddingY;

  const trendPoints = stats.trendData.map((val, idx) => {
    const x = paddingX + (idx / 5) * graphWidth;
    const y = paddingY + graphHeight - (val / 100) * graphHeight;
    return { x, y, val };
  });

  const linePath = trendPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${trendPoints[trendPoints.length - 1].x.toFixed(1)} ${(paddingY + graphHeight).toFixed(1)} L ${trendPoints[0].x.toFixed(1)} ${(paddingY + graphHeight).toFixed(1)} Z`;

  // Get dynamic months names list
  const getMonthName = (monthDiff: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthDiff);
    return d.toLocaleString('en-US', { month: 'short' });
  };
  const monthsList = [5, 4, 3, 2, 1, 0].map(diff => getMonthName(diff));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header section */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0A1930" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Performance Overview</Text>
          <Text style={styles.headerSubtitleText}>Track and analyze overall teacher performance</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <Ionicons name="funnel-outline" size={20} color="#0A1930" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
              

              {/* KPI Cards Row */}
              <View style={styles.kpiRow}>
                {/* 1. Avg Performance */}
                <View style={styles.kpiCard}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="trending-up" size={18} color="#3B82F6" />
                  </View>
                  <Text style={styles.kpiValue}>{stats.avgPerformance}%</Text>
                  <Text style={styles.kpiLabel}>Avg. Performance</Text>
                  <View style={styles.kpiTrend}>
                    {stats.avgPerformanceChange > 0 ? (
                      <>
                        <Ionicons name="arrow-up" size={12} color="#10B981" />
                        <Text style={[styles.kpiTrendText, { color: '#10B981' }]}>+{stats.avgPerformanceChange}% from last sem</Text>
                      </>
                    ) : stats.avgPerformanceChange < 0 ? (
                      <>
                        <Ionicons name="arrow-down" size={12} color="#EF4444" />
                        <Text style={[styles.kpiTrendText, { color: '#EF4444' }]}>{stats.avgPerformanceChange}% from last sem</Text>
                      </>
                    ) : (
                      <Text style={[styles.kpiTrendText, { color: '#64748B' }]}>No change from last sem</Text>
                    )}
                  </View>
                </View>

                {/* 2. Avg Pass Rate */}
                <View style={styles.kpiCard}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="school" size={18} color="#10B981" />
                  </View>
                  <Text style={styles.kpiValue}>{stats.avgPassRate}%</Text>
                  <Text style={styles.kpiLabel}>Avg. Pass Rate</Text>
                  <View style={styles.kpiTrend}>
                    <Ionicons name="arrow-up" size={12} color="#10B981" style={{ opacity: stats.avgPassRate > 0 ? 1 : 0 }} />
                    <Text style={[styles.kpiTrendText, { color: '#10B981' }]}>{stats.avgPassRate > 0 ? 'Active average' : 'No data'}</Text>
                  </View>
                </View>

                {/* 3. Total Teachers */}
                <View style={styles.kpiCard}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#FFFBEB' }]}>
                    <Ionicons name="clipboard" size={18} color="#F59E0B" />
                  </View>
                  <Text style={styles.kpiValue}>{stats.totalTeachers}</Text>
                  <Text style={styles.kpiLabel}>Total Teachers</Text>
                  <View style={styles.kpiTrend}>
                    <Text style={[styles.kpiTrendText, { color: '#64748B' }]}>All registered</Text>
                  </View>
                </View>

                {/* 4. Departments */}
                <View style={styles.kpiCard}>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="people" size={18} color="#8B5CF6" />
                  </View>
                  <Text style={styles.kpiValue}>{stats.totalDepartments}</Text>
                  <Text style={styles.kpiLabel}>Departments</Text>
                  <View style={styles.kpiTrend}>
                    <Text style={[styles.kpiTrendText, { color: '#64748B' }]}>Active fields</Text>
                  </View>
                </View>
              </View>

              {/* Performance Distribution Card */}
              <View style={styles.chartCard}>
                <View style={styles.chartCardHeader}>
                  <Text style={styles.cardTitle}>Performance Distribution</Text>
                  <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => router.push('/professors')}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                  </TouchableOpacity>
                </View>

                <View style={styles.donutContainer}>
                  {/* Left Side Donut SVG */}
                  <View style={styles.donutWrapper}>
                    <Svg width="150" height="150" viewBox="0 0 150 150">
                      <Circle cx="75" cy="75" r="48" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                      {segments.map((seg, idx) => {
                        if (seg.percent === 0) return null;
                        return (
                          <Circle
                            key={idx}
                            cx="75"
                            cy="75"
                            r="48"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="12"
                            strokeDasharray="301.6"
                            strokeDashoffset={seg.strokeDashoffset}
                            transform={`rotate(${seg.rotation - 90} 75 75)`}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </Svg>
                    <View style={styles.donutCenter}>
                      <Text style={styles.donutCenterValue}>{stats.totalTeachers}</Text>
                      <Text style={styles.donutCenterLabel}>Teachers</Text>
                    </View>
                  </View>

                  {/* Right Side Legends */}
                  <View style={styles.donutLegend}>
                    {stats.distribution.map((item, idx) => (
                      <View key={idx} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <Text style={styles.legendLabel} numberOfLines={1}>
                          {item.label}
                        </Text>
                        <Text style={styles.legendValue}>
                          {item.count} ({item.percent}%)
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Performance Trend Card */}
              <View style={styles.chartCard}>
                <View style={styles.chartCardHeader}>
                  <Text style={styles.cardTitle}>Performance Trend</Text>
                  <TouchableOpacity style={styles.trendDropdown} activeOpacity={0.8}>
                    <Text style={styles.trendDropdownText}>Average Performance</Text>
                    <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>

                <View style={styles.trendChartContainer}>
                  {/* Custom Svg Line Chart */}
                  <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <Defs>
                      <SvgLinearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </SvgLinearGradient>
                    </Defs>

                    {/* Y Axis Grid lines & labels */}
                    {[0, 20, 40, 60, 80, 100].map((gridVal) => {
                      const y = paddingY + graphHeight - (gridVal / 100) * graphHeight;
                      return (
                        <G key={gridVal}>
                          <Path d={`M ${paddingX} ${y} L ${chartWidth - paddingX} ${y}`} stroke="#F1F5F9" strokeWidth="1" />
                          <SvgText x={paddingX - 4} y={y + 3} fontSize="8" fill="#94A3B8" textAnchor="end">
                            {gridVal}%
                          </SvgText>
                        </G>
                      );
                    })}

                    {/* Area under the line */}
                    <Path d={areaPath} fill="url(#blueGradient)" />

                    {/* Line path */}
                    <Path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2.5" />

                    {/* Data dots with values */}
                    {trendPoints.map((p, idx) => (
                      <G key={idx}>
                        <Circle cx={p.x} cy={p.y} r="3.5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
                        <SvgText x={p.x} y={p.y - 7} fontSize="8" fontWeight="bold" fill="#3B82F6" textAnchor="middle">
                          {p.val}%
                        </SvgText>
                      </G>
                    ))}

                    {/* X Axis Month Labels */}
                    {monthsList.map((mName, idx) => {
                      const x = paddingX + (idx / 5) * graphWidth;
                      return (
                        <SvgText key={idx} x={x} y={chartHeight - 4} fontSize="8" fontWeight="600" fill="#94A3B8" textAnchor="middle">
                          {mName}
                        </SvgText>
                      );
                    })}
                  </Svg>
                </View>
              </View>

              {/* Side-by-Side Analysis Cards */}
              <View style={styles.sideBySideContainer}>
                {/* 1. Performance by Department */}
                <View style={styles.detailsCard}>
                  <View style={styles.detailsCardHeader}>
                    <Text style={styles.detailsCardTitle}>Performance by Department</Text>
                    <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/professors')}>
                      <Text style={styles.viewAllText}>View All</Text>
                      <Ionicons name="chevron-forward" size={12} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.progressList}>
                    {stats.deptData.map((item, idx) => (
                      <View key={idx} style={styles.progressItem}>
                        <View style={[styles.progressIconBox, { backgroundColor: `${item.color}15` }]}>
                          <Ionicons name={item.icon as any} size={16} color={item.color} />
                        </View>
                        <View style={styles.progressContent}>
                          <View style={styles.progressLabelRow}>
                            <Text style={styles.progressName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.progressValue}>{item.pct}%</Text>
                          </View>
                          <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFilled, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 2. Evaluation Criteria Breakdown */}
                <View style={styles.detailsCard}>
                  <View style={styles.detailsCardHeader}>
                    <Text style={styles.detailsCardTitle}>Evaluation Criteria Breakdown</Text>
                    <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/professors')}>
                      <Text style={styles.viewAllText}>View All</Text>
                      <Ionicons name="chevron-forward" size={12} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.progressList}>
                    {stats.criteriaData.map((item, idx) => (
                      <View key={idx} style={styles.progressItem}>
                        <View style={[styles.progressIconBox, { backgroundColor: `${item.color}15` }]}>
                          <Ionicons name={item.icon as any} size={16} color={item.color} />
                        </View>
                        <View style={styles.progressContent}>
                          <View style={styles.progressLabelRow}>
                            <Text style={styles.progressName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.progressValue}>{item.score}/5</Text>
                          </View>
                          <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFilled, { width: `${(item.score / 5) * 100}%`, backgroundColor: item.color }]} />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

            </View>
          )}

          <View style={{ height: 80 }} />
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
    width: 32,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1930',
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  filterButton: {
    width: 32,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  responsiveWrapper: {
    maxWidth: '100%',
  },
  loaderContainer: {
    padding: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },
  tabScroll: {
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dateSelectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    width: '48%',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A1930',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  kpiTrendText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0A1930',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  donutWrapper: {
    position: 'relative',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenterValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A1930',
  },
  donutCenterLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  donutLegend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  legendValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0A1930',
  },
  trendDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendDropdownText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  trendChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 8,
  },
  sideBySideContainer: {
    gap: 16,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailsCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0A1930',
    flex: 1,
    paddingRight: 6,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  progressList: {
    gap: 12,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContent: {
    flex: 1,
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A1930',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFilled: {
    height: '100%',
    borderRadius: 3,
  },
});
