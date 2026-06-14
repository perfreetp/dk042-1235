import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockCompanions } from '@/data/mockCompanions';
import { mockHospitals } from '@/data/mockHospitals';
import { Companion } from '@/types/companion';
import styles from './index.module.scss';

const levelMap = {
  standard: '标准陪诊师',
  senior: '资深陪诊师',
  expert: '专家陪诊师'
};

const statusMap = {
  idle: { text: '空闲', color: '#00b42a' },
  busy: { text: '忙碌', color: '#ff7d00' },
  offline: { text: '离线', color: '#86909c' },
  leave: { text: '休假', color: '#86909c' }
};

const reviews = [
  {
    id: '1',
    name: '王**',
    avatar: 'https://picsum.photos/id/1005/100/100',
    rating: 5,
    time: '2024-06-10',
    content: '非常专业，服务态度好，全程陪同很贴心，下次还会选择！'
  },
  {
    id: '2',
    name: '李**',
    avatar: 'https://picsum.photos/id/1012/100/100',
    rating: 5,
    time: '2024-06-08',
    content: '陪诊师很有耐心，对医院流程很熟悉，帮我们节省了很多时间。'
  },
  {
    id: '3',
    name: '张**',
    avatar: 'https://picsum.photos/id/1027/100/100',
    rating: 4,
    time: '2024-06-05',
    content: '整体服务不错，就是稍微迟到了几分钟，可以理解。'
  }
];

const CompanionDetailPage: React.FC = () => {
  const router = useRouter();
  const companionId = router.params.id;

  const companion = useMemo<Companion | undefined>(() => {
    return mockCompanions.find(c => c.id === companionId);
  }, [companionId]);

  const goodHospitalNames = useMemo(() => {
    if (!companion) return [];
    return mockHospitals
      .filter(h => companion.goodHospitals.includes(h.id))
      .map(h => h.name);
  }, [companion]);

  const handleCall = () => {
    if (companion) {
      Taro.makePhoneCall({ phoneNumber: companion.phone.replace(/\*/g, '0') });
    }
  };

  const handleAssign = () => {
    Taro.showToast({ title: '派单功能请前往订单分配页', icon: 'none' });
  };

  if (!companion) {
    return (
      <View className={styles.page}>
        <Text style={{ textAlign: 'center', padding: '100rpx', color: '#86909c' }}>
          陪诊师不存在
        </Text>
      </View>
    );
  }

  const status = statusMap[companion.status];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Image 
          className={styles.avatar} 
          src={companion.avatar}
          mode="aspectFill"
        />
        <View className={styles.info}>
          <Text className={styles.name}>{companion.name}</Text>
          <View>
            <Text className={styles.level}>{levelMap[companion.level]}</Text>
          </View>
          <Text className={styles.meta}>
            {companion.gender === 'male' ? '男' : '女'} · {companion.age}岁 · {companion.experience}年经验
          </Text>
          <Text className={styles.meta} style={{ marginTop: '8rpx' }}>
            状态：<Text style={{ color: status.color, fontWeight: 500 }}>{status.text}</Text>
          </Text>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statValue, styles.primary)}>{companion.orderCount}</Text>
            <Text className={styles.statLabel}>服务订单</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statValue, styles.warning)}>{companion.rating}</Text>
            <Text className={styles.statLabel}>评分</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statValue, styles.success)}>{companion.distance}km</Text>
            <Text className={styles.statLabel}>距您</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>个人简介</Text>
        <Text className={styles.introText}>{companion.intro}</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>擅长技能</Text>
        <View className={styles.skillTags}>
          {companion.skills.map((skill, index) => (
            <Text key={index} className={styles.skillTag}>{skill}</Text>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>擅长医院</Text>
        <View className={styles.hospitalList}>
          {goodHospitalNames.map((name, index) => (
            <View key={index} className={styles.hospitalItem}>
              <Text className={styles.hospitalIcon}>🏥</Text>
              <Text className={styles.hospitalName}>{name}</Text>
              <Text className={styles.hospitalBadge}>熟练</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>资质证书</Text>
        <View className={styles.skillTags}>
          <Text className={styles.skillTag}>{companion.certificate}</Text>
          <Text className={styles.skillTag}>健康证</Text>
          <Text className={styles.skillTag}>身份证</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>服务评价</Text>
        <View className={styles.reviewList}>
          {reviews.map(review => (
            <View key={review.id} className={styles.reviewItem}>
              <View className={styles.reviewHeader}>
                <Image 
                  className={styles.reviewerAvatar} 
                  src={review.avatar}
                  mode="aspectFill"
                />
                <Text className={styles.reviewerName}>{review.name}</Text>
                <Text className={styles.reviewRating}>
                  {'⭐'.repeat(review.rating)}
                </Text>
              </View>
              <Text className={styles.reviewTime}>{review.time}</Text>
              <Text className={styles.reviewContent}>{review.content}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.outline)} onClick={handleCall}>
          <Text>电话联系</Text>
        </View>
        <View className={classnames(styles.btn, styles.primary)} onClick={handleAssign}>
          <Text>指派订单</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default CompanionDetailPage;
