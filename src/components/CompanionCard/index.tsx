import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Companion } from '@/types/companion';
import styles from './index.module.scss';

interface CompanionCardProps {
  companion: Companion;
  onClick?: () => void;
}

const statusMap = {
  idle: { text: '空闲', color: 'success' },
  busy: { text: '忙碌', color: 'warning' },
  offline: { text: '离线', color: 'default' },
  leave: { text: '休假', color: 'default' }
};

const levelMap = {
  standard: '标准陪诊',
  senior: '资深陪诊',
  expert: '专家陪诊'
};

const CompanionCard: React.FC<CompanionCardProps> = ({ companion, onClick }) => {
  const status = statusMap[companion.status];
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/companion-detail/index?id=${companion.id}` });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.avatarSection}>
        <Image 
          className={styles.avatar} 
          src={companion.avatar} 
          mode="aspectFill"
        />
        <View className={classnames(styles.statusDot, styles[status.color])} />
      </View>
      
      <View className={styles.infoSection}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{companion.name}</Text>
          <View className={styles.levelTag}>
            <Text className={styles.levelText}>{levelMap[companion.level]}</Text>
          </View>
        </View>
        
        <View className={styles.metaRow}>
          <Text className={styles.rating}>⭐ {companion.rating}分</Text>
          <Text className={styles.orderCount}>{companion.orderCount}单</Text>
          <Text className={styles.experience}>{companion.experience}年经验</Text>
        </View>
        
        <View className={styles.skillsRow}>
          {companion.skills.slice(0, 4).map((skill, index) => (
            <Text key={index} className={styles.skillTag}>{skill}</Text>
          ))}
          {companion.skills.length > 4 && (
            <Text className={styles.moreTag}>+{companion.skills.length - 4}</Text>
          )}
        </View>
        
        {companion.distance !== undefined && (
          <View className={styles.distanceRow}>
            <Text className={styles.distance}>📍 {companion.distance}km</Text>
            <Text className={styles.freeTime}>{companion.freeTime}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CompanionCard;
