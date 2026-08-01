export interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number
  image: string
  condition: string
  location: string
  likes: number
  brand?: string
  category?: string
  subcategory?: string
  description?: string
  images?: string[]
  seller?: Seller
  postedDate?: string
  views?: number
  isLiked?: boolean
  conditionDetails?: ConditionDetails

  material?: string
  color?: string[]
  colors?: string[]
  sizes?: string[]
  estadoGeneral?: number
  estadoTelaMaterial?: number
  notasSobreElEstado?: string
  defectosEspecificos?: string
  autenticidad?: string
  stock?: Array<{ talla: string; cantidad: number }>
  measurements?: {
    chest: string
    waist: string
    length: string
    shoulders: string
    hips: string
    inseam: string
  }
  tipoDeEntregaPermitida?: {
    envioAPuntoDeRecogida: boolean
    recogidaEnPersona: boolean
    envioADomicilio: boolean
  }
  ciudadRecogidaEnPersona?: string
  ciudadesParaEnvioADomicilio?: Array<{ ciudad: string; precio: string }>
  instruccionesParaEntrega?: string
  shippingAvailable?: boolean
  shippingPrice?: string
  createdAt?: Date
  province?: string
  city?: string
  accountType?: string
}

export interface Seller {
  id: string
  name: string
  lastname: string
  storeName?: string
  username: string
  avatar: string
  rating: number
  reviewCount: number
  totalSales: number
  responseRate: number
  averageResponseTime: string
  memberSince: string
  location: string
  verified: boolean
  badges: Array<{ name: string; type: string }>
  bio: string
  stats: {
    thisMonth: {
      sales: number
      newListings: number
      responseTime: string
    }
  }
  province?: string
  city?: string
  distance?: number
  accountType?: string
  geoPoint?: {
    latitude: number
    longitude: number
  }
}

export interface ConditionDetails {
  overall: string
  rating: number
  details: Array<{
    aspect: string
    condition: string
    description: string
  }>
  photos: string[]
}

export interface Category {
  id: string
  name: string
  icon?: string
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id: string
  name: string
  parentId: string
}

export interface Review {
  id: string
  buyerName: string
  buyerAvatar: string
  rating: number
  date: string
  verified: boolean
  productTitle: string
  comment: string
  photos: string[]
  helpful: number
  categories?: {
    comunicacion?: number
    descripcion?: number
    envio?: number
    calidad?: number
  }
  sellerResponse?: string
  sellerResponseDate?: string
  sellerAvatar?: string
}
