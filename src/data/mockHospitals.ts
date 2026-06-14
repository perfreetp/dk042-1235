import { Hospital } from '@/types/hospital';

export const mockHospitals: Hospital[] = [
  {
    id: 'h001',
    name: '北京协和医院',
    address: '北京市东城区王府井帅府园1号',
    level: '三甲',
    departments: ['内科', '外科', '妇产科', '儿科', '眼科', '口腔科', '皮肤科', '骨科'],
    distance: 2.5
  },
  {
    id: 'h002',
    name: '北京大学第一医院',
    address: '北京市西城区西什库大街8号',
    level: '三甲',
    departments: ['心内科', '神经内科', '消化内科', '呼吸内科', '泌尿外科', '骨科'],
    distance: 3.8
  },
  {
    id: 'h003',
    name: '中国人民解放军总医院',
    address: '北京市海淀区复兴路28号',
    level: '三甲',
    departments: ['心内科', '神经内科', '肿瘤科', '骨科', '眼科', '口腔科'],
    distance: 5.2
  },
  {
    id: 'h004',
    name: '北京天坛医院',
    address: '北京市丰台区南四环西路119号',
    level: '三甲',
    departments: ['神经内科', '神经外科', '心内科', '呼吸科', '消化科'],
    distance: 4.1
  },
  {
    id: 'h005',
    name: '北京朝阳医院',
    address: '北京市朝阳区工人体育场南路8号',
    level: '三甲',
    departments: ['呼吸科', '心内科', '消化科', '妇产科', '儿科'],
    distance: 1.8
  }
];
