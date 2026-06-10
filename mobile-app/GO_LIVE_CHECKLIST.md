# Checklist exécutable — Lancement marché (RopaNova Mobile)

**Usage :** cocher `[x]` quand la ligne est **terminée** et que le **critère de validation** est rempli.  
**Owner :** remplacer `TBD` par un nom. **Effort :** XS < 0,5j · S 0,5–1j · M 2–3j · L 1 sem · XL > 1 sem.

---

## Go / No-Go (bloquant publication stores)

**Légende :** 🔴 = tâche encore à faire (tu passes ensuite à **S1-1**).

| ID | Tâche | Owner | Effort | Statut | Validation (preuve) |
|----|--------|-------|--------|--------|----------------------|
| G0-1 | Corriger `firestore.rules` : lecture **messages** limitée aux **participants** (pas `isAuthenticated()` seul) | TBD | S | [x] | Règle publiée + test manuel : user B ne lit pas les messages de A |
| G0-2 | Aligner règles **favorites** + **products.favoriteCount** (batch add/remove) et déployer sur le **bon** projet Firebase | TBD | S | [x] | Ajout/retrait favori OK en prod-like + pas d’erreur permissions |
| G0-3 | Retirer saisie **PAN/CVV** brute côté app ; intégrer **PSP tokenisé** (Stripe/Adyen/etc.) ou désactiver le flux paiement jusqu’à intégration | TBD | XL | [x] | Revue conformité + aucun secret carte en logs/state persistant |
| G0-4 | Secrets Firebase / clés : **pas** dans le repo ; `EXPO_PUBLIC_*` ou EAS Secrets par environnement | TBD | M | [x] | `.env` gitignoré ; `app.config.js` refuse build EAS sans secrets ; `eas.json` sans valeurs ; build preview sans `.env` dans l’artefact |
| G0-5 | 🔴 Politique confidentialité / CGU : **même marque** (RopaNova), contacts, pays, données collectées | TBD | M | [ ] | Écran légal relu + URL/contact valides |
| G0-6 | 🔴 Profils **EAS** : `eas.json` (dev/preview/prod), versioning build, submit App Store / Play | TBD | M | [ ] | Build `production` + soumission test interne OK |
| G0-7 | 🔴 Permissions Android/iOS : justifier chaque permission (store listing) ; retirer legacy inutiles | TBD | S | [ ] | Fiche store + `app.json` alignés |
| G0-8 | 🔴 Supprimer ou désactiver **logs** verbeux en prod (PII, payloads Firestore) | TBD | M | [ ] | Build prod : pas de `console.log` sensibles (ou wrapper niveau log) |

### G0-4 — Le jour où tu lances un **build sur Internet** (EAS)

À faire **ce jour-là** (ou à faire faire par la personne qui lance le build). Tu n’en as **pas besoin** tant que tu testes seulement sur ton Mac avec `npx expo start`.

1. **Ouvre** ton fichier `mobile-app/.env` sur ton ordinateur (il contient déjà les bonnes valeurs Firebase).
2. **Connecte-toi** au site [expo.dev](https://expo.dev) avec le compte du projet **RopaNova Mobile**.
3. Va dans le projet → **Secrets** (ou « Variables / Environment » selon l’interface) **ou** reste sur ton Mac et ouvre le Terminal dans le dossier `mobile-app/`.
4. **Enregistre chaque valeur** comme « secret de projet » **sans** les coller sur GitHub ni dans un chat public. Les **noms** à utiliser sont exactement ceux de ton `.env` (lignes qui commencent par `EXPO_PUBLIC_FIREBASE_…`). Le modèle des commandes à taper est dans **`mobile-app/.env.example`** (section « Builds EAS ») : une commande par variable, avec ta vraie valeur à la place des `…`.
5. Quand les **six** secrets sont créés sur Expo, lance le build (souvent `eas build --profile preview` ou `production` selon l’objectif). **Ne mets pas** les clés dans `eas.json` ni dans un fichier que tu committerais.
6. Après le build, **vérifie** sur la page du build Expo qu’il n’y a pas de fichier `.env` joint en téléchargement public (normalement il n’y en a pas).

Une fois ces étapes faites pour **au moins** un build preview, tu peux considérer que G0-4 est aussi validé **côté serveur Expo**, pas seulement en local.

---


## Sécurité & données (P1)

| ID | Tâche | Owner | Effort | Statut | Validation |
|----|--------|-------|--------|--------|------------|
| S1-1 | Audit complet `firestore.rules` (lecture liste, sous-collections, `document=**`) | TBD | M | [x] | `docs/FIRESTORE_RULES_AUDIT_S1-1.md` + correctifs `notifications` / `conversations` dans `firestore.rules` |
| S1-2 | Vérifier que tout doc `products` a **`userId`** (sinon favoris / règles cassent) | TBD | S | [x] | Vérification manuelle Firebase : tous les docs `products` ont `userId` |
| S1-3 | RLS équivalent **Storage** (avatars, images produits) si utilisé | TBD | M | [x] | `storage.rules` + chemins `avatars|covers/{uid}/…`, `products/{uid}/…` ; déployer `firebase deploy --only storage` depuis `mobile-app/` |
| S1-4 | Auth : gestion session, reset password, compte supprimé | TBD | M | [x] | `AuthContext` (reset / change pwd / `deleteUser`) + écrans Login / PrivacySettings / AccountSettings ; `docs/AUTH_SUPPORT_S1-4.md` |

---

## Qualité produit & fiabilité (P1)

| ID | Tâche | Owner | Effort | Statut | Validation |
|----|--------|-------|--------|--------|------------|
| P1-1 | Remplacer **mocks** encore exposés (commandes, adresses, etc.) par Firestore ou feature flag “bientôt” | TBD | L | [ ] | Aucun mock en chemin critique sans mention UX |
| P1-2 | Messagerie : **pagination réelle** + états vide/erreur/retry | TBD | L | [ ] | Long thread + scroll + pas de fuite perf |
| P1-3 | `productService` : pas de fallback **mock silencieux** en prod (afficher erreur + retry) | TBD | S | [x] | `getDocsFromServer` + erreur/retry Accueil & Buscar ; mode avion validé |
| P1-4 | Parcours **acheter** : panier/checkout/statuts commande jusqu’à fin heureuse | TBD | XL | [x] | `docs/P1-4_BUY_FLOW.md` — buy-now Firestore OK ; paiement simulé ; pas de panier ; statuts vendeur via console pour test reseña |
| P1-5 | Textes UI sans fausses promesses push (Option B) jusqu’à activation P1-7 | TBD | S | [ ] | Buy / Wallet / légal : « consulta Mis pedidos » ; pas de « Recibirás una notificación » avant push réel |
| P1-6 | **Détail commande** : Mis pedidos → tap → timeline statuts + envío + actions | TBD | M | [x] | `OrderDetailScreen` + navigation depuis `OrdersScreen` ; refresh au focus |
| P1-7 | **Push notifications** (`expo-notifications`) : ventes (vendeur), promos boutiques suivies, événements importants, statut commande, messagerie | TBD | XL | [ ] | Permissions iOS/Android ; envoi serveur (Cloud Functions ou équivalent) ; test device réel |
| P1-8 | **Réglages → Notificaciones** : l’utilisateur choisit les types de alertes (cases à cocher par catégorie, liées à P1-7) | TBD | M | [ ] | Écran dans Settings ; persistance Firestore `users/{uid}.notificationPrefs` ; **à faire en fin de parcours**, après P1-7 |

---

## Observabilité & exploitation (P2)

| ID | Tâche | Owner | Effort | Statut | Validation |
|----|--------|-------|--------|--------|------------|
| O2-1 | **Crash reporting** (Sentry ou Firebase Crashlytics) | TBD | M | [ ] | Crash test remonté en staging |
| O2-2 | **Analytics** événements clés (inscription, publier, favori, message, achat) | TBD | M | [ ] | Dashboard + respect consentement |
| O2-3 | `ErrorBoundary` : erreurs remontées ou log structuré | TBD | S | [ ] | Erreur simulée visible côté tooling |

---

## CI / Qualité code (P2)

| ID | Tâche | Owner | Effort | Statut | Validation |
|----|--------|-------|--------|--------|------------|
| Q2-1 | CI : `lint` + `tsc` (ou équivalent) sur `mobile-app` | TBD | M | [ ] | PR bloquée si rouge |
| Q2-2 | Tests unitaires **services** critiques (auth, produit, favoris) | TBD | L | [ ] | Couverture minimale définie |
| Q2-3 | Refactor fichiers **> ~800 lignes** (ex. Profile, Sell) par modules | TBD | XL | [ ] | Plan de decoupe + 1er module extrait |

---

## Store & conformité (P1–P2)

| ID | Tâche | Owner | Effort | Statut | Validation |
|----|--------|-------|--------|--------|------------|
| ST-1 | Fiches App Store / Play : screenshots, description, âge, catégorie | TBD | M | [ ] | Brouillon validé |
| ST-2 | **Data safety** / privacy nutrition labels (collecte, partage) | TBD | M | [ ] | Formulaires stores remplis |
| ST-3 | Support utilisateur : email/chat + procédure signalement / retrait contrefaçon | TBD | S | [ ] | Lien visible dans l’app |

---

## Accessibilité & i18n (P3)

| ID | Tâche | Owner | Effort | Statut | Validation |
|----|--------|-------|--------|--------|------------|
| A3-1 | Labels accessibilité boutons/icônes critiques | TBD | M | [ ] | VoiceOver/TalkBack sur parcours principal |
| A3-2 | i18n (catalogue ES + stratégie langue) | TBD | XL | [ ] | Changement langue ou locale cohérent |

---

## Paiements — suite (post G0-3, non bloquant checklist Go)

| ID | Tâche | Owner | Effort | Statut | Validation |
|----|--------|-------|--------|--------|------------|
| PAY-1 | Intégrer un **prestataire de paiement externe** (PSP tokenisé : Stripe, Adyen, équivalent) : cartes bancaires, recharge wallet, encaissement vendeur, webhooks | TBD | XL | [ ] | Sandbox puis prod ; conformité PCI hors app ; pas de PAN/CVV dans RopaNova |

---

## Synthèse décision lancement

| Critère | Oui / Non | Notes |
|---------|-----------|--------|
| Aucun P0 ouvert | | |
| Paiement conforme ou hors scope assumé | | |
| Règles Firestore validées en staging | | |
| Build store soumis en test interne | | |
| Playbook incident (crash, spam, abus) | | |

**Date cible lancement :** _______________  
**Responsable Go/No-Go :** _______________

---

*Dernière mise à jour : checklist générée pour exécution interne — à dupliquer dans Linear/Jira si besoin.*
