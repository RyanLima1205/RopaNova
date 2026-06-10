# Audit Firestore rules — S1-1 (RopaNova)

**Date :** 2026-05-14  
**Fichier audité :** `mobile-app/firestore.rules`  
**Objectif checklist :** matrice rôles + scénarios d’abus documentés ; couverture lectures liste, sous-collections, `document=**`.

---

## 1. Carte des chemins (collections & sous-collections)

| Chemin | `read` | `create` | `update` | `delete` |
|--------|--------|----------|----------|----------|
| `users/{userId}` | Tout utilisateur connecté | Soi-même (champs imposés) | Propriétaire | Propriétaire |
| `users/.../paymentMethods/{id}` | Propriétaire | Propriétaire | Propriétaire | Propriétaire |
| `users/.../wallet/{id}` | Propriétaire | Propriétaire | Propriétaire | Interdit |
| `users/.../transactions/{id}` | Propriétaire | Propriétaire | Propriétaire | Interdit |
| `users/.../preferences/{id}` | Propriétaire | Propriétaire | Propriétaire | Propriétaire |
| `products/{id}` | Public | Auth + champs produit | Vendeur ou delta `favoriteCount` | Vendeur |
| `categories/{id}` | Public | Interdit | Interdit | Interdit |
| `favorites/{id}` | Propriétaire du favori | Auth + id doc = `uid_productId` | Propriétaire | Propriétaire |
| `conversations/{id}` | Participant ou doc absent | Auth, 2 participants | Participant | Participant |
| `conversations/.../messages/{id}` | Participant (G0-1) | Participant + `senderId` | Auteur du message | Auteur du message |
| `reviews/{id}` | Public | Auteur + champs | Auteur | Auteur |
| `orders/{id}` | Acheteur ou vendeur | Acheteur + champs | Acheteur ou vendeur | Acheteur |
| `notifications/{id}` | `userId` == auth | Auth + `userId` == auth (correctif S1-1) | Destinataire | Destinataire |
| `/{document=**}` | Refus | Refus | Refus | Refus |

---

## 2. Matrice « qui peut quoi » (résumé)

| Rôle | Lecture catalogue | Écriture produits | Lire profils autres users | Messages d’autrui | Commandes d’autrui |
|------|-------------------|-----------------|---------------------------|-------------------|---------------------|
| Non connecté | Oui (`products`, `categories`, `reviews`) | Non | Non (sauf si règle `users` change) | Non | Non |
| Connecté | Oui | Créer / éditer les siens ; ±1 favori | **Oui** (tous les `users/*` — voir risque) | Non si pas participant | Non si ni acheteur ni vendeur |

---

## 3. Scénarios d’abus & statut

| # | Scénario | Risque | Statut / action |
|---|----------|--------|------------------|
| A | Utilisateur A liste `users` et récupère emails / profils de tous | Vie privée / RGPD, spam | **Risque résiduel** : `allow read` sur `users` = tout connecté. Mitigation produit : ne stocker que données publiques sur ce doc, ou scinder profil public / privé (refonte données). |
| B | Créer des notifications au nom d’autrui ou spam global | Harcèlement, confusion | **Corrigé (S1-1)** : `create` impose `userId == request.auth.uid`. Notifications « pour un autre user » → Cloud Functions (Admin SDK) ou backend. |
| C | Participant modifie `participants` pour exclure l’autre ou usurper la thread | Intégrité conversation | **Corrigé (S1-1)** : `update` conversation impose `participants` inchangé. |
| D | Participant conversation `update` écrase d’autres champs sensibles | Selon champs app | **À surveiller** : la règle ne limite pas les autres champs ; revue côté app (n’envoyer que champs autorisés). |
| E | Acheteur ou vendeur modifie n’importe quel champ d’une `order` | Fraude (montant, statut) | **Risque résiduel** : `update` large pour buyer/seller. Idéal : `diff().affectedKeys()` whitelist (champs métier). |
| F | Création conversation avec 2 IDs dont une victime n’a pas « accepté » | Spam / faux fils | **Risque résiduel** : `create` vérifie seulement 2 participants et auth ∈ liste. À traiter produit (invitation) si besoin. |
| G | Favoris : forger un doc avec un `favoriteId` qui ne matche pas `uid_productId` | Contournement | **Bloqué** : règle sur `favoriteId`. |
| H | Lister une collection non déclarée | Accès large | **Bloqué** : `match /{document=**}` refuse le reste. |
| I | Sous-collections `messages` sans être dans `participants` | Fuite messages | **Bloqué** : `isConversationParticipant` (G0-1). |

---

## 4. `document=**` (récursif)

Le bloc final `match /{document=**} { allow read, write: if false; }` **refuse** tout chemin non couvert explicitement au-dessus. **Comportement attendu** : pas d’accès implicite à de nouvelles collections ou sous-arbres oubliés.

---

## 5. Lectures « liste » (queries)

Firestore n’a pas de distinction `get` / `list` dans les règles : `read` s’applique à chaque document candidat. Les queries client doivent donc utiliser des filtres compatibles (ex. `favorites` avec `where('userId','==', uid)`). Les points sensibles identifiés :

- **`users`** : une query sans filtre renvoie théoriquement tous les profils pour tout connecté (si l’index le permet) — **à éviter côté app** et à traiter côté règles si la politique produit change.

---

## 6. Synthèse pour validation checklist S1-1

- [x] Parcours complet des `match` + sous-collections.  
- [x] Comportement `document=**` vérifié.  
- [x] Matrice rôles + table scénarios d’abus (ce document).  
- [x] Correctifs appliqués sur **notifications** (create) et **conversations** (update `participants`).  
- [ ] Suivi recommandé : **users read** (PII), **orders update** (whitelist champs), **conversation create** (consentement), durcissement **wallet/transactions** côté serveur si montants sensibles.

**Prochaine étape produit / tech :** trancher la politique sur la lecture des profils (`users`) et, si besoin, planifier une évolution de schéma ou de règles sans casser l’app actuelle.
