import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useOrderStore } from '@/store/useOrderStore';
// 全局样式
import './app.scss';

function App(props) {
  const initOrders = useOrderStore(state => state.initOrders);

  useEffect(() => {
    initOrders();
  }, [initOrders]);

  // 对应 onShow
  useDidShow(() => {
    initOrders();
  });

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
