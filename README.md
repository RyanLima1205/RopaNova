# RopaNova

RopaNova is a marketplace for buying and selling second-hand clothing in the Dominican Republic.

## Structure

```
.
├── mobile-app/     # Expo / React Native app — the primary product. Firebase (Auth + Firestore) backend.
├── web/            # Next.js web app — browser access to the same Firebase project as mobile-app.
├── App.tsx,
│   index.html,
│   script.js,
│   styles.css,
│   src/            # Legacy, unused prototype scaffold kept at the root — not part of the build.
└── README.md
```

`mobile-app/` and `web/` share the same Firebase project (Auth, Firestore, Cloud Functions). Data written from
one is immediately visible in the other — e.g. a listing created in the mobile app shows up on the website, and
an order placed on the web checkout shows up in the seller's mobile Orders screen.

## mobile-app/

Expo (React Native) app. See `mobile-app/.env.example` for the required Firebase config and
`mobile-app/GO_LIVE_CHECKLIST.md` for release steps.

```bash
cd mobile-app
npm install
npm start
```

## web/

Next.js 14 (App Router) + Tailwind + shadcn/ui. Reuses the mobile app's Firestore data layer
(`web/lib/services/`, ported from `mobile-app/src/services/`) and Firebase Auth (`web/contexts/AuthContext.tsx`).

```bash
cd web
cp .env.example .env.local   # fill in NEXT_PUBLIC_FIREBASE_* (same project as mobile-app/.env)
npm install
npm run dev
```

Includes Spanish legal pages (`/terminos`, `/privacidad`, `/devoluciones`, `/entrega`) and a checkout flow at
`/producto/[id]/comprar` integrating **Pago Azul** for card payments (Visa/Mastercard) in DOP. Pago Azul
credentials aren't configured yet — see `web/lib/azul/client.ts` for the integration point and its current
mocked behavior.

Order confirmation emails are sent via a Firestore-triggered Cloud Function
(`mobile-app/functions/src/index.ts`, `onOrderCreatedSendReceipt`) using the Firebase "Trigger Email" extension.

### Known follow-ups

- `/buscar`, `/vender`, `/wallet`, `/dashboard`, `/mensajes`, `/perfil` still render mock/placeholder data and
  need to be wired to the real Firestore services the same way `/` and `/producto/[id]` were.
- Legal pages, and the RopaNova legal address/RNC shown at checkout and in email receipts, contain
  `[Completar...]` placeholders pending your real business details and a legal review before launch.
- Pago Azul needs real sandbox/production credentials (`AZUL_MERCHANT_ID`, `AZUL_AUTH_KEY` in `web/.env.local`).
