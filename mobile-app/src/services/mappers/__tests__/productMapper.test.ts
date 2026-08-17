// Couverture Phase 2 (REFONTE_PRODUCT_PAGE.md) : document complet, document
// minimal, precio de livraison invalide → null, startingPrice = minimum réel.

import { mapToProductDetail } from '../productMapper'

describe('mapToProductDetail', () => {
  describe('document complet', () => {
    const rawComplet = {
      id: 'prod-1',
      userId: 'user-1',
      titulo: 'Poloche Negro',
      precio: '450',
      precioOriginal: '800',
      descripcion: 'Poloche de algodón premium',
      categoria: 'Hombre',
      subcategoria: 'Poloches',
      marca: 'Nike',
      material: '100% Algodón',
      color: ['Negro', 'Blanco'],
      condicionGeneral: 'Nuevo',
      images: ['https://img/1.jpg', '', 'https://img/2.jpg'],
      stock: [
        { talla: 'M', cantidad: 3 },
        { talla: 'L', cantidad: 0 },
      ],
      createdAt: { toDate: () => new Date('2024-01-15T00:00:00.000Z') },
      tipoDeEntregaPermitida: {
        envioADomicilio: true,
        recogidaEnPersona: true,
        envioAPuntoDeRecogida: false,
      },
      ciudadRecogidaEnPersona: 'Santiago',
      ciudadesParaEnvioADomicilio: [
        { ciudad: 'Santo Domingo', precio: '300' },
        { ciudad: 'Santiago', precio: '150' },
        { ciudad: 'Puerto Plata', precio: '' },
      ],
      instruccionesParaEntrega: 'Coordinar por chat',
      productSummary: { views: 120, likes: 8, cartAdds: 2, shares: 1 },
    }

    const sellerRawComplet = {
      storeName: 'Men Fashion Store',
      name: 'Carlos',
      lastname: 'Pérez',
      avatar: 'https://avatar/carlos.jpg',
      verified: true,
      accountType: 'fisica',
      rating: 4.8,
      reviewCount: 27,
      totalSales: 150,
      itemsCount: 42,
      responseRate: 95,
      averageResponseTime: 'menos de 1 hora',
      createdAt: { toDate: () => new Date('2022-06-01T00:00:00.000Z') },
      city: 'Santiago',
      province: 'Santiago',
    }

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2024-02-01T00:00:00.000Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('mappe info, pricing, gallery et variants', () => {
      const result = mapToProductDetail(rawComplet, sellerRawComplet)

      expect(result.info).toEqual({
        id: 'prod-1',
        title: 'Poloche Negro',
        description: 'Poloche de algodón premium',
        brand: 'Nike',
        category: 'Hombre',
        subcategory: 'Poloches',
        material: '100% Algodón',
        color: 'Negro',
        condition: 'Nuevo',
        createdAt: '2024-01-15T00:00:00.000Z',
      })

      expect(result.gallery).toEqual(['https://img/1.jpg', 'https://img/2.jpg'])

      expect(result.pricing).toEqual({
        price: 450,
        originalPrice: 800,
        discountPercent: 44,
        currency: 'DOP',
      })

      expect(result.variants).toEqual([
        { size: 'M', quantity: 3, available: true },
        { size: 'L', quantity: 0, available: false },
      ])
    })

    it('mappe le vendeur avec storeName pour un compte física', () => {
      const result = mapToProductDetail(rawComplet, sellerRawComplet)

      expect(result.seller).toEqual({
        id: 'user-1',
        storeName: 'Men Fashion Store',
        avatar: 'https://avatar/carlos.jpg',
        verified: true,
        accountType: 'fisica',
        rating: 4.8,
        reviewCount: 27,
        salesCount: 150,
        itemsCount: 42,
        responseRate: 95,
        responseTime: 'menos de 1 hora',
        memberSince: 2022,
        city: 'Santiago',
        province: 'Santiago',
      })
    })

    it('mappe la livraison, le marketing et les analytics', () => {
      const result = mapToProductDetail(rawComplet, sellerRawComplet)

      expect(result.delivery.homeDelivery).toEqual({
        available: true,
        cities: [
          { name: 'Santo Domingo', price: 300 },
          { name: 'Santiago', price: 150 },
          { name: 'Puerto Plata', price: null },
        ],
        startingPrice: 150,
      })
      expect(result.delivery.storePickup).toEqual({ available: true, city: 'Santiago' })
      expect(result.delivery.pickupPoint).toEqual({ available: false, price: null })
      expect(result.delivery.instructions).toBe('Coordinar por chat')

      expect(result.marketing).toEqual({
        protectedPurchase: true,
        featured: false,
        recommended: false,
        newArrival: false,
        bestSeller: false,
        fastSelling: false,
      })

      expect(result.analytics).toEqual({
        views: 120,
        likes: 8,
        cartAdds: 2,
        shares: 1,
        createdDaysAgo: 17, // 2024-01-15 → 2024-02-01 (horloge figée ci-dessus)
      })
    })
  })

  describe('document minimal (uniquement title + price)', () => {
    const rawMinimal = {
      id: 'prod-2',
      titulo: 'Camisa',
      precio: '200',
    }

    it('ne throw jamais et applique des valeurs par défaut sûres', () => {
      const result = mapToProductDetail(rawMinimal, {})

      expect(result.info).toEqual({
        id: 'prod-2',
        title: 'Camisa',
        description: '',
        brand: undefined,
        category: '',
        subcategory: undefined,
        material: undefined,
        color: undefined,
        condition: '',
        createdAt: new Date(0).toISOString(),
      })

      expect(result.gallery).toEqual([''])
      expect(result.pricing).toEqual({
        price: 200,
        originalPrice: undefined,
        discountPercent: undefined,
        currency: 'DOP',
      })
      expect(result.variants).toEqual([])

      expect(result.seller).toEqual({
        id: '',
        storeName: 'Vendedor',
        avatar: '',
        verified: false,
        accountType: 'privado',
        rating: 0,
        reviewCount: 0,
        salesCount: 0,
        itemsCount: 0,
        responseRate: 0,
        responseTime: '',
        memberSince: 1970,
        city: undefined,
        province: undefined,
      })

      expect(result.delivery).toEqual({
        homeDelivery: { available: false, cities: [], startingPrice: null },
        storePickup: { available: false, city: undefined },
        pickupPoint: { available: false, price: null },
        instructions: undefined,
      })

      expect(result.marketing.protectedPurchase).toBe(true)
      expect(result.analytics).toEqual({
        views: 0,
        likes: 0,
        cartAdds: 0,
        shares: 0,
        createdDaysAgo: expect.any(Number),
      })
    })

    it('ne throw jamais même avec des entrées nulles/indéfinies', () => {
      expect(() => mapToProductDetail(null, undefined)).not.toThrow()
      expect(() => mapToProductDetail(undefined, null)).not.toThrow()
      expect(() => mapToProductDetail('not-an-object', 42)).not.toThrow()
    })
  })

  describe('precio de livraison vide ou non numérique → null', () => {
    it.each([
      ['', null],
      ['abc', null],
      [undefined, null],
      [null, null],
      ['250', 250],
      ['0', 0],
    ])('precio=%p → price=%p', (precio, expected) => {
      const raw = {
        titulo: 'Test',
        precio: '100',
        ciudadesParaEnvioADomicilio: [{ ciudad: 'Ciudad X', precio }],
      }
      const result = mapToProductDetail(raw, {})
      expect(result.delivery.homeDelivery.cities).toEqual([{ name: 'Ciudad X', price: expected }])
    })
  })

  describe('startingPrice = minimum des villes, pas la première', () => {
    it("prend le minimum même si ce n'est pas la première ville", () => {
      const raw = {
        titulo: 'Test',
        precio: '100',
        ciudadesParaEnvioADomicilio: [
          { ciudad: 'A', precio: '500' },
          { ciudad: 'B', precio: '100' },
          { ciudad: 'C', precio: '300' },
        ],
      }
      const result = mapToProductDetail(raw, {})
      expect(result.delivery.homeDelivery.startingPrice).toBe(100)
    })

    it('ignore les villes sans prix (A coordinar) dans le calcul du minimum', () => {
      const raw = {
        titulo: 'Test',
        precio: '100',
        ciudadesParaEnvioADomicilio: [
          { ciudad: 'A', precio: '' },
          { ciudad: 'B', precio: '400' },
          { ciudad: 'C', precio: 'no-numero' },
        ],
      }
      const result = mapToProductDetail(raw, {})
      expect(result.delivery.homeDelivery.startingPrice).toBe(400)
    })

    it('retourne null si aucune ville n\'a de prix', () => {
      const raw = {
        titulo: 'Test',
        precio: '100',
        ciudadesParaEnvioADomicilio: [
          { ciudad: 'A', precio: '' },
          { ciudad: 'B', precio: 'no-numero' },
        ],
      }
      const result = mapToProductDetail(raw, {})
      expect(result.delivery.homeDelivery.startingPrice).toBeNull()
    })

    it('retourne null si aucune ville n\'est renseignée', () => {
      const raw = { titulo: 'Test', precio: '100' }
      const result = mapToProductDetail(raw, {})
      expect(result.delivery.homeDelivery.startingPrice).toBeNull()
      expect(result.delivery.homeDelivery.cities).toEqual([])
    })
  })
})
