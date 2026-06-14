import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

interface Message {
  id: string;
  type: 'system' | 'order' | 'complaint' | 'notice';
  title: string;
  content: string;
  time: string;
  unread: boolean;
}

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'order',
    title: '新订单提醒',
    content: '您有一个新的陪诊订单待接单，患者：王建国，医院：北京协和医院',
    time: '10分钟前',
    unread: true
  },
  {
    id: '2',
    type: 'order',
    title: '订单状态更新',
    content: '订单 PZ20240614003 已开始服务，陪诊师：陈师傅',
    time: '30分钟前',
    unread: true
  },
  {
    id: '3',
    type: 'complaint',
    title: '投诉提醒',
    content: '订单 PZ20240613008 收到客户投诉，请及时处理',
    time: '1小时前',
    unread: true
  },
  {
    id: '4',
    type: 'system',
    title: '系统通知',
    content: '陪诊服务平台版本更新，新增多项功能，欢迎体验',
    time: '今天 09:00',
    unread: false
  },
  {
    id: '5',
    type: 'order',
    title: '订单完成',
    content: '订单 PZ20240614004 服务已完成，客户评价：5星好评',
    time: '今天 08:30',
    unread: false
  },
  {
    id: '6',
    type: 'notice',
    title: '超时提醒',
    content: '订单 PZ20240614010 分配超时，请尽快处理',
    time: '昨天 18:00',
    unread: false
  },
  {
    id: '7',
    type: 'system',
    title: '培训通知',
    content: '本周六下午2点将进行新员工培训，请准时参加',
    time: '昨天 15:30',
    unread: false
  }
];

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'order', label: '订单' },
  { key: 'system', label: '系统' },
  { key: 'complaint', label: '投诉' }
];

const iconMap = {
  system: { icon: '🔔', type: 'info' },
  order: { icon: '📋', type: 'success' },
  complaint: { icon: '⚠️', type: 'error' },
  notice: { icon: '📢', type: 'warning' }
};

const MessagesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredMessages = useMemo(() => {
    if (activeTab === 'all') return mockMessages;
    return mockMessages.filter(m => m.type === activeTab);
  }, [activeTab]);

  const handleMessageClick = (msg: Message) => {
    if (msg.type === 'order') {
      Taro.switchTab({ url: '/pages/orders/index' });
    } else if (msg.type === 'complaint') {
      Taro.switchTab({ url: '/pages/stats/index' });
    } else {
      Taro.showToast({ title: '消息详情开发中', icon: 'none' });
    }
  };

  const unreadCount = mockMessages.filter(m => m.unread).length;

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View 
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView className={styles.messageList} scrollY>
        {filteredMessages.length > 0 ? (
          filteredMessages.map(msg => {
            const iconInfo = iconMap[msg.type] || iconMap.system;
            return (
              <View 
                key={msg.id} 
                className={styles.messageCard}
                onClick={() => handleMessageClick(msg)}
              >
                <View className={classnames(styles.iconWrapper, styles[iconInfo.type])}>
                  <Text className={styles.icon}>{iconInfo.icon}</Text>
                </View>
                <View className={styles.messageContent}>
                  <View className={styles.messageHeader}>
                    <View style={{ display: 'flex', alignItems: 'center' }}>
                      <Text className={styles.messageTitle}>{msg.title}</Text>
                      {msg.unread && <View className={styles.badge} />}
                    </View>
                    <Text className={styles.messageTime}>{msg.time}</Text>
                  </View>
                  <Text className={styles.messageDesc}>{msg.content}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无消息</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MessagesPage;
