import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useOrderStore, generateDefaultNodes } from '@/store/useOrderStore';
import { Order, ServiceNode } from '@/types/order';
import styles from './index.module.scss';

const ServiceExecutePage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId;
  
  const [serviceStep, setServiceStep] = useState<'waiting' | 'going' | 'arrived' | 'serving' | 'completed'>('waiting');
  const [nodes, setNodes] = useState<ServiceNode[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [visitResult, setVisitResult] = useState<string>('');
  const [timer, setTimer] = useState<string>('00:00:00');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const initOrders = useOrderStore(state => state.initOrders);
  const getOrderById = useOrderStore(state => state.getOrderById);
  const updateOrderStatus = useOrderStore(state => state.updateOrderStatus);
  const updateOrderNodes = useOrderStore(state => state.updateOrderNodes);
  const updateNodeStatus = useOrderStore(state => state.updateNodeStatus);
  const completeService = useOrderStore(state => state.completeService);
  const uploadReceipts = useOrderStore(state => state.uploadReceipts);

  useDidShow(() => {
    initOrders();
  });

  const order = useMemo<Order | undefined>(() => {
    return getOrderById(orderId || '');
  }, [orderId, getOrderById]);

  useEffect(() => {
    if (order && !isDataLoaded) {
      const hasNodes = order.nodes && order.nodes.length > 0;
      const initNodes: ServiceNode[] = hasNodes
        ? order.nodes.map(n => ({ ...n }))
        : generateDefaultNodes(order.status);
      setNodes(initNodes);
      setVisitResult(order.visitResult || '');
      setPhotos(order.receiptPhotos || []);
      
      switch (order.status) {
        case 'pending':
          setServiceStep('waiting');
          break;
        case 'assigned':
          setServiceStep('going');
          if (!startTime) setStartTime(Date.now() - 1800000);
          break;
        case 'serving': {
          setServiceStep('serving');
          const doneCount = initNodes.filter(n => n.status === 'done').length;
          if (doneCount >= 3) setServiceStep('serving');
          else setServiceStep('arrived');
          if (!startTime) setStartTime(Date.now() - 3600000);
          break;
        }
        case 'completed':
          setServiceStep('completed');
          break;
      }
      setIsDataLoaded(true);
    }
  }, [order, isDataLoaded, startTime]);

  useEffect(() => {
    let interval: number | null = null;
    
    if (startTime && serviceStep !== 'completed' && serviceStep !== 'waiting') {
      interval = setInterval(() => {
        const diff = Date.now() - startTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimer(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }, 1000) as unknown as number;
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, serviceStep]);

  const handleAcceptOrder = () => {
    if (!orderId) return;
    Taro.showModal({
      title: '确认接单',
      content: '确定要接下这个陪诊订单吗？',
      success: (res) => {
        if (res.confirm) {
          updateOrderStatus(orderId, 'assigned');
          const newNodes = generateDefaultNodes('assigned');
          setNodes(newNodes);
          updateOrderNodes(orderId, newNodes);
          setServiceStep('going');
          setStartTime(Date.now());
          setIsDataLoaded(false);
          Taro.showToast({ title: '接单成功', icon: 'success' });
          setTimeout(() => setIsDataLoaded(true), 200);
        }
      }
    });
  };

  const handleArrive = () => {
    if (!orderId) return;
    Taro.showModal({
      title: '到院定位',
      content: '确定已到达医院吗？系统将记录位置。',
      success: (res) => {
        if (res.confirm) {
          updateOrderStatus(orderId, 'serving');
          const newNodes: ServiceNode[] = nodes.map((n, i) => {
            if (i <= 1) return { ...n, status: 'done' as const, time: new Date().toLocaleTimeString().slice(0, 5) };
            if (i === 2) return { ...n, status: 'current' as const };
            return n;
          });
          setNodes(newNodes);
          updateOrderNodes(orderId, newNodes);
          setServiceStep('arrived');
          Taro.showToast({ title: '已确认到院', icon: 'success' });
        }
      }
    });
  };

  const handleNodeCheckIn = (nodeId: string) => {
    if (!orderId) return;
    const idx = nodes.findIndex(n => n.id === nodeId);
    if (idx < 0) return;
    
    const newNodes: ServiceNode[] = nodes.map((n, i) => {
      if (n.id === nodeId) {
        return { ...n, status: 'done' as const, time: new Date().toLocaleTimeString().slice(0, 5) };
      }
      if (i === idx + 1 && n.status === 'pending') {
        return { ...n, status: 'current' as const };
      }
      return n;
    });
    setNodes(newNodes);
    updateNodeStatus(orderId, nodeId);
    updateOrderNodes(orderId, newNodes);
    if (serviceStep !== 'serving') {
      setServiceStep('serving');
      updateOrderStatus(orderId, 'serving');
    }
    Taro.showToast({ title: '打卡成功', icon: 'success' });
  };

  const handleUploadPhoto = () => {
    if (!orderId) return;
    Taro.chooseImage({
      count: 3 - photos.length,
      success: (res) => {
        const newPhotos = [...photos, ...res.tempFilePaths];
        setPhotos(newPhotos);
        uploadReceipts(orderId, newPhotos);
        Taro.showToast({ title: '上传成功', icon: 'success' });
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    if (!orderId) return;
    Taro.showModal({
      title: '删除照片',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          const newPhotos = photos.filter((_, i) => i !== index);
          setPhotos(newPhotos);
          uploadReceipts(orderId, newPhotos);
        }
      }
    });
  };

  const handleComplete = () => {
    if (!orderId || !startTime) return;
    if (!visitResult) {
      Taro.showToast({ title: '请填写就诊结果', icon: 'none' });
      return;
    }
    
    Taro.showModal({
      title: '完成服务',
      content: '确认所有服务已完成，提交结束服务？',
      success: (res) => {
        if (res.confirm) {
          const baseDuration = Math.round((Date.now() - startTime) / 60000);
          const minDuration = order?.actualDuration || order?.duration || 60;
          const duration = Math.max(baseDuration, minDuration);
          const finalNodes: ServiceNode[] = nodes.map((n, i) => ({
            ...n,
            status: 'done' as const,
            time: n.time || new Date().toLocaleTimeString().slice(0, 5)
          }));
          completeService(orderId, duration, visitResult, photos, finalNodes);
          setNodes(finalNodes);
          setServiceStep('completed');
          Taro.showToast({ title: '服务已完成', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      }
    });
  };

  const handleCallPatient = () => {
    if (order) {
      Taro.makePhoneCall({ phoneNumber: order.patient.phone.replace(/\*/g, '0') });
    }
  };

  const handleCallFamily = () => {
    if (order) {
      Taro.makePhoneCall({ phoneNumber: order.familyContact.phone.replace(/\*/g, '0') });
    }
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

  const statusConfig = {
    waiting: { title: '待接单', desc: '请确认是否接单', buttonText: '确认接单' },
    going: { title: '前往医院中', desc: '请在到达医院后点击"到院签到"', buttonText: '到院签到' },
    arrived: { title: '已到达医院', desc: '请按流程完成各节点打卡', buttonText: '开始服务' },
    serving: { title: '服务进行中', desc: '请按节点完成陪诊服务', buttonText: '完成服务' },
    completed: { title: '服务已完成', desc: '感谢您的服务', buttonText: '返回' }
  };

  const currentStatus = statusConfig[serviceStep];
  const showTimer = serviceStep !== 'waiting' && serviceStep !== 'completed';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.statusBanner}>
        <Text className={styles.statusTitle}>{currentStatus.title}</Text>
        <Text className={styles.statusDesc}>{currentStatus.desc}</Text>
        {showTimer && startTime && (
          <View className={styles.timer}>
            <Text>服务时长：{timer}</Text>
          </View>
        )}
      </View>

      <View className={styles.orderCard}>
        <Text className={styles.orderTitle}>{order.hospitalName} · {order.department}</Text>
        <View className={styles.orderInfo}>
          <Text className={styles.infoTag}>{order.appointmentTime.slice(11, 16)} 预约</Text>
          <Text className={styles.infoTag}>{order.checkItems.length}项检查</Text>
          <Text className={styles.infoTag}>
            {order.serviceLevel === 'standard' ? '标准服务' : 
             order.serviceLevel === 'premium' ? '高级服务' : 'VIP服务'}
          </Text>
        </View>
        <View className={styles.patientRow}>
          <View className={styles.patientAvatar}>
            <Text className={styles.icon}>👤</Text>
          </View>
          <View className={styles.patientInfo}>
            <Text className={styles.patientName}>
              {order.patient.name} · {order.patient.age}岁
            </Text>
            <Text className={styles.patientMeta}>
              家属：{order.familyContact.name}（{order.familyContact.relation}）
            </Text>
          </View>
          <View className={styles.callBtn} onClick={handleCallPatient}>
            <Text>联系</Text>
          </View>
        </View>
        {order.actualDuration && order.actualDuration > order.duration && (
          <View style={{ marginTop: '16rpx', padding: '12rpx 20rpx', backgroundColor: '#e8f3ff', borderRadius: '8rpx' }}>
            <Text style={{ fontSize: '26rpx', color: '#1677FF' }}>
              ⏱️ 原计划{order.duration}分钟，已追加{order.actualDuration - order.duration}分钟，总共{order.actualDuration}分钟
            </Text>
          </View>
        )}
      </View>

      {order.specialNotes && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>注意事项</Text>
          <Text style={{ fontSize: '28rpx', color: '#ff7d00', lineHeight: 1.6 }}>
            ⚠️ {order.specialNotes}
          </Text>
        </View>
      )}

      {order.supplementMessages && order.supplementMessages.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>客户补充需求</Text>
          <View>
            {order.supplementMessages.map(msg => (
              <View key={msg.id} style={{
                padding: '16rpx',
                backgroundColor: msg.from === 'customer' ? '#fff7e8' : '#f5f7fa',
                borderRadius: '8rpx',
                marginBottom: '12rpx',
                borderLeft: '4rpx solid #ff7d00'
              }}>
                <Text style={{ fontSize: '24rpx', color: '#86909c' }}>
                  [{msg.from === 'customer' ? '客户' : '系统'}] {msg.time}
                </Text>
                <Text style={{ fontSize: '28rpx', color: '#1d2129', marginTop: '8rpx', display: 'block' }}>
                  {msg.content}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>服务节点</Text>
        <View className={styles.nodesList}>
          {nodes.map((node, index) => (
            <View key={node.id} className={styles.nodeItem}>
              <View className={styles.nodeLeft}>
                <View className={classnames(
                  styles.nodeDot,
                  node.status === 'done' && styles.done,
                  node.status === 'current' && styles.current
                )}>
                  {node.status === 'done' ? '✓' : ''}
                </View>
                {index < nodes.length - 1 && (
                  <View className={classnames(styles.nodeLine, node.status === 'done' && styles.done)} />
                )}
              </View>
              <View className={styles.nodeContent}>
                <View className={node.status === 'pending' ? styles.pending : ''}>
                  <Text className={styles.nodeName}>{node.name}</Text>
                  {node.time && <Text className={styles.nodeTime}> {node.time}</Text>}
                </View>
                {node.status === 'current' && serviceStep !== 'completed' && (
                  <View 
                    className={styles.nodeAction}
                    onClick={() => handleNodeCheckIn(node.id)}
                  >
                    <Text>打卡</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>票据照片</Text>
        <View className={styles.photosRow}>
          {photos.map((photo, index) => (
            <View key={index} className={styles.photoItem}>
              <Image 
                className={styles.photoImg} 
                src={photo} 
                mode="aspectFill" 
                onClick={() => Taro.previewImage({ urls: photos, current: photo })}
              />
              {serviceStep !== 'completed' && (
                <View className={styles.photoDelete} onClick={() => handleDeletePhoto(index)}>
                  <Text>×</Text>
                </View>
              )}
            </View>
          ))}
          {photos.length < 3 && serviceStep !== 'completed' && (
            <View className={styles.uploadBtn} onClick={handleUploadPhoto}>
              <Text className={styles.uploadIcon}>📷</Text>
              <Text className={styles.uploadText}>上传票据</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>就诊结果</Text>
        <Textarea
          className={styles.resultTextarea}
          placeholder="请填写就诊结果、诊断建议、医嘱等信息..."
          value={visitResult}
          onInput={(e) => setVisitResult(e.detail.value)}
          maxlength={500}
          disabled={serviceStep === 'completed'}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.outline)} onClick={handleCallFamily}>
          <Text>联系家属</Text>
        </View>
        {serviceStep === 'waiting' && (
          <View className={classnames(styles.btn, styles.primary)} onClick={handleAcceptOrder}>
            <Text>确认接单</Text>
          </View>
        )}
        {serviceStep === 'going' && (
          <View className={classnames(styles.btn, styles.primary)} onClick={handleArrive}>
            <Text>到院签到</Text>
          </View>
        )}
        {(serviceStep === 'arrived' || serviceStep === 'serving') && (
          <View className={classnames(styles.btn, styles.success)} onClick={handleComplete}>
            <Text>完成服务</Text>
          </View>
        )}
        {serviceStep === 'completed' && (
          <View className={classnames(styles.btn, styles.primary)} onClick={() => Taro.navigateBack()}>
            <Text>返回</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ServiceExecutePage;
