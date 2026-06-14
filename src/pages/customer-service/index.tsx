import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Image, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useOrderStore, generateDefaultNodes } from '@/store/useOrderStore';
import { mockCompanions } from '@/data/mockCompanions';
import { Order, ServiceNode } from '@/types/order';
import styles from './index.module.scss';

interface Message {
  id: string;
  content: string;
  sender: 'self' | 'other';
  time: string;
  type?: 'normal' | 'supplement';
}

const CustomerServicePage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId;
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const scrollRef = useRef<any>(null);
  
  const getOrderById = useOrderStore(state => state.getOrderById);
  const sendSupplementToCompanion = useOrderStore(state => state.sendSupplementToCompanion);
  const applyExtraDuration = useOrderStore(state => state.applyExtraDuration);
  const initOrders = useOrderStore(state => state.initOrders);
  const orders = useOrderStore(state => state.orders);

  const order = useMemo(() => getOrderById(orderId || ''), [orderId, getOrderById, orders]);
  const companion = useMemo(() => {
    if (!order?.companionId) return null;
    return mockCompanions.find(c => c.id === order.companionId);
  }, [order]);

  const trackNodes = useMemo<ServiceNode[]>(() => {
    if (!order) return [];
    if (order.nodes && order.nodes.length > 0) {
      return order.nodes.map(n => ({ ...n }));
    }
    return generateDefaultNodes(order.status);
  }, [order]);

  const initMessages = () => {
    if (!order) return;
    const baseMessages: Message[] = [
      { id: 'sys1', content: `您好，我是您的陪诊师${companion?.name || ''}，很高兴为您服务！`, sender: 'other', time: '09:00' },
    ];
    if (order.status === 'assigned') {
      baseMessages.push({ id: 'sys2', content: '我正在前往医院，请您按预约时间到达即可', sender: 'other', time: '09:02' });
    } else if (order.status === 'serving') {
      baseMessages.push({ id: 'sys2', content: '我已到达医院，正在门诊大厅等您，方便时请联系我', sender: 'other', time: '09:05' });
    } else if (order.status === 'completed') {
      baseMessages.push({ id: 'sys2', content: '今天的陪诊服务已完成，如有问题随时联系，祝您身体健康！', sender: 'other', time: '11:30' });
    }
    if (order.supplementMessages?.length) {
      order.supplementMessages.forEach(sm => {
        baseMessages.push({
          id: sm.id,
          content: `【补充需求】${sm.content}`,
          sender: sm.from === 'customer' ? 'self' : 'other',
          time: sm.time,
          type: 'supplement'
        });
      });
    }
    setMessages(baseMessages);
  };

  useDidShow(() => {
    initOrders();
    initMessages();
  });

  useEffect(() => {
    initMessages();
  }, [orderId]);

  const quickReplies = [
    '我们快到了',
    '请问挂号在哪里',
    '需要带什么资料',
    '检查结果什么时候出',
    '可以加时吗'
  ];

  const statusTextMap = {
    pending: '● 等待分配陪诊师',
    assigned: '● 已接单，前往医院中',
    serving: '● 服务中',
    completed: '● 服务已完成'
  };

  const handleSend = (type: 'normal' | 'supplement' = 'normal', contentOverride?: string) => {
    const sendContent = contentOverride || message.trim();
    if (!sendContent) return;
    
    const newMsg: Message = {
      id: String(Date.now()),
      content: type === 'supplement' ? `【补充需求】${sendContent}` : sendContent,
      sender: 'self',
      time: new Date().toLocaleTimeString().slice(0, 5),
      type
    };
    
    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    
    if (type === 'supplement' && orderId) {
      sendSupplementToCompanion(orderId, sendContent);
      Taro.showToast({ title: '补充需求已发送给陪诊师', icon: 'success' });
    }
    
    setTimeout(() => {
      const replyContent = type === 'supplement'
        ? '好的，补充需求已收到，我会注意的！'
        : '好的，收到您的消息，我会尽快处理。';
      const reply: Message = {
        id: String(Date.now() + 1),
        content: replyContent,
        sender: 'other',
        time: new Date().toLocaleTimeString().slice(0, 5)
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  const handleQuickReply = (text: string) => {
    setMessage(text);
  };

  const handleAddTime = () => {
    Taro.showActionSheet({
      itemList: ['追加30分钟（¥50）', '追加60分钟（¥100）', '追加120分钟（¥200）'],
      success: (res) => {
        const durations = [30, 60, 120];
        const duration = durations[res.tapIndex];
        Taro.showModal({
          title: '追加时长',
          content: `确定要追加${duration}分钟服务时长吗？`,
          success: (modalRes) => {
            if (modalRes.confirm && orderId) {
              applyExtraDuration(orderId, duration);
              Taro.showToast({ title: '已申请追加时长', icon: 'success' });
            }
          }
        });
      }
    });
  };

  const handleReview = () => {
    Taro.navigateTo({ url: `/pages/review-detail/index?orderId=${orderId}` });
  };

  const handleCall = () => {
    if (companion) {
      Taro.makePhoneCall({ phoneNumber: companion.phone.replace(/\*/g, '0') });
    }
  };

  const handleSupplement = () => {
    Taro.showModal({
      title: '补充需求',
      editable: true,
      placeholderText: '请输入需要补充的需求，将直接发送给陪诊师',
      success: (res) => {
        if (res.confirm && res.content) {
          handleSend('supplement', res.content);
        }
      }
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        // scroll to bottom handled by component
      }, 100);
    }
  }, [messages]);

  if (!order || !companion) {
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
      <View className={styles.header}>
        <Image 
          className={styles.avatar} 
          src={companion.avatar}
          mode="aspectFill"
        />
        <View className={styles.info}>
          <Text className={styles.name}>{companion.name}</Text>
          <Text className={styles.status}>
            {statusTextMap[order.status as keyof typeof statusTextMap] || '● 等待分配'}
          </Text>
        </View>
        <View className={styles.callBtn} onClick={handleCall}>
          <Text>电话</Text>
        </View>
      </View>

      <View className={styles.trackSection}>
        <Text className={styles.trackTitle}>服务进度</Text>
        <View className={styles.trackItems}>
          {trackNodes.map((node, index) => (
            <View 
              key={index}
              className={classnames(
                styles.trackItem,
                node.status
              )}
            >
              <View className={styles.trackDot}>
                {node.status === 'done' ? '✓' : ''}
              </View>
              <Text className={styles.trackLabel}>{node.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.quickActions}>
        {quickReplies.map((text, index) => (
          <View 
            key={index} 
            className={styles.quickBtn}
            onClick={() => handleQuickReply(text)}
          >
            <Text>{text}</Text>
          </View>
        ))}
      </View>

      <ScrollView className={styles.chatContainer} scrollY ref={scrollRef}>
        {messages.map(msg => (
          <View 
            key={msg.id} 
            className={classnames(styles.messageItem, msg.sender === 'self' && styles.self)}
          >
            <Image 
              className={styles.messageAvatar} 
              src={msg.sender === 'self' 
                ? 'https://picsum.photos/id/1005/100/100' 
                : companion.avatar
              }
              mode="aspectFill"
            />
            <View className={styles.messageContent}>
              <View className={styles.messageBubble}>
                <Text className={styles.messageText}>{msg.content}</Text>
              </View>
              <Text className={styles.messageTime}>{msg.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className={styles.inputBar}>
        <View className={styles.inputWrapper}>
          <Input
            className={styles.input}
            placeholder="请输入消息..."
            value={message}
            onInput={(e) => setMessage(e.detail.value)}
            onConfirm={() => handleSend('normal')}
          />
        </View>
        <View 
          className={classnames(styles.sendBtn, !message.trim() && styles.disabled)}
          onClick={() => handleSend('normal')}
        >
          <Text>发送</Text>
        </View>
      </View>

      <View className={styles.bottomActions}>
        <View className={classnames(styles.actionBtn, styles.outline)} onClick={handleSupplement}>
          <Text>补充需求</Text>
        </View>
        <View className={classnames(styles.actionBtn, styles.outline)} onClick={handleAddTime}>
          <Text>追加时长</Text>
        </View>
        <View className={classnames(styles.actionBtn, styles.primary)} onClick={handleReview}>
          <Text>服务评价</Text>
        </View>
      </View>
    </View>
  );
};

export default CustomerServicePage;
