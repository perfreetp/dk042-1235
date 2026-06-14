import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import StatusTag from '@/components/StatusTag';
import { Order } from '@/types/order';
import styles from './index.module.scss';

interface OrderCardProps {
  order: Order;
  showHospital?: boolean;
  onClick?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, showHospital = true, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.left}>
          <StatusTag status={order.status} size="sm" />
          {order.isOverdue && (
            <View className={styles.overdueTag}>
              <Text className={styles.overdueText}>超时</Text>
            </View>
          )}
        </View>
        <Text className={styles.orderNo}>{order.orderNo}</Text>
      </View>

      {showHospital && (
        <View className={styles.hospitalRow}>
          <Text className={styles.hospitalName}>{order.hospitalName}</Text>
          <Text className={styles.department}>{order.department}</Text>
        </View>
      )}

      <View className={styles.patientRow}>
        <View className={styles.patientInfo}>
          <Text className={styles.patientName}>{order.patient.name}</Text>
          <Text className={styles.patientAge}>{order.patient.age}岁</Text>
          <Text className={styles.patientGender}>{order.patient.gender === 'male' ? '男' : '女'}</Text>
        </View>
        <Text className={styles.appointmentTime}>{order.appointmentTime.slice(11, 16)}</Text>
      </View>

      <View className={styles.checkItems}>
        {order.checkItems.slice(0, 3).map((item, index) => (
          <Text key={index} className={styles.checkItem}>
            {item}
          </Text>
        ))}
        {order.checkItems.length > 3 && (
          <Text className={styles.more}>+{order.checkItems.length - 3}</Text>
        )}
      </View>

      {order.companionName && (
        <View className={styles.companionRow}>
          <Text className={styles.label}>陪诊师：</Text>
          <Text className={styles.value}>{order.companionName}</Text>
        </View>
      )}

      <View className={styles.footer}>
        <View className={styles.priceRow}>
          <Text className={styles.priceSymbol}>¥</Text>
          <Text className={styles.price}>{order.price}</Text>
        </View>
        <Text className={styles.duration}>服务时长 {order.duration}分钟</Text>
      </View>
    </View>
  );
};

export default OrderCard;
