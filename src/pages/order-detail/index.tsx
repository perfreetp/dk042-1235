import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import StatusTag from '@/components/StatusTag';
import Timeline from '@/components/Timeline';
import { mockOrders } from '@/data/mockOrders';
import { mockCompanions } from '@/data/mockCompanions';
import { Order } from '@/types/order';
import styles from './index.module.scss';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id;
  
  const order = useMemo<Order | undefined>(() => {
    return mockOrders.find(o => o.id === orderId);
  }, [orderId]);

  const companion = useMemo(() => {
    if (!order?.companionId) return null;
    return mockCompanions.find(c => c.id === order.companionId);
  }, [order]);

  const statusTextMap = {
    pending: '待分配陪诊师',
    assigned: '已接单，等待到院',
    serving: '服务进行中',
    completed: '服务已完成'
  };

  const handleCallPhone = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone.replace(/\*/g, '0') });
  };

  const handleAssign = () => {
    Taro.navigateTo({ url: `/pages/order-assign/index?orderId=${orderId}` });
  };

  const handleServiceExecute = () => {
    Taro.navigateTo({ url: `/pages/service-execute/index?orderId=${orderId}` });
  };

  const handleCustomerView = () => {
    Taro.navigateTo({ url: `/pages/customer-service/index?orderId=${orderId}` });
  };

  const handleContact = () => {
    Taro.showToast({ title: '消息功能开发中', icon: 'none' });
  };

  if (!order) {
    return (
      <View className={styles.page}>
        <Text style={{ textAlign: 'center', padding: '100rpx', color: '#86909c' }}>
          订单不存在
        </Text>
      </View>
    );
  }

  const showAssignBtn = order.status === 'pending';
  const showServiceBtn = order.status === 'assigned' || order.status === 'serving';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statusSection}>
        <View className={styles.statusRow}>
          <StatusTag status={order.status} size="md" />
        </View>
        <Text className={styles.statusText}>{statusTextMap[order.status]}</Text>
        <View style={{ marginTop: '16rpx' }}>
          <Text className={styles.orderNo}>订单号：{order.orderNo}</Text>
        </View>
        <Text className={styles.orderTime}>下单时间：{order.createTime}</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>医院信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>医院</Text>
          <Text className={styles.infoValue}>{order.hospitalName}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>科室</Text>
          <Text className={styles.infoValue}>{order.department}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>预约时间</Text>
          <Text className={styles.infoValue}>{order.appointmentTime}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>检查项目</Text>
          <View className={styles.checkItems}>
            {order.checkItems.map((item, index) => (
              <Text key={index} className={styles.checkItem}>{item}</Text>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>患者信息</Text>
        <View className={styles.patientCard}>
          <View className={styles.patientAvatar}>
            <Text className={styles.icon}>👤</Text>
          </View>
          <View className={styles.patientInfo}>
            <Text className={styles.patientName}>{order.patient.name}</Text>
            <Text className={styles.patientMeta}>
              {order.patient.gender === 'male' ? '男' : '女'} · {order.patient.age}岁 · {order.patient.phone}
            </Text>
          </View>
        </View>
      </View>

      {order.specialNotes && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>特殊注意事项</Text>
          <View className={styles.notesBox}>
            <Text className={styles.notesText}>⚠️ {order.specialNotes}</Text>
          </View>
        </View>
      )}

      <View className={styles.card}>
        <Text className={styles.cardTitle}>家属联系方式</Text>
        <View className={styles.contactRow}>
          <View className={styles.contactInfo}>
            <Text className={styles.contactName}>{order.familyContact.name}</Text>
            <Text className={styles.contactRelation}>
              {order.familyContact.relation} · {order.familyContact.phone}
            </Text>
          </View>
          <View 
            className={classnames(styles.callBtn, styles.success)}
            onClick={() => handleCallPhone(order.familyContact.phone)}
          >
            <Text>联系</Text>
          </View>
        </View>
      </View>

      {companion && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>陪诊师</Text>
          <View className={styles.companionCard}>
            <Image 
              className={styles.companionAvatar} 
              src={companion.avatar} 
              mode="aspectFill"
            />
            <View className={styles.companionInfo}>
              <Text className={styles.companionName}>{companion.name}</Text>
              <View className={styles.companionMeta}>
                <Text className={styles.rating}>⭐ {companion.rating}</Text>
                <Text>{companion.experience}年经验</Text>
                <Text>{companion.orderCount}单</Text>
              </View>
            </View>
            <View 
              className={classnames(styles.callBtn)}
              onClick={() => handleCallPhone(companion.phone)}
            >
              <Text>联系</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.card}>
        <Text className={styles.cardTitle}>服务进度</Text>
        <Timeline nodes={order.nodes} />
      </View>

      {order.receiptPhotos && order.receiptPhotos.length > 0 && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>票据照片</Text>
          <View className={styles.receiptPhotos}>
            {order.receiptPhotos.map((photo, index) => (
              <Image 
                key={index} 
                className={styles.receiptPhoto} 
                src={photo}
                mode="aspectFill"
              />
            ))}
          </View>
        </View>
      )}

      {order.visitResult && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>就诊结果</Text>
          <View className={styles.resultBox}>
            <Text className={styles.resultText}>{order.visitResult}</Text>
          </View>
        </View>
      )}

      {order.rating && (
        <View className={styles.reviewCard}>
          <View className={styles.reviewHeader}>
            <Text className={styles.reviewTitle}>客户评价</Text>
            <Text className={styles.reviewRating}>
              {'⭐'.repeat(order.rating)} {order.rating}.0
            </Text>
          </View>
          <Text className={styles.reviewContent}>{order.review}</Text>
        </View>
      )}

      <View className={styles.card}>
        <Text className={styles.cardTitle}>费用信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>服务等级</Text>
          <Text className={styles.infoValue}>
            {order.serviceLevel === 'standard' ? '标准服务' : 
             order.serviceLevel === 'premium' ? '高级服务' : 'VIP服务'}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>服务时长</Text>
          <Text className={styles.infoValue}>
            {order.actualDuration ? `${order.actualDuration}分钟（预计${order.duration}分钟）` : `${order.duration}分钟`}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>服务费用</Text>
          <Text className={styles.infoValue} style={{ color: '#f53f3f', fontWeight: 600 }}>
            ¥{order.price}
          </Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.outline)} onClick={handleContact}>
          <Text>消息</Text>
        </View>
        {showAssignBtn && (
          <View className={classnames(styles.btn, styles.primary)} onClick={handleAssign}>
            <Text>立即派单</Text>
          </View>
        )}
        {showServiceBtn && (
          <View className={classnames(styles.btn, styles.primary)} onClick={handleServiceExecute}>
            <Text>服务执行</Text>
          </View>
        )}
        {order.status === 'completed' && (
          <View className={classnames(styles.btn, styles.primary)} onClick={handleCustomerView}>
            <Text>客户视角</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default OrderDetailPage;
