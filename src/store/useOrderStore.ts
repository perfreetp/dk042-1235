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
  orderId: string;
  duration: number;
  extraPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  applyTime: string;
}

interface OrderStore {
  orders: Order[];
  complaints: ComplaintData[];
  extraDurations: ExtraDuration[];
  reviews: Record<string, ReviewData>;
  
  initOrders: () => void;
  
  getOrdersByTime: (filter: 'today' | 'yesterday' | 'week' | 'all') => Order[];
  getOrderById: (id: string) => Order | undefined;
  
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  
  assignOrder: (orderId: string, companionId: string, companionName: string, companionPhone: string) => void;
  
  reassignOrder: (orderId: string, companionId: string, companionName: string, companionPhone: string) => void;
  
  completeService: (orderId: string, visitResult: string, receiptPhotos: string[], actualDuration: number) => void;
  
  updateNodeStatus: (orderId: string, nodeId: string) => void;
  
  submitReview: (orderId: string, review: ReviewData) => void;
  
  addComplaint: (orderId: string, content: string) => void;
  
  handleComplaint: (complaintId: string, result: string) => void;
  
  applyExtraDuration: (orderId: string, duration: number) => void;
  
  handleExtraDuration: (applyId: string, status: 'approved' | 'rejected') => void;
  
  sendSupplementToCompanion: (orderId: string, content: string) => { id: string; time: string };
  
  getStats: () => {
    totalOrders: number;
    pendingOrders: number;
    servingOrders: number;
    completedOrders: number;
    overdueOrders: number;
    complaintCount: number;
    pendingComplaintCount: number;
    todayRevenue: number;
    monthRevenue: number;
  };
}

const generateNodes = (status: OrderStatus): ServiceNode[] => {
  const baseNodes: ServiceNode[] = [
    { id: 'n1', name: '预约挂号', status: 'done', time: '08:00', description: '已完成挂号' },
    { id: 'n2', name: '到院签到', status: 'pending' },
    { id: 'n3', name: '候诊等待', status: 'pending' },
    { id: 'n4', name: '医生问诊', status: 'pending' },
    { id: 'n5', name: '检查检验', status: 'pending' },
    { id: 'n6', name: '取药结算', status: 'pending' },
    { id: 'n7', name: '服务完成', status: 'pending' }
  ];
  
  if (status === 'pending') return baseNodes.map((n, i) => i === 0 ? { ...n, status: 'done' } : n);
  if (status === 'assigned') return baseNodes.map((n, i) => i <= 0 ? { ...n, status: 'done' } : n);
  if (status === 'serving') {
    return baseNodes.map((n, i) => {
      if (i <= 2) return { ...n, status: 'done', time: `0${8 + i}:${30 + i * 15}` };
      if (i === 3) return { ...n, status: 'current' };
      return n;
    });
  }
  return baseNodes.map((n, i) => ({ ...n, status: 'done' as const, time: `0${8 + i}:${30 + i * 15}` }));
};

const buildTrackNodesFromStatus = (order: Order) => {
  const status = order.status;
  const baseNodes = [
    { id: 'n1', label: '预约挂号', status: 'done' },
    { id: 'n2', label: '到院签到', status: 'pending' },
    { id: 'n3', label: '候诊等待', status: 'pending' },
    { id: 'n4', label: '医生问诊', status: 'pending' },
    { id: 'n5', label: '检查检验', status: 'pending' },
    { id: 'n6', label: '取药结算', status: 'pending' },
    { id: 'n7', label: '服务完成', status: 'pending' }
  ];
  
  const doneCount = order.nodes.filter(n => n.status === 'done').length;
  
  return baseNodes.map((n, i) => {
    if (i < doneCount) return { ...n, status: 'done' };
    if (i === doneCount && status !== 'completed' && status !== 'pending') return { ...n, status: 'current' };
    return n;
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
          set({ orders: JSON.parse(JSON.stringify(mockOrders)) });
        }
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
          return orders.filter(o => dayjs(o.createTime).isAfter(now.subtract(7, 'day')));
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
              ? { ...o, status, nodes: generateNodes(status) }
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
                  nodes: generateNodes('assigned')
                }
              : o
          )
        }));
      },

      reassignOrder: (orderId, companionId, companionName, companionPhone) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'assigned',
                  companionId,
                  companionName,
                  companionPhone
                }
              : o
          )
        }));
      },

      completeService: (orderId, visitResult, receiptPhotos, actualDuration) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'completed',
                  visitResult,
                  receiptPhotos,
                  actualDuration,
                  nodes: generateNodes('completed')
                }
              : o
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

      submitReview: (orderId, review) => {
        set(state => ({
          reviews: { ...state.reviews, [orderId]: review },
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, rating: review.rating, review: review.content }
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
          complaints: [complaint, ...state.complaints]
        }));
      },

      handleComplaint: (complaintId, result) => {
        set(state => ({
          complaints: state.complaints.map(c =>
            c.id === complaintId
              ? { ...c, status: 'resolved', handleResult: result }
              : c
          )
        }));
      },

      applyExtraDuration: (orderId, duration) => {
        const extra: ExtraDuration = {
          orderId,
          duration,
          extraPrice: Math.round(duration / 30) * 50,
          status: 'pending',
          applyTime: dayjs().format('YYYY-MM-DD HH:mm')
        };
        set(state => ({
          extraDurations: [extra, ...state.extraDurations]
        }));
      },

      handleExtraDuration: (applyId, status) => {
        set(state => ({
          extraDurations: state.extraDurations.map(e =>
            e.orderId === applyId ? { ...e, status } : e
          ),
          orders: status === 'approved'
            ? state.orders.map(o =>
                o.id === applyId
                  ? { ...o, duration: o.duration + (state.extraDurations.find(e => e.orderId === applyId)?.duration || 0) }
                  : o
              )
            : state.orders
        }));
      },

      sendSupplementToCompanion: (orderId, content) => {
        const id = `msg${Date.now()}`;
        const time = dayjs().format('HH:mm');
        return { id, time };
      },

      getStats: () => {
        const { orders, complaints, extraDurations } = get();
        const now = dayjs();
        const todayOrders = orders.filter(o => dayjs(o.createTime).isSame(now, 'day'));
        const monthOrders = orders.filter(o => dayjs(o.createTime).isSame(now, 'month'));
        
        return {
          totalOrders: todayOrders.length,
          pendingOrders: todayOrders.filter(o => o.status === 'pending').length,
          servingOrders: todayOrders.filter(o => o.status === 'serving').length,
          completedOrders: todayOrders.filter(o => o.status === 'completed').length,
          overdueOrders: todayOrders.filter(o => o.isOverdue).length,
          complaintCount: complaints.length,
          pendingComplaintCount: complaints.filter(c => c.status === 'pending').length,
          todayRevenue: todayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.price, 0),
          monthRevenue: monthOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.price, 0)
        };
      }
    }),
    {
      name: 'peizhen-order-store',
      partialize: (state) => ({
        orders: state.orders,
        complaints: state.complaints,
        extraDurations: state.extraDurations,
        reviews: state.reviews
      })
    }
  )
);

export { buildTrackNodesFromStatus };
