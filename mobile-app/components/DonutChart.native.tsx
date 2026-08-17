import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface GradeItem {
  label: string;
  count: number;
  color: string;
}

interface DonutChartProps {
  grades: GradeItem[];
  totalStuds: number;
}

export default function DonutChart({ grades, totalStuds }: DonutChartProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const radius = 40;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Find index of grade with maximum count as default
  let defaultIdx = 0;
  let maxCount = -1;
  grades.forEach((g, i) => {
    if (g.count > maxCount) {
      maxCount = g.count;
      defaultIdx = i;
    }
  });

  const activeIdx = selectedIdx !== null ? selectedIdx : defaultIdx;
  const activeGrade = grades[activeIdx];

  let offset = 0;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width="140" height="140" viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {grades.map((g, idx) => {
            const percent = totalStuds > 0 ? (g.count / totalStuds) : 0;
            if (percent === 0) return null;
            const strokeDashoffset = circumference - percent * circumference;
            const rotation = offset;
            offset += percent * 360;

            const isSelected = idx === selectedIdx;

            return (
              <G key={idx}>
                {isSelected && (
                  <Circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#0f172a"
                    strokeWidth={strokeWidth + 4}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(${rotation} 60 60)`}
                    strokeLinecap="round"
                  />
                )}
                <Circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={g.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotation} 60 60)`}
                  strokeLinecap="round"
                  onPress={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
                />
              </G>
            );
          })}
        </Svg>

        {/* Center Tooltip text inside the donut hole */}
        {activeGrade && (
          <View style={styles.centerTooltip} pointerEvents="none">
            <Text style={[styles.tooltipText, { color: activeGrade.color }]}>
              {activeGrade.label.split(' ')[0]} : {activeGrade.count}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  chartWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTooltip: {
    position: 'absolute',
    width: 90,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
