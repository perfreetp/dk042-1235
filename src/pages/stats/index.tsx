import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { getStatsData, mockOrders } from '@/data/mockOrders';
import styles from './index.module.scss';

const StatsPage: React.FC = () => {
  const stats = getStatsData();
  
  const overdueOrders = mockOrders.filter(o => o.isOverdue);
  
  const complaints = [
    { 
      id: '1', 
      orderNo: 'PZ20240613008', 
      status: 'pending' as const, 
      content: '陪诊师迟到半小时，导致挂号差点过期，希望能加强管理。',
      time: '2024-06-13 15:30'
    },
    { 
      id: '2', 
      orderNo: 'PZ20240612005', 
      status: 'processing' as const, 
      content: '服务态度不好，对患者不够耐心。',
      time: '2024-06-12 11:20'
    },
    { 
      id: '3', 
      orderNo: 'PZ20240611012', 
      status: 'resolved' as const, 
      content: '票据遗失，已重新补办并致歉。',
      time: '2024-06-11 16:45'
    }
  ];

  const quickEntries = [
    { icon: '📊', label: '订单统计' },
    { icon: '👥', label: '人员绩效' },
    { icon: '💰', label: '收入明细' },
    { icon: '📈', label: '趋势分析' }
  ];

  const handleOverdueClick = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const handleQuickEntry = (label: string) => {
    Taro.showToast({ title: `${label}功能开发中`, icon: 'none' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>统计中心</Text>
        <Text className={styles.subTitle}>{dayjs().format('YYYY年MM月DD日')} 数据概览</Text>
      </View>

      <View className={styles.statsCards}>
        <View className={styles.bigStatCard}>
          <Text className={styles.bigStatTitle}>今日订单</Text>
          <View>
            <Text className={classnames(styles.bigStatValue, styles.primary)}>{stats.totalOrders}</Text>
            <Text className={styles.bigStatUnit}>单</Text>
          </View>
          <Text className={styles.bigStatDesc}>较昨日 +12%</Text>
        </View>
        <View className={styles.bigStatCard}>
          <Text className={styles.bigStatTitle}>今日收入</Text>
          <View>
            <Text className={classnames(styles.bigStatValue, styles.success)}>
              ¥{stats.todayRevenue}
            </Text>
          </View>
          <Text className={styles.bigStatDesc}>已完成订单收入</Text>
        </View>
        <View className={styles.bigStatCard}>
          <Text className={styles.bigStatTitle}>服务中</Text>
          <View>
            <Text className={classnames(styles.bigStatValue, styles.success)}>{stats.servingOrders}</Text>
            <Text className={styles.bigStatUnit}>单</Text>
          </View>
          <Text className={styles.bigStatDesc}>正在进行的服务</Text>
        </View>
        <View className={styles.bigStatCard}>
          <Text className={styles.bigStatTitle}>超时提醒</Text>
          <View>
            <Text className={classnames(styles.bigStatValue, styles.error)}>{stats.overdueOrders}</Text>
            <Text className={styles.bigStatUnit}>单</Text>
          </View>
          <Text className={styles.bigStatDesc}>需要及时处理</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>超时订单</Text>
          <Text className={styles.moreLink}>查看全部</Text>
        </View>
        
        {overdueOrders.length > 0 ? (
          overdueOrders.map(order => (
            <View 
              key={order.id} 
              className={styles.overdueCard}
              onClick={() => handleOverdueClick(order.id)}
            >
              <View className={styles.overdueHeader}>
                <Text className={styles.overdueOrderNo}>{order.orderNo}</Text>
                <Text className={styles.overdueTime}>超时 {Math.floor(Math.random() * 30 + 10)} 分钟</Text>
              </View>
              <Text className={styles.overdueInfo}>
                {order.hospitalName} · {order.department} · {order.patient.name}
              </Text>
              <Text className={styles.overdueReason}>待分配超时</Text>
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无超时订单</Text>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>投诉记录</Text>
          <Text className={styles.moreLink}>查看全部</Text>
        </View>
        
        {complaints.map(item => (
          <View key={item.id} className={styles.complaintCard}>
            <View className={styles.complaintHeader}>
              <Text className={styles.complaintOrder}>{item.orderNo}</Text>
              <View className={classnames(styles.complaintStatus, styles[item.status])}>
                <Text>
                  {item.status === 'pending' ? '待处理' : item.status === 'processing' ? '处理中' : '已解决'}
                </Text>
              </View>
            </View>
            <Text className={styles.complaintContent}>{item.content}</Text>
            <Text className={styles.complaintTime}>{item.time}</Text>
          </View>
        ))}
      </View>

      <View className={styles.quickEntrySection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>快捷入口</Text>
        </View>
        <View className={styles.quickGrid}>
          {quickEntries.map((item, index) => (
            <View 
              key={index} 
              className={styles.quickItem}
              onClick={() => handleQuickEntry(item.label)}
            >
              <Text className={styles.quickIcon}>{item.icon}</Text>
              <Text className={styles.quickLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default StatsPage;
