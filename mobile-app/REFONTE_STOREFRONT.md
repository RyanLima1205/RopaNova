# RopaNova — ProfileScreen → StoreScreen (Storefront V1)

> À placer à la racine du repo, à côté de `REFONTE_PRODUCT_PAGE.md`.
> Même méthode : une phase = un prompt = une revue. Aucune phase sautée.

---

## 0. Le principe

Aujourd'hui : `Utilisateur → profil → annonces`
Demain : `Utilisateur → possède → Boutique → possède → Catalogue + Storefront`

La page n'est plus un profil vendeur. C'est **le mini-site e-commerce de la boutique
à l'intérieur de RopaNova** — la page qu'un commerçant voudra mettre en lien dans sa bio Instagram.

Objectif UX : présenter la marque → créer la confiance → faire découvrir le catalogue → convertir.

---

## 1. Trois corrections à la proposition initiale

La proposition d'origine est solide sur le fond. Trois points la rendraient dangereuse
telle quelle, et je m'en écarte volontairement.

### 1.1 Ne pas migrer `users` → `stores` maintenant

La proposition dit de séparer `users` et `stores` en deux collections. C'est la bonne
cible, mais une migration de production sur la collection la plus lue de l'app,
alors que `ProfileScreen`, `ChatScreen`, `MessagesScreen`, `SellerReviewsScreen`,
`ProductCard` et le mapper produit lisent tous `users` — c'est un chantier à haut risque
pour un gain nul côté utilisateur.

**On applique la méthode qui a marché sur la fiche produit :** un type `Store` propre
côté frontend, alimenté par un **mapper** qui lit le document `users` existant.
La collection `stores` viendra quand on aura une vraie raison (multi-boutiques par
propriétaire, ou équipes). L'UI ne changera pas ce jour-là — c'est tout l'intérêt.

### 1.2 Sections configurables : oui pour l'ordre, non pour le no-code

Un moteur de sections entièrement piloté par Firestore est la bonne V2. En V1, c'est
de l'over-engineering : tu construirais un CMS pour zéro utilisateur qui l'utilise.

**Le compromis :** les sections sont des composants React normaux, mais leur **ordre**
et leur **activation** viennent d'un tableau en base. Ça coûte quasi rien aujourd'hui
et ça débloque « Personalizar tienda » en V2 sans rien démolir.

```ts
storefront.sections: ['HERO', 'FEATURED', 'CATEGORIES', 'NEW_ARRIVALS', 'REVIEWS']
```

Le rendu est un `switch` sur ce tableau. Ajouter un type de section en V2 = ajouter un `case`.

### 1.3 La personnalisation doit être bornée, y compris sur le contraste

La proposition a raison de refuser le color picker libre. Il faut aller plus loin :
même avec une palette fermée, une boutique peut choisir une couleur de marque claire
et rendre son texte illisible.

**Règle :** le thème ne contrôle jamais la couleur du texte. Il contrôle une couleur
d'accent (boutons, liens, badges) et la couleur du texte *posé sur* cet accent est
calculée automatiquement (noir ou blanc selon la luminance). Tout le reste du texte
reste sur les tokens RopaNova. Une boutique ne peut pas produire une page illisible.

### 1.4 Le cas oublié : le vendeur particulier

La proposition traite tout le monde comme une boutique. Or `accountType: 'privado'`
existe et existera : quelqu'un qui vend trois vestes n'a ni logo, ni cover, ni collections.

**Règle :** `StoreScreen` détecte le type de compte et rend deux variantes.
Compte privé → pas de hero, pas d'onglets, pas de thème : juste avatar, nom, note,
et le catalogue. Même écran, même route, rendu dégradé. Sans ça, 80 % des profils
seront des coquilles vides avec un bandeau gris et « Nueva colección » sans collection.

---

## 2. Le modèle de données

### `src/types/store.ts`

```ts
// ============================================================
// RopaNova — Modèle Storefront (V1)
// La page boutique est un mini-site, pas un profil.
// ============================================================

export type StoreKind = 'store' | 'private'   // dérivé de accountType
export type StoreTheme = 'minimal' | 'elegante' | 'streetwear' | 'luxury' | 'colorful'
export type StoreAccent = 'black' | 'blue' | 'beige' | 'green' | 'pink'
export type StoreFont = 'moderna' | 'elegante' | 'editorial' | 'bold'

export type SectionType =
  | 'HERO'
  | 'FEATURED'
  | 'CATEGORIES'
  | 'COLLECTIONS'
  | 'NEW_ARRIVALS'
  | 'PROMO'
  | 'REVIEWS'

export interface StoreIdentity {
  id: string                 // = ownerId en V1 (voir 1.1)
  kind: StoreKind
  name: string               // storeName, ou "Prénom Nom" si privé
  username?: string          // @zarard — slug, unique, pour l'URL publique
  tagline?: string           // "Moda contemporánea para mujer y hombre"
  description?: string       // texte long, onglet Info
  logo: string
  cover?: string
  verified: boolean
  physicalStore: boolean     // accountType === 'fisica'
  city?: string
  province?: string
  memberSince: number
}

export interface StoreStats {
  rating: number
  reviewCount: number
  followerCount: number
  salesCount: number
  productCount: number
  responseRate: number
  responseTime: string
}

export interface StoreDelivery {
  homeDelivery: boolean
  storePickup: boolean
  pickupPoint: boolean
  returnPolicy?: string
}

export interface StoreSocials {
  instagram?: string
  whatsapp?: string
  tiktok?: string
  website?: string
}

/** Thème borné — voir 1.3. Aucune couleur de texte n'est configurable. */
export interface StorefrontTheme {
  preset: StoreTheme
  accent: StoreAccent
  font: StoreFont
}

export interface StorefrontHero {
  image?: string
  title?: string             // "NUEVA COLECCIÓN"
  subtitle?: string
  ctaLabel?: string          // "Ver colección"
  ctaCollectionId?: string
}

export interface StoreCollection {
  id: string
  title: string              // "Summer Essentials"
  cover?: string
  productCount: number
}

export interface Storefront {
  sections: SectionType[]    // ordre ET activation — voir 1.2
  theme: StorefrontTheme
  hero?: StorefrontHero
  featuredProductIds: string[]
  collections: StoreCollection[]
  promoText?: string
}

/** Objet unique consommé par StoreScreen. */
export interface StoreDetail {
  identity: StoreIdentity
  stats: StoreStats
  delivery: StoreDelivery
  socials: StoreSocials
  storefront: Storefront
  isOwner: boolean           // le visiteur est-il le propriétaire ?
}
```

**Valeurs par défaut du mapper** (aucune boutique n'a encore rempli ces champs) :

| Champ | Défaut |
|---|---|
| `storefront.sections` | `['FEATURED', 'CATEGORIES', 'NEW_ARRIVALS', 'REVIEWS']` — pas de HERO sans image |
| `storefront.theme` | `{ preset: 'minimal', accent: 'blue', font: 'moderna' }` |
| `identity.kind` | `'store'` si accountType ∈ {virtual, fisica}, sinon `'private'` |
| `identity.username` | slug généré depuis `name`, minuscules, tirets |
| `featuredProductIds` | `[]` → la section FEATURED ne se rend pas |
| `collections` | `[]` → la section COLLECTIONS ne se rend pas |

Une section dont les données sont vides **ne se rend pas du tout**. Jamais de titre
de section flottant au-dessus du vide.

---

## 3. L'architecture des fichiers

```
src/screens/Store/
├── StoreScreen.tsx                 ← orchestrateur, ≤150 lignes
├── components/
│   ├── StoreHeader.tsx             ← cover + logo + nom + stats + Seguir
│   ├── StoreTabs.tsx               ← Inicio | Productos | Información
│   ├── sections/
│   │   ├── SectionRenderer.tsx     ← switch sur SectionType  ★ clé de la V2
│   │   ├── HeroSection.tsx
│   │   ├── FeaturedSection.tsx
│   │   ├── CategoriesSection.tsx
│   │   ├── CollectionsSection.tsx
│   │   ├── NewArrivalsSection.tsx
│   │   ├── PromoSection.tsx
│   │   └── ReviewsSection.tsx
│   ├── CatalogTab.tsx              ← recherche interne + filtres + grille
│   ├── InfoTab.tsx                 ← à propos, livraison, confiance, réseaux
│   └── OwnerBar.tsx                ← "Vista previa" / "Personalizar" si isOwner
├── hooks/
│   ├── useStoreDetail.ts
│   ├── useStoreCatalog.ts          ← recherche + filtres + pagination
│   └── useFollowStore.ts
├── theme/
│   └── resolveStoreTheme.ts        ← preset+accent+font → tokens, contraste garanti
└── styles.ts
```

**`SectionRenderer` est la pièce importante.** C'est le seul endroit qui connaît
la correspondance `SectionType → composant`. En V2, l'écran « Personalizar tienda »
réordonnera le tableau `sections` en base, et cette page suivra sans une ligne de plus.

```tsx
// SectionRenderer.tsx — le cœur de l'extensibilité V2
switch (type) {
  case 'HERO':         return storefront.hero ? <HeroSection .../> : null
  case 'FEATURED':     return featured.length ? <FeaturedSection .../> : null
  case 'CATEGORIES':   return <CategoriesSection .../>
  case 'COLLECTIONS':  return collections.length ? <CollectionsSection .../> : null
  case 'NEW_ARRIVALS': return <NewArrivalsSection .../>
  case 'PROMO':        return storefront.promoText ? <PromoSection .../> : null
  case 'REVIEWS':      return stats.reviewCount > 0 ? <ReviewsSection .../> : null
  default:             return null   // section inconnue = ignorée, jamais un crash
}
```

Le `default: return null` compte : quand tu ajouteras un type de section en V2, les
utilisateurs sur une vieille version de l'app l'ignoreront proprement au lieu de crasher.

---

## 4. Le système de thème

### `src/screens/Store/theme/resolveStoreTheme.ts`

```ts
export interface ResolvedStoreTheme {
  accent: string           // couleur de marque (boutons, liens, badges actifs)
  onAccent: string         // '#FFFFFF' ou '#111111' — calculé, jamais configuré
  surface: string          // toujours un token RopaNova
  textPrimary: string      // toujours un token RopaNova
  textSecondary: string    // toujours un token RopaNova
  fontFamily: string
  radius: number           // le preset influence l'arrondi, pas la lisibilité
  cardStyle: 'flat' | 'shadow' | 'border'
}
```

Règles non négociables :

1. `onAccent` est **calculé** par luminance relative, jamais choisi par la boutique.
2. `textPrimary` / `textSecondary` / `surface` viennent **toujours** de `brandColors`.
3. Le thème s'applique **uniquement** dans `src/screens/Store/`. `ProductCard`,
   la navigation, la fiche produit et le checkout gardent l'identité RopaNova.
4. `preset` pilote la forme (rayons, ombres, densité), `accent` la couleur, `font` la typo.
   Trois axes indépendants, cinq valeurs chacun : assez de variété, zéro possibilité de casse.

Un acheteur doit toujours savoir qu'il est sur RopaNova. Une boutique décore sa vitrine,
elle ne repeint pas le centre commercial.

---

## 5. Les phases

### Phase 1 — Types (aucun code métier)

```
@REFONTE_STOREFRONT.md

Contexte : lis REFONTE_STOREFRONT.md. On refond ProfileScreen en StoreScreen.

Tâche (Phase 1 uniquement) :
1. Crée src/types/store.ts avec exactement les interfaces de la section 2.
2. Ajoute `export * from './store'` dans src/types/index.ts. Ne touche à rien
   d'autre dans ce fichier.
3. Ne modifie AUCUN écran, AUCUN service. La collection Firestore ne change pas.
4. npx tsc --noEmit doit passer.

Arrête-toi et attends validation.
```

### Phase 2 — Mapper et service

```
@REFONTE_STOREFRONT.md

Contexte : lis REFONTE_STOREFRONT.md. Phase 1 validée.

Tâche (Phase 2 uniquement) :
1. Crée src/services/mappers/storeMapper.ts exportant
   mapToStoreDetail(userRaw, userId, viewerId, counts): StoreDetail
   - Pur, synchrone, sans import Firebase, ne throw jamais.
   - Applique le tableau de valeurs par défaut de la section 2.
   - identity.kind: 'store' si accountType est 'virtual' ou 'fisica',
     sinon 'private'.
   - identity.username: slug depuis le nom (minuscules, tirets, sans accents).
   - isOwner: viewerId === userId.
2. Crée src/services/storeService.ts avec
   getStoreDetail(storeId, viewerId): Promise<StoreDetail | null>
   Lit users/{storeId}, compte les produits actifs, applique le mapper.
   NE TOUCHE PAS aux services existants.
3. Tests dans src/services/mappers/__tests__/storeMapper.test.ts :
   - compte boutique complet
   - compte privé (kind: 'private', pas de hero dans sections)
   - document minimal (nom seulement)
   - viewerId === storeId → isOwner true
   - slug avec accents et espaces → slug propre
4. npx tsc --noEmit et npx jest doivent passer.

Arrête-toi et attends validation.
```

### Phase 3 — Thème

```
@REFONTE_STOREFRONT.md

Contexte : lis REFONTE_STOREFRONT.md. Phases 1-2 validées.

Tâche (Phase 3 uniquement) :
1. Crée src/screens/Store/theme/resolveStoreTheme.ts.
   resolveStoreTheme(theme: StorefrontTheme): ResolvedStoreTheme
   - 5 presets, 5 accents, 4 fonts — tables de correspondance en dur.
   - onAccent calculé par luminance relative (WCAG) : renvoie '#FFFFFF'
     si l'accent est sombre, '#111111' s'il est clair. Jamais configurable.
   - surface, textPrimary, textSecondary viennent TOUJOURS de brandColors.
   - Les fonts sont uniquement celles déjà chargées dans App.tsx
     (Montserrat, BebasNeue). Ne charge aucune police supplémentaire.
2. Tests : chaque combinaison accent → onAccent a un ratio de contraste ≥ 4.5.
3. npx tsc --noEmit et npx jest doivent passer.
   Aucun composant créé dans cette phase.

Arrête-toi et attends validation.
```

### Phase 4 — UI

```
@REFONTE_STOREFRONT.md

Contexte : lis REFONTE_STOREFRONT.md. Phases 1-3 validées.

Tâche (Phase 4) :
Crée l'arborescence src/screens/Store/ décrite en section 3.

Contraintes strictes :
- Chaque composant reçoit ses données en props typées depuis StoreDetail.
  AUCUN composant ne fait d'appel Firestore.
- StoreScreen.tsx ≤ 150 lignes, chaque composant ≤ 200 lignes.
- SectionRenderer suit exactement le switch de la section 3, avec
  default: return null.
- Une section sans données ne se rend pas (pas de titre au-dessus du vide).
- kind === 'private' : pas de hero, pas d'onglets, pas de thème.
  Avatar, nom, note, catalogue. Rien d'autre.
- Le thème s'applique uniquement dans src/screens/Store/.
- Animations : Animated de react-native uniquement.
  INTERDIT : react-native-reanimated, babel.config.js.
- Textes en espagnol, commentaires en français.
- CatalogTab : recherche interne + filtres, sans requête composite Firestore
  (une contrainte serveur maximum, le reste filtré en mémoire —
  ce projet n'a pas de firestore.indexes.json déployé).

Ne touche pas encore à ProfileScreen.tsx ni à la navigation.
On bascule après revue visuelle.

Arrête-toi et attends validation.
```

### Phase 5 — Bascule et suite

- Router `UserProfile` vers `StoreScreen`, garder `ProfileScreen` pour l'espace
  propriétaire (dashboard, commandes, réglages) — **ne jamais remélanger
  administration et vitrine**.
- `OwnerBar` : « Vista previa » / « Personalizar » (bouton inactif en V1, il prépare la V2).
- Deep links : `ropanova.com/tienda/{username}` via `expo-linking` + Universal Links.
  À faire seulement après que `username` soit garanti unique — prévoir une collection
  `usernames/{slug} → storeId` avec écriture transactionnelle.
- Follow : la sous-collection suffit en V1. Les notifications « nouvelle collection »
  demandent une Cloud Function avec fan-out — c'est un chantier à part, pas un bonus de fin de phase.

---

## 6. Sur la monétisation

Le découpage START / PRO / ELITE de la proposition tient, à une condition : ce qui
distingue les paliers doit être **des sections et des options de thème**, pas la qualité
de base de la page. Une boutique START doit avoir une vitrine dont elle est fière —
sinon elle ne reste pas assez longtemps pour passer à PRO.

| Palier | Débloque |
|---|---|
| START | Logo, cover, catalogue, info, sections par défaut |
| PRO | Hero, produits mis en avant, collections, choix du thème et de l'accent |
| ELITE | Presets premium, bannières promo, réordonnancement libre des sections, analytics |

Tout cela se lit dans un seul champ `plan` sur le document boutique, et se traduit par
un filtre sur le tableau `sections` au moment du mapping. Aucun composant n'a besoin
de connaître le plan — c'est le mapper qui décide ce qui entre dans `storefront.sections`.
C'est la seule façon de garder les paliers modifiables sans toucher à l'UI.
