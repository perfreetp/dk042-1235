import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockOrders } from '@/data/mockOrders';
import { mockCompanions } from '@/data/mockCompanions';
import { Order } from '@/types/order';
import styles from './index.module.scss';

interface Message {
  id: string;
  content: string;
  sender: 'self' | 'other';
  time: string;
}

const CustomerServicePage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId;
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: '您好，我是您的陪诊师张护士，很高兴为您服务！', sender: 'other', time: '09:00' },
    { id: '2', content: '我已到达医院，请问您现在到哪里了？', sender: 'other', time: '09:02' },
    { id: '3', content: '我们正在路上，大概10分钟到', sender: 'self', time: '09:03' },
    { id: '4', content: '好的，我在门诊大厅门口等您，您到了给我打电话', sender: 'other', time: '09:04' }
  ]);
  
  const scrollRef = useRef<any>(null);

  const order = mockOrders.find(o => o.id === orderId) as Order | undefined;
  const companion = mockCompanions.find(c => c.id === order?.companionId);

  const trackNodes = [
    { label: '预约挂号', status: 'done' },
    { label: '到院签到', status: 'done' },
    { label: '候诊等待', status: 'current' },
    { label: '医生问诊', status: 'pending' },
    { label: '检查检验', status: 'pending' },
    { label: '取药结算', status: 'pending' }
  ];

  const quickReplies = [
    '我们快到了',
    '请问挂号在哪里',
    '需要带什么资料',
    '检查结果什么时候出',
    '可以加时吗'
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newMsg: Message = {
      id: String(Date.now()),
      content: message.trim(),
      sender: 'self',
      time: new Date().toLocaleTimeString().slice(0, 5)
    };
    
    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    
    setTimeout(() => {
      const reply: Message = {
        id: String(Date.now() + 1),
        content: '好的，收到您的消息，我会尽快处理。',
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
    Taro.showModal({
      title: '追加时长',
      content: '确定要追加30分钟服务时长吗？费用将按实际使用结算。',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已申请追加时长', icon: 'success' });
        }
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
    Taro.showToast({ title: '补充需求功能开发中', icon: 'none' });
  };

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        // scroll to bottom
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
          <Text className={styles.status}>● 服务中</Text>
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
            onConfirm={handleSend}
          />
        </View>
        <View 
          className={classnames(styles.sendBtn, !message.trim() && styles.disabled)}
          onClick={handleSend}
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
