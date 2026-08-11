import { Product } from '../types';

/** Envío a domicilio activo sur ce produit (modes de la publication + villes tarifées). */
export function productAllowsHomeDelivery(product: Product): boolean {
  return Boolean(
    product.tipoDeEntregaPermitida?.envioADomicilio &&
      product.ciudadesParaEnvioADomicilio &&
      product.ciudadesParaEnvioADomicilio.length > 0,
  );
}

export function normalizeCityName(city: string): string {
  return city.trim().toLowerCase();
}

export function citiesMatch(a: string, b: string): boolean {
  return normalizeCityName(a) === normalizeCityName(b);
}

export type ShippingOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  available: boolean;
  cities?: Array<{ ciudad: string; precio: string }>;
};

export function generateShippingOptions(product: Product): ShippingOption[] {
  const options: ShippingOption[] = [];

  if (product.tipoDeEntregaPermitida?.recogidaEnPersona) {
    options.push({
      id: 'pickup',
      name: 'Recoger en Persona',
      description: product.ciudadRecogidaEnPersona ? `En ${product.ciudadRecogidaEnPersona}` : 'Coordinar con el vendedor',
      price: 0,
      icon: 'person-outline',
      available: true,
    });
  }

  if (product.tipoDeEntregaPermitida?.envioADomicilio && product.ciudadesParaEnvioADomicilio?.length) {
    const minPrice = Math.min(...product.ciudadesParaEnvioADomicilio.map((city) => parseInt(city.precio, 10)));
    options.push({
      id: 'home_delivery',
      name: 'Envío a Domicilio',
      description: `Desde RD$${minPrice.toLocaleString()} • Selecciona tu ciudad`,
      price: minPrice,
      icon: 'home-outline',
      available: true,
      cities: product.ciudadesParaEnvioADomicilio,
    });
  }

  if (product.tipoDeEntregaPermitida?.envioAPuntoDeRecogida) {
    options.push({
      id: 'pickup_point',
      name: 'Envío a Punto de Recogida',
      description: 'Gratis • Coordinar con el vendedor',
      price: 0,
      icon: 'location-outline',
      available: true,
    });
  }

  return options;
}

export function formatSizeOrderSummary(quantities: Record<string, number>): string {
  const parts = Object.entries(quantities)
    .filter(([, n]) => n > 0)
    .map(([talla, n]) => `${talla}×${n}`);
  return parts.length ? parts.join(', ') : '—';
}

export function totalUnitsFromQuantities(quantities: Record<string, number>): number {
  return Object.values(quantities).reduce((a, b) => a + b, 0);
}

export function buildShippingLabel(
  shippingOptions: ShippingOption[],
  selectedShipping: string,
  selectedDeliveryCity: string,
  deliveryAddressLabel?: string,
): string {
  const selected = shippingOptions.find((o) => o.id === selectedShipping);
  const base = selected?.name ?? '';
  if (selectedShipping === 'home_delivery') {
    const parts = [base];
    if (selectedDeliveryCity) parts.push(selectedDeliveryCity);
    if (deliveryAddressLabel) parts.push(deliveryAddressLabel);
    return parts.join(' - ');
  }
  return base;
}

export function computeCheckoutTotals(
  product: Product,
  sizeQuantities: Record<string, number>,
  selectedShipping: string,
  selectedDeliveryCity: string,
  shippingOptions: ShippingOption[],
) {
  const selectedShippingOption = shippingOptions.find((o) => o.id === selectedShipping);
  const unitCount = totalUnitsFromQuantities(sizeQuantities);

  const shippingCost = (() => {
    if (selectedShipping === 'home_delivery' && selectedDeliveryCity && selectedShippingOption?.cities) {
      const selectedCity = selectedShippingOption.cities.find((city) => city.ciudad === selectedDeliveryCity);
      return selectedCity ? parseInt(selectedCity.precio, 10) : selectedShippingOption.price;
    }
    return selectedShippingOption?.price ?? 0;
  })();

  const subtotal = product.price * unitCount;
  // 2.5% del buyer service fee, floor (no round) para ser consistente con la política de precios TTC.
  const serviceFee = Math.floor((subtotal * 25) / 1000);
  const total = subtotal + shippingCost + serviceFee;

  return {
    unitCount,
    subtotal,
    shippingCost,
    serviceFee,
    total,
    selectedShippingOption,
  };
}

/** Objet propre pour Firestore (pas de clés à 0). */
export function cleanSizeQuantities(q: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(q).filter(([, n]) => n > 0));
}
