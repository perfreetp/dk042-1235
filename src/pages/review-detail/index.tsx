import React, { useState, useMemo } from 'react';
import { View, Text, Image, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { mockOrders, mockCompanions } from '@/data/mockOrders';
import { Order } from '@/types/order';
import styles from './index.module.scss';

const ReviewDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId;
  const mode = router.params.mode || 'write'; // write: 写评价, view: 看评价

  const order = useMemo<Order | undefined>(() => {
    return mockOrders.find(o => o.id === orderId);
  }, [orderId]);

  const companion = useMemo(() => {
    if (!order?.companionId) return null;
    return mockCompanions.find(c => c.id === order.companionId);
  }, [order]);

  const [rating, setRating] = useState<number>(order?.rating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  const tags = [
    '专业负责', '态度很好', '准时到达', '熟悉流程',
    '耐心细致', '沟通顺畅', '服务周到', '值得推荐'
  ];

  const displayRating = hoverRating || rating;

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleUploadPhoto = () => {
    Taro.chooseImage({
      count: 9 - photos.length,
      success: (res) => {
        setPhotos(prev => [...prev, ...res.tempFilePaths].slice(0, 9));
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Taro.showToast({ title: '请选择评分', icon: 'none' });
      return;
    }
    
    Taro.showModal({
      title: '提交评价',
      content: '确定要提交评价吗？提交后不可修改。',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '评价提交成功', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
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

  const isViewMode = order.rating !== undefined;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.card}>
        <Text className={styles.sectionTitle}>服务信息</Text>
        <View className={styles.companionInfo}>
          {companion && (
            <Image 
              className={styles.avatar} 
              src={companion.avatar}
              mode="aspectFill"
            />
          )}
          <View className={styles.info}>
            <Text className={styles.name}>{companion?.name || '未知'}</Text>
            <Text className={styles.meta}>
              {order.hospitalName} · {order.department}
            </Text>
            <Text className={styles.meta}>
              服务时长：{order.actualDuration || order.duration}分钟
            </Text>
          </View>
        </View>
      </View>

      {isViewMode ? (
        <View className={styles.viewReviewSection}>
          <Text className={styles.sectionTitle}>我的评价</Text>
          <View className={styles.reviewHeader}>
            <Text className={styles.reviewName}>
              {isAnonymous ? '匿名用户' : order.patient.name}
            </Text>
            <Text className={styles.reviewRating}>
              {'⭐'.repeat(order.rating || 0)} {order.rating}.0
            </Text>
          </View>
          {selectedTags.length > 0 && (
            <View className={styles.reviewTags}>
              {selectedTags.map((tag, index) => (
                <Text key={index} className={styles.reviewTag}>{tag}</Text>
              ))}
            </View>
          )}
          <Text className={styles.reviewContent}>{order.review}</Text>
          <Text className={styles.reviewTime}>{order.createTime}</Text>
          
          <View className={styles.replySection}>
            <Text className={styles.replyLabel}>商家回复：</Text>
            <Text className={styles.replyContent}>
              感谢您的好评！我们会继续努力为您提供优质的陪诊服务。如有任何问题，欢迎随时联系我们。
            </Text>
          </View>
        </View>
      ) : (
        <>
          <View className={styles.card}>
            <Text className={styles.sectionTitle}>服务评分</Text>
            <View className={styles.ratingSection}>
              <View className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(value => (
                  <Text
                    key={value}
                    className={styles.star}
                    onClick={() => handleRatingClick(value)}
                    onTouchStart={() => setHoverRating(value)}
                    onTouchEnd={() => setHoverRating(0)}
                  >
                    {value <= displayRating ? '⭐' : '☆'}
                  </Text>
                ))}
              </View>
              <Text className={styles.ratingText}>
                {rating > 0 ? `${rating} 分` : '请点击星星评分'}
              </Text>
            </View>
          </View>

          <View className={styles.card}>
            <Text className={styles.sectionTitle}>评价标签</Text>
            <View className={styles.tagsGrid}>
              {tags.map(tag => (
                <View
                  key={tag}
                  className={classnames(styles.tag, selectedTags.includes(tag) && styles.selected)}
                  onClick={() => handleTagClick(tag)}
                >
                  <Text>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.card}>
            <Text className={styles.sectionTitle}>评价内容</Text>
            <View className={styles.textareaSection}>
              <Textarea
                className={styles.textarea}
                placeholder="请详细描述您的服务体验..."
                value={reviewText}
                onInput={(e) => setReviewText(e.detail.value)}
                maxlength={500}
              />
              <Text className={styles.charCount}>{reviewText.length}/500</Text>
            </View>
            
            <View className={styles.photosSection}>
              <View className={styles.photosRow}>
                {photos.map((photo, index) => (
                  <View key={index} className={styles.photoItem}>
                    <Image className={styles.photoImg} src={photo} mode="aspectFill" />
                    <View 
                      className={styles.photoDelete} 
                      onClick={() => handleDeletePhoto(index)}
                    >
                      <Text>×</Text>
                    </View>
                  </View>
                ))}
                {photos.length < 9 && (
                  <View className={styles.uploadBtn} onClick={handleUploadPhoto}>
                    <Text className={styles.uploadIcon}>📷</Text>
                    <Text className={styles.uploadText}>上传图片</Text>
                  </View>
                )}
              </View>
            </View>

            <View className={styles.anonymousSection}>
              <Text className={styles.anonymousLabel}>匿名评价</Text>
              <View 
                className={classnames(styles.switch, isAnonymous && styles.checked)}
                onClick={() => setIsAnonymous(!isAnonymous)}
              >
                <View className={classnames(styles.switchDot, isAnonymous && 'checked-dot')} 
                  style={{ left: isAnonymous ? '40rpx' : '4rpx' }}
                />
              </View>
            </View>
          </View>
        </>
      )}

      {!isViewMode && (
        <View className={styles.bottomBar}>
          <View 
            className={classnames(styles.submitBtn, rating === 0 && styles.disabled)}
            onClick={handleSubmit}
          >
            <Text>提交评价</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReviewDetailPage;
