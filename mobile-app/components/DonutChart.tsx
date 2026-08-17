import React from 'react';
import { View } from 'react-native';

interface GradeItem {
  label: string;
  count: number;
  color: string;
}

interface DonutChartProps {
  grades: GradeItem[];
  totalStuds: number;
}

export default function DonutChart({ grades, totalStuds }: DonutChartProps): React.JSX.Element {
  return <View />;
}
