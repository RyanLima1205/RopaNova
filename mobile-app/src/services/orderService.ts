import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { generateOrderCode } from '../utils/orderCode';

const db = getFirestore(app);

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface BuyerOrder {
  id: string;
  buyerId: string;
  orderCode: string;
  productId: string;
  productTitle: string;
  lineSummary: string;
  unitCount: number;
  productImage: string;
  amount: number;
  status: OrderStatus;
  createdAt: Date | null;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  shippingLabel: string;
  shippingMethodId?: string;
  deliveryCity?: string;
  deliveryAddressId?: string;
  deliveryAddressSummary?: string;
  includeInsurance?: boolean;
  /** Stocké pour pouvoir ré-éditer les tailles sans parser lineSummary */
  sizeQuantities?: Record<string, number>;
  trackingNumber?: string;
  estimatedDelivery?: string;
  reviewId?: string;
  hasReview?: boolean;
}

export interface CreateOrderInput {
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number;
  productTitle: string;
  lineSummary: string;
  unitCount: number;
  productImage: string;
  sellerName: string;
  sellerAvatar: string;
  shippingLabel: string;
  shippingMethodId: string;
  deliveryCity: string;
  deliveryAddressId?: string;
  deliveryAddressSummary?: string;
  includeInsurance: boolean;
  sizeQuantities: Record<string, number>;
  status?: OrderStatus;
}

function mapSnapToBuyerOrder(docSnap: { id: string; data: () => Record<string, unknown> }): BuyerOrder {
  const d = docSnap.data();
  const status = (d.status as OrderStatus) || 'pending';
  const sq = d.sizeQuantities;
  return {
    id: docSnap.id,
    buyerId: String(d.buyerId ?? ''),
    orderCode: typeof d.orderCode === 'string' ? d.orderCode : docSnap.id,
    productId: String(d.productId ?? ''),
    productTitle: typeof d.productTitle === 'string' ? d.productTitle : 'Producto',
    lineSummary: typeof d.lineSummary === 'string' ? d.lineSummary : '—',
    unitCount: typeof d.unitCount === 'number' ? d.unitCount : 1,
    productImage: typeof d.productImage === 'string' ? d.productImage : '',
    amount: typeof d.amount === 'number' ? d.amount : 0,
    status,
    createdAt: parseCreatedAt(d as Record<string, unknown>),
    sellerId: String(d.sellerId ?? ''),
    sellerName: typeof d.sellerName === 'string' ? d.sellerName : '',
    sellerAvatar: typeof d.sellerAvatar === 'string' ? d.sellerAvatar : '',
    shippingLabel: typeof d.shippingLabel === 'string' ? d.shippingLabel : '',
    shippingMethodId: typeof d.shippingMethodId === 'string' ? d.shippingMethodId : undefined,
    deliveryCity: typeof d.deliveryCity === 'string' ? d.deliveryCity : undefined,
    deliveryAddressId: typeof d.deliveryAddressId === 'string' ? d.deliveryAddressId : undefined,
    deliveryAddressSummary:
      typeof d.deliveryAddressSummary === 'string' ? d.deliveryAddressSummary : undefined,
    includeInsurance: typeof d.includeInsurance === 'boolean' ? d.includeInsurance : undefined,
    sizeQuantities:
      sq && typeof sq === 'object' && !Array.isArray(sq)
        ? (sq as Record<string, number>)
        : undefined,
    trackingNumber: typeof d.trackingNumber === 'string' ? d.trackingNumber : undefined,
    estimatedDelivery: typeof d.estimatedDelivery === 'string' ? d.estimatedDelivery : undefined,
    reviewId: typeof d.reviewId === 'string' ? d.reviewId : undefined,
    hasReview: Boolean(d.hasReview) || typeof d.reviewId === 'string',
  };
}

export async function fetchOrderForBuyer(orderId: string, buyerId: string): Promise<BuyerOrder | null> {
  const ref = doc(db, 'orders', orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const row = mapSnapToBuyerOrder(snap);
  if (row.buyerId !== buyerId) return null;
  return row;
}

/** Champs exigés par firestore.rules + champs d’affichage (titres, tailles, code). */
export async function createOrder(input: CreateOrderInput): Promise<{ id: string; orderCode: string }> {
  const orderCode = generateOrderCode();
  const ref = await addDoc(collection(db, 'orders'), {
    buyerId: input.buyerId,
    sellerId: input.sellerId,
    productId: input.productId,
    amount: input.amount,
    status: input.status ?? 'pending',
    createdAt: serverTimestamp(),
    orderCode,
    productTitle: input.productTitle,
    lineSummary: input.lineSummary,
    unitCount: input.unitCount,
    productImage: input.productImage,
    sellerName: input.sellerName,
    sellerAvatar: input.sellerAvatar,
    shippingLabel: input.shippingLabel,
    shippingMethodId: input.shippingMethodId,
    deliveryCity: input.deliveryCity,
    ...(input.deliveryAddressId ? { deliveryAddressId: input.deliveryAddressId } : {}),
    ...(input.deliveryAddressSummary ? { deliveryAddressSummary: input.deliveryAddressSummary } : {}),
    includeInsurance: input.includeInsurance,
    sizeQuantities: input.sizeQuantities,
  });
  return { id: ref.id, orderCode };
}

function parseCreatedAt(data: Record<string, unknown>): Date | null {
  const c = data.createdAt;
  if (c && typeof c === 'object' && 'toDate' in c && typeof (c as { toDate: () => Date }).toDate === 'function') {
    return (c as { toDate: () => Date }).toDate();
  }
  if (c instanceof Date) return c;
  return null;
}

export async function fetchOrdersForBuyer(buyerId: string): Promise<BuyerOrder[]> {
  const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
  const snap = await getDocs(q);
  const rows = snap.docs.map((docSnap) => mapSnapToBuyerOrder(docSnap));
  rows.sort((a, b) => {
    const ta = a.createdAt?.getTime() ?? 0;
    const tb = b.createdAt?.getTime() ?? 0;
    return tb - ta;
  });
  return rows;
}

export async function cancelOrderAsBuyer(orderId: string, buyerId: string): Promise<void> {
  const ref = doc(db, 'orders', orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('NOT_FOUND');
  const data = snap.data();
  if (data.buyerId !== buyerId) throw new Error('FORBIDDEN');
  const st = data.status as OrderStatus;
  if (st !== 'pending') throw new Error('NOT_CANCELLABLE');
  await updateDoc(ref, {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
  });
}
