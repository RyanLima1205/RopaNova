# Azul Payment Page — état réel au 2026-08-12

Contexte complet : `docs/briefing-integration-azul.md`. Ce document ne
reflète que ce qui existe vérifiablement dans le dépôt et dans le projet
Firebase au moment de l'écriture — pas ce qui est prévu ou en discussion.

## Modèle de données — champs déclarés, pas encore de règles ni d'écran

- **`users/{uid}.plan`** : `'START' | 'PRO' | 'ELITE'`, défaut `'START'`.
  Détermine le taux de commission (voir formules plus bas). **Déclaré ici
  seulement** — aucune règle Firestore ne le référence encore, et il n'est
  lu nulle part dans le code (le calcul de payout utilise un placeholder
  `'START'` en dur, voir plus bas). **Dette notée** : pas d'écran de
  gestion d'abonnement — un vendeur ne peut pas encore changer de plan
  depuis l'app.

## Ce qui est fait et vérifié (mis à jour — routes de retour déployées et testées)

- **`computeAuthHash` / `verifyResponseAuthHash`** (`functions/src/azul.ts`) :
  implémentées, algorithme confirmé correct contre le PDF officiel d'Azul,
  et maintenant vérifié par une vraie transaction (voir plus bas) —
  `verifyResponseAuthHash` est appelée par `azulApproved`/`azulDeclined` et
  a validé une signature réelle d'Azul.
- **`payTest`, `azulApproved`, `azulDeclined`, `azulCancelled`**
  (`functions/src/azul.ts`) : déployées (confirmé via
  `firebase functions:list`), câblées sur `pay.ropanova.com` via Hosting
  (`/pay/**`, `/aprobada`, `/declinada`, `/cancelada`).
- **Le domaine `pay.ropanova.com` est accepté en environnement de test
  Azul** — confirmé par un paiement de test qui a abouti sans
  `INVALID_BASEDOMAIN`.
- **Transaction réelle validée de bout en bout** : `OrderNumber
  TEST-1786558438202`, doc `azulTransactions/TEST-1786558438202_44938877`,
  `status: 'approved'`, `isoCode: '00'`, `responseMessage: 'APROBADA'`.
  Champs de payout recalculés et vérifiés manuellement contre le document
  Firestore réel : `buyerFeeCents` 2500, `azulFeeCents` 3485,
  `commissionGrossCents` 10000, `commissionNetCents` 8475, `payoutCents`
  84015 — tous corrects. `gmvCents` égale `amountCents` (100000) : c'est le
  placeholder connu, pas une vraie séparation GMV/buyerFee (voir table
  ci-dessous).
- **Idempotence vérifiée en conception** (clé `OrderNumber` + `AzulOrderId`
  comme ID de document, transaction Firestore get-then-set) — pas encore
  testée sous un vrai doublon de requête Azul.

## Ce qui N'EST PAS fait — à ne pas supposer acquis

- **Pas de lien avec `/orders`.** `azulTransactions` reste une collection
  séparée ; aucune commande réelle n'est mise à jour par ces routes.
- **`gmvCents` est un placeholder** (= `amountCents`), pas une vraie
  séparation GMV / buyer fee — `payTest` ne construit pas de vrai panier.
- **`sellerPlan` est en dur sur `'START'`** — `users/{uid}.plan` n'est lu
  nulle part.
- **Rétention et reversement non activés** — les champs
  `retentionStartsAt`/`retentionReleasesAt`/`retentionReleased` sont posés
  dans le document mais toujours `null`/`false`, aucun mécanisme ne les
  fait évoluer.
- **IPN non construit** (voir section dédiée plus bas).
- **Pas de 3D Secure testé** — voir section dédiée.
- **Comprobantes e-CF, abonnements mensuels** : non commencés.

## Valeurs codées en dur — à remplacer avant toute mise en production

| Valeur | Actuellement | Pourquoi ça doit changer |
|---|---|---|
| `CurrencyCode` | `"$"` | **Confirmé par un test réel réussi — rien à changer.** |
| `MerchantName` | `"ROPANOVA"` (défaut, deviné) | Jamais discuté avec Azul/Luis |
| `MerchantType` | `"ECommerce"` (`functions/.env.ropanova`) | Valeur maintenant définie — à confirmer qu'elle correspond bien à ce qu'Azul attend, mais n'est plus un trou vide |
| `Amount` / `ITBIS` | `"100000"` / `"000"` fixes | Pas de lien avec une vraie commande ; pas de calcul ITBIS dynamique |
| `OrderNumber` | `TEST-${Date.now()}` | Pas de lien avec `/orders` ni un vrai panier |
| `gmvCents` (dans `azulApproved`) | = `amountCents` | Placeholder — pas de vraie séparation GMV/buyerFee tant que `payTest` n'est pas remplacé par un vrai flux de commande |
| `sellerPlan` (dans `azulApproved`) | `'START'` en dur | `users/{uid}.plan` n'existe pas encore côté lecture |

## Secrets — définis en production (sandbox)

`AZUL_MERCHANT_ID` et `AZUL_AUTH_KEY` sont désormais définis dans Secret
Manager (les quatre fonctions sont déployées et un paiement de test a
abouti, ce qui n'était pas possible sans eux). Rappels qui restent
valables :

- **`AZUL_AUTH_KEY` : toujours la NOUVELLE clé régénérée par Azul**, jamais
  une clé qui a pu être partagée ou exposée en clair à un moment du
  processus.
- **Prévoir un second jeu de valeurs pour la production** — sandbox et
  production ne doivent jamais partager une même valeur de secret.

## Actions de passage en production (checklist, rien de commencé ici)

- **Déclarer `pay.ropanova.com` chez Azul pour l'environnement de
  production** — l'acceptation en test ne vaut pas enregistrement en
  production ; c'est une démarche séparée à faire avant tout paiement réel.
- Définir un second jeu `AZUL_MERCHANT_ID` / `AZUL_AUTH_KEY` de production
  (voir section secrets).
- Résoudre les autres valeurs codées en dur listées plus haut.

## 3D Secure

**Rien à coder côté RopaNova.** Non activé en environnement de test ; en
production, Azul gère le 3D Secure automatiquement côté Payment Page
(Visa Secure / Mastercard ID Check) sans intervention de notre code — le
navigateur du client interagit directement avec l'émetteur sur la page
hébergée par Azul. Confirmé par Azul, pas une supposition de notre part.

## Remboursements / devoluciones — confirmé par Azul

- **`VOID` reste pertinent** pour les annulations dans les 20 minutes
  suivant la vente (`TrxType = VOID` avec `AzulOrderId`) — rien construit
  ici encore, mais la fenêtre de 20 minutes reste la bonne limite à coder
  le jour où le VOID sera implémenté.
- **Au-delà de 20 minutes, aucune API de remboursement n'existe côté
  Payment Page.** Confirmé par Azul : les devoluciones se font
  **manuellement via le portail Azul**, disponible uniquement en
  production (pas en sandbox). **Aucune logique de remboursement
  automatique au-delà de 20 minutes ne sera codée** — ce cas restera un
  processus manuel humain, pas une fonctionnalité de l'app. Conséquence
  directe sur la politique publiée (`ropanova.com/devoluciones`) : toute
  promesse de remboursement au-delà de cette fenêtre implique une action
  manuelle de l'équipe, pas un remboursement instantané.

## IPN — chantier prioritaire pour la suite (non commencé)

Le retour navigateur (`ApprovedUrl`/`DeclinedUrl`) dépend du client : s'il
ferme l'onglet, perd la connexion, ou que la redirection échoue après un
paiement réellement approuvé côté Azul, RopaNova ne le saura jamais par ce
seul mécanisme. L'IPN (notification serveur-à-serveur d'Azul, indépendante
du navigateur) est la source de vérité qui doit exister en parallèle.

À construire, dans un temps dédié, pas maintenant :
- Un endpoint HTTP serveur séparé des trois routes de retour navigateur,
  que Azul appelle directement de serveur à serveur.
- La même vérification de signature (`verifyResponseAuthHash`) sur cette
  notification — elle est tout aussi falsifiable si non vérifiée.
- La même idempotence (`OrderNumber` + `AzulOrderId`) que le chemin
  navigateur, puisque les deux peuvent arriver pour la même transaction,
  dans un ordre non garanti — le second qui arrive ne doit rien réécrire.
- Une politique claire sur lequel des deux (retour navigateur ou IPN) fait
  foi en cas de désaccord — probablement l'IPN, puisqu'elle ne dépend pas
  du client, mais à trancher explicitement plutôt que supposé.

## Prochaine étape suggérée

Décider de la source réelle de GMV (remplacer le placeholder `gmvCents =
amountCents`) et de `sellerPlan` (lire `users/{uid}.plan`) avant de
brancher ces routes sur de vraies commandes — sinon les payouts calculés
resteront des chiffres de démonstration, pas des montants réels.
