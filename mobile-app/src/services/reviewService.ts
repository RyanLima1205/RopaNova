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
  Timestamp,
} from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { fetchOrderForBuyer } from './orderService';
import type { Review } from '../types';

const db = getFirestore(app);

export type ReviewCategoryKey = 'comunicacion' | 'descripcion' | 'envio' | 'calidad';

export type ReviewCategories = {
  comunicacion: number;
  descripcion: number;
  envio: number;
  calidad: number;
};

/** Seules les catégories explicitement notées par l'acheteur. */
export type PartialReviewCategories = Partial<ReviewCategories>;

/** Note générale cohérente : moyenne des catégories détaillées si présentes, sinon la note globale. */
export function resolveReviewRating(
  generalRating: number,
  categories?: PartialReviewCategories,
): number {
  const values: number[] = [];
  const keys: ReviewCategoryKey[] = ['comunicacion', 'descripcion', 'envio', 'calidad'];
  for (const key of keys) {
    const v = categories?.[key];
    if (typeof v === 'number' && v >= 1) values.push(v);
  }
  if (values.length === 0) {
    return Math.min(5, Math.max(1, Math.round(generalRating)));
  }
  const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
  return Math.min(5, Math.max(1, Math.round(avg)));
}

export function countExplicitCategories(categories?: PartialReviewCategories): number {
  if (!categories) return 0;
  return (['comunicacion', 'descripcion', 'envio', 'calidad'] as ReviewCategoryKey[]).filter(
    (key) => typeof categories[key] === 'number' && (categories[key] ?? 0) >= 1,
  ).length;
}

export interface SellerReview {
  id: string;
  userId: string;
  sellerId: string;
  orderId: string;
  productId: string;
  productTitle: string;
  rating: number;
  comment: string;
  categories: PartialReviewCategories;
  buyerName: string;
  buyerAvatar: string;
  photos: string[];
  createdAt: Date | null;
  sellerResponse?: string;
  sellerResponseDate?: string;
}

export interface CreateReviewInput {
  orderId: string;
  rating: number;
  comment: string;
  /** Uniquement les catégories explicitement notées par l'acheteur. */
  categories?: PartialReviewCategories;
}

function parseTimestamp(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

export function formatReviewDate(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semana${Math.floor(days / 7) > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' });
}

function parseExplicitCategories(raw: unknown): PartialReviewCategories {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const cat = raw as Record<string, unknown>;
  const out: PartialReviewCategories = {};
  const keys: ReviewCategoryKey[] = ['comunicacion', 'descripcion', 'envio', 'calidad'];
  for (const key of keys) {
    const v = cat[key];
    if (typeof v === 'number' && v >= 1 && v <= 5) {
      out[key] = v;
    }
  }
  return out;
}

function mapDocToSellerReview(id: string, data: Record<string, unknown>): SellerReview {
  return {
    id,
    userId: String(data.userId ?? ''),
    sellerId: String(data.sellerId ?? ''),
    orderId: String(data.orderId ?? ''),
    productId: String(data.productId ?? ''),
    productTitle: String(data.productTitle ?? ''),
    rating: typeof data.rating === 'number' ? data.rating : 0,
    comment: String(data.comment ?? ''),
    categories: parseExplicitCategories(data.categories),
    buyerName: String(data.buyerName ?? 'Comprador'),
    buyerAvatar: String(data.buyerAvatar ?? ''),
    photos: Array.isArray(data.photos) ? (data.photos as string[]) : [],
    createdAt: parseTimestamp(data.createdAt),
    sellerResponse: typeof data.sellerResponse === 'string' ? data.sellerResponse : undefined,
    sellerResponseDate:
      typeof data.sellerResponseDate === 'string' ? data.sellerResponseDate : undefined,
  };
}

export function sellerReviewToCardReview(r: SellerReview, sellerAvatar?: string): Review {
  return {
    id: r.id,
    buyerName: r.buyerName,
    buyerAvatar: r.buyerAvatar,
    rating: r.rating,
    date: formatReviewDate(r.createdAt),
    verified: true,
    productTitle: r.productTitle,
    comment: r.comment,
    photos: r.photos,
    helpful: 0,
    categories: r.categories,
    sellerResponse: r.sellerResponse,
    sellerResponseDate: r.sellerResponseDate,
    sellerAvatar,
  };
}

export interface SellerReviewStats {
  averageRating: number;
  reviewCount: number;
  ratingBreakdown: Record<number, number>;
  /** Moyennes uniquement pour les catégories ayant au moins une note explicite. */
  categoryAverages: PartialReviewCategories;
  categoryCounts: Partial<Record<ReviewCategoryKey, number>>;
}

export function computeSellerReviewStats(reviews: SellerReview[]): SellerReviewStats {
  const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
      ratingBreakdown,
      categoryAverages: {},
      categoryCounts: {},
    };
  }
  let sum = 0;
  const catSum: Record<ReviewCategoryKey, number> = {
    comunicacion: 0,
    descripcion: 0,
    envio: 0,
    calidad: 0,
  };
  const catCount: Record<ReviewCategoryKey, number> = {
    comunicacion: 0,
    descripcion: 0,
    envio: 0,
    calidad: 0,
  };
  const categoryKeys: ReviewCategoryKey[] = ['comunicacion', 'descripcion', 'envio', 'calidad'];
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    ratingBreakdown[star] = (ratingBreakdown[star] ?? 0) + 1;
    sum += r.rating;
    for (const key of categoryKeys) {
      const v = r.categories[key];
      if (typeof v === 'number' && v >= 1) {
        catSum[key] += v;
        catCount[key] += 1;
      }
    }
  }
  const n = reviews.length;
  const categoryAverages: PartialReviewCategories = {};
  const categoryCounts: Partial<Record<ReviewCategoryKey, number>> = {};
  for (const key of categoryKeys) {
    if (catCount[key] > 0) {
      categoryAverages[key] = Math.round((catSum[key] / catCount[key]) * 10) / 10;
      categoryCounts[key] = catCount[key];
    }
  }
  return {
    averageRating: Math.round((sum / n) * 10) / 10,
    reviewCount: n,
    ratingBreakdown,
    categoryAverages,
    categoryCounts,
  };
}

export async function getReviewByOrderId(orderId: string): Promise<SellerReview | null> {
  const q = query(collection(db, 'reviews'), where('orderId', '==', orderId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapDocToSellerReview(d.id, d.data() as Record<string, unknown>);
}

export async function getReviewsBySellerId(sellerId: string): Promise<SellerReview[]> {
  const q = query(collection(db, 'reviews'), where('sellerId', '==', sellerId));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => mapDocToSellerReview(d.id, d.data() as Record<string, unknown>));
  rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  return rows;
}

export async function createReview(
  buyerId: string,
  buyerName: string,
  buyerAvatar: string,
  input: CreateReviewInput,
): Promise<string> {
  const order = await fetchOrderForBuyer(input.orderId, buyerId);
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.status !== 'delivered') throw new Error('ORDER_NOT_DELIVERED');

  const existing = await getReviewByOrderId(input.orderId);
  if (existing) throw new Error('REVIEW_ALREADY_EXISTS');

  const explicitCategories = input.categories ?? {};
  const rating = resolveReviewRating(input.rating, explicitCategories);
  const comment = input.comment.trim().slice(0, 500);
  const reviewPayload: Record<string, unknown> = {
    userId: buyerId,
    sellerId: order.sellerId,
    orderId: input.orderId,
    productId: order.productId,
    productTitle: order.productTitle,
    rating,
    comment,
    buyerName: buyerName.trim() || 'Comprador',
    buyerAvatar: buyerAvatar || '',
    photos: [],
    createdAt: serverTimestamp(),
  };
  if (Object.keys(explicitCategories).length > 0) {
    reviewPayload.categories = explicitCategories;
  }

  const ref = await addDoc(collection(db, 'reviews'), reviewPayload);

  await updateDoc(doc(db, 'orders', input.orderId), {
    reviewId: ref.id,
    hasReview: true,
  });

  return ref.id;
}
