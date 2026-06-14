import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import CompanionCard from '@/components/CompanionCard';
import { mockCompanions } from '@/data/mockCompanions';
import { mockHospitals } from '@/data/mockHospitals';
import { CompanionStatus } from '@/types/companion';
import styles from './index.module.scss';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'idle', label: '空闲' },
  { key: 'busy', label: '忙碌' },
  { key: 'offline', label: '离线' },
  { key: 'leave', label: '休假' }
];

const sortOptions = [
  { key: 'distance', label: '距离最近' },
  { key: 'rating', label: '评分最高' },
  { key: 'orderCount', label: '接单最多' },
  { key: 'experience', label: '经验最丰富' }
];

const CompanionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [hospitalFilter, setHospitalFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('distance');

  const filteredCompanions = useMemo(() => {
    let result = [...mockCompanions];

    if (activeTab !== 'all') {
      result = result.filter(c => c.status === activeTab);
    }

    if (searchText) {
      const keyword = searchText.toLowerCase();
      result = result.filter(c => 
        c.name.includes(keyword) ||
        c.skills.some(s => s.includes(keyword))
      );
    }

    if (hospitalFilter !== 'all') {
      result = result.filter(c => c.goodHospitals.includes(hospitalFilter));
    }

    if (sortBy === 'distance') {
      result.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'orderCount') {
      result.sort((a, b) => b.orderCount - a.orderCount);
    } else if (sortBy === 'experience') {
      result.sort((a, b) => b.experience - a.experience);
    }

    return result;
  }, [activeTab, searchText, hospitalFilter, sortBy]);

  const handleHospitalFilter = () => {
    const items = ['全部医院', ...mockHospitals.map(h => h.name)];
    Taro.showActionSheet({
      itemList: items,
      success: (res) => {
        setHospitalFilter(res.tapIndex === 0 ? 'all' : mockHospitals[res.tapIndex - 1].id);
      }
    });
  };

  const handleSort = () => {
    Taro.showActionSheet({
      itemList: sortOptions.map(s => s.label),
      success: (res) => {
        setSortBy(sortOptions[res.tapIndex].key);
      }
    });
  };

  const handleCompanionClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/companion-detail/index?id=${id}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.searchSection}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索陪诊师姓名/技能"
            placeholderClass={styles.searchPlaceholder}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
        <View className={styles.filterRow}>
          <View 
            className={classnames(styles.filterBtn, hospitalFilter !== 'all' && styles.active)}
            onClick={handleHospitalFilter}
          >
            <Text>
              {hospitalFilter === 'all' ? '全部医院' : mockHospitals.find(h => h.id === hospitalFilter)?.name}
            </Text>
          </View>
          <View 
            className={classnames(styles.filterBtn, sortBy !== 'distance' && styles.active)}
            onClick={handleSort}
          >
            <Text>{sortOptions.find(s => s.key === sortBy)?.label}</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabBar}>
        {statusTabs.map(tab => (
          <View 
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.summaryBar}>
        <Text className={styles.summaryText}>共 {filteredCompanions.length} 位陪诊师</Text>
      </View>

      <ScrollView className={styles.companionList} scrollY>
        {filteredCompanions.length > 0 ? (
          filteredCompanions.map(companion => (
            <CompanionCard 
              key={companion.id} 
              companion={companion}
              onClick={() => handleCompanionClick(companion.id)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>👨‍⚕️</Text>
            <Text className={styles.emptyText}>暂无陪诊师</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default CompanionsPage;
