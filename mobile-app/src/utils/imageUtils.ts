import { logger } from './logger'
/**
 * Utilitaires pour la gestion des images
 */

/**
 * Vérifie si une URL d'image est valide et accessible
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  const trimmed = url.trim();
  
  // Vérifier si c'est une URL vide ou invalide
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
    return false;
  }
  
  // Vérifier si c'est un chemin local (ne fonctionne pas dans Expo Go)
  if (trimmed.startsWith('file://')) {
    return false;
  }
  
  // Vérifier si c'est une URL HTTP/HTTPS valide
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }
  
  // Vérifier si c'est une URL Firebase Storage
  if (trimmed.includes('firebasestorage.googleapis.com')) {
    return true;
  }
  
  return false;
};

/**
 * Filtre un tableau d'images pour ne garder que les URLs valides
 */
export const filterValidImages = (images: string[]): string[] => {
  if (!Array.isArray(images)) return [];
  
  return images.filter(img => isValidImageUrl(img));
};

/**
 * Obtient la première image valide d'un tableau
 */
export const getFirstValidImage = (images: string[]): string | null => {
  const validImages = filterValidImages(images);
  return validImages.length > 0 ? validImages[0] : null;
};

/**
 * Génère une URL d'image de placeholder
 */
export const getPlaceholderImage = (width: number = 400, height: number = 400, text: string = 'Sin Imagen'): string => {
  // Utiliser un placeholder local au lieu de via.placeholder.com
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `)}`;
};

/**
 * Vérifie si une image est un placeholder
 */
export const isPlaceholderImage = (url: string): boolean => {
  return url.includes('via.placeholder.com') || url.includes('placeholder') || url.startsWith('data:image/svg+xml');
};

/**
 * Nettoie les données d'images d'un produit
 */
export const cleanProductImages = (product: any): string[] => {
  if (!product) return [];
  
  // Essayer différents champs d'images
  const imageFields = ['images', 'imagenes', 'imageUrls', 'photos'];
  let allImages: string[] = [];
  
  for (const field of imageFields) {
    if (product[field] && Array.isArray(product[field])) {
      allImages = [...allImages, ...product[field]];
    }
  }
  
  // Filtrer et nettoyer les images
  const validImages = filterValidImages(allImages);
  
  // Si aucune image valide, retourner un placeholder
  if (validImages.length === 0) {
    return [getPlaceholderImage(400, 400, product.title || product.titulo || 'Sin Imagen')];
  }
  
  return validImages;
};

/**
 * URL d’avatar depuis un document Firestore `users` (chaîne vide si aucune URL utilisable).
 */
export const getUserDocumentAvatarUrl = (data: Record<string, unknown> | null | undefined): string => {
  if (!data) return ''
  const candidates = [data.avatar, data.profileImage, data.photoURL]
  for (const c of candidates) {
    const s = String(c ?? '').trim()
    if (isValidImageUrl(s)) return s
  }
  return ''
}

/**
 * Obtient l'image de profil de l'utilisateur ou un placeholder
 */
export const getUserAvatar = (user: any): string => {
  if (!user) {
    logger.log('🔍 getUserAvatar - user is null/undefined');
    return getPlaceholderImage(100, 100, 'Usuario');
  }
  
  const avatar = user.avatar || user.profileImage || user.photoURL;
  logger.log('🔍 getUserAvatar - user:', user.name, 'avatar:', avatar);
  
  if (isValidImageUrl(avatar)) {
    logger.log('✅ getUserAvatar - avatar valide:', avatar);
    return avatar;
  }
  
  logger.log('❌ getUserAvatar - avatar invalide, utilisation placeholder');
  return getPlaceholderImage(100, 100, user.name || user.displayName || 'Usuario');
};

/**
 * Obtient l'image de couverture ou un placeholder
 */
export const getUserCover = (user: any): string => {
  if (!user) return getPlaceholderImage(400, 200, 'Portada');
  
  const cover = user.coverImage || user.coverPhoto || user.banner;
  
  if (isValidImageUrl(cover)) {
    return cover;
  }
  
  return getPlaceholderImage(400, 200, 'Portada');
};
