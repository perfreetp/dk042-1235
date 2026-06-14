import { Order, HospitalOrderGroup } from '@/types/order';
import { mockHospitals } from './mockHospitals';
import dayjs from 'dayjs';

const now = dayjs();

const today = (hour: number, minute = 0) => now.hour(hour).minute(minute).second(0).format('YYYY-MM-DD HH:mm:ss');
const yesterday = (hour: number, minute = 0) => now.subtract(1, 'day').hour(hour).minute(minute).second(0).format('YYYY-MM-DD HH:mm:ss');
const daysAgo = (days: number, hour: number, minute = 0) => now.subtract(days, 'day').hour(hour).minute(minute).second(0).format('YYYY-MM-DD HH:mm:ss');

const generateNodes = (status: string) => {
  const baseNodes = [
    { id: 'n1', name: '预约挂号', status: 'done' as const, time: '08:00', description: '已完成挂号' },
    { id: 'n2', name: '到院签到', status: 'pending' as const },
    { id: 'n3', name: '候诊等待', status: 'pending' as const },
    { id: 'n4', name: '医生问诊', status: 'pending' as const },
    { id: 'n5', name: '检查检验', status: 'pending' as const },
    { id: 'n6', name: '取药结算', status: 'pending' as const },
    { id: 'n7', name: '服务完成', status: 'pending' as const }
  ];
  
  if (status === 'assigned') {
    return baseNodes.map((n, i) => i <= 0 ? { ...n, status: 'done' as const } : n);
  }
  if (status === 'serving') {
    return baseNodes.map((n, i) => {
      if (i <= 2) return { ...n, status: 'done' as const, time: `0${8 + i}:${30 + i * 15}` };
      if (i === 3) return { ...n, status: 'current' as const };
      return n;
    });
  }
  if (status === 'completed') {
    return baseNodes.map((n, i) => ({ ...n, status: 'done' as const, time: `0${8 + i}:${30 + i * 15}` }));
  }
  return baseNodes;
};

export const mockOrders: Order[] = [
  // ============ 今日订单 ============
  {
    id: 'o001',
    orderNo: 'PZ20240614001',
    status: 'pending',
    hospitalId: 'h001',
    hospitalName: '北京协和医院',
    department: '心内科',
    appointmentTime: today(9, 30),
    checkItems: ['心电图', '心脏彩超', '血液检查'],
    specialNotes: '患者有高血压史，行动较缓慢，需要耐心陪同',
    patient: { name: '王建国', age: 65, gender: 'male', phone: '138****1111' },
    familyContact: { name: '王小明', relation: '儿子', phone: '139****2222' },
    serviceLevel: 'premium',
    duration: 180,
    price: 298,
    createTime: yesterday(15, 30),
    nodes: generateNodes('pending'),
    isOverdue: false
  },
  {
    id: 'o002',
    orderNo: 'PZ20240614002',
    status: 'assigned',
    hospitalId: 'h001',
    hospitalName: '北京协和医院',
    department: '妇产科',
    appointmentTime: today(10, 0),
    checkItems: ['常规产检', 'B超检查', '胎心监测'],
    specialNotes: '孕妇怀孕6个月，需要有人搀扶',
    patient: { name: '李美丽', age: 28, gender: 'female', phone: '137****3333' },
    familyContact: { name: '张伟', relation: '丈夫', phone: '136****4444' },
    companionId: 'c003',
    companionName: '王陪诊',
    companionPhone: '137****9012',
    serviceLevel: 'vip',
    duration: 120,
    price: 398,
    createTime: today(7, 20),
    nodes: generateNodes('assigned'),
    isOverdue: false
  },
  {
    id: 'o003',
    orderNo: 'PZ20240614003',
    status: 'serving',
    hospitalId: 'h001',
    hospitalName: '北京协和医院',
    department: '骨科',
    appointmentTime: today(8, 30),
    checkItems: ['腰椎CT', '骨密度检测', '康复评估'],
    specialNotes: '腰椎间盘突出，行走困难，需要轮椅协助',
    patient: { name: '赵德柱', age: 58, gender: 'male', phone: '135****5555' },
    familyContact: { name: '赵小芳', relation: '女儿', phone: '134****6666' },
    companionId: 'c004',
    companionName: '陈师傅',
    companionPhone: '136****3456',
    serviceLevel: 'premium',
    duration: 240,
    price: 368,
    actualDuration: 120,
    createTime: yesterday(16, 45),
    nodes: generateNodes('serving'),
    isOverdue: false
  },
  {
    id: 'o011',
    orderNo: 'PZ20240614011',
    status: 'serving',
    hospitalId: 'h005',
    hospitalName: '北京朝阳医院',
    department: '儿科',
    appointmentTime: today(9, 30),
    checkItems: ['血常规', '胸片', '流感检测'],
    specialNotes: '小孩发烧，可能需要输液，家长陪同',
    patient: { name: '韩小宝', age: 5, gender: 'male', phone: '188****1111' },
    familyContact: { name: '韩梅', relation: '妈妈', phone: '187****2222' },
    companionId: 'c003',
    companionName: '王陪诊',
    companionPhone: '137****9012',
    serviceLevel: 'premium',
    duration: 180,
    price: 288,
    actualDuration: 90,
    createTime: today(7, 30),
    nodes: generateNodes('serving'),
    isOverdue: false
  },
  {
    id: 'o005',
    orderNo: 'PZ20240614005',
    status: 'pending',
    hospitalId: 'h002',
    hospitalName: '北京大学第一医院',
    department: '神经内科',
    appointmentTime: today(14, 0),
    checkItems: ['头颅MRI', '脑电图', '神经功能评估'],
    specialNotes: '患者有头晕症状，需要有人陪同以防意外',
    patient: { name: '刘国强', age: 72, gender: 'male', phone: '131****9999' },
    familyContact: { name: '刘华', relation: '儿子', phone: '130****0000' },
    serviceLevel: 'vip',
    duration: 180,
    price: 498,
    createTime: today(8, 30),
    nodes: generateNodes('pending'),
    isOverdue: false
  },
  {
    id: 'o010',
    orderNo: 'PZ20240614010',
    status: 'pending',
    hospitalId: 'h005',
    hospitalName: '北京朝阳医院',
    department: '呼吸科',
    appointmentTime: today(15, 0),
    checkItems: ['肺功能检查', '胸部CT', '血气分析'],
    specialNotes: '慢性支气管炎，走路容易气喘',
    patient: { name: '冯大爷', age: 75, gender: 'male', phone: '151****9999' },
    familyContact: { name: '冯晓', relation: '孙女', phone: '150****0000' },
    serviceLevel: 'standard',
    duration: 120,
    price: 198,
    createTime: today(10, 0),
    nodes: generateNodes('pending'),
    isOverdue: true
  },
  {
    id: 'o009',
    orderNo: 'PZ20240614009',
    status: 'assigned',
    hospitalId: 'h004',
    hospitalName: '北京天坛医院',
    department: '神经外科',
    appointmentTime: today(13, 30),
    checkItems: ['头颅CT', '脑血管造影', '专家会诊'],
    specialNotes: '患者有头痛症状，需协助挂号排队',
    patient: { name: '钱海涛', age: 48, gender: 'male', phone: '153****7777' },
    familyContact: { name: '钱丽', relation: '妻子', phone: '152****8888' },
    companionId: 'c002',
    companionName: '李医生',
    companionPhone: '139****5678',
    serviceLevel: 'vip',
    duration: 240,
    price: 498,
    createTime: today(9, 15),
    nodes: generateNodes('assigned'),
    isOverdue: false
  },
  {
    id: 'o006',
    orderNo: 'PZ20240614006',
    status: 'serving',
    hospitalId: 'h002',
    hospitalName: '北京大学第一医院',
    department: '消化内科',
    appointmentTime: today(9, 0),
    checkItems: ['胃镜检查', '幽门螺杆菌检测', '肝功能检查'],
    specialNotes: '空腹检查，检查后需陪同休息',
    patient: { name: '周美玲', age: 45, gender: 'female', phone: '158****1111' },
    familyContact: { name: '周明', relation: '哥哥', phone: '159****2222' },
    companionId: 'c007',
    companionName: '孙护士',
    companionPhone: '133****6789',
    serviceLevel: 'premium',
    duration: 150,
    price: 268,
    actualDuration: 100,
    createTime: yesterday(14, 20),
    nodes: generateNodes('serving'),
    isOverdue: false
  },
  {
    id: 'o007',
    orderNo: 'PZ20240614007',
    status: 'pending',
    hospitalId: 'h003',
    hospitalName: '中国人民解放军总医院',
    department: '肿瘤科',
    appointmentTime: today(10, 30),
    checkItems: ['化疗前评估', '血常规', '肝肾功能检查'],
    specialNotes: '化疗患者，身体较虚弱，需要细心照顾',
    patient: { name: '吴建军', age: 60, gender: 'male', phone: '157****3333' },
    familyContact: { name: '吴芳', relation: '女儿', phone: '156****4444' },
    serviceLevel: 'vip',
    duration: 240,
    price: 598,
    createTime: today(8, 30),
    nodes: generateNodes('pending'),
    isOverdue: false
  },
  // ============ 昨日完成订单 ============
  {
    id: 'o004',
    orderNo: 'PZ20240613004',
    status: 'completed',
    hospitalId: 'h001',
    hospitalName: '北京协和医院',
    department: '眼科',
    appointmentTime: yesterday(8, 0),
    checkItems: ['视力检查', '眼底检查', '验光配镜'],
    specialNotes: '高度近视，需要定期复查',
    patient: { name: '陈思远', age: 35, gender: 'male', phone: '133****7777' },
    familyContact: { name: '陈晓', relation: '弟弟', phone: '132****8888' },
    companionId: 'c001',
    companionName: '张护士',
    companionPhone: '138****1234',
    serviceLevel: 'standard',
    duration: 90,
    price: 168,
    actualDuration: 95,
    createTime: yesterday(9, 0),
    nodes: generateNodes('completed'),
    receiptPhotos: ['https://picsum.photos/id/180/400/300', 'https://picsum.photos/id/160/400/300'],
    visitResult: '双眼近视度数略有加深，已重新配镜，医嘱注意用眼卫生。',
    isOverdue: false,
    rating: 5,
    review: '张护士非常专业，全程陪同很贴心，下次还会选择！',
    reviewTags: ['专业负责', '态度很好', '准时到达'],
    reviewPhotos: ['https://picsum.photos/id/237/200/200'],
    isAnonymousReview: false
  },
  // ============ 3天前完成订单 ============
  {
    id: 'o008',
    orderNo: 'PZ20240611008',
    status: 'completed',
    hospitalId: 'h003',
    hospitalName: '中国人民解放军总医院',
    department: '骨科',
    appointmentTime: daysAgo(3, 8, 0),
    checkItems: ['膝关节X光', 'MRI检查', '骨科会诊'],
    specialNotes: '膝关节置换术后复查',
    patient: { name: '郑大娘', age: 70, gender: 'female', phone: '155****5555' },
    familyContact: { name: '郑伟', relation: '孙子', phone: '154****6666' },
    companionId: 'c008',
    companionName: '周医生',
    companionPhone: '132****0123',
    serviceLevel: 'premium',
    duration: 180,
    price: 328,
    actualDuration: 175,
    createTime: daysAgo(4, 10, 0),
    nodes: generateNodes('completed'),
    receiptPhotos: ['https://picsum.photos/id/225/400/300'],
    visitResult: '术后恢复良好，医生建议继续康复训练，三个月后复诊。',
    isOverdue: false,
    rating: 5,
    review: '周医生非常专业，帮我们解读了很多医学知识，服务态度特别好！',
    reviewTags: ['专业负责', '耐心细致', '沟通顺畅'],
    isAnonymousReview: false
  },
  // ============ 5天前完成订单 ============
  {
    id: 'o012',
    orderNo: 'PZ20240609012',
    status: 'completed',
    hospitalId: 'h005',
    hospitalName: '北京朝阳医院',
    department: '心内科',
    appointmentTime: daysAgo(5, 8, 30),
    checkItems: ['心电图', '24小时动态血压', '心脏彩超'],
    specialNotes: '高血压复查，需要空腹抽血',
    patient: { name: '杨丽华', age: 62, gender: 'female', phone: '186****3333' },
    familyContact: { name: '杨军', relation: '儿子', phone: '185****4444' },
    companionId: 'c001',
    companionName: '张护士',
    companionPhone: '138****1234',
    serviceLevel: 'standard',
    duration: 120,
    price: 198,
    actualDuration: 130,
    createTime: daysAgo(6, 15, 0),
    nodes: generateNodes('completed'),
    receiptPhotos: ['https://picsum.photos/id/201/400/300'],
    visitResult: '血压控制良好，继续按原方案服药，建议清淡饮食，适量运动。',
    isOverdue: false,
    rating: 4,
    review: '整体服务不错，张护士很负责，就是稍微晚到了几分钟。',
    reviewTags: ['服务周到'],
    isAnonymousReview: false
  },
  // ============ 6天前完成订单 ============
  {
    id: 'o013',
    orderNo: 'PZ20240608013',
    status: 'completed',
    hospitalId: 'h004',
    hospitalName: '北京天坛医院',
    department: '神经内科',
    appointmentTime: daysAgo(6, 9, 0),
    checkItems: ['脑电图', '经颅多普勒'],
    specialNotes: '头痛原因待查',
    patient: { name: '徐文斌', age: 42, gender: 'male', phone: '139****5555' },
    familyContact: { name: '徐敏', relation: '妹妹', phone: '139****6666' },
    companionId: 'c005',
    companionName: '吴师傅',
    companionPhone: '138****7777',
    serviceLevel: 'standard',
    duration: 120,
    price: 188,
    actualDuration: 115,
    createTime: daysAgo(7, 11, 0),
    nodes: generateNodes('completed'),
    isOverdue: false,
    rating: 4,
    review: '服务还行，流程很熟悉。'
  },
  // ============ 昨日订单（今天未完成的昨日开始的服务） ============
  {
    id: 'o014',
    orderNo: 'PZ20240613014',
    status: 'completed',
    hospitalId: 'h002',
    hospitalName: '北京大学第一医院',
    department: '呼吸内科',
    appointmentTime: yesterday(14, 0),
    checkItems: ['胸部CT', '肺功能检查'],
    specialNotes: '长期咳嗽',
    patient: { name: '林建国', age: 55, gender: 'male', phone: '139****7788' },
    familyContact: { name: '林芳', relation: '女儿', phone: '138****8899' },
    companionId: 'c006',
    companionName: '郑护士',
    companionPhone: '138****9900',
    serviceLevel: 'premium',
    duration: 150,
    price: 258,
    actualDuration: 145,
    createTime: yesterday(10, 0),
    nodes: generateNodes('completed'),
    visitResult: '检查结果显示轻微肺炎，已开药，医嘱按时服药多休息。',
    isOverdue: false,
    rating: 5,
    review: '非常专业，全程陪同很细心。'
  },
  // ============ 待处理的投诉示例订单 ============
  {
    id: 'o015',
    orderNo: 'PZ20240614015',
    status: 'serving',
    hospitalId: 'h004',
    hospitalName: '北京天坛医院',
    department: '普外科',
    appointmentTime: today(10, 0),
    checkItems: ['腹部B超', '肝功能'],
    specialNotes: '腹部疼痛待查',
    patient: { name: '马大爷', age: 68, gender: 'male', phone: '136****1122' },
    familyContact: { name: '马丽', relation: '女儿', phone: '137****3344' },
    companionId: 'c006',
    companionName: '郑护士',
    companionPhone: '138****9900',
    serviceLevel: 'standard',
    duration: 120,
    price: 198,
    actualDuration: 60,
    createTime: yesterday(17, 0),
    nodes: generateNodes('serving'),
    isOverdue: false,
    complaint: '陪诊师迟到了20分钟，态度不太好'
  }
];

export const getHospitalOrderGroups = (): HospitalOrderGroup[] => {
  const groups: HospitalOrderGroup[] = [];
  
  mockHospitals.forEach(hospital => {
    const hospitalOrders = mockOrders.filter(o => o.hospitalId === hospital.id);
    
    if (hospitalOrders.length > 0) {
      groups.push({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        hospitalAddress: hospital.address,
        orderCount: hospitalOrders.length,
        pendingCount: hospitalOrders.filter(o => o.status === 'pending').length,
        assignedCount: hospitalOrders.filter(o => o.status === 'assigned').length,
        servingCount: hospitalOrders.filter(o => o.status === 'serving').length,
        completedCount: hospitalOrders.filter(o => o.status === 'completed').length,
        orders: hospitalOrders
      });
    }
  });
  
  return groups;
};

export const getStatsData = () => {
  return {
    totalOrders: mockOrders.length,
    pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
    servingOrders: mockOrders.filter(o => o.status === 'serving').length,
    completedOrders: mockOrders.filter(o => o.status === 'completed').length,
    overdueOrders: mockOrders.filter(o => o.isOverdue).length,
    complaintCount: mockOrders.filter(o => o.complaint && o.complaint !== '已处理').length,
    todayRevenue: mockOrders.filter(o => dayjs(o.createTime).isSame(dayjs(), 'day') && o.status === 'completed').reduce((sum, o) => sum + o.price, 0),
    monthRevenue: mockOrders.filter(o => dayjs(o.createTime).isSame(dayjs(), 'month') && o.status === 'completed').reduce((sum, o) => sum + o.price, 0)
  };
};
