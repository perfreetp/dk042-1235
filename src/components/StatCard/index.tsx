import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'default';
  icon?: React.ReactNode;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, color = 'default', onClick }) => {
  return (
    <View 
      className={classnames(styles.card, styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`])} 
      onClick={onClick}
    >
      <Text className={styles.title}>{title}</Text>
      <View className={styles.valueRow}>
        <Text className={styles.value}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
};

export default StatCard;
