import { Product } from '../types'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocsFromServer,
} from 'firebase/firestore'
import { app } from '../firebaseConfig'

import { logger } from '../utils/logger'
/** Sous-titre affiché sous « No se pudieron cargar los productos » (sans consignes techniques). */
export function formatProductsLoadError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: string }).code)
      : ''
  const isOffline =
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    (error instanceof Error && /offline|network|unavailable/i.test(error.message))

  if (isOffline) {
    return 'No hay conexión a internet en este momento.'
  }
  return 'No fue posible conectar con el servidor.'
}

export async function getProducts(): Promise<Product[]> {
  try {
    logger.log('🔄 Récupération des produits depuis le serveur Firebase...')
    
    const db = getFirestore(app);
    const productsRef = collection(db, 'products');
    /** getDocsFromServer : pas de cache silencieux hors ligne (requis P1-3 / mode avion). */
    const snapshot = await getDocsFromServer(productsRef);
    
    const products: Product[] = [];
    
    for (const doc of snapshot.docs) {
      const productData = doc.data();
      logger.log('📦 Produit trouvé:', doc.id, productData.titulo || productData.title);
      
      // Vérification de sécurité des données
      if (!productData) {
        logger.warn('⚠️ Données de produit vides pour:', doc.id);
        continue;
      }
      
      // Transformer les données Firebase en format Product
      const product: Product = {
        id: doc.id,
        title: productData.titulo || productData.title || 'Sin título',
        price: productData.precio || productData.price || 0,
        originalPrice: productData.precioOriginal || productData.originalPrice,
        image: productData.images?.[0] || productData.image || '',
        images: productData.images || [productData.image || ''],
        condition: productData.condicionGeneral || productData.condicion || productData.condition || 'Usado',
        location: productData.ubicacion || productData.location || '',
        likes: typeof productData.favoriteCount === 'number' ? productData.favoriteCount : (productData.likes || 0),
        brand: productData.marca || productData.brand || '',
        category: productData.categoria || productData.category || '',
        subcategory: productData.subcategoria || productData.subcategory || '',
        description: productData.descripcion || productData.description || '',
        createdAt: productData.createdAt?.toDate() || new Date(),
        views: productData.views || 0,
        isLiked: false,
        
        // Stock et tailles
        stock: productData.stock || [],
        sizes: productData.stock?.map((s: any) => s.talla).filter(Boolean) || [],
        
        // Couleurs
        color: productData.color || [],
        colors: productData.color || [], // Alias pour compatibilité
        
        // Autres propriétés
        material: productData.material || '',
        estadoGeneral: productData.estadoGeneral || 0,
        estadoTelaMaterial: productData.estadoTelaMaterial || 0,
        notasSobreElEstado: productData.notasSobreElEstado || '',
        defectosEspecificos: productData.defectosEspecificos || '',
        autenticidad: productData.autenticidad || '',
        measurements: productData.measurements || {
          chest: '',
          waist: '',
          length: '',
          shoulders: '',
          hips: '',
          inseam: '',
        },
        tipoDeEntregaPermitida: productData.tipoDeEntregaPermitida || {
          envioAPuntoDeRecogida: false,
          recogidaEnPersona: false,
          envioADomicilio: false,
        },
        ciudadRecogidaEnPersona: productData.ciudadRecogidaEnPersona || '',
        ciudadesParaEnvioADomicilio: productData.ciudadesParaEnvioADomicilio || [],
        instruccionesParaEntrega: productData.instruccionesParaEntrega || '',
        shippingAvailable: productData.shippingAvailable || false,
        shippingPrice: productData.shippingPrice || '',
        province: productData.province || '',
        city: productData.city || '',
        accountType: productData.accountType || '',
        
        seller: {
          id: productData.userId || '',
          name: productData.vendedor?.name || 'Vendeur',
          lastname: productData.vendedor?.lastname || '',
          storeName: productData.vendedor?.storeName || '',
          username: productData.vendedor?.username || '@vendeur',
          avatar: productData.vendedor?.avatar || '',
          rating: productData.vendedor?.rating || 4.5,
          reviewCount: productData.vendedor?.reviewCount || 0,
          totalSales: productData.vendedor?.totalSales || 0,
          responseRate: productData.vendedor?.responseRate || 90,
          averageResponseTime: productData.vendedor?.averageResponseTime || "2 horas",
          memberSince: productData.vendedor?.memberSince || "2024",
          location: productData.vendedor?.location || productData.ubicacion || '',
          verified: productData.vendedor?.verified || false,
          badges: productData.vendedor?.badges || [],
          bio: productData.vendedor?.bio || '',
          stats: productData.vendedor?.stats || {
            thisMonth: {
              sales: 0,
              newListings: 0,
              responseTime: "2 horas",
            },
          },
          province: productData.vendedor?.province || '',
          city: productData.vendedor?.city || '',
          distance: productData.vendedor?.distance || undefined,
          accountType: productData.vendedor?.accountType || '',
        }
      };
      
      products.push(product);
    }
    
    logger.log(`✅ ${products.length} produits récupérés depuis Firebase`)
    return products;
    
  } catch (error) {
    logger.error('❌ Erreur lors de la récupération des produits:', error);
    throw error;
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    logger.log('🔍 Début getProduct pour ID:', id);
    logger.log('🔍 Type de ID:', typeof id);
    logger.log('🔍 ID est undefined?', id === undefined);
    logger.log('🔍 ID est null?', id === null);
    logger.log('🔍 ID est vide?', id === '');
    
    // Vérification de sécurité pour l'ID
    if (!id || typeof id !== 'string' || id.trim() === '') {
      logger.error('❌ ID de produit invalide:', id);
      return null;
    }
    
    const db = getFirestore(app);
    const productDoc = await getDoc(doc(db, 'products', id));
    
    if (!productDoc.exists()) {
      logger.log('❌ Produit non trouvé:', id);
      return null;
    }

    const productData = productDoc.data();
    logger.log('📦 Données brutes du produit depuis Firestore:', productData);
    
    // Récupérer les données de localité, type de compte et profil du vendeur depuis la collection users
    let userProvince = '';
    let userCity = '';
    let userAccountType = '';
    let sellerData = null;
    
    if (productData.userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', productData.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userProvince = userData.province || '';
          userCity = userData.city || '';
          userAccountType = userData.accountType || '';
          sellerData = userData; // Stocker toutes les données du vendeur
        }
      } catch (error) {
        logger.log('Erreur lors de la récupération des données utilisateur:', error);
      }
    }
    
    // Convertir les données Firestore en format Product
    const product: Product = {
      id: productDoc.id,
      title: productData.titulo || productData.title || '',
      price: Number(productData.precio) || Number(productData.price) || 0,
      condition: productData.condicionGeneral || productData.condition || '',
      location: productData.location || '',
      brand: productData.marca || productData.brand || '',
      image: productData.images?.[0] || productData.image || '',
      images: productData.images || [],
      description: productData.descripcion || productData.description || '',
      category: productData.categoria || productData.category || '',
      subcategory: productData.subcategoria || productData.subcategory || '',
      likes: typeof productData.favoriteCount === 'number' ? productData.favoriteCount : (productData.likes || 0),
      views: 0, // À implémenter plus tard
      isLiked: false, // À implémenter plus tard
      postedDate: (() => {
        try {
          if (productData.createdAt && productData.createdAt.toDate) {
            const date = new Date(productData.createdAt.toDate());
            if (date && !isNaN(date.getTime())) {
              return date.getFullYear().toString();
            }
          }
          return '';
        } catch (error) {
          logger.log('Erreur lors du formatage de postedDate:', error);
          return '';
        }
      })(),
      
      // Stock et tailles
      stock: productData.stock || [],
      sizes: productData.stock?.map((s: any) => s.talla).filter(Boolean) || [],
      
      // Couleurs
      color: productData.color || [],
      colors: productData.color || [], // Alias pour compatibilité
      
      // Autres propriétés
      material: productData.material || '',
      estadoGeneral: productData.estadoGeneral || 0,
      estadoTelaMaterial: productData.estadoTelaMaterial || 0,
      notasSobreElEstado: productData.notasSobreElEstado || '',
      defectosEspecificos: productData.defectosEspecificos || '',
      autenticidad: productData.autenticidad || '',
      measurements: productData.measurements || {
        chest: '',
        waist: '',
        length: '',
        shoulders: '',
        hips: '',
        inseam: '',
      },
      tipoDeEntregaPermitida: productData.tipoDeEntregaPermitida || {
        envioAPuntoDeRecogida: false,
        recogidaEnPersona: false,
        envioADomicilio: false,
      },
      ciudadRecogidaEnPersona: productData.ciudadRecogidaEnPersona || '',
      ciudadesParaEnvioADomicilio: productData.ciudadesParaEnvioADomicilio || [],
      instruccionesParaEntrega: productData.instruccionesParaEntrega || '',
      shippingAvailable: productData.shippingAvailable || false,
      shippingPrice: productData.shippingPrice || '',
      createdAt: (() => {
        try {
          if (productData.createdAt && productData.createdAt.toDate) {
            return productData.createdAt.toDate();
          }
          return new Date();
        } catch (error) {
          logger.log('Erreur lors du formatage de createdAt:', error);
          return new Date();
        }
      })(),
      province: userProvince,
      city: userCity,
      accountType: userAccountType,
      
      // Données du vendeur récupérées depuis la collection users
      seller: sellerData ? {
        id: productData.userId || '',
        name: sellerData.name || 'Vendeur',
        lastname: sellerData.lastname || '',
        storeName: sellerData.storeName || '',
        username: sellerData.username || '@vendeur',
        avatar: sellerData.avatar || "https://via.placeholder.com/80x80/4ade80/ffffff?text=V",
        rating: sellerData.rating || 4.5,
        reviewCount: sellerData.reviewCount || 0,
        totalSales: sellerData.totalSales || 0,
        responseRate: sellerData.responseRate || 90,
        averageResponseTime: sellerData.averageResponseTime || "2 horas",
        memberSince: (() => {
          if (sellerData.createdAt) {
            try {
              // Si createdAt est un Timestamp Firestore
              if (sellerData.createdAt && sellerData.createdAt.toDate) {
                try {
                  const date = new Date(sellerData.createdAt.toDate());
                  if (date && !isNaN(date.getTime())) {
                    return date.getFullYear().toString();
                  }
                } catch (error) {
                  logger.log('Erreur Timestamp Firestore:', error);
                }
              }
              // Si createdAt est déjà une Date
              if (sellerData.createdAt instanceof Date) {
                try {
                  return sellerData.createdAt.getFullYear().toString();
                } catch (error) {
                  logger.log('Erreur Date instance:', error);
                }
              }
              // Si createdAt est une string
              if (typeof sellerData.createdAt === 'string') {
                try {
                  const date = new Date(sellerData.createdAt);
                  if (date && !isNaN(date.getTime())) {
                    return date.getFullYear().toString();
                  }
                } catch (error) {
                  logger.log('Erreur string date:', error);
                }
              }
              // Si createdAt est un nombre (timestamp)
              if (typeof sellerData.createdAt === 'number') {
                try {
                  const date = new Date(sellerData.createdAt);
                  if (date && !isNaN(date.getTime())) {
                    return date.getFullYear().toString();
                  }
                } catch (error) {
                  logger.log('Erreur number date:', error);
                }
              }
            } catch (error) {
              logger.log('Erreur lors du formatage de la date createdAt:', error);
            }
          }
          return '2024';
        })(),
        location: productData.location || '',
        verified: sellerData.verified || false,
        badges: sellerData.badges || [
          { name: "Vendedor Verificado", type: "verified" },
          { name: "Respuesta Rápida", type: "fast_response" },
          { name: "Top Seller", type: "top_seller" },
        ],
        bio: sellerData.bio || "Amante de la moda vintage y sostenible. Vendiendo piezas únicas desde 2022. ✨",
        stats: sellerData.stats || {
          thisMonth: {
            sales: 12,
            newListings: 8,
            responseTime: "1.5 horas",
          },
        },
        province: sellerData.province || '',
        city: sellerData.city || '',
        distance: sellerData.distance || undefined,
        accountType: sellerData.accountType || '',
        geoPoint: sellerData.geoPoint ? {
          latitude: sellerData.geoPoint.latitude,
          longitude: sellerData.geoPoint.longitude
        } : undefined,
      } : {
        id: productData.userId || '',
        name: 'Vendeur',
        lastname: '',
        storeName: '',
        username: '@vendeur',
        avatar: "https://via.placeholder.com/80x80/4ade80/ffffff?text=V",
        rating: 4.5,
        reviewCount: 0,
        totalSales: 0,
        responseRate: 90,
        averageResponseTime: "2 horas",
        memberSince: "2024",
        location: productData.location || '',
        verified: false,
        badges: [
          { name: "Vendedor Verificado", type: "verified" },
          { name: "Respuesta Rápida", type: "fast_response" },
          { name: "Top Seller", type: "top_seller" },
        ],
        bio: "Amante de la moda vintage y sostenible. Vendiendo piezas únicas desde 2022. ✨",
        stats: {
          thisMonth: {
            sales: 12,
            newListings: 8,
            responseTime: "1.5 horas",
          },
        },
        province: '',
        city: '',
        distance: undefined,
        accountType: '',
      },
      conditionDetails: {
        overall: productData.condicionGeneral || "Nuevo",
        rating: productData.estadoGeneral || 5,
        details: [
          { aspect: "Tela", condition: "Perfecta", description: "Sin manchas, roturas o desgaste" },
          { aspect: "Cremallera", condition: "Perfecta", description: "Funciona perfectamente, sin problemas" },
          { aspect: "Costuras", condition: "Perfecta", description: "Todas las costuras intactas" },
          { aspect: "Etiquetas", condition: "Incluidas", description: "Etiqueta original de la marca presente" },
        ],
        photos: productData.images || [],
      },
    };

    logger.log('✅ Produit récupéré depuis Firestore:', product);
    return product;
    
  } catch (error) {
    logger.error('❌ Erreur lors de la récupération du produit:', error);
    logger.error('❌ Stack trace:', (error as Error).stack);
    return null;
  }
} 