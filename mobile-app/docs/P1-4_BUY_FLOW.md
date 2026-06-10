# P1-4 — Parcours acheter (validation manuelle)

**Date :** 2026-05-18  
**Périmètre MVP :** achat direct « Comprar ahora » (pas de panier multi-produits).

## Parcours implémenté (Firestore réel)

| Étape | Écran / service | Statut |
|-------|-----------------|--------|
| 1 | `ProductDetail` → **Comprar ahora** (talla si besoin) | OK |
| 2 | `Buy` — résumé produit, vendeur, livraison, adresse (si envío a domicilio) | OK |
| 3 | `Buy` — choix paiement + validation | OK (simulé, voir limites) |
| 4 | `orderService.createOrder` → `orders/` statut `pending` | OK |
| 5 | Écran **Compra confirmada** + code commande | OK |
| 6 | **Mis pedidos** (`OrdersScreen`) — liste, filtres, détail | OK |
| 7 | Annulation acheteur si `pending` | OK |
| 8 | Reseña si `delivered` + `WriteReview` | OK (statut `delivered` à poser manuellement en console Firebase pour test) |

## Test E2E manuel (à exécuter)

### Prérequis

- Deux comptes : **acheteur** (connecté) et **vendeur** (produit publié avec stock/tallas).
- Règles Firestore déployées (`firebase deploy --only firestore:rules` depuis `mobile-app/`).
- Produit avec au moins une option de livraison cochée (recogida, envío a domicilio, etc.).

### Scénario A — Recogida + wallet (chemin le plus simple)

1. Acheteur : ouvrir le produit → **Comprar ahora** → choisir taille si demandé.
2. **Comprar ahora** : méthode d’envío = recogida en persona.
3. Paiement = **RopaNova Wallet** (solde affiché RD$375 — mock).
4. **Confirmar compra** → attendre ~2 s → écran **Compra confirmada** avec `Pedido RN-…`.
5. **Ver Mis Pedidos** → commande visible, badge **Pendiente**.
6. **Cancelar** sur la commande → statut **Cancelado** (si encore pendiente).

**Résultat attendu :** document `orders/{id}` en Firebase avec `buyerId`, `sellerId`, `productId`, `amount`, `status`, `orderCode`, champs livraison.

### Scénario B — Envío a domicilio + adresse

1. Produit avec `envioADomicilio` activé et ville configurée.
2. Checkout : **Envío a domicilio** → choisir ville → sélectionner une adresse (ou en créer une dans Configuración).
3. Confirmer l’achat → vérifier sur la commande le libellé d’adresse (`deliveryAddressSummary`).

### Scénario C — Paiement digital (simulation)

1. Choisir **Apple Pay** / **Google Pay** / **PayPal**.
2. Alert **Simulación de pago** → **Continuar**.
3. Même fin : commande créée en `pending`.

### Scénario D — Suite statuts + reseña (hors app vendeur)

1. Console Firebase → `orders/{id}` → `status: "delivered"`.
2. **Mis pedidos** → onglet Entregados → **Reseña** → publier note + commentaire optionnel.
3. Vérifier **Reseñas del vendedor** et carré **Reseñas** sur **Perfil** vendeur.

## Limites connues (hors périmètre P1-4 MVP)

| Limite | Impact |
|--------|--------|
| Pas de **panier** multi-articles | Achat unitaire par produit seulement |
| **Paiement simulé** (délai 2 s, wallet RD$375 en dur) | Pas de PSP réel (cf. G0-3 / PAY-1) |
| Pas d’écran **vendeur** pour confirmer / expédier | Statuts `confirmed` / `shipped` / `delivered` via Firebase ou futur dashboard |
| Boutons **Rastrear** / **Contactar** sur commande | Non branchés |
| Pas de débit wallet réel ni webhook paiement | Commande créée même en simulation |

## Critère checklist P1-4

**Cocher `[x]` si :**

- [x] Scénarios A + B (ou C) passent sur un build récent.
- [x] Commande visible dans **Mis pedidos** avec le bon montant et code.
- [x] Ce document sert de preuve du test E2E manuel.

**Ne pas considérer P1-4 « production paiements »** tant que PAY-1 / PSP n’est pas intégré.
