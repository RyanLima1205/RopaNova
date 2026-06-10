import { logger } from '../utils/logger'
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { app } from '../firebaseConfig';

export interface PaymentMethod {
  id: string;
  type: 'bank_transfer' | 'cash' | 'mobile_payment' | 'card';
  name: string;
  details: {
    // Pour carte
    cardNumber?: string;
    cardHolder?: string;
    expiry?: string;
    cardType?: string; // 'visa', 'mastercard', etc.
    // Pour virement bancaire
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    accountType?: string; // 'corriente', 'ahorros'
    // Pour espèces
    preferredLocation?: string;
    // Pour paiement mobile
    phoneNumber?: string;
    provider?: string; // 'Tpago', 'Azul Mobile', etc.
  };
  isDefault: boolean;
  isActive: boolean;
  isVerified: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletData {
  userId: string;
  balance: number;
  pendingEarnings: number;
  totalEarnings: number;
  currency: string;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'sale' | 'purchase' | 'withdrawal' | 'deposit' | 'refund';
  description: string;
  amount: number;
  status: 'completed' | 'processing' | 'failed' | 'cancelled';
  paymentMethodId?: string;
  relatedProductId?: string;
  relatedOrderId?: string;
  createdAt: Date;
}

export interface PaymentPreferences {
  userId: string;
  autoWithdraw: boolean;
  autoWithdrawThreshold: number;
  autoWithdrawMethodId?: string;
  requireConfirmation: boolean;
  paymentInstructions: string;
  updatedAt: Date;
}

const db = getFirestore(app);

// ==========================================
// GESTION DES MÉTHODES DE PAIEMENT
// ==========================================

export const addPaymentMethod = async (userId: string, paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt' | 'lastUsed'>): Promise<string> => {
  try {
    const paymentMethodsRef = collection(db, 'users', userId, 'paymentMethods');
    const newDocRef = doc(paymentMethodsRef);
    
    const newPaymentMethod: Omit<PaymentMethod, 'id'> = {
      ...paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(newDocRef, {
      ...newPaymentMethod,
      createdAt: Timestamp.fromDate(newPaymentMethod.createdAt),
      updatedAt: Timestamp.fromDate(newPaymentMethod.updatedAt),
    });
    
    // Si c'est la méthode par défaut, désactiver les autres
    if (paymentMethod.isDefault) {
      await setDefaultPaymentMethod(userId, newDocRef.id);
    }

    return newDocRef.id;
  } catch (error) {
    logger.error('Erreur lors de l\'ajout de la méthode de paiement:', error);
    throw error;
  }
};

export const getPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  try {
    const paymentMethodsRef = collection(db, 'users', userId, 'paymentMethods');
    const q = query(paymentMethodsRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const paymentMethods: PaymentMethod[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      paymentMethods.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastUsed: data.lastUsed?.toDate(),
      } as PaymentMethod);
    });

    // Trier : méthode par défaut en premier, puis par date de dernière utilisation
    return paymentMethods.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      if (a.lastUsed && b.lastUsed) {
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des méthodes de paiement:', error);
    throw error;
  }
};

export const updatePaymentMethod = async (userId: string, paymentMethodId: string, updates: Partial<PaymentMethod>): Promise<void> => {
  try {
    const paymentMethodRef = doc(db, 'users', userId, 'paymentMethods', paymentMethodId);
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    };
    
    // Convertir les dates si présentes
    if (updates.lastUsed) {
      updateData.lastUsed = Timestamp.fromDate(updates.lastUsed);
    }
    
    await updateDoc(paymentMethodRef, updateData);

    // Si cette méthode est marquée comme défaut, désactiver les autres
    if (updates.isDefault) {
      await setDefaultPaymentMethod(userId, paymentMethodId);
    }
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la méthode de paiement:', error);
    throw error;
  }
};

export const deletePaymentMethod = async (userId: string, paymentMethodId: string): Promise<void> => {
  try {
    const paymentMethodRef = doc(db, 'users', userId, 'paymentMethods', paymentMethodId);
    
    // Vérifier si c'est la méthode par défaut
    const paymentMethodDoc = await getDoc(paymentMethodRef);
    const isDefault = paymentMethodDoc.data()?.isDefault;

    // Marquer comme inactive au lieu de supprimer (pour garder l'historique)
    await updateDoc(paymentMethodRef, {
      isActive: false,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Si c'était la méthode par défaut, définir une nouvelle méthode par défaut
    if (isDefault) {
      const remainingMethods = await getPaymentMethods(userId);
      if (remainingMethods.length > 0) {
        await setDefaultPaymentMethod(userId, remainingMethods[0].id);
      }
    }
  } catch (error) {
    logger.error('Erreur lors de la suppression de la méthode de paiement:', error);
    throw error;
  }
};

export const setDefaultPaymentMethod = async (userId: string, paymentMethodId: string): Promise<void> => {
  try {
    // Désactiver toutes les méthodes par défaut
    const paymentMethodsRef = collection(db, 'users', userId, 'paymentMethods');
    const q = query(paymentMethodsRef, where('isDefault', '==', true));
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map((docSnap) => 
      updateDoc(docSnap.ref, { 
        isDefault: false, 
        updatedAt: Timestamp.fromDate(new Date()) 
      })
    );
    
    await Promise.all(updatePromises);

    // Activer la nouvelle méthode par défaut
    const defaultPaymentMethodRef = doc(db, 'users', userId, 'paymentMethods', paymentMethodId);
    await updateDoc(defaultPaymentMethodRef, { 
      isDefault: true, 
      updatedAt: Timestamp.fromDate(new Date()) 
    });
  } catch (error) {
    logger.error('Erreur lors de la définition de la méthode par défaut:', error);
    throw error;
  }
};

// ==========================================
// GESTION DU PORTEFEUILLE
// ==========================================

export const getWalletData = async (userId: string): Promise<WalletData | null> => {
  try {
    const walletRef = doc(db, 'users', userId, 'wallet', 'data');
    const walletDoc = await getDoc(walletRef);
    
    if (walletDoc.exists()) {
      const data = walletDoc.data();
      return {
        userId,
        balance: data.balance || 0,
        pendingEarnings: data.pendingEarnings || 0,
        totalEarnings: data.totalEarnings || 0,
        currency: data.currency || 'DOP',
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    }
    
    // Créer un portefeuille vide si n'existe pas
    const initialWallet: WalletData = {
      userId,
      balance: 0,
      pendingEarnings: 0,
      totalEarnings: 0,
      currency: 'DOP',
      lastUpdated: new Date(),
    };
    
    await setDoc(walletRef, {
      ...initialWallet,
      lastUpdated: Timestamp.fromDate(initialWallet.lastUpdated),
    });
    
    return initialWallet;
  } catch (error) {
    logger.error('Erreur lors de la récupération du portefeuille:', error);
    throw error;
  }
};

export const updateWalletBalance = async (userId: string, amount: number, type: 'add' | 'subtract'): Promise<void> => {
  try {
    const walletRef = doc(db, 'users', userId, 'wallet', 'data');
    const walletDoc = await getDoc(walletRef);
    
    if (!walletDoc.exists()) {
      throw new Error('Portefeuille non trouvé');
    }
    
    const currentBalance = walletDoc.data().balance || 0;
    const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;
    
    if (newBalance < 0) {
      throw new Error('Solde insuffisant');
    }
    
    await updateDoc(walletRef, {
      balance: newBalance,
      lastUpdated: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du solde:', error);
    throw error;
  }
};

// ==========================================
// GESTION DES TRANSACTIONS
// ==========================================

export const getRecentTransactions = async (userId: string, limit: number = 10): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const querySnapshot = await getDocs(transactionsRef);
    
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Transaction);
    });
    
    // Trier par date décroissante et limiter
    return transactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  } catch (error) {
    logger.error('Erreur lors de la récupération des transactions:', error);
    return [];
  }
};

export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const newDocRef = doc(transactionsRef);
    
    await setDoc(newDocRef, {
      ...transaction,
      userId,
      createdAt: Timestamp.fromDate(new Date()),
    });
    
    return newDocRef.id;
  } catch (error) {
    logger.error('Erreur lors de l\'ajout de la transaction:', error);
    throw error;
  }
};

// ==========================================
// PRÉFÉRENCES DE PAIEMENT
// ==========================================

export const getPaymentPreferences = async (userId: string): Promise<PaymentPreferences | null> => {
  try {
    const preferencesRef = doc(db, 'users', userId, 'preferences', 'payment');
    const preferencesDoc = await getDoc(preferencesRef);
    
    if (preferencesDoc.exists()) {
      const data = preferencesDoc.data();
      return {
        userId,
        autoWithdraw: data.autoWithdraw || false,
        autoWithdrawThreshold: data.autoWithdrawThreshold || 1000,
        autoWithdrawMethodId: data.autoWithdrawMethodId,
        requireConfirmation: data.requireConfirmation || true,
        paymentInstructions: data.paymentInstructions || '',
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Erreur lors de la récupération des préférences:', error);
    throw error;
  }
};

export const updatePaymentPreferences = async (userId: string, preferences: Partial<PaymentPreferences>): Promise<void> => {
  try {
    const preferencesRef = doc(db, 'users', userId, 'preferences', 'payment');
    await setDoc(preferencesRef, {
      userId,
      ...preferences,
      updatedAt: Timestamp.fromDate(new Date()),
    }, { merge: true });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour des préférences:', error);
    throw error;
  }
};

// ==========================================
// UTILITAIRES
// ==========================================

export const getPaymentMethodDisplayName = (paymentMethod: PaymentMethod): string => {
  switch (paymentMethod.type) {
    case 'card':
      const lastFour = paymentMethod.details.cardNumber?.slice(-4) || '****';
      return `${paymentMethod.details.cardType || 'Tarjeta'} **** ${lastFour}`;
    case 'bank_transfer':
      return `${paymentMethod.details.bankName} - ${paymentMethod.details.accountNumber?.slice(-4)}`;
    case 'cash':
      return `Efectivo - ${paymentMethod.details.preferredLocation || 'Ubicación por acordar'}`;
    case 'mobile_payment':
      return `${paymentMethod.details.provider} - ${paymentMethod.details.phoneNumber}`;
    default:
      return paymentMethod.name;
  }
};

export const getPaymentMethodIcon = (type: PaymentMethod['type']): string => {
  switch (type) {
    case 'bank_transfer':
      return 'business';
    case 'cash':
      return 'cash';
    case 'mobile_payment':
      return 'phone-portrait';
    case 'card':
      return 'card';
    default:
      return 'card';
  }
};

export const getPaymentMethodColor = (type: PaymentMethod['type']): string => {
  switch (type) {
    case 'bank_transfer':
      return '#059669';
    case 'cash':
      return '#eab308';
    case 'mobile_payment':
      return '#3b82f6';
    case 'card':
      return '#1a1f71';
    default:
      return '#6b7280';
  }
};

export const formatCurrency = (amount: number): string => {
  return `RD$${amount.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`;
};

export const getTransactionTypeLabel = (type: Transaction['type']): string => {
  switch (type) {
    case 'sale':
      return 'Venta';
    case 'purchase':
      return 'Compra';
    case 'withdrawal':
      return 'Retiro';
    case 'deposit':
      return 'Depósito';
    case 'refund':
      return 'Reembolso';
    default:
      return 'Transacción';
  }
};

export const getTransactionStatusLabel = (status: Transaction['status']): string => {
  switch (status) {
    case 'completed':
      return 'Completado';
    case 'processing':
      return 'Procesando';
    case 'failed':
      return 'Fallido';
    case 'cancelled':
      return 'Cancelado';
    default:
      return 'Desconocido';
  }
};

export const validatePaymentMethod = (paymentMethod: Partial<PaymentMethod>): string[] => {
  const errors: string[] = [];

  if (!paymentMethod.name || paymentMethod.name.trim() === '') {
    errors.push('El nombre es obligatorio');
  }

  if (!paymentMethod.type) {
    errors.push('El tipo de método de pago es obligatorio');
  }

  switch (paymentMethod.type) {
    case 'card':
      if (!paymentMethod.details?.cardNumber) errors.push('El número de tarjeta es obligatorio');
      if (!paymentMethod.details?.cardHolder) errors.push('El titular de la tarjeta es obligatorio');
      if (!paymentMethod.details?.expiry) errors.push('La fecha de expiración es obligatoria');
      break;
    case 'bank_transfer':
      if (!paymentMethod.details?.bankName) errors.push('El nombre del banco es obligatorio');
      if (!paymentMethod.details?.accountNumber) errors.push('El número de cuenta es obligatorio');
      if (!paymentMethod.details?.accountHolder) errors.push('El titular de la cuenta es obligatorio');
      break;
    case 'cash':
      if (!paymentMethod.details?.preferredLocation) errors.push('La ubicación preferida es obligatoria');
      break;
    case 'mobile_payment':
      if (!paymentMethod.details?.phoneNumber) errors.push('El número de teléfono es obligatorio');
      if (!paymentMethod.details?.provider) errors.push('El proveedor es obligatorio');
      break;
  }

  return errors;
};
