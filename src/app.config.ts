export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/orders/index',
    'pages/companions/index',
    'pages/stats/index',
    'pages/mine/index',
    'pages/order-detail/index',
    'pages/order-assign/index',
    'pages/companion-detail/index',
    'pages/service-execute/index',
    'pages/customer-service/index',
    'pages/messages/index',
    'pages/review-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '陪诊调度',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f7fa'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#1677ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单'
      },
      {
        pagePath: 'pages/companions/index',
        text: '陪诊师'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
