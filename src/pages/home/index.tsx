import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import StatusTag from '@/components/StatusTag';
import StatCard from '@/components/StatCard';
import OrderCard from '@/components/OrderCard';
import { useOrderStore } from '@/store/useOrderStore';
import { mockHospitals } from '@/data/mockHospitals';
import { HospitalOrderGroup, Order } from '@/types/order';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const [expandedHospital, setExpandedHospital] = useState<string | null>(null);
  
  const initOrders = useOrderStore(state => state.initOrders);
  const getStats = useOrderStore(state => state.getStats);
  const getOrdersByTime = useOrderStore(state => state.getOrdersByTime);
  const reassignOrder = useOrderStore(state => state.reassignOrder);
  const applyExtraDuration = useOrderStore(state => state.applyExtraDuration);
  const handleExtraDuration = useOrderStore(state => state.handleExtraDuration);
  const addComplaint = useOrderStore(state => state.addComplaint);

  useDidShow(() => {
    initOrders();
  });

  const stats = useMemo(() => getStats('today'), [getStats]);
  const todayOrders = useMemo(() => getOrdersByTime('today'), [getOrdersByTime]);

  const hospitalGroups = useMemo(() => {
    const groups: Map<string, HospitalOrderGroup> = new Map();
    todayOrders.forEach(order => {
      if (!groups.has(order.hospitalId)) {
        const hospital = mockHospitals.find(h => h.id === order.hospitalId);
        groups.set(order.hospitalId, {
          hospitalId: order.hospitalId,
          hospitalName: order.hospitalName,
          hospitalAddress: hospital?.address || '',
          orders: [],
          pendingCount: 0,
          assignedCount: 0,
          servingCount: 0,
          completedCount: 0,
          totalCount: 0
        });
      }
      const group = groups.get(order.hospitalId)!;
      group.orders.push(order);
      group.totalCount++;
      if (order.status === 'pending') group.pendingCount++;
      else if (order.status === 'assigned') group.assignedCount++;
      else if (order.status === 'serving') group.servingCount++;
      else if (order.status === 'completed') group.completedCount++;
    });
    return Array.from(groups.values()).sort((a, b) => b.totalCount - a.totalCount);
  }, [todayOrders]);

  const handleHospitalClick = useCallback((hospitalId: string) => {
    setExpandedHospital(prev => prev === hospitalId ? null : hospitalId);
  }, []);

  const handleAssign = useCallback((orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.navigateTo({ url: `/pages/order-assign/index?orderId=${orderId}` });
  }, []);

  const handleReassign = useCallback((orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showActionSheet({
      itemList: ['改派给其他陪诊师', '取消当前派单'],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.showModal({
            title: '改派订单',
            content: '已为您重置派单状态，请在新页面重新选择陪诊师',
            success: (modalRes) => {
              if (modalRes.confirm) {
                reassignOrder(orderId, '', '', '', '调度改派');
                Taro.showToast({ title: '已取消派单', icon: 'success' });
                setTimeout(() => {
                  Taro.navigateTo({ url: `/pages/order-assign/index?orderId=${orderId}` });
                }, 800);
              }
            }
          });
        } else if (res.tapIndex === 1) {
          reassignOrder(orderId, '', '', '', '调度取消派单');
          Taro.showToast({ title: '已取消派单', icon: 'success' });
        }
      }
    });
  }, [reassignOrder]);

  const handleAddDuration = useCallback((orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showActionSheet({
      itemList: ['追加30分钟（¥50）', '追加60分钟（¥100）'],
      success: (res) => {
        const durations = [30, 60];
        const duration = durations[res.tapIndex];
        Taro.showModal({
          title: '追加时长',
          content: `确定要为订单追加${duration}分钟吗？追加后费用自动增加${Math.round(duration / 30) * 50}元。`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              applyExtraDuration(orderId, duration);
              handleExtraDuration(orderId, true);
              Taro.showToast({ title: `已追加${duration}分钟`, icon: 'success' });
            }
          }
        });
      }
    });
  }, [applyExtraDuration, handleExtraDuration]);

  const handleAddComplaintQuick = useCallback((orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showActionSheet({
      itemList: ['服务态度不好', '迟到超时', '服务不专业', '其他问题'],
      success: (res) => {
        const reasons = ['服务态度不好', '迟到超时', '服务不专业', '其他问题'];
        addComplaint(orderId, reasons[res.tapIndex]);
        Taro.showToast({ title: '投诉已记录', icon: 'success' });
      }
    });
  }, [addComplaint]);

  const handleOrderClick = useCallback((orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  }, []);

  const handleRefresh = useCallback(() => {
    initOrders();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 800);
  }, [initOrders]);

  React.useEffect(() => {
    Taro.onPullDownRefresh(handleRefresh);
    return () => {
      Taro.offPullDownRefresh(handleRefresh);
    };
  }, [handleRefresh]);

  const pendingCount = todayOrders.filter(o => o.status === 'pending').length;
  const assignedCount = todayOrders.filter(o => o.status === 'assigned').length;
  const servingCount = todayOrders.filter(o => o.status === 'serving').length;
  const completedCount = todayOrders.filter(o => o.status === 'completed').length;

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
          <StatCard title="待分配" value={pendingCount} color="warning" />
          <StatCard title="服务中" value={servingCount} color="success" />
          <StatCard title="已完成" value={completedCount} color="default" />
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
                      <View style={{ display: 'flex', alignItems: 'center', marginBottom: '8rpx', flexWrap: 'wrap', gap: '12rpx' }}>
                        <StatusTag status={order.status} size="sm" />
                        <Text style={{ fontSize: '26rpx', color: '#4e5969' }}>
                          {order.appointmentTime.slice(11, 16)}
                        </Text>
                        {order.isOverdue && (
                          <View style={{
                            backgroundColor: '#f53f3f',
                            color: '#fff',
                            padding: '2rpx 12rpx',
                            borderRadius: '6rpx',
                            fontSize: '20rpx'
                          }}>
                            <Text>超时</Text>
                          </View>
                        )}
                        {order.complaint && order.complaint !== '已处理' && (
                          <View style={{
                            backgroundColor: '#ff7d00',
                            color: '#fff',
                            padding: '2rpx 12rpx',
                            borderRadius: '6rpx',
                            fontSize: '20rpx'
                          }}>
                            <Text>投诉</Text>
                          </View>
                        )}
                      </View>
                      <Text className={styles.orderPatient}>
                        {order.patient.name} · {order.patient.age}岁 · {order.department}
                      </Text>
                      <Text className={styles.orderDetail}>
                        {order.checkItems.slice(0, 2).join('、')}
                        {order.checkItems.length > 2 ? '...' : ''}
                      </Text>
                    </View>
                    <View className={styles.orderActions}>
                      {order.status === 'pending' && (
                        <View 
                          className={styles.assignBtn}
                          onClick={(e) => handleAssign(order.id, e as any)}
                        >
                          <Text>派单</Text>
                        </View>
                      )}
                      {(order.status === 'assigned' || order.status === 'serving') && (
                        <View style={{ display: 'flex', flexDirection: 'column', gap: '8rpx' }}>
                          <View
                            className={styles.reassignBtn}
                            onClick={(e) => handleReassign(order.id, e as any)}
                          >
                            <Text>改派</Text>
                          </View>
                          <View
                            className={styles.addTimeBtn}
                            onClick={(e) => handleAddDuration(order.id, e as any)}
                          >
                            <Text>加时</Text>
                          </View>
                          <View
                            className={styles.complaintBtn}
                            onClick={(e) => handleAddComplaintQuick(order.id, e as any)}
                          >
                            <Text>投诉</Text>
                          </View>
                        </View>
                      )}
                    </View>
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
