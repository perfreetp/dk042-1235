import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { ServiceNode } from '@/types/order';
import styles from './index.module.scss';

interface TimelineProps {
  nodes: ServiceNode[];
}

const Timeline: React.FC<TimelineProps> = ({ nodes }) => {
  return (
    <View className={styles.timeline}>
      {nodes.map((node, index) => (
        <View 
          key={node.id} 
          className={classnames(
            styles.timelineItem,
            node.status === 'done' && styles.done,
            node.status === 'current' && styles.current,
            node.status === 'pending' && styles.pending
          )}
        >
          <View className={styles.leftSide}>
            <View className={styles.dot} />
            {index < nodes.length - 1 && <View className={styles.line} />}
          </View>
          <View className={styles.content}>
            <View className={styles.header}>
              <Text className={styles.name}>{node.name}</Text>
              {node.time && <Text className={styles.time}>{node.time}</Text>}
            </View>
            {node.description && (
              <Text className={styles.description}>{node.description}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

export default Timeline;
