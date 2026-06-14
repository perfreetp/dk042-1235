import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import StatCard from '@/components/StatCard';
import { useOrderStore } from '@/store/useOrderStore';
import { Order } from '@/types/order';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const StatsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');
  const initOrders = useOrderStore(state => state.initOrders);
  const getStats = useOrderStore(state => state.getStats);
  const getOrdersByTime = useOrderStore(state => state.getOrdersByTime);
  const handleComplaint = useOrderStore(state => state.handleComplaint);

  useDidShow(() => {
    initOrders();
  });

  const stats = useMemo(() => getStats(activeTab), [activeTab, getStats]);
  const rangeOrders = useMemo(() => getOrdersByTime(activeTab), [activeTab, getOrdersByTime]);

  const overdueOrders = useMemo(
    () => rangeOrders.filter(o => o.isOverdue && o.status !== 'completed'),
    [rangeOrders]
  );

  const pendingComplaints = useMemo(
    () => rangeOrders.filter(o => o.complaint && o.complaint !== '已处理'),
    [rangeOrders]
  );

  const tabs = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' }
  ];

  const handleTabClick = (key: string) => {
    setActiveTab(key as 'today' | 'week' | 'month');
  };

  const handleViewOrder = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?orderId=${orderId}` });
  };

  const handleResolveComplaint = (orderId: string) => {
    Taro.showModal({
      title: '处理投诉',
      editable: true,
      placeholderText: '请输入处理结果说明',
      success: (res) => {
        if (res.confirm) {
          const result = res.content || '已联系客户并妥善处理';
          handleComplaint(orderId, result);
          Taro.showToast({ title: '投诉已处理', icon: 'success' });
        }
      }
    });
  };

  const quickEntries = [
    { icon: '📊', label: '数据报表', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: '💰', label: '结算明细', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: '📝', label: '投诉管理', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: '👥', label: '绩效统计', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>统计中心</Text>
        <View className={styles.tabBar}>
          {tabs.map(tab => (
            <View 
              key={tab.key}
              className={classnames(
                styles.tabItem,
                activeTab === tab.key && styles.active
              )}
              onClick={() => handleTabClick(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.statsGrid}>
        <StatCard 
          title="订单数量" 
          value={stats.totalOrders} 
          unit="单"
          trend="+12%"
          trendType="up"
          onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}
        />
        <StatCard 
          title="完成订单" 
          value={stats.completedOrders} 
          unit="单"
          trend="+8%"
          trendType="up"
          onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}
        />
        <StatCard 
          title="服务收入" 
          value={stats.totalRevenue} 
          unit="元"
          trend="+15%"
          trendType="up"
          onClick={() => Taro.showToast({ title: '查看明细', icon: 'none' })}
        />
        <StatCard 
          title="平均评分" 
          value={stats.avgRating} 
          unit="分"
          trend="+0.2"
          trendType="up"
          onClick={() => Taro.showToast({ title: '查看评价', icon: 'none' })}
        />
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>超时提醒</Text>
          <Text className={styles.sectionMore}>
            共{overdueOrders.length}条 →
          </Text>
        </View>
        {overdueOrders.length === 0 ? (
          <View className={styles.emptyCard}>
            <Text style={{ color: '#86909c', fontSize: '26rpx' }}>该时间段暂无超时订单</Text>
          </View>
        ) : (
          <ScrollView className={styles.overdueList} scrollX>
            {overdueOrders.map(order => (
              <View key={order.id} className={styles.overdueCard} onClick={() => handleViewOrder(order.id)}>
                <View className={styles.overdueHeader}>
                  <Text className={styles.overdueTag}>超时</Text>
                  <Text className={styles.overdueOrderNo}>{order.orderNo.slice(-6)}</Text>
                </View>
                <Text className={styles.overduePatient}>{order.patient.name}</Text>
                <Text className={styles.overdueHospital}>{order.hospitalName}</Text>
                <Text className={styles.overdueTime}>{order.appointmentTime.slice(5, 16)}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>投诉记录</Text>
          <Text className={styles.sectionMore}>
            共{pendingComplaints.length}条待处理 →
          </Text>
        </View>
        {pendingComplaints.length === 0 ? (
          <View className={styles.emptyCard}>
            <Text style={{ color: '#86909c', fontSize: '26rpx' }}>该时间段暂无待处理投诉</Text>
          </View>
        ) : (
          <View className={styles.complaintList}>
            {pendingComplaints.map(order => (
              <View key={order.id} className={styles.complaintCard}>
                <View className={styles.complaintHeader}>
                  <Text className={styles.complaintOrderNo}>订单号：{order.orderNo}</Text>
                  <Text className={styles.complaintTime}>{dayjs(order.createTime).format('MM-DD HH:mm')}</Text>
                </View>
                <Text className={styles.complaintContent}>投诉内容：{order.complaint}</Text>
                <View className={styles.complaintMeta}>
                  <Text style={{ fontSize: '24rpx', color: '#86909c' }}>
                    客户：{order.patient.name} · {order.hospitalName}
                  </Text>
                </View>
                <View className={styles.complaintActions}>
                  <View className={styles.complaintBtn} onClick={() => handleViewOrder(order.id)}>
                    <Text>查看详情</Text>
                  </View>
                  <View className={classnames(styles.complaintBtn, styles.primary)} onClick={() => handleResolveComplaint(order.id)}>
                    <Text>处理投诉</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>快捷操作</Text>
        <View className={styles.quickGrid}>
          {quickEntries.map((entry, index) => (
            <View 
              key={index} 
              className={styles.quickItem}
              onClick={entry.action}
            >
              <Text className={styles.quickIcon}>{entry.icon}</Text>
              <Text className={styles.quickLabel}>{entry.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default StatsPage;
