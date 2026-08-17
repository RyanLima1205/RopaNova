# RopaNova — Refonte de la fiche produit (V1)

> Document de travail à placer à la racine du repo (ou dans `/docs`).
> Il sert de **source de vérité** pour l'agent Claude dans Cursor.
> Chaque phase contient un prompt prêt à coller. **Ne pas sauter de phase.**

---

## 0. Contexte et règles du jeu

**Objectif** : passer d'une fiche produit "annonce Vinted" à une fiche produit "mini-page de marque",
adaptée à des boutiques professionnelles payantes.

**Ordre de travail imposé** : modèle de données → service → UI → features premium.

**Règles pour l'agent :**

1. Ne jamais modifier `ProductDetailScreen.tsx` avant la Phase 3.
2. Aucune régression : `getProduct()` reste le point d'entrée public, la signature ne change pas.
3. Les anciens champs Firestore existent encore en base — on **mappe**, on ne migre pas la base en V1.
4. Chaque composant UI ≤ 200 lignes, une seule responsabilité, aucune requête Firestore à l'intérieur.
5. Espagnol pour tout texte visible par l'utilisateur. Commentaires de code en français.
6. `brandColors` depuis `../theme` — jamais de bleu en dur.
7. TypeScript strict : pas de `any`, pas de `!` non justifié.

**Ce qui disparaît en V1 :**

- ❌ Section « Estado del producto » + `ConditionModal`
- ❌ `estadoGeneral`, `estadoTelaMaterial`, `notasSobreElEstado`, `defectosEspecificos`
- ❌ Les gros blocs bleus de livraison (`availabilityWarning`, `pickupInfo`, listes de villes visibles)
- ❌ La liste `Detalles` toujours dépliée

**Ce qui apparaît :**

- ✅ Preuve sociale sous le titre (note boutique, ventes, vérification)
- ✅ Bloc confiance compact (Compra Protegida / Entrega / Devolución)
- ✅ Livraison racontée : « ¿Cómo puedes recibirlo? »
- ✅ Détails en accordéon
- ✅ Carte boutique enrichie
- ✅ « También podría gustarte »
- ✅ CTA `Comprar ahora` dominant, prix en sous-titre

---

## Phase 1 — Le modèle de données

### Fichier cible : `src/types/product.ts`

```ts
// ============================================================
// RopaNova — Modèle de la fiche produit (V1)
// Construit autour de l'EXPÉRIENCE D'ACHAT, pas du formulaire
// de publication. Toute donnée non affichée n'a pas sa place ici.
// ============================================================

export type AccountType = 'privado' | 'virtual' | 'fisica'

/** Résumé vendeur : la fiche produit ne doit JAMAIS aller chercher 25 champs. */
export interface SellerSummary {
  id: string
  storeName: string          // déjà résolu côté service (storeName ou "Prénom Nom")
  avatar: string
  verified: boolean
  accountType: AccountType
  rating: number             // 0–5
  reviewCount: number
  salesCount: number
  itemsCount: number
  responseRate: number       // 0–100
  responseTime: string       // "menos de 1 hora"
  memberSince: number        // année, ex: 2022
  city?: string
  province?: string
}

export interface DeliveryCity {
  name: string
  price: number | null       // null = "A coordinar"
}

export interface HomeDelivery {
  available: boolean
  cities: DeliveryCity[]
  startingPrice: number | null
  estimatedTime?: string     // "1–3 días"
}

export interface StorePickup {
  available: boolean
  city?: string
  address?: string
  note?: string              // "Acordar con el vendedor"
}

export interface PickupPoint {
  available: boolean
  price: number | null
  estimatedTime?: string
}

export interface ProductDelivery {
  homeDelivery: HomeDelivery
  storePickup: StorePickup
  pickupPoint: PickupPoint
  instructions?: string
}

/** Champs marketing : certains ne servent pas encore, ils sont là pour dans 6 mois. */
export interface ProductMarketing {
  protectedPurchase: boolean
  returnPolicy?: string      // "Devolución según política de la tienda"
  featured: boolean
  recommended: boolean
  newArrival: boolean
  bestSeller: boolean
  fastSelling: boolean
}

/** Compteurs dénormalisés — jamais calculés à la lecture. */
export interface ProductAnalytics {
  views: number
  likes: number
  cartAdds: number
  shares: number
  createdDaysAgo: number
}

export interface ProductVariant {
  size: string
  quantity: number
  available: boolean
}

export interface ProductPricing {
  price: number
  originalPrice?: number
  discountPercent?: number   // calculé côté service
  currency: 'DOP'
}

export interface ProductBasicInfo {
  id: string
  title: string
  description: string
  brand?: string
  category: string
  subcategory?: string
  material?: string
  color?: string
  condition: string          // conservé, mais affiché comme simple chip
  createdAt: string          // ISO
}

/** Le modèle consommé par l'UI. Un seul objet, prêt à afficher. */
export interface ProductDetail {
  info: ProductBasicInfo
  gallery: string[]
  pricing: ProductPricing
  variants: ProductVariant[]
  seller: SellerSummary
  delivery: ProductDelivery
  marketing: ProductMarketing
  analytics: ProductAnalytics
}
```

### Prompt Cursor — Phase 1

```
Contexte : lis d'abord REFONTE_PRODUCT_PAGE.md à la racine du repo.

Tâche (Phase 1 uniquement, ne touche à rien d'autre) :
1. Crée src/types/product.ts avec exactement les interfaces de la Phase 1 du document.
2. Garde src/types/index.ts intact : les anciens types Product et Seller
   restent exportés pour les autres écrans. Ajoute simplement
   `export * from './product'`.
3. Ne modifie AUCUN écran, AUCUN service.
4. Vérifie que `npx tsc --noEmit` passe.

Ne code rien d'autre. Arrête-toi et attends validation.
```

---

## Phase 2 — Le service (adaptateur)

Le principe : la base Firestore ne change pas encore. On écrit un **mapper** qui traduit
le document brut en `ProductDetail`. Ça isole complètement l'UI de la structure Firestore.

### Fichiers cibles

- `src/services/mappers/productMapper.ts` (nouveau)
- `src/services/productService.ts` (ajout d'une fonction, pas de suppression)

### Contrat

```ts
// productMapper.ts
export const mapToProductDetail = (raw: any, sellerRaw: any): ProductDetail
```

Règles de mapping à respecter :

| Champ cible | Source actuelle | Règle |
|---|---|---|
| `gallery` | `images` ou `[image]` | filtrer les chaînes vides ; si vide → placeholder |
| `pricing.discountPercent` | `price` / `originalPrice` | calculé, arrondi, absent si pas de `originalPrice` |
| `variants` | `stock[]` | `available = quantity > 0` |
| `seller.storeName` | `storeName` ou `name + lastname` | logique de `displaySellerTitle` actuelle |
| `delivery.homeDelivery.cities[].price` | `ciudadesParaEnvioADomicilio[].precio` (string) | `parseInt` ; `NaN` → `null` |
| `delivery.homeDelivery.startingPrice` | idem | **min** des prix non nuls, pas le premier |
| `delivery.storePickup.city` | `ciudadRecogidaEnPersona` | — |
| `marketing.protectedPurchase` | — | `true` par défaut en V1 |
| `analytics.*` | `productSummary.*` | `0` si absent |
| `info.createdAt` | `createdAt` (Timestamp \| string) | toujours normalisé en ISO |

Tous les champs manquants ont une **valeur par défaut sûre**. Le mapper ne doit jamais throw.

### Prompt Cursor — Phase 2

```
Contexte : lis REFONTE_PRODUCT_PAGE.md. Phase 1 est terminée et validée.

Tâche (Phase 2 uniquement) :
1. Crée src/services/mappers/productMapper.ts exportant
   `mapToProductDetail(raw, sellerRaw): ProductDetail`.
   Respecte scrupuleusement le tableau de mapping de la Phase 2 du document.
   Le mapper est pur, synchrone, sans import Firebase, et ne throw jamais :
   chaque champ absent reçoit une valeur par défaut sûre.
2. Dans src/services/productService.ts, ajoute
   `getProductDetail(productId: string): Promise<ProductDetail | null>`
   qui réutilise la récupération existante puis applique le mapper.
   NE SUPPRIME PAS `getProduct()` — les autres écrans en dépendent encore.
3. Ajoute src/services/mappers/__tests__/productMapper.test.ts couvrant :
   - document complet
   - document minimal (uniquement title + price)
   - precio de livraison vide ou non numérique → null
   - startingPrice = minimum des villes, pas la première
4. `npx tsc --noEmit` doit passer. Aucun composant modifié.

Arrête-toi et attends validation.
```

---

## Phase 3 — Le découpage UI

### Arborescence cible

```
src/screens/ProductDetail/
├── ProductDetailScreen.tsx        ← orchestrateur, ~150 lignes max
├── components/
│   ├── ProductGallery.tsx         ← wrap EnhancedSwipeGallery + gradient bas
│   ├── ProductIdentityCard.tsx    ← titre, prix, preuve sociale, chips  ★ signature
│   ├── TrustRow.tsx               ← Compra Protegida / Entrega / Devolución
│   ├── ProductDescription.tsx     ← "Acerca de este artículo" + Ver más (3 lignes)
│   ├── SizeSelector.tsx           ← seulement si variants.length > 1
│   ├── DeliveryOptions.tsx        ← "¿Cómo puedes recibirlo?" + villes masquées
│   ├── ProductDetailsAccordion.tsx
│   ├── SellerCard.tsx             ← carte boutique enrichie
│   ├── RelatedProducts.tsx        ← scroller horizontal
│   ├── BottomPurchaseBar.tsx      ← chat + "Comprar ahora"
│   └── ReportModal.tsx            ← extrait tel quel de l'existant
├── hooks/
│   ├── useProductDetail.ts        ← fetch + loading + error
│   ├── useProductActions.ts       ← favori, partage, chat, achat
│   └── useReportProduct.ts
└── styles.ts                      ← tokens partagés uniquement
```

### Ordre des sections à l'écran

Il suit exactement le raisonnement de l'acheteur :

1. **Galerie** — *Est-ce que j'aime ?*
2. **ProductIdentityCard** — *C'est mon style ? Combien ?*
3. **TrustRow** — *Je peux faire confiance ?*
4. **Description**
5. **SizeSelector** (conditionnel)
6. **DeliveryOptions** — *Comment je le reçois ?*
7. **DetailsAccordion** (replié par défaut)
8. **SellerCard** — *Qui le vend ?*
9. **RelatedProducts**
10. **Lien Reportar** (discret)
11. **BottomPurchaseBar** (fixe) — *Je l'achète ?*

### Spécification de `ProductIdentityCard` (le composant signature)

```
Poloche Negro
RD$450        RD$800  (barré)      -44%

⭐ 4.9 (27) · Men Fashion Store ✓ · Santiago

[ Nike ]  [ Talla L ]  [ 100% Algodón ]
```

- Le prix est l'élément le plus gros de la carte (28pt, bold, `#111827`).
- La ligne de preuve sociale est **cliquable** → profil boutique.
- Les chips reprennent le style des filtres de recherche (arrondis, bordure fine, pas de fond gris plat).
- Le badge « Compra Protegida » **quitte** cette zone → il va dans `TrustRow`.

### Spécification de `DeliveryOptions`

Titre : **¿Cómo puedes recibirlo?**
Trois lignes maximum, une par méthode disponible, format compact :

```
🏠  Entrega a domicilio      Desde RD$150   ›
📍  Recoger en tienda        Santiago       ›
📦  Punto de recogida        Gratis         ›
```

Les villes sont **masquées** derrière un bottom sheet « Ver ciudades disponibles »
(une boutique peut en avoir 50). Aucun encadré bleu, aucun avertissement.

### Prompt Cursor — Phase 3

```
Contexte : lis REFONTE_PRODUCT_PAGE.md. Phases 1 et 2 sont validées.

Tâche (Phase 3) :
Crée l'arborescence src/screens/ProductDetail/ décrite dans la Phase 3 du document.

Contraintes strictes :
- Chaque composant reçoit ses données en props typées depuis ProductDetail.
  AUCUN composant ne fait d'appel Firestore ni n'importe firebaseConfig.
- Toute la logique de données vit dans les hooks du dossier hooks/.
- ProductDetailScreen.tsx ≤ 150 lignes : il compose, il ne calcule pas.
- Chaque composant ≤ 200 lignes, avec son propre StyleSheet en bas de fichier.
- Ordre des sections à l'écran : exactement celui listé dans le document.
- Supprime toute trace de : estado del producto, ConditionModal,
  getConditionColor, getConditionLabel, getConditionSummary.
- Textes en espagnol. Couleurs via brandColors uniquement.
- Respecte les specs détaillées de ProductIdentityCard et DeliveryOptions.
- RelatedProducts : crée le composant avec une prop `products: ProductCardData[]`
  et un état vide propre. La récupération viendra en Phase 4 — ne l'implémente pas.

Ne supprime pas encore l'ancien src/screens/ProductDetailScreen.tsx : renomme-le
en ProductDetailScreen.legacy.tsx et laisse la navigation pointer sur l'ancien.
On bascule après revue visuelle.

Arrête-toi et attends validation.
```

---

## Phase 4 — Bascule et features premium

### 4.1 Bascule

```
Fais pointer la route 'ProductDetail' de App.tsx vers
src/screens/ProductDetail/ProductDetailScreen.
Vérifie tous les call sites de navigation.navigate('ProductDetail', ...) :
le paramètre reste { productId }. Puis supprime ProductDetailScreen.legacy.tsx.
```

### 4.2 `product_summary` — compteurs dénormalisés

À écrire en Cloud Function, pas côté client :

```ts
// Collection: products/{productId}
productSummary: {
  views: number,
  likes: number,
  cartAdds: number,
  shares: number,
  updatedAt: Timestamp,
}
```

- `views` : incrément via Cloud Function appelable, throttlé (1 vue / utilisateur / 24 h).
- `likes` : trigger `onWrite` sur la sous-collection favoris.
- Jamais de `increment` direct depuis le client — sinon les compteurs sont manipulables.

**Règle absolue** : n'affiche un signal social que si la donnée est réelle.
`👀 38 personas visitaron hoy` avec un chiffre inventé détruit la confiance
que toute cette refonte cherche à construire. Si `views < 20`, on n'affiche rien.

### 4.3 `sellerSummary` dénormalisé

Aujourd'hui la fiche produit lit le document vendeur complet. À terme, `products/{id}`
embarque un `sellerSummary` figé à la publication, rafraîchi par une Cloud Function
quand le vendeur change de nom, d'avatar ou passe vérifié. Gain : une lecture au lieu de deux.

### 4.4 Produits similaires

V1 simple et suffisante : requête sur `category == product.category`,
`sellerId != current`, `available == true`, limit 10, tri par `createdAt desc`.
Pas de reco IA en V1.

---

## Checklist de recette (à faire avant de fermer la refonte)

- [ ] Produit sans `originalPrice` → pas de prix barré, pas de badge remise
- [ ] Produit sans image → placeholder, pas de crash
- [ ] Vendeur non vérifié → pas de coche, carte toujours propre
- [ ] Vendeur particulier (`privado`) → pas de « ventas », pas de « miembro desde »
- [ ] Une seule taille → sélecteur masqué, achat direct possible
- [ ] Aucune méthode de livraison → section masquée, pas de bloc vide
- [ ] `precio` de ville vide → « A coordinar », jamais `NaN`
- [ ] Utilisateur non connecté → favori et chat déclenchent l'invite de connexion
- [ ] Propre produit → pas de lien « Reportar »
- [ ] Description courte → pas de « Ver más »
- [ ] Analytics à 0 → aucun signal social affiché
- [ ] Petit écran (iPhone SE) → CTA fixe non recouvert par le contenu
```

---

## Comment piloter l'agent dans Cursor

1. Place ce fichier à la racine et ajoute-le au contexte (`@REFONTE_PRODUCT_PAGE.md`).
2. Crée une branche par phase : `refonte/p1-types`, `refonte/p2-service`, etc.
3. **Une phase = un prompt = une revue.** Ne lance jamais deux phases dans la même session :
   l'agent perd le fil et commence à réécrire ce qui marchait déjà.
4. Après chaque phase : `npx tsc --noEmit` puis test manuel sur simulateur.
5. Si l'agent dérive, ramène-le au document plutôt que de corriger à la main :
   « Relis la section Phase 3 du document, ton DeliveryOptions affiche encore les villes. »

Ajoute aussi ces lignes dans `.cursor/rules` (ou `.cursorrules`) pour toute la durée du chantier :

```
- La fiche produit suit REFONTE_PRODUCT_PAGE.md. Lis-le avant toute modification
  dans src/screens/ProductDetail/ ou src/services/productService.ts.
- Aucun composant de src/screens/ProductDetail/components/ ne fait d'appel réseau.
- Les couleurs viennent de src/theme (brandColors). Jamais de hex en dur pour le bleu.
- Textes utilisateur en espagnol. Commentaires en français.
- Ne réintroduis jamais estadoGeneral, estadoTelaMaterial, notasSobreElEstado,
  defectosEspecificos ni ConditionModal : supprimés volontairement en V1.
```
