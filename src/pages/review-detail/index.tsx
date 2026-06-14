import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useOrderStore } from '@/store/useOrderStore';
import { mockCompanions } from '@/data/mockCompanions';
import { Order } from '@/types/order';
import styles from './index.module.scss';

const ReviewDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId;

  const getOrderById = useOrderStore(state => state.getOrderById);
  const submitReview = useOrderStore(state => state.submitReview);
  const getReviews = useOrderStore(state => state.reviews);
  const initOrders = useOrderStore(state => state.initOrders);

  const order = useMemo(() => getOrderById(orderId || ''), [orderId, getOrderById]);

  const companion = useMemo(() => {
    if (!order?.companionId) return null;
    return mockCompanions.find(c => c.id === order.companionId);
  }, [order]);

  const savedReview = orderId ? getReviews[orderId] : null;

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  const tags = [
    '专业负责', '态度很好', '准时到达', '熟悉流程',
    '耐心细致', '沟通顺畅', '服务周到', '值得推荐'
  ];

  const isViewMode = useMemo(() => {
    return !!(savedReview || (order && order.rating && order.rating > 0));
  }, [savedReview, order]);

  useEffect(() => {
    if (savedReview) {
      setRating(savedReview.rating);
      setSelectedTags(savedReview.tags);
      setReviewText(savedReview.content);
      setPhotos(savedReview.photos);
      setIsAnonymous(savedReview.isAnonymous);
    } else if (order?.rating && order.rating > 0) {
      setRating(order.rating);
      setSelectedTags(order.reviewTags || []);
      setReviewText(order.review || '');
      setPhotos(order.reviewPhotos || []);
      setIsAnonymous(order.isAnonymousReview || false);
    }
  }, [savedReview, order]);

  useDidShow(() => {
    initOrders();
  });

  const displayRating = hoverRating || rating;

  const handleRatingClick = (value: number) => {
    if (isViewMode) return;
    setRating(value);
  };

  const handleTagClick = (tag: string) => {
    if (isViewMode) return;
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleUploadPhoto = () => {
    if (isViewMode) return;
    Taro.chooseImage({
      count: 9 - photos.length,
      success: (res) => {
        setPhotos(prev => [...prev, ...res.tempFilePaths].slice(0, 9));
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    if (isViewMode) return;
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
        if (res.confirm && orderId) {
          submitReview(orderId, {
            rating,
            tags: selectedTags,
            content: reviewText,
            photos,
            isAnonymous,
            time: new Date().toLocaleString()
          });
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

  const viewRating = rating || order.rating || 0;
  const viewTags = selectedTags.length > 0 ? selectedTags : (order.reviewTags || []);
  const viewContent = reviewText || order.review || '';
  const viewPhotos = photos.length > 0 ? photos : (order.reviewPhotos || []);
  const viewAnonymous = isAnonymous || order.isAnonymousReview || false;
  const reviewTime = savedReview?.time || order.createTime;

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

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>服务评分</Text>
        <View className={styles.ratingSection}>
          <View className={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(value => (
              <Text
                key={value}
                className={styles.star}
                onClick={() => handleRatingClick(value)}
                onTouchStart={() => !isViewMode && setHoverRating(value)}
                onTouchEnd={() => !isViewMode && setHoverRating(0)}
              >
                {value <= displayRating ? '⭐' : '☆'}
              </Text>
            ))}
          </View>
          <Text className={styles.ratingText}>
            {viewRating > 0 ? `${viewRating} 分` : (isViewMode ? '暂无评分' : '请点击星星评分')}
          </Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>评价标签</Text>
        <View className={styles.tagsGrid}>
          {tags.map(tag => (
            <View
              key={tag}
              className={classnames(styles.tag, viewTags.includes(tag) && styles.selected)}
              onClick={() => handleTagClick(tag)}
            >
              <Text>{tag}</Text>
            </View>
          ))}
        </View>
        {viewTags.length === 0 && isViewMode && (
          <Text style={{ fontSize: '26rpx', color: '#86909c', marginTop: '16rpx' }}>暂无标签</Text>
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>评价内容</Text>
        {isViewMode ? (
          <View style={{ backgroundColor: '#f5f7fa', borderRadius: '12rpx', padding: '24rpx' }}>
            {viewContent ? (
              <Text style={{ fontSize: '28rpx', color: '#4e5969', lineHeight: 1.6 }}>
                {viewContent}
              </Text>
            ) : (
              <Text style={{ fontSize: '26rpx', color: '#86909c' }}>暂无文字评价</Text>
            )}
          </View>
        ) : (
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
        )}
        
        <View style={{ marginTop: '24rpx' }}>
          <Text style={{ fontSize: '28rpx', color: '#4e5969', marginBottom: '16rpx' }}>
            {isViewMode ? '评价图片' : '上传图片'}
          </Text>
          <View className={styles.photosRow}>
            {viewPhotos.map((photo, index) => (
              <View key={index} className={styles.photoItem}>
                <Image 
                  className={styles.photoImg} 
                  src={photo} 
                  mode="aspectFill" 
                  onClick={() => {
                    Taro.previewImage({
                      urls: viewPhotos,
                      current: photo
                    });
                  }}
                />
                {!isViewMode && (
                  <View 
                    className={styles.photoDelete} 
                    onClick={() => handleDeletePhoto(index)}
                  >
                    <Text>×</Text>
                  </View>
                )}
              </View>
            ))}
            {!isViewMode && viewPhotos.length < 9 && (
              <View className={styles.uploadBtn} onClick={handleUploadPhoto}>
                <Text className={styles.uploadIcon}>📷</Text>
                <Text className={styles.uploadText}>上传图片</Text>
              </View>
            )}
          </View>
          {viewPhotos.length === 0 && isViewMode && (
            <Text style={{ fontSize: '26rpx', color: '#86909c' }}>暂无图片</Text>
          )}
        </View>

        {!isViewMode && (
          <View className={styles.anonymousSection}>
            <Text className={styles.anonymousLabel}>匿名评价</Text>
            <View 
              className={classnames(styles.switch, isAnonymous && styles.checked)}
              onClick={() => setIsAnonymous(!isAnonymous)}
            >
              <View 
                className={classnames(styles.switchDot)} 
                style={{ left: isAnonymous ? '40rpx' : '4rpx' }}
              />
            </View>
          </View>
        )}
      </View>

      {isViewMode && (
        <View className={styles.viewReviewSection}>
          <View className={styles.reviewHeader}>
            <Text className={styles.reviewName}>
              {viewAnonymous ? '匿名用户' : order.patient.name}
            </Text>
            <Text className={styles.reviewRating}>
              {'⭐'.repeat(viewRating)} {viewRating}.0
            </Text>
          </View>
          <Text className={styles.reviewTime}>{reviewTime}</Text>
          
          <View className={styles.replySection}>
            <Text className={styles.replyLabel}>商家回复：</Text>
            <Text className={styles.replyContent}>
              感谢您的评价！我们会继续努力为您提供优质的陪诊服务。如有任何问题，欢迎随时联系我们。
            </Text>
          </View>
        </View>
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
