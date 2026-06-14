import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { mockCompanions } from '@/data/mockCompanions';
import { useOrderStore } from '@/store/useOrderStore';
import { Companion } from '@/types/companion';
import { Order } from '@/types/order';
import styles from './index.module.scss';

const levelMap = {
  standard: '标准',
  senior: '资深',
  expert: '专家'
};

const OrderAssignPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId;
  
  const [selectedCompanion, setSelectedCompanion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('match');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const initOrders = useOrderStore(state => state.initOrders);
  const getOrderById = useOrderStore(state => state.getOrderById);
  const assignOrder = useOrderStore(state => state.assignOrder);

  useDidShow(() => {
    initOrders();
  });

  const order = useMemo<Order | undefined>(() => {
    return getOrderById(orderId || '');
  }, [orderId, getOrderById]);

  const companionsWithScore = useMemo(() => {
    return mockCompanions
      .filter(c => {
        if (filterLevel !== 'all' && c.level !== filterLevel) return false;
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        return true;
      })
      .map(c => {
        let score = 60;
        
        if (c.goodHospitals.includes(order?.hospitalId || '')) {
          score += 15;
        }
        
        if (c.level === 'expert') {
          score += 10;
        } else if (c.level === 'senior') {
          score += 5;
        }
        
        score += c.rating * 2;
        
        if (c.status === 'idle') {
          score += 5;
        }
        
        const distanceBonus = Math.max(0, 10 - (c.distance || 5) * 2);
        score += distanceBonus;
        
        const highlights = [];
        if (c.goodHospitals.includes(order?.hospitalId || '')) {
          highlights.push('擅长该医院');
        }
        if (c.status === 'idle') {
          highlights.push('当前空闲');
        }
        if (c.rating >= 4.8) {
          highlights.push('高评分');
        }
        if (c.experience >= 5) {
          highlights.push('经验丰富');
        }
        
        return {
          ...c,
          matchScore: Math.min(100, Math.round(score)),
          highlights
        };
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore - a.matchScore;
        if (sortBy === 'distance') return (a.distance || 999) - (b.distance || 999);
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'experience') return b.experience - a.experience;
        return 0;
      });
  }, [order, filterLevel, filterStatus, sortBy]);

  const handleSelectCompanion = (id: string) => {
    setSelectedCompanion(id === selectedCompanion ? null : id);
  };

  const handleAssign = () => {
    if (!selectedCompanion) return;
    
    Taro.showModal({
      title: '确认派单',
      content: `确定将订单派给 ${companionsWithScore.find(c => c.id === selectedCompanion)?.name} 吗？`,
      success: (res) => {
        if (res.confirm && orderId) {
          const companion = companionsWithScore.find(c => c.id === selectedCompanion);
          assignOrder(orderId, selectedCompanion, companion?.name || '', companion?.phone || '');
          Taro.showToast({
            title: '派单成功',
            icon: 'success',
            duration: 1500
          });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      }
    });
  };

  const handleSortChange = () => {
    const options = ['智能匹配', '距离最近', '评分最高', '经验最丰富'];
    const keys = ['match', 'distance', 'rating', 'experience'];
    Taro.showActionSheet({
      itemList: options,
      success: (res) => {
        setSortBy(keys[res.tapIndex]);
      }
    });
  };

  const handleLevelFilter = () => {
    const options = ['全部等级', '标准陪诊', '资深陪诊', '专家陪诊'];
    const keys = ['all', 'standard', 'senior', 'expert'];
    Taro.showActionSheet({
      itemList: options,
      success: (res) => {
        setFilterLevel(keys[res.tapIndex]);
      }
    });
  };

  const handleStatusFilter = () => {
    const options = ['全部状态', '空闲', '忙碌', '离线'];
    const keys = ['all', 'idle', 'busy', 'offline'];
    Taro.showActionSheet({
      itemList: options,
      success: (res) => {
        setFilterStatus(keys[res.tapIndex]);
      }
    });
  };

  const selectedCompanionInfo = companionsWithScore.find(c => c.id === selectedCompanion);

  if (!order) {
    return (
      <View className={styles.page}>
        <Text style={{ textAlign: 'center', padding: '100rpx', color: '#86909c' }}>
          订单不存在
        </Text>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.orderSummary}>
        <Text className={styles.orderTitle}>待分配订单</Text>
        <Text className={styles.orderDesc}>
          {order.hospitalName} · {order.department}
        </Text>
        <Text className={styles.orderMeta}>
          {order.appointmentTime.slice(11, 16)} · {order.patient.name}({order.patient.age}岁) · {order.checkItems.length}项检查
        </Text>
      </View>

      <View className={styles.filterSection}>
        <View 
          className={classnames(styles.filterBtn, styles.active)}
          onClick={handleSortChange}
        >
          <Text>
            {sortBy === 'match' ? '智能匹配' : 
             sortBy === 'distance' ? '距离最近' :
             sortBy === 'rating' ? '评分最高' : '经验最丰富'}
          </Text>
        </View>
        <View 
          className={classnames(styles.filterBtn, filterLevel !== 'all' && styles.active)}
          onClick={handleLevelFilter}
        >
          <Text>
            {filterLevel === 'all' ? '服务等级' : 
             filterLevel === 'standard' ? '标准' :
             filterLevel === 'senior' ? '资深' : '专家'}
          </Text>
        </View>
        <View 
          className={classnames(styles.filterBtn, filterStatus !== 'all' && styles.active)}
          onClick={handleStatusFilter}
        >
          <Text>
            {filterStatus === 'all' ? '状态' :
             filterStatus === 'idle' ? '空闲' :
             filterStatus === 'busy' ? '忙碌' : '离线'}
          </Text>
        </View>
      </View>

      <ScrollView className={styles.companionList} scrollY>
        {companionsWithScore.map((companion, index) => (
          <View 
            key={companion.id}
            className={classnames(
              styles.companionCard,
              index === 0 && styles.recommended
            )}
            onClick={() => handleSelectCompanion(companion.id)}
          >
            <View className={styles.cardHeader}>
              <View className={styles.avatarSection}>
                <Image 
                  className={styles.avatar} 
                  src={companion.avatar}
                  mode="aspectFill"
                />
                <View 
                  className={classnames(
                    styles.statusDot,
                    companion.status === 'idle' ? 'status-idle' : ''
                  )}
                  style={{ 
                    backgroundColor: companion.status === 'idle' ? '#00b42a' : 
                                    companion.status === 'busy' ? '#ff7d00' : '#86909c'
                  }}
                />
              </View>
              
              <View className={styles.infoSection}>
                <View className={styles.nameRow}>
                  <Text className={styles.name}>{companion.name}</Text>
                  <View className={styles.levelTag}>
                    <Text>{levelMap[companion.level]}级</Text>
                  </View>
                </View>
                <View className={styles.metaRow}>
                  <Text className={styles.rating}>⭐ {companion.rating}</Text>
                  <Text className={styles.orderCount}>{companion.orderCount}单</Text>
                  <Text className={styles.experience}>{companion.experience}年经验</Text>
                </View>
              </View>
              
              <View className={styles.matchScore}>
                <Text className={styles.matchValue}>{(companion as any).matchScore}</Text>
                <Text className={styles.matchLabel}>匹配度</Text>
              </View>
            </View>

            {(companion as any).highlights.length > 0 && (
              <View className={styles.highlights}>
                {(companion as any).highlights.map((h: string, i: number) => (
                  <Text key={i} className={styles.highlightTag}>{h}</Text>
                ))}
              </View>
            )}

            <View className={styles.skills}>
              {companion.skills.slice(0, 5).map((skill, index) => (
                <Text key={index} className={styles.skillTag}>{skill}</Text>
              ))}
              {companion.skills.length > 5 && (
                <Text className={styles.skillTag}>+{companion.skills.length - 5}</Text>
              )}
            </View>

            <View className={styles.cardFooter}>
              <View>
                <Text className={styles.distanceInfo}>
                  距医院 {companion.distance}km · 
                  <Text className={styles.freeTime}> {companion.freeTime}</Text>
                </Text>
              </View>
              <View 
                className={classnames(
                  styles.assignBtn,
                  companion.status !== 'idle' && styles.disabled
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (companion.status === 'idle') {
                    setSelectedCompanion(companion.id);
                    handleAssign();
                  }
                }}
              >
                <Text>派单</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.selectedInfo}>
          <Text className={styles.selectedLabel}>已选择陪诊师</Text>
          <Text className={styles.selectedName}>
            {selectedCompanionInfo ? selectedCompanionInfo.name : '请选择陪诊师'}
          </Text>
        </View>
        <View 
          className={classnames(styles.confirmBtn, !selectedCompanion && styles.disabled)}
          onClick={handleAssign}
        >
          <Text>确认派单</Text>
        </View>
      </View>
    </View>
  );
};

export default OrderAssignPage;
