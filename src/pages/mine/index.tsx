import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { getStatsData } from '@/data/mockOrders';
import styles from './index.module.scss';

type RoleType = 'dispatcher' | 'companion';

const MinePage: React.FC = () => {
  const [role, setRole] = useState<RoleType>('dispatcher');
  const stats = getStatsData();

  const handleRoleSwitch = () => {
    Taro.showActionSheet({
      itemList: ['调度员', '陪诊师'],
      success: (res) => {
        setRole(res.tapIndex === 0 ? 'dispatcher' : 'companion');
        Taro.showToast({
          title: `已切换为${res.tapIndex === 0 ? '调度员' : '陪诊师'}`,
          icon: 'success'
        });
      }
    });
  };

  const menuItems = [
    { icon: '🔔', label: '消息中心', badge: '3', path: '/pages/messages/index' },
    { icon: '📋', label: '我的订单', path: '/pages/orders/index' },
    { icon: '👤', label: '个人资料', path: '' },
    { icon: '🔧', label: '系统设置', path: '' },
    { icon: '📞', label: '联系客服', path: '' },
    { icon: '❓', label: '帮助中心', path: '' },
    { icon: '📜', label: '关于我们', path: '' }
  ];

  const companionMenuItems = [
    { icon: '📋', label: '我的任务', path: '' },
    { icon: '💰', label: '收入明细', path: '' },
    { icon: '⭐', label: '我的评价', path: '' },
    { icon: '🏥', label: '擅长医院', path: '' },
    { icon: '📚', label: '技能培训', path: '' },
    { icon: '🔔', label: '消息中心', badge: '2', path: '/pages/messages/index' },
    { icon: '⚙️', label: '设置', path: '' }
  ];

  const currentMenu = role === 'dispatcher' ? menuItems : companionMenuItems;

  const handleMenuClick = (path: string, label: string) => {
    if (path) {
      if (path.startsWith('/pages/orders')) {
        Taro.switchTab({ url: path });
      } else {
        Taro.navigateTo({ url: path });
      }
    } else {
      Taro.showToast({ title: `${label}功能开发中`, icon: 'none' });
    }
  };

  const profileInfo = role === 'dispatcher' 
    ? { name: '李调度', role: '调度员', empId: '工号: D001', avatar: 'https://picsum.photos/id/1005/200/200' }
    : { name: '张护士', role: '陪诊师', empId: '工号: C001', avatar: 'https://picsum.photos/id/64/200/200' };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.profileCard}>
          <Image 
            className={styles.avatar} 
            src={profileInfo.avatar}
            mode="aspectFill"
          />
          <View className={styles.profileInfo}>
            <Text className={styles.name}>{profileInfo.name}</Text>
            <View>
              <Text className={styles.role}>{profileInfo.role}</Text>
            </View>
            <Text className={styles.empId}>{profileInfo.empId}</Text>
          </View>
          <View className={styles.roleSwitch} onClick={handleRoleSwitch}>
            <Text>切换角色</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statValue, styles.primary)}>
            {role === 'dispatcher' ? stats.totalOrders : 3}
          </Text>
          <Text className={styles.statLabel}>
            {role === 'dispatcher' ? '今日订单' : '今日任务'}
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statValue, styles.success)}>
            {role === 'dispatcher' ? stats.completedOrders : 2}
          </Text>
          <Text className={styles.statLabel}>
            {role === 'dispatcher' ? '已完成' : '已完成'}
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statValue, styles.warning)}>
            {role === 'dispatcher' ? stats.servingOrders : 1}
          </Text>
          <Text className={styles.statLabel}>
            {role === 'dispatcher' ? '服务中' : '服务中'}
          </Text>
        </View>
      </View>

      <View className={styles.menuSection}>
        <View className={styles.menuCard}>
          {currentMenu.map((item, index) => (
            <View 
              key={index} 
              className={styles.menuItem}
              onClick={() => handleMenuClick(item.path, item.label)}
            >
              <Text className={styles.menuIcon}>{item.icon}</Text>
              <Text className={styles.menuText}>{item.label}</Text>
              {item.badge && <Text className={styles.menuBadge}>{item.badge}</Text>}
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.aboutSection}>
        <Text className={styles.versionText}>陪诊调度 v1.0.0</Text>
        <Text className={styles.copyright}>© 2024 陪诊服务平台</Text>
      </View>
    </ScrollView>
  );
};

export default MinePage;
