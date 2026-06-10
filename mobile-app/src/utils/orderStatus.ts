import type { OrderStatus } from '../services/orderService';

export type OrderStatusVisual = {
  label: string;
  color: string;
  icon: string;
};

export type OrderTimelineStep = {
  status: OrderStatus;
  label: string;
  descriptionActive: string;
  descriptionPending: string;
  icon: string;
};

const FLOW: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

export const ORDER_TIMELINE_STEPS: OrderTimelineStep[] = [
  {
    status: 'pending',
    label: 'Pedido realizado',
    descriptionActive: 'Tu pedido fue registrado. El vendedor debe confirmarlo.',
    descriptionPending: 'Pendiente de registro',
    icon: 'receipt-outline',
  },
  {
    status: 'confirmed',
    label: 'Confirmado por el vendedor',
    descriptionActive: 'El vendedor aceptó tu pedido y lo prepara para el envío.',
    descriptionPending: 'En espera de confirmación del vendedor',
    icon: 'checkmark-circle-outline',
  },
  {
    status: 'shipped',
    label: 'Enviado',
    descriptionActive: 'Tu paquete está en camino.',
    descriptionPending: 'El vendedor aún no ha marcado el envío',
    icon: 'car-outline',
  },
  {
    status: 'delivered',
    label: 'Entregado',
    descriptionActive: 'Pedido completado. ¡Gracias por tu compra!',
    descriptionPending: 'Pendiente de entrega',
    icon: 'checkmark-done-circle-outline',
  },
];

export function getStatusInfo(status: OrderStatus): OrderStatusVisual {
  switch (status) {
    case 'pending':
      return { label: 'Pendiente', color: '#facc15', icon: 'cube-outline' };
    case 'confirmed':
      return { label: 'Confirmado', color: '#3b82f6', icon: 'checkmark-circle-outline' };
    case 'shipped':
      return { label: 'Enviado', color: '#a78bfa', icon: 'car-outline' };
    case 'delivered':
      return { label: 'Entregado', color: '#22c55e', icon: 'checkmark-done-circle-outline' };
    case 'cancelled':
      return { label: 'Cancelado', color: '#ef4444', icon: 'close-circle-outline' };
    default:
      return { label: 'Desconocido', color: '#6b7280', icon: 'cube-outline' };
  }
}

export type TimelineStepState = 'done' | 'current' | 'upcoming' | 'cancelled';

export function getTimelineStepStates(currentStatus: OrderStatus): TimelineStepState[] {
  if (currentStatus === 'cancelled') {
    return ORDER_TIMELINE_STEPS.map((_, i) => (i === 0 ? 'done' : 'cancelled'));
  }
  const currentIndex = FLOW.indexOf(currentStatus);
  return ORDER_TIMELINE_STEPS.map((step, i) => {
    const stepIndex = FLOW.indexOf(step.status);
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  });
}

export function formatOrderCurrency(amount: number): string {
  return `RD$${amount.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`;
}

export function formatOrderDate(d: Date | null): string {
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
}
