import { Category } from '../types'

export const categories: Category[] = [
  {
    id: '1',
    name: 'Todo',
    icon: 'grid-outline',
  },
  {
    id: '2',
    name: 'Mujer',
    icon: 'woman-outline',
    subcategories: [
      { id: '2.1', name: 'Vestidos', parentId: '2' },
      { id: '2.2', name: 'Pantalones', parentId: '2' },
      { id: '2.3', name: 'Zapatos', parentId: '2' },
      { id: '2.4', name: 'Blusas', parentId: '2' },
      { id: '2.5', name: 'T-shirts', parentId: '2' },
      { id: '2.6', name: 'Faldas', parentId: '2' },
      { id: '2.7', name: 'Shorts', parentId: '2' },
      { id: '2.8', name: 'Licras', parentId: '2' },
      { id: '2.9', name: 'Fajas', parentId: '2' },
      { id: '2.10', name: 'Trajes de Baño', parentId: '2' },
      { id: '2.11', name: 'Accesorios', parentId: '2' },
      { id: '2.12', name: 'Lencerias', parentId: '2' },
      { id: '2.13', name: 'Ropa Interior', parentId: '2' },
      { id: '2.14', name: 'Camisas', parentId: '2' },
      { id: '2.15', name: 'Deportivas', parentId: '2' },
      { id: '2.16', name: 'Uniformes', parentId: '2' },
    ],
  },
  {
    id: '3',
    name: 'Hombre',
    icon: 'man-outline',
    subcategories: [
      { id: '3.1', name: 'T-shirts', parentId: '3' },
      { id: '3.2', name: 'Camisas', parentId: '3' },
      { id: '3.3', name: 'Poloches', parentId: '3' },
      { id: '3.4', name: 'Pantalones', parentId: '3' },
      { id: '3.5', name: 'Shorts', parentId: '3' },
      { id: '3.6', name: 'Zapatos', parentId: '3' },
      { id: '3.7', name: 'Abrigos', parentId: '3' },
      { id: '3.8', name: 'Deportiva', parentId: '3' },
      { id: '3.9', name: 'Accesorios', parentId: '3' },
      { id: '3.10', name: 'Trajes de Baño', parentId: '3' },
      { id: '3.11', name: 'Gorras', parentId: '3' },
      { id: '3.12', name: 'Franelas', parentId: '3' },
      { id: '3.13', name: 'Deportivas', parentId: '3' },
      { id: '3.14', name: 'Uniformes', parentId: '3' },
    ],
  },
  {
    id: '4',
    name: 'Niño',
    icon: 'people-outline',
    subcategories: [
      { id: '4.1', name: 'Ropa de Bebé (0-24 meses)', parentId: '4' },
      { id: '4.2', name: 'Ropa de Niña (2-12 años)', parentId: '4' },
      { id: '4.3', name: 'Ropa de Niño (2-12 años)', parentId: '4' },
      { id: '4.4', name: 'Zapatos Infantiles', parentId: '4' },
      { id: '4.5', name: 'Juguetes y Juegos', parentId: '4' },
      { id: '4.6', name: 'Accesorios Infantiles', parentId: '4' },
      { id: '4.7', name: 'Artículos Deportivos Infantiles', parentId: '4' },
      { id: '4.8', name: 'Disfraces', parentId: '4' },
    ],
  },
]

export const getSubcategories = (categoryId: string) => {
  const category = categories.find(cat => cat.id === categoryId)
  return category?.subcategories || []
}

export const getCategoryName = (categoryId: string) => {
  const category = categories.find(cat => cat.id === categoryId)
  return category?.name || ''
}

export const getSubcategoryName = (categoryId: string, subcategoryId: string) => {
  const category = categories.find(cat => cat.id === categoryId)
  const subcategory = category?.subcategories?.find(sub => sub.id === subcategoryId)
  return subcategory?.name || ''
} 