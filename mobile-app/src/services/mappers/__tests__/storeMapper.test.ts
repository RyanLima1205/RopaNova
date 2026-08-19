// Couverture Phase 2 (REFONTE_STOREFRONT.md) : compte boutique complet, compte privé,
// document minimal, isOwner, slug (accents, ponctuation, fallback), username non nettoyé,
// entrées null/undefined.
// Couverture Phase 3 : plan résolu (start/pro/elite), plafond 'start' pour les comptes
// privés, storefront.sections filtrées et ordonnées par SECTIONS_BY_PLAN.

import { mapToStoreDetail, slugify, SECTIONS_BY_PLAN } from '../storeMapper'

describe('mapToStoreDetail', () => {
  describe('compte boutique complet', () => {
    const rawComplet = {
      accountType: 'fisica',
      storeName: 'Zapatería Peña',
      name: 'Carlos',
      lastname: 'Peña',
      username: 'zapapena',
      avatar: 'https://avatar/zapapena.jpg',
      coverImage: 'https://cover/zapapena.jpg',
      verified: true,
      bio: 'La mejor zapatería de Santiago',
      city: 'Santiago',
      province: 'Santiago',
      rating: 4.7,
      reviewCount: 30,
      totalSales: 120,
      responseRate: 92,
      averageResponseTime: 'menos de 1 hora',
      createdAt: { toDate: () => new Date('2021-03-10T00:00:00.000Z') },
    }

    it('mappe identity, stats, delivery, socials et storefront', () => {
      const result = mapToStoreDetail(rawComplet, 'zapapena-uid', 'otro-usuario', {
        productCount: 15,
        followerCount: 40,
      })

      expect(result.identity).toEqual({
        id: 'zapapena-uid',
        kind: 'store',
        plan: 'start', // rawComplet ne renseigne pas plan → défaut 'start'
        name: 'Zapatería Peña',
        username: 'zapapena',
        slug: 'zapateria-pena',
        tagline: undefined,
        description: 'La mejor zapatería de Santiago',
        logo: 'https://avatar/zapapena.jpg',
        cover: 'https://cover/zapapena.jpg',
        verified: true,
        physicalStore: true,
        city: 'Santiago',
        province: 'Santiago',
        memberSince: 2021,
      })

      expect(result.stats).toEqual({
        rating: 4.7,
        reviewCount: 30,
        followerCount: 40,
        salesCount: 120,
        productCount: 15,
        responseRate: 92,
        responseTime: 'menos de 1 hora',
      })

      expect(result.delivery).toEqual({
        homeDelivery: false,
        storePickup: false,
        pickupPoint: false,
        returnPolicy: undefined,
      })

      expect(result.socials).toEqual({
        instagram: undefined,
        whatsapp: undefined,
        tiktok: undefined,
        website: undefined,
      })

      expect(result.storefront).toEqual({
        sections: ['PRODUCTS', 'INFO'], // plan 'start' (défaut)
        theme: { preset: 'minimal', accent: 'blue', font: 'moderna' },
        hero: undefined,
        featuredProductIds: [],
        collections: [],
        promoText: undefined,
      })

      expect(result.isOwner).toBe(false)
    })
  })

  describe('compte privé', () => {
    it("kind 'private' et pas de HERO dans sections", () => {
      const raw = {
        accountType: 'privado',
        name: 'Ana',
        lastname: 'Gómez',
        username: 'ana_g',
      }

      const result = mapToStoreDetail(raw, 'ana-uid', 'otro', { productCount: 3, followerCount: 0 })

      expect(result.identity.kind).toBe('private')
      expect(result.identity.physicalStore).toBe(false)
      expect(result.storefront.hero).toBeUndefined()
      expect(result.storefront.sections).not.toContain('HERO')
    })
  })

  describe('plan', () => {
    it("compte START (défaut) → plan 'start', sections ['PRODUCTS', 'INFO']", () => {
      const raw = { accountType: 'virtual', storeName: 'Tienda Base' }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })

      expect(result.identity.plan).toBe('start')
      expect(result.storefront.sections).toEqual(['PRODUCTS', 'INFO'])
    })

    it("compte privado avec plan 'elite' en base → forcé à 'start'", () => {
      const raw = { accountType: 'privado', name: 'Ana', plan: 'elite' }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })

      expect(result.identity.kind).toBe('private')
      expect(result.identity.plan).toBe('start')
      expect(result.storefront.sections).toEqual(SECTIONS_BY_PLAN.start)
    })

    it("compte virtual avec plan 'pro' → sections de PRO, dans l'ordre du plan", () => {
      const raw = { accountType: 'virtual', storeName: 'Tienda Pro', plan: 'pro' }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })

      expect(result.identity.plan).toBe('pro')
      expect(result.storefront.sections).toEqual(SECTIONS_BY_PLAN.pro)
      expect(result.storefront.sections).toEqual(['FEATURED', 'NEW_ARRIVALS', 'PRODUCTS', 'REVIEWS', 'INFO'])
    })

    it("compte virtual avec plan 'elite' → sections de ELITE, dans l'ordre du plan", () => {
      const raw = { accountType: 'virtual', storeName: 'Tienda Elite', plan: 'elite' }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })

      expect(result.identity.plan).toBe('elite')
      expect(result.storefront.sections).toEqual(SECTIONS_BY_PLAN.elite)
      expect(result.storefront.sections).toEqual([
        'HERO', 'FEATURED', 'COLLECTIONS', 'PROMO', 'NEW_ARRIVALS', 'PRODUCTS', 'REVIEWS', 'INFO',
      ])
    })

    it("userRaw.plan absent → 'start'", () => {
      const raw = { accountType: 'fisica', storeName: 'Tienda Sin Plan' }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })
      expect(result.identity.plan).toBe('start')
    })

    it("userRaw.plan invalide → 'start'", () => {
      const raw = { accountType: 'virtual', storeName: 'Tienda X', plan: 'super-deluxe' }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })
      expect(result.identity.plan).toBe('start')
      expect(result.storefront.sections).toEqual(['PRODUCTS', 'INFO'])
    })
  })

  describe('document minimal (nom seulement)', () => {
    it('ne throw jamais et applique des valeurs par défaut sûres', () => {
      const raw = { name: 'Pedro' }

      const result = mapToStoreDetail(raw, 'pedro-uid', 'otro', { productCount: 0, followerCount: 0 })

      expect(result.identity).toEqual({
        id: 'pedro-uid',
        kind: 'private',
        plan: 'start',
        name: 'Pedro',
        username: undefined,
        slug: 'pedro',
        tagline: undefined,
        description: undefined,
        logo: '',
        cover: undefined,
        verified: false,
        physicalStore: false,
        city: undefined,
        province: undefined,
        memberSince: 1970,
      })
      expect(result.stats).toEqual({
        rating: 0,
        reviewCount: 0,
        followerCount: 0,
        salesCount: 0,
        productCount: 0,
        responseRate: 0,
        responseTime: '',
      })
      expect(result.delivery.homeDelivery).toBe(false)
      expect(result.socials.instagram).toBeUndefined()
    })
  })

  describe('isOwner', () => {
    it('true quand viewerId === storeId', () => {
      const result = mapToStoreDetail({ name: 'Luis' }, 'u1', 'u1', { productCount: 0, followerCount: 0 })
      expect(result.isOwner).toBe(true)
    })

    it('false quand viewerId diffère', () => {
      const result = mapToStoreDetail({ name: 'Luis' }, 'u1', 'u2', { productCount: 0, followerCount: 0 })
      expect(result.isOwner).toBe(false)
    })
  })

  describe('slug', () => {
    it('depuis storeName avec accents et espaces', () => {
      const raw = { accountType: 'fisica', storeName: 'Zapatería Peña' }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })
      expect(result.identity.slug).toBe('zapateria-pena')
    })

    it('depuis storeName avec ponctuation', () => {
      const raw = { accountType: 'virtual', storeName: "Ryan's Boutique & Co." }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })
      expect(result.identity.slug).toBe('ryans-boutique-co')
    })

    it('storeName vide → slug depuis identity.name', () => {
      const raw = { accountType: 'fisica', storeName: '', name: 'Luis', lastname: 'Fernández' }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })
      expect(result.identity.name).toBe('Luis Fernández')
      expect(result.identity.slug).toBe('luis-fernandez')
    })

    // identity.name retombe toujours sur "Vendedor" en pratique (jamais vide) — ce test
    // couvre donc directement le comportement de undefined de l'utilitaire slugify.
    it('chaîne vide → undefined', () => {
      expect(slugify('')).toBeUndefined()
      expect(slugify('   ')).toBeUndefined()
    })
  })

  describe('username', () => {
    it("un username ancien avec point est lu tel quel, sans nettoyage", () => {
      const raw = { name: 'Ryan', username: 'ryan.1205' }
      const result = mapToStoreDetail(raw, 'u1', 'u2', { productCount: 0, followerCount: 0 })
      expect(result.identity.username).toBe('ryan.1205')
    })
  })

  describe('entrées invalides', () => {
    it('ne throw jamais avec null/undefined/valeurs non-objet', () => {
      expect(() => mapToStoreDetail(null, 'u1', 'u1', { productCount: 0, followerCount: 0 })).not.toThrow()
      expect(() => mapToStoreDetail(undefined, '', '', { productCount: 0, followerCount: 0 })).not.toThrow()
      expect(() => mapToStoreDetail('not-an-object', 'u1', 'u2', { productCount: 0, followerCount: 0 })).not.toThrow()
      expect(() => mapToStoreDetail(42, undefined as unknown as string, null as unknown as string, {
        productCount: 0,
        followerCount: 0,
      })).not.toThrow()
    })

    it('userId vide → id vide et isOwner false', () => {
      const result = mapToStoreDetail({ name: 'X' }, '', '', { productCount: 0, followerCount: 0 })
      expect(result.identity.id).toBe('')
      expect(result.isOwner).toBe(false)
    })
  })
})
