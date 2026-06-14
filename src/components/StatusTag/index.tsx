import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatusTagProps {
  status: 'pending' | 'assigned' | 'serving' | 'completed';
  text?: string;
  size?: 'sm' | 'md';
}

const statusMap = {
  pending: { text: '待分配', className: 'pending' },
  assigned: { text: '已接单', className: 'assigned' },
  serving: { text: '服务中', className: 'serving' },
  completed: { text: '已完成', className: 'completed' }
};

const StatusTag: React.FC<StatusTagProps> = ({ status, text, size = 'md' }) => {
  const info = statusMap[status];
  return (
    <View className={classnames(styles.tag, styles[info.className], styles[size])}>
      <Text className={styles.text}>{text || info.text}</Text>
    </View>
  );
};

export default StatusTag;
