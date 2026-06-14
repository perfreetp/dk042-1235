import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import StatusTag from '@/components/StatusTag';
import Timeline from '@/components/Timeline';
import { mockCompanions } from '@/data/mockCompanions';
import { useOrderStore, generateDefaultNodes } from '@/store/useOrderStore';
import { Order, ServiceNode } from '@/types/order';
import styles from './index.module.scss';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id || router.params.orderId;
  
  const initOrders = useOrderStore(state => state.initOrders);
  const getOrderById = useOrderStore(state => state.getOrderById);
  const reassignOrder = useOrderStore(state => state.reassignOrder);
  const applyExtraDuration = useOrderStore(state => state.applyExtraDuration);
  const handleExtraDuration = useOrderStore(state => state.handleExtraDuration);
  const addComplaint = useOrderStore(state => state.addComplaint);
  const handleComplaint = useOrderStore(state => state.handleComplaint);
  const orders = useOrderStore(state => state.orders);

  useDidShow(() => {
    initOrders();
  });

  const order = useMemo<Order | undefined>(() => {
    return getOrderById(orderId || '');
  }, [orderId, getOrderById, orders]);

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

  const handleReassign = () => {
    Taro.showActionSheet({
      itemList: ['改派给其他陪诊师', '取消当前派单'],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.showModal({
            title: '改派订单',
            editable: true,
            placeholderText: '请输入改派原因（选填）',
            success: (modalRes) => {
              if (modalRes.confirm) {
                if (orderId) {
                  reassignOrder(orderId, '', '', '', modalRes.content || '客户要求改派');
                  Taro.showToast({ title: '已取消派单，请重新分配', icon: 'success' });
                  setTimeout(() => {
                    Taro.navigateTo({ url: `/pages/order-assign/index?orderId=${orderId}` });
                  }, 1000);
                }
              }
            }
          });
        } else if (res.tapIndex === 1 && orderId) {
          reassignOrder(orderId, '', '', '', '调度取消派单');
          Taro.showToast({ title: '已取消派单', icon: 'success' });
        }
      }
    });
  };

  const handleAddDuration = () => {
    Taro.showActionSheet({
      itemList: ['追加30分钟（¥50）', '追加60分钟（¥100）', '追加120分钟（¥200）'],
      success: (res) => {
        const durations = [30, 60, 120];
        const duration = durations[res.tapIndex];
        Taro.showModal({
          title: '追加时长',
          content: `确定要为该订单追加${duration}分钟服务时长吗？订单费用将增加¥${Math.round(duration / 30) * 50}元，刷新后仍然保留。`,
          success: (modalRes) => {
            if (modalRes.confirm && orderId) {
              applyExtraDuration(orderId, duration);
              handleExtraDuration(orderId, true);
              Taro.showToast({ title: `已追加${duration}分钟`, icon: 'success' });
            }
          }
        });
      }
    });
  };

  const handleAddComplaint = () => {
    Taro.showModal({
      title: '添加投诉',
      editable: true,
      placeholderText: '请输入投诉内容',
      success: (res) => {
        if (res.confirm && res.content && orderId) {
          addComplaint(orderId, res.content);
          Taro.showToast({ title: '投诉已记录', icon: 'success' });
        }
      }
    });
  };

  const handleResolveComplaint = () => {
    Taro.showModal({
      title: '处理投诉',
      editable: true,
      placeholderText: '请输入处理结果',
      success: (res) => {
        if (res.confirm && orderId) {
          handleComplaint(orderId, res.content || '已妥善处理');
          Taro.showToast({ title: '投诉已处理', icon: 'success' });
        }
      }
    });
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
  const canReassign = order.status === 'assigned' || order.status === 'serving';
  const canAddDuration = order.status === 'serving' || order.status === 'assigned';
  const hasComplaint = order.complaint && order.complaint !== '已处理';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statusSection}>
        <View className={styles.statusRow}>
          <StatusTag status={order.status} size="md" />
          {order.isOverdue && (
            <View style={{
              backgroundColor: '#f53f3f',
              color: '#fff',
              padding: '4rpx 16rpx',
              borderRadius: '8rpx',
              fontSize: '22rpx',
              marginLeft: '16rpx'
            }}>
              <Text>超时</Text>
            </View>
          )}
        </View>
        <Text className={styles.statusText}>{statusTextMap[order.status]}</Text>
        <View style={{ marginTop: '16rpx' }}>
          <Text className={styles.orderNo}>订单号：{order.orderNo}</Text>
        </View>
        <Text className={styles.orderTime}>下单时间：{order.createTime}</Text>
      </View>

      {(canReassign || canAddDuration || hasComplaint) && (
        <View className={styles.card} style={{ border: '2rpx dashed #1677FF' }}>
          <Text className={styles.cardTitle}>调度操作</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '16rpx' }}>
            {canReassign && (
              <View
                className={styles.actionTag}
                onClick={handleReassign}
              >
                <Text>🔄 改派订单</Text>
              </View>
            )}
            {canAddDuration && (
              <View
                className={styles.actionTag}
                onClick={handleAddDuration}
              >
                <Text>⏱️ 追加时长</Text>
              </View>
            )}
            {!hasComplaint && order.status !== 'pending' && (
              <View
                className={styles.actionTag}
                onClick={handleAddComplaint}
              >
                <Text>📢 记录投诉</Text>
              </View>
            )}
            {hasComplaint && (
              <View
                className={classnames(styles.actionTag, styles.warning)}
                onClick={handleResolveComplaint}
              >
                <Text>✓ 处理投诉</Text>
              </View>
            )}
          </View>
          {hasComplaint && (
            <View style={{
              marginTop: '16rpx',
              backgroundColor: '#fff7e8',
              padding: '16rpx 24rpx',
              borderRadius: '8rpx'
            }}>
              <Text style={{ fontSize: '26rpx', color: '#ff7d00' }}>
                ⚠️ 当前投诉：{order.complaint}
              </Text>
            </View>
          )}
          {order.actualDuration && order.actualDuration > order.duration && (
            <View style={{
              marginTop: '16rpx',
              backgroundColor: '#e8f3ff',
              padding: '16rpx 24rpx',
              borderRadius: '8rpx'
            }}>
              <Text style={{ fontSize: '26rpx', color: '#1677FF' }}>
                ⏱️ 原计划{order.duration}分钟，已追加{order.actualDuration - order.duration}分钟，总共{order.actualDuration}分钟
              </Text>
            </View>
          )}
        </View>
      )}

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
        <Timeline nodes={trackNodes} />
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
                onClick={() => Taro.previewImage({ urls: order.receiptPhotos!, current: photo })}
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

      {order.supplementMessages && order.supplementMessages.length > 0 && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>补充需求记录</Text>
          <View>
            {order.supplementMessages.map(msg => (
              <View key={msg.id} style={{
                padding: '16rpx',
                backgroundColor: msg.from === 'customer' ? '#e8f3ff' : '#f5f7fa',
                borderRadius: '8rpx',
                marginBottom: '12rpx'
              }}>
                <Text style={{ fontSize: '26rpx', color: '#4e5969' }}>
                  [{msg.from === 'customer' ? '客户' : '陪诊师'}] {msg.time}
                </Text>
                <Text style={{ fontSize: '28rpx', color: '#1d2129', marginTop: '8rpx' }}>
                  {msg.content}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {(order.rating || order.reviewTags?.length || order.reviewPhotos?.length) && (
        <View className={styles.reviewCard}>
          <View className={styles.reviewHeader}>
            <Text className={styles.reviewTitle}>客户评价</Text>
            {order.rating && (
              <Text className={styles.reviewRating}>
                {'⭐'.repeat(order.rating)} {order.rating}.0
              </Text>
            )}
          </View>
          {order.reviewTags && order.reviewTags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '12rpx', marginBottom: '16rpx' }}>
              {order.reviewTags.map(tag => (
                <Text key={tag} style={{
                  padding: '4rpx 16rpx',
                  backgroundColor: '#1677FF',
                  color: '#fff',
                  borderRadius: '8rpx',
                  fontSize: '24rpx'
                }}>{tag}</Text>
              ))}
            </View>
          )}
          {order.review && <Text className={styles.reviewContent}>{order.review}</Text>}
          {order.reviewPhotos && order.reviewPhotos.length > 0 && (
            <View style={{ marginTop: '16rpx', flexDirection: 'row', flexWrap: 'wrap', gap: '16rpx' }}>
              {order.reviewPhotos.map((p, i) => (
                <Image
                  key={i}
                  src={p}
                  mode="aspectFill"
                  style={{ width: '160rpx', height: '160rpx', borderRadius: '8rpx' }}
                />
              ))}
            </View>
          )}
          <View style={{ marginTop: '12rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#86909c' }}>
              {order.isAnonymousReview ? '匿名用户' : order.patient.name}
            </Text>
          </View>
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
            {(() => {
              const baseDuration = order.duration;
              const totalDuration = order.actualDuration || baseDuration;
              const extraDuration = Math.max(0, totalDuration - baseDuration);
              if (extraDuration > 0) {
                return `原计划${baseDuration}分钟，已追加${extraDuration}分钟，总共${totalDuration}分钟`;
              }
              return `${baseDuration}分钟`;
            })()}
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
        {canReassign && (
          <View className={classnames(styles.btn, styles.warning)} onClick={handleReassign}>
            <Text>改派</Text>
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
