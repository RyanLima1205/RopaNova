import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { getFirestore } from 'firebase/firestore';

export type AddressType = 'home' | 'work' | 'other';

export interface SavedAddress {
  id: string;
  type: AddressType;
  name: string;
  recipient: string;
  phone: string;
  street: string;
  sector: string;
  city: string;
  province: string;
  postalCode: string;
  references: string;
  isDefault: boolean;
  isVerified: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AddressInput = Omit<
  SavedAddress,
  'id' | 'isVerified' | 'lastUsedAt' | 'createdAt' | 'updatedAt'
>;

const db = getFirestore(app);

function mapDoc(id: string, data: Record<string, unknown>): SavedAddress {
  return {
    id,
    type: (data.type as AddressType) || 'other',
    name: String(data.name || ''),
    recipient: String(data.recipient || ''),
    phone: String(data.phone || ''),
    street: String(data.street || ''),
    sector: String(data.sector || ''),
    city: String(data.city || ''),
    province: String(data.province || ''),
    postalCode: String(data.postalCode || ''),
    references: String(data.references || ''),
    isDefault: Boolean(data.isDefault),
    isVerified: Boolean(data.isVerified),
    lastUsedAt: data.lastUsedAt instanceof Timestamp ? data.lastUsedAt.toDate() : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

function sortAddresses(rows: SavedAddress[]): SavedAddress[] {
  return [...rows].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    const aUsed = a.lastUsedAt?.getTime() ?? 0;
    const bUsed = b.lastUsedAt?.getTime() ?? 0;
    if (bUsed !== aUsed) return bUsed - aUsed;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export async function getAddresses(userId: string): Promise<SavedAddress[]> {
  const ref = collection(db, 'users', userId, 'addresses');
  const snap = await getDocs(ref);
  const rows: SavedAddress[] = [];
  snap.forEach((d) => rows.push(mapDoc(d.id, d.data() as Record<string, unknown>)));
  return sortAddresses(rows);
}

export async function getAddress(userId: string, addressId: string): Promise<SavedAddress | null> {
  const ref = doc(db, 'users', userId, 'addresses', addressId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapDoc(snap.id, snap.data() as Record<string, unknown>);
}

async function clearDefaultFlags(userId: string, batch: ReturnType<typeof writeBatch>) {
  const ref = collection(db, 'users', userId, 'addresses');
  const q = query(ref, where('isDefault', '==', true));
  const snap = await getDocs(q);
  snap.forEach((d) => {
    batch.update(d.ref, { isDefault: false, updatedAt: Timestamp.now() });
  });
}

export async function addAddress(
  userId: string,
  input: AddressInput,
): Promise<string> {
  const existing = await getAddresses(userId);
  const shouldBeDefault = input.isDefault || existing.length === 0;

  const addressesRef = collection(db, 'users', userId, 'addresses');
  const newRef = doc(addressesRef);
  const now = Timestamp.now();

  const batch = writeBatch(db);
  if (shouldBeDefault) {
    await clearDefaultFlags(userId, batch);
  }

  batch.set(newRef, {
    type: input.type,
    name: input.name.trim(),
    recipient: input.recipient.trim(),
    phone: input.phone.trim(),
    street: input.street.trim(),
    sector: input.sector.trim(),
    city: input.city.trim(),
    province: input.province.trim(),
    postalCode: input.postalCode.trim(),
    references: input.references.trim(),
    isDefault: shouldBeDefault,
    isVerified: false,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
  return newRef.id;
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: Partial<AddressInput>,
): Promise<void> {
  const ref = doc(db, 'users', userId, 'addresses', addressId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('NOT_FOUND');

  const batch = writeBatch(db);
  if (input.isDefault === true) {
    await clearDefaultFlags(userId, batch);
  }

  const patch: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (input.type !== undefined) patch.type = input.type;
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.recipient !== undefined) patch.recipient = input.recipient.trim();
  if (input.phone !== undefined) patch.phone = input.phone.trim();
  if (input.street !== undefined) patch.street = input.street.trim();
  if (input.sector !== undefined) patch.sector = input.sector.trim();
  if (input.city !== undefined) patch.city = input.city.trim();
  if (input.province !== undefined) patch.province = input.province.trim();
  if (input.postalCode !== undefined) patch.postalCode = input.postalCode.trim();
  if (input.references !== undefined) patch.references = input.references.trim();
  if (input.isDefault !== undefined) patch.isDefault = input.isDefault;

  batch.update(ref, patch as { [x: string]: unknown });
  await batch.commit();
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'addresses', addressId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('NOT_FOUND');

  const batch = writeBatch(db);
  await clearDefaultFlags(userId, batch);
  batch.update(ref, { isDefault: true, updatedAt: Timestamp.now() });
  await batch.commit();
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'addresses', addressId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const wasDefault = Boolean(snap.data()?.isDefault);
  await deleteDoc(ref);

  if (wasDefault) {
    const remaining = await getAddresses(userId);
    if (remaining.length > 0) {
      await setDefaultAddress(userId, remaining[0].id);
    }
  }
}

/** Libellé relatif pour l’UI (ex. « Hace 2 días »). */
export function formatAddressShort(address: SavedAddress): string {
  const line = [address.street, address.sector, address.city].filter(Boolean).join(', ');
  return address.name ? `${address.name} — ${line}` : line;
}

export async function touchAddressLastUsed(userId: string, addressId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'addresses', addressId);
  await updateDoc(ref, { lastUsedAt: Timestamp.now(), updatedAt: Timestamp.now() });
}

export function formatLastUsedLabel(lastUsedAt: Date | null): string {
  if (!lastUsedAt) return 'Sin usar aún';
  const diffMs = Date.now() - lastUsedAt.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hace 1 día';
  if (days < 7) return `Hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Hace 1 semana';
  return `Hace ${weeks} semanas`;
}
