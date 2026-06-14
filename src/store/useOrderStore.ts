import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import { Order, ServiceNode, OrderStatus } from '@/types/order';
import { mockOrders } from '@/data/mockOrders';

export interface ReviewData {
  rating: number;
  tags: string[];
  content: string;
  photos: string[];
  isAnonymous: boolean;
  time: string;
}

export interface ComplaintData {
  id: string;
  orderId: string;
  content: string;
  status: 'pending' | 'processing' | 'resolved';
  createTime: string;
  handleResult?: string;
}

export interface ExtraDuration {
  id: string;
  orderId: string;
  duration: number;
  extraPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  applyTime: string;
}

export interface TrackNodeItem {
  id: string;
  label: string;
  status: 'done' | 'current' | 'pending';
  time?: string;
}

export interface StatsResult {
  totalOrders: number;
  pendingOrders: number;
  assignedOrders: number;
  servingOrders: number;
  completedOrders: number;
  overdueOrders: number;
  complaintCount: number;
  pendingComplaintCount: number;
  totalRevenue: number;
  avgRating: number;
}

interface OrderStore {
  orders: Order[];
  complaints: ComplaintData[];
  extraDurations: ExtraDuration[];
  reviews: Record<string, ReviewData>;
  
  initOrders: () => void;
  resetStore: () => void;
  
  getOrdersByTime: (filter: 'today' | 'yesterday' | 'week' | 'month' | 'all') => Order[];
  getOrderById: (id: string) => Order | undefined;
  
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  
  assignOrder: (orderId: string, companionId: string, companionName: string, companionPhone: string) => void;
  
  reassignOrder: (orderId: string, newCompanionId: string, newCompanionName: string, newCompanionPhone: string, reason?: string) => void;
  
  updateOrderNodes: (orderId: string, nodes: ServiceNode[]) => void;
  updateNodeStatus: (orderId: string, nodeId: string) => void;
  
  uploadReceipts: (orderId: string, photos: string[]) => void;
  
  completeService: (orderId: string, actualDuration: number, visitResult: string, receiptPhotos: string[], finalNodes: ServiceNode[]) => void;
  
  submitReview: (orderId: string, review: ReviewData) => void;
  
  addComplaint: (orderId: string, content: string) => void;
  handleComplaint: (orderId: string, result: string) => void;
  
  applyExtraDuration: (orderId: string, minutes: number) => void;
  handleExtraDuration: (orderId: string, approved: boolean) => void;
  
  sendSupplementToCompanion: (orderId: string, content: string) => { id: string; time: string };
  
  getStats: (range: 'today' | 'week' | 'month') => StatsResult;
}

const generateDefaultNodes = (status: OrderStatus): ServiceNode[] => {
  const baseNodes: ServiceNode[] = [
    { id: 'n1', name: '预约挂号', status: 'done', time: '08:00', description: '已完成挂号' },
    { id: 'n2', name: '到院签到', status: 'pending' },
    { id: 'n3', name: '候诊等待', status: 'pending' },
    { id: 'n4', name: '医生问诊', status: 'pending' },
    { id: 'n5', name: '检查检验', status: 'pending' },
    { id: 'n6', name: '取药结算', status: 'pending' },
    { id: 'n7', name: '服务完成', status: 'pending' }
  ];
  
  if (status === 'pending') return baseNodes;
  if (status === 'assigned') return baseNodes.map((n, i) => i === 0 ? { ...n, status: 'done' } : n);
  if (status === 'serving') {
    return baseNodes.map((n, i) => {
      if (i <= 2) return { ...n, status: 'done', time: `0${8 + i}:${30 + i * 10}`.slice(-5) };
      if (i === 3) return { ...n, status: 'current' };
      return n;
    });
  }
  return baseNodes.map((n, i) => ({ ...n, status: 'done' as const, time: `${String(8 + i).padStart(2, '0')}:${String(30 + i * 10).slice(-2)}` }));
};

export const buildTrackNodesFromStatus = (order: Order): TrackNodeItem[] => {
  const baseLabels = [
    { id: 'n1', label: '已下单' },
    { id: 'n2', label: '已分配陪诊师' },
    { id: 'n3', label: '陪诊师出发' },
    { id: 'n4', label: '已到院' },
    { id: 'n5', label: '服务中' },
    { id: 'n6', label: '检查/取药完成' },
    { id: 'n7', label: '服务结束' }
  ];
  
  const status = order.status;
  const nodes = order.nodes || [];
  const doneFromNodes = nodes.filter(n => n.status === 'done').length;
  
  let doneCount = 0;
  switch (status) {
    case 'pending':
      doneCount = 1;
      break;
    case 'assigned':
      doneCount = 3;
      break;
    case 'serving':
      doneCount = Math.max(4, Math.min(doneFromNodes + 2, 6));
      break;
    case 'completed':
      doneCount = 7;
      break;
  }
  
  return baseLabels.map((n, i) => {
    if (i < doneCount) return { ...n, status: 'done' as const };
    if (i === doneCount && status !== 'completed' && status !== 'pending') return { ...n, status: 'current' as const };
    return { ...n, status: 'pending' as const };
  });
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      complaints: [],
      extraDurations: [],
      reviews: {},

      initOrders: () => {
        const current = get().orders;
        if (current.length === 0) {
          const deepCopy = JSON.parse(JSON.stringify(mockOrders)) as Order[];
          const withNodes = deepCopy.map(o => ({
            ...o,
            nodes: o.nodes && o.nodes.length > 0 ? o.nodes : generateDefaultNodes(o.status),
            supplementMessages: o.supplementMessages || [],
            reviewTags: o.reviewTags || [],
            reviewPhotos: o.reviewPhotos || []
          }));
          
          const existingComplaints = get().complaints;
          const newComplaints: ComplaintData[] = [...existingComplaints];
          
          withNodes.forEach(o => {
            if (o.complaint && o.complaint !== '已处理' && o.complaint !== '') {
              const exists = existingComplaints.some(c => c.orderId === o.id);
              if (!exists) {
                newComplaints.push({
                  id: `c_init_${o.id}`,
                  orderId: o.id,
                  content: o.complaint,
                  status: 'pending',
                  createTime: o.createTime
                });
              }
            }
          });
          
          set({ orders: withNodes, complaints: newComplaints });
        } else {
          const syncedComplaints = get().complaints.map(c => {
            const order = get().orders.find(o => o.id === c.orderId);
            if (order && order.complaint === '已处理' && c.status !== 'resolved') {
              return { ...c, status: 'resolved' as const };
            }
            return c;
          }).filter(c => get().orders.some(o => o.id === c.orderId));
          
          if (JSON.stringify(syncedComplaints) !== JSON.stringify(get().complaints)) {
            set({ complaints: syncedComplaints });
          }
        }
      },

      resetStore: () => {
        const deepCopy = JSON.parse(JSON.stringify(mockOrders)) as Order[];
        const withNodes = deepCopy.map(o => ({
          ...o,
          nodes: o.nodes && o.nodes.length > 0 ? o.nodes : generateDefaultNodes(o.status),
          supplementMessages: [],
          reviewTags: [],
          reviewPhotos: []
        }));
        set({ orders: withNodes, complaints: [], extraDurations: [], reviews: {} });
      },

      getOrdersByTime: (filter) => {
        const { orders } = get();
        const now = dayjs();
        
        if (filter === 'today') {
          return orders.filter(o => dayjs(o.createTime).isSame(now, 'day'));
        }
        if (filter === 'yesterday') {
          return orders.filter(o => dayjs(o.createTime).isSame(now.subtract(1, 'day'), 'day'));
        }
        if (filter === 'week') {
          return orders.filter(o => dayjs(o.createTime).isAfter(now.subtract(7, 'day').startOf('day')));
        }
        if (filter === 'month') {
          return orders.filter(o => dayjs(o.createTime).isSame(now, 'month'));
        }
        return orders;
      },

      getOrderById: (id) => {
        return get().orders.find(o => o.id === id);
      },

      updateOrderStatus: (id, status) => {
        set(state => ({
          orders: state.orders.map(o => 
            o.id === id 
              ? { ...o, status, nodes: generateDefaultNodes(status) }
              : o
          )
        }));
      },

      assignOrder: (orderId, companionId, companionName, companionPhone) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'assigned',
                  companionId,
                  companionName,
                  companionPhone,
                  nodes: generateDefaultNodes('assigned')
                }
              : o
          )
        }));
      },

      reassignOrder: (orderId, newCompanionId, newCompanionName, newCompanionPhone, reason) => {
        if (!newCompanionId) {
          set(state => ({
            orders: state.orders.map(o =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'pending',
                    companionId: undefined,
                    companionName: undefined,
                    companionPhone: undefined,
                    nodes: generateDefaultNodes('pending')
                  }
                : o
            )
          }));
          return;
        }
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'assigned',
                  companionId: newCompanionId,
                  companionName: newCompanionName,
                  companionPhone: newCompanionPhone
                }
              : o
          )
        }));
      },

      updateOrderNodes: (orderId, nodes) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, nodes: [...nodes] } : o
          )
        }));
      },

      updateNodeStatus: (orderId, nodeId) => {
        set(state => ({
          orders: state.orders.map(o => {
            if (o.id !== orderId) return o;
            const newNodes = [...o.nodes];
            const idx = newNodes.findIndex(n => n.id === nodeId);
            if (idx >= 0) {
              newNodes[idx] = {
                ...newNodes[idx],
                status: 'done',
                time: dayjs().format('HH:mm')
              };
              if (idx + 1 < newNodes.length) {
                newNodes[idx + 1] = { ...newNodes[idx + 1], status: 'current' };
              }
            }
            return { ...o, nodes: newNodes };
          })
        }));
      },

      uploadReceipts: (orderId, photos) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, receiptPhotos: [...photos] } : o
          )
        }));
      },

      completeService: (orderId, actualDuration, visitResult, receiptPhotos, finalNodes) => {
        set(state => {
          const order = state.orders.find(o => o.id === orderId);
          const basePrice = order?.price || 0;
          const extraDur = Math.max(0, actualDuration - (order?.duration || 0));
          const extraPrice = Math.round(extraDur / 30) * 50;
          return {
            orders: state.orders.map(o =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'completed',
                    actualDuration,
                    visitResult,
                    receiptPhotos,
                    nodes: finalNodes.length > 0 ? finalNodes : generateDefaultNodes('completed'),
                    price: basePrice + extraPrice
                  }
                : o
            )
          };
        });
      },

      submitReview: (orderId, review) => {
        set(state => ({
          reviews: { ...state.reviews, [orderId]: review },
          orders: state.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  rating: review.rating,
                  review: review.content,
                  reviewTags: review.tags,
                  reviewPhotos: review.photos,
                  isAnonymousReview: review.isAnonymous
                }
              : o
          )
        }));
      },

      addComplaint: (orderId, content) => {
        const complaint: ComplaintData = {
          id: `c${Date.now()}`,
          orderId,
          content,
          status: 'pending',
          createTime: dayjs().format('YYYY-MM-DD HH:mm')
        };
        set(state => ({
          complaints: [complaint, ...state.complaints],
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, complaint: content } : o
          )
        }));
      },

      handleComplaint: (orderId, result) => {
        set(state => ({
          complaints: state.complaints.map(c =>
            c.orderId === orderId
              ? { ...c, status: 'resolved', handleResult: result }
              : c
          ),
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, complaint: '已处理' } : o
          )
        }));
      },

      applyExtraDuration: (orderId, minutes) => {
        const extra: ExtraDuration = {
          id: `e${Date.now()}`,
          orderId,
          duration: minutes,
          extraPrice: Math.round(minutes / 30) * 50,
          status: 'pending',
          applyTime: dayjs().format('YYYY-MM-DD HH:mm')
        };
        set(state => ({
          extraDurations: [extra, ...state.extraDurations]
        }));
      },

      handleExtraDuration: (orderId, approved) => {
        set(state => {
          const extra = state.extraDurations.find(e => e.orderId === orderId && e.status === 'pending');
          if (!extra) return state;
          
          const newDurations = state.extraDurations.map(e =>
            e.id === extra.id ? { ...e, status: approved ? 'approved' as const : 'rejected' as const } : e
          );
          
          if (approved) {
            return {
              extraDurations: newDurations,
              orders: state.orders.map(o => {
                if (o.id !== orderId) return o;
                const newActual = (o.actualDuration || o.duration) + extra.duration;
                const addPrice = Math.round(extra.duration / 30) * 50;
                return {
                  ...o,
                  actualDuration: newActual,
                  price: o.price + addPrice
                };
              })
            };
          }
          return { extraDurations: newDurations };
        });
      },

      sendSupplementToCompanion: (orderId, content) => {
        const id = `msg${Date.now()}`;
        const time = dayjs().format('HH:mm');
        set(state => ({
          orders: state.orders.map(o => {
            if (o.id !== orderId) return o;
            const existing = o.supplementMessages || [];
            return {
              ...o,
              supplementMessages: [
                ...existing,
                { id, content, time, from: 'customer' }
              ]
            };
          })
        }));
        return { id, time };
      },

      getStats: (range) => {
        const { orders, complaints } = get();
        const now = dayjs();
        
        let targetOrders: Order[];
        if (range === 'today') {
          targetOrders = orders.filter(o => dayjs(o.createTime).isSame(now, 'day'));
        } else if (range === 'week') {
          targetOrders = orders.filter(o => dayjs(o.createTime).isAfter(now.subtract(7, 'day').startOf('day')));
        } else {
          targetOrders = orders.filter(o => dayjs(o.createTime).isSame(now, 'month'));
        }
        
        const completed = targetOrders.filter(o => o.status === 'completed');
        const totalRevenue = completed.reduce((sum, o) => sum + (o.price || 0), 0);
        const ratedOrders = completed.filter(o => o.rating && o.rating > 0);
        const avgRating = ratedOrders.length > 0
          ? Number((ratedOrders.reduce((s, o) => s + (o.rating || 0), 0) / ratedOrders.length).toFixed(1))
          : 4.8;
        
        const orderIds = new Set(targetOrders.map(o => o.id));
        
        const pendingComplaintsFromArray = complaints.filter(c => 
          orderIds.has(c.orderId) && c.status === 'pending'
        );
        
        const pendingComplaintsFromOrders = targetOrders.filter(o => 
          o.complaint && o.complaint !== '已处理' && o.complaint !== '' &&
          !complaints.some(c => c.orderId === o.id && c.status === 'resolved')
        );
        
        const allPendingComplaintIds = new Set([
          ...pendingComplaintsFromArray.map(c => c.orderId),
          ...pendingComplaintsFromOrders.map(o => o.id)
        ]);
        
        const allComplaintIds = new Set([
          ...complaints.filter(c => orderIds.has(c.orderId)).map(c => c.orderId),
          ...targetOrders.filter(o => o.complaint && o.complaint !== '').map(o => o.id)
        ]);
        
        return {
          totalOrders: targetOrders.length,
          pendingOrders: targetOrders.filter(o => o.status === 'pending').length,
          assignedOrders: targetOrders.filter(o => o.status === 'assigned').length,
          servingOrders: targetOrders.filter(o => o.status === 'serving').length,
          completedOrders: completed.length,
          overdueOrders: targetOrders.filter(o => o.isOverdue).length,
          complaintCount: allComplaintIds.size,
          pendingComplaintCount: allPendingComplaintIds.size,
          totalRevenue,
          avgRating
        };
      }
    }),
    {
           name: 'peizhen-order-store-v4',
      partialize: (state) => ({
        orders: state.orders,
        complaints: state.complaints,
        extraDurations: state.extraDurations,
        reviews: state.reviews
      })
    }
  )
);

export { generateDefaultNodes };
