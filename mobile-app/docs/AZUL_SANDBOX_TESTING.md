# Azul Payment Page — notas de pruebas en sandbox

Contexto completo: `docs/briefing-integration-azul.md`. Este archivo solo
registra lo que cambió tras la revisión de Luis contra la documentación
oficial completa de Azul, para no perderlo en el historial de chat.

## Confirmado

- `computeAuthHash` (mobile-app/functions/src/azul.ts) es correcta: AuthKey
  al final del mensaje concatenado Y como clave HMAC, mensaje en UTF-16LE.
  No tocar sin razón nueva.
- Nombres de campos del formulario: `MerchantId` (i minúscula, no
  `MerchantID`) — ya estaba así en la implementación, verificado.

## Pendiente de confirmación por Azul (Luis)

- **CurrencyCode**: se está construyendo con `"$"` (ver
  `azulCurrencyCode` en `azul.ts`, variable de entorno `AZUL_CURRENCY_CODE`,
  no secreto). Mientras Azul no confirme este valor, **un fallo de AuthHash
  en pruebas de sandbox no debe tratarse como bug de `computeAuthHash`** —
  puede ser simplemente que este valor esté mal.
- **Registro del dominio** (`pay.ropanova.com` ante Azul) — sin esto, las
  URLs de retorno serán rechazadas con `INVALID_BASEDOMAIN` (briefing §3.7).

## Tarjetas de prueba (sandbox únicamente)

Reemplazan cualquier tarjeta usada antes. Vencimiento `12/34` para todas;
CVV libre de 3 dígitos (4 para Amex).

- 5424180279791732
- 4260550061845872
- 4005520000000129
- 5413330089600119
- 4012000033330026
- 6011000990099818

Azul no especificó aquí qué escenario cubre cada una (aprobada, rechazada,
etc.) — confirmar con Luis antes de asumir un mapeo.
