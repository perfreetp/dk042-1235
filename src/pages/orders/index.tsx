import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import OrderCard from '@/components/OrderCard';
import StatusTag from '@/components/StatusTag';
import { mockOrders } from '@/data/mockOrders';
import { mockHospitals } from '@/data/mockHospitals';
import { OrderStatus, Order } from '@/types/order';
import styles from './index.module.scss';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待分配' },
  { key: 'assigned', label: '已接单' },
  { key: 'serving', label: '服务中' },
  { key: 'completed', label: '已完成' }
];

const timeFilters = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week', label: '近7天' },
  { key: 'all', label: '全部' }
];

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('today');
  const [showHospitalFilter, setShowHospitalFilter] = useState(false);

  const filteredOrders = useMemo(() => {
    let result = [...mockOrders];

    if (activeTab !== 'all') {
      result = result.filter(o => o.status === activeTab);
    }

    if (searchText) {
      const keyword = searchText.toLowerCase();
      result = result.filter(o => 
        o.orderNo.toLowerCase().includes(keyword) ||
        o.patient.name.includes(keyword) ||
        o.hospitalName.includes(keyword) ||
        o.department.includes(keyword)
      );
    }

    if (selectedHospital !== 'all') {
      result = result.filter(o => o.hospitalId === selectedHospital);
    }

    return result;
  }, [activeTab, searchText, selectedHospital, timeFilter]);

  const handleTabClick = (key: string) => {
    setActiveTab(key);
  };

  const handleOrderClick = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const handleAssign = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-assign/index?orderId=${orderId}` });
  };

  const handleHospitalFilter = () => {
    const hospitals = ['all', ...mockHospitals.map(h => h.id)];
    const labels = ['全部医院', ...mockHospitals.map(h => h.name)];
    Taro.showActionSheet({
      itemList: labels,
      success: (res) => {
        setSelectedHospital(hospitals[res.tapIndex]);
      }
    });
  };

  const handleTimeFilter = () => {
    Taro.showActionSheet({
      itemList: timeFilters.map(t => t.label),
      success: (res) => {
        setTimeFilter(timeFilters[res.tapIndex].key);
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.searchSection}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索订单号/患者/医院/科室"
            placeholderClass={styles.searchPlaceholder}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
        <View className={styles.filterRow}>
          <View 
            className={classnames(styles.filterBtn, selectedHospital !== 'all' && styles.active)}
            onClick={handleHospitalFilter}
          >
            <Text>
              {selectedHospital === 'all' ? '全部医院' : mockHospitals.find(h => h.id === selectedHospital)?.name}
            </Text>
          </View>
          <View 
            className={classnames(styles.filterBtn, timeFilter !== 'today' && styles.active)}
            onClick={handleTimeFilter}
          >
            <Text>{timeFilters.find(t => t.key === timeFilter)?.label}</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View 
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => handleTabClick(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView className={styles.ordersList} scrollY>
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <View key={order.id} onClick={() => handleOrderClick(order.id)}>
              <OrderCard order={order} showHospital />
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无订单</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OrdersPage;
