import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import StatusTag from '@/components/StatusTag';
import StatCard from '@/components/StatCard';
import OrderCard from '@/components/OrderCard';
import { getHospitalOrderGroups, getStatsData } from '@/data/mockOrders';
import { HospitalOrderGroup, Order } from '@/types/order';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const [expandedHospital, setExpandedHospital] = useState<string | null>(null);
  const stats = getStatsData();
  const hospitalGroups = getHospitalOrderGroups();

  const handleHospitalClick = useCallback((hospitalId: string) => {
    setExpandedHospital(prev => prev === hospitalId ? null : hospitalId);
  }, []);

  const handleAssign = useCallback((orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.navigateTo({ url: `/pages/order-assign/index?orderId=${orderId}` });
  }, []);

  const handleOrderClick = useCallback((orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  }, []);

  const handleRefresh = useCallback(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 1000);
  }, []);

  React.useEffect(() => {
    Taro.onPullDownRefresh(handleRefresh);
    return () => {
      Taro.offPullDownRefresh(handleRefresh);
    };
  }, [handleRefresh]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>陪诊调度</Text>
          <Text className={styles.dateText}>{dayjs().format('MM月DD日')}</Text>
        </View>
        <View className={styles.searchBar}>
          <Text className={styles.searchPlaceholder}>搜索订单号 / 患者姓名 / 医院</Text>
        </View>
      </View>

      <View className={styles.statsContainer}>
        <View className={styles.statsGrid}>
          <StatCard title="今日订单" value={stats.totalOrders} color="primary" />
          <StatCard title="待分配" value={stats.pendingOrders} color="warning" />
          <StatCard title="服务中" value={stats.servingOrders} color="success" />
          <StatCard title="已完成" value={stats.completedOrders} color="default" />
        </View>
      </View>

      <View className={styles.hospitalSection}>
        <Text className={styles.sectionTitle}>医院订单分布</Text>
        
        {hospitalGroups.map((group: HospitalOrderGroup) => (
          <View key={group.hospitalId} className={styles.hospitalCard}>
            <View className={styles.hospitalHeader} onClick={() => handleHospitalClick(group.hospitalId)}>
              <View className={styles.hospitalInfo}>
                <Text className={styles.hospitalName}>{group.hospitalName}</Text>
                <Text className={styles.hospitalAddress}>{group.hospitalAddress}</Text>
              </View>
              <Text className={classnames(styles.arrowIcon, expandedHospital === group.hospitalId && styles.expanded)}>
                ›
              </Text>
            </View>

            <View className={styles.statusBar}>
              <View className={styles.statusItem}>
                <View className={classnames(styles.statusDot, styles.pending)} />
                <Text className={styles.statusCount}>{group.pendingCount}</Text>
                <Text className={styles.statusLabel}>待分配</Text>
              </View>
              <View className={styles.statusItem}>
                <View className={classnames(styles.statusDot, styles.assigned)} />
                <Text className={styles.statusCount}>{group.assignedCount}</Text>
                <Text className={styles.statusLabel}>已接单</Text>
              </View>
              <View className={styles.statusItem}>
                <View className={classnames(styles.statusDot, styles.serving)} />
                <Text className={styles.statusCount}>{group.servingCount}</Text>
                <Text className={styles.statusLabel}>服务中</Text>
              </View>
              <View className={styles.statusItem}>
                <View className={classnames(styles.statusDot, styles.completed)} />
                <Text className={styles.statusCount}>{group.completedCount}</Text>
                <Text className={styles.statusLabel}>已完成</Text>
              </View>
            </View>

            {expandedHospital === group.hospitalId && (
              <View className={styles.ordersList}>
                {group.orders.map((order: Order) => (
                  <View key={order.id} className={styles.orderMiniCard}>
                    <View className={styles.orderInfo} onClick={() => handleOrderClick(order.id)}>
                      <View style={{ display: 'flex', alignItems: 'center', marginBottom: '8rpx' }}>
                        <StatusTag status={order.status} size="sm" />
                        <Text style={{ marginLeft: '16rpx', fontSize: '26rpx', color: '#4e5969' }}>
                          {order.appointmentTime.slice(11, 16)}
                        </Text>
                      </View>
                      <Text className={styles.orderPatient}>
                        {order.patient.name} · {order.patient.age}岁 · {order.department}
                      </Text>
                      <Text className={styles.orderDetail}>
                        {order.checkItems.slice(0, 2).join('、')}
                        {order.checkItems.length > 2 ? '...' : ''}
                      </Text>
                    </View>
                    {order.status === 'pending' && (
                      <View className={styles.orderAction}>
                        <View 
                          className={styles.assignBtn}
                          onClick={(e) => handleAssign(order.id, e as any)}
                        >
                          <Text>派单</Text>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default HomePage;
