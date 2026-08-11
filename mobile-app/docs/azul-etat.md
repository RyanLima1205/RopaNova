# Azul Payment Page — état réel au 2026-08-11

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

## Ce qui est fait et vérifié

- **`computeAuthHash` / `verifyResponseAuthHash`** (`functions/src/azul.ts`) :
  implémentées, algorithme relu par Luis contre le PDF officiel d'Azul et
  confirmé correct (ordre de concaténation, AuthKey en octets UTF-8 comme
  clé HMAC, message en UTF-16LE). C'est une relecture de l'algorithme, pas
  une transaction réelle passée par le système.
- **`payTest`** (`functions/src/azul.ts`) : construit une commande de test à
  montant fixe, la signe, renvoie une page HTML qui s'auto-soumet vers
  l'URL de sandbox Azul. Fonctionne uniquement dans le sens sortant.
- **Hosting** : site `ropanova-pay` et target `pay` créés, séparés du site
  de l'app web abandonnée. Rewrite `/pay-test` → `payTest` présent dans
  `firebase.json`.

## Ce qui N'EST PAS fait — à ne pas supposer acquis

- **`payTest` n'est pas déployé.** `firebase functions:list` ne le liste
  pas. Aucune requête n'a jamais atteint Azul depuis ce dépôt.
- **`AZUL_MERCHANT_ID` et `AZUL_AUTH_KEY` n'existent pas dans Secret
  Manager** — 404 à la vérification. Sans ça, `payTest` ne peut même pas
  se déployer.
- **Aucune route de retour n'existe** — `/aprobada`, `/declinada`,
  `/cancelada` ne sont que des chaînes de caractères passées dans les
  champs `ApprovedUrl`/`DeclinedUrl`/`CancelUrl` de `payTest`. Rien ne sert
  ces routes côté serveur.
- **`verifyResponseAuthHash` n'est appelée nulle part.** Elle existe comme
  fonction pure, prête à être branchée, mais aucun code ne l'invoque.
- **Aucune écriture Firestore liée à Azul n'existe.** Pas de transaction,
  pas d'idempotence, pas de statut "payé" — parce qu'il n'y a encore aucun
  chemin de code qui écrirait quoi que ce soit suite à une réponse Azul.
- **Le domaine `pay.ropanova.com` n'est pas confirmé enregistré chez
  Azul.** Personne n'a testé cette partie.
- **`CurrencyCode="$"` n'est confirmé que par la lecture de la doc**, pas
  par une transaction réelle passée avec succès — aucune transaction n'a
  été passée du tout.

En clair : la chaîne sortante (préparer + signer + POST navigateur) est
construite mais jamais exécutée en pratique faute de secrets. Tout ce qui
concerne le retour (vérification de signature, décision payé/refusé,
idempotence) reste à écrire intégralement.

## Valeurs codées en dur — à remplacer avant toute mise en production

| Valeur | Actuellement | Pourquoi ça doit changer |
|---|---|---|
| `CurrencyCode` | `"$"` (défaut) | Jamais confirmé par un test réel réussi |
| `MerchantName` | `"ROPANOVA"` (défaut, deviné) | Jamais discuté avec Azul/Luis |
| `MerchantType` | `""` (vide) | Aucune valeur connue du tout |
| `Amount` / `ITBIS` | `"100000"` / `"000"` fixes | Pas de lien avec une vraie commande ; pas de calcul ITBIS (voir briefing §2.7 — l'ITBIS est la part incluse dans le total, jamais ajoutée — formule à valider avant de coder) |
| `OrderNumber` | `TEST-${Date.now()}` | Pas de lien avec `/orders` ni `/azulTransactions` |
| `AZUL_MERCHANT_ID` / `AZUL_AUTH_KEY` | non définis | Voir section suivante |

## Secrets — commande prête, non exécutée

`AZUL_MERCHANT_ID` et `AZUL_AUTH_KEY` doivent être définis directement par
vous, jamais collés dans ce chat ni dans aucun fichier du dépôt :

```
firebase functions:secrets:set AZUL_MERCHANT_ID --project ropanova
firebase functions:secrets:set AZUL_AUTH_KEY --project ropanova
```

**Important pour `AZUL_AUTH_KEY` : utiliser la NOUVELLE clé régénérée par
Azul, jamais l'actuelle.** Si l'ancienne clé a été partagée ou exposée à un
moment quelconque du processus (document, capture d'écran, email), elle ne
doit plus être utilisée en production — c'est le même principe que pour
tout secret potentiellement compromis.

Prévoir un second jeu de valeurs pour la production quand ce moment
viendra (`--project` différent ou variables distinctes selon la
configuration retenue) — sandbox et production ne doivent jamais partager
une même valeur de secret.

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

Écrire, pour de vrai cette fois, les trois routes de retour avec
vérification de signature et écriture Firestore idempotente
(`OrderNumber` + `AzulOrderId` comme clé) — c'est le travail réel qui
correspond à ce que ce document devait initialement décrire comme "fait."
