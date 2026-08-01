import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getProduct } from '../services/productService';
import { createOrder } from '../services/orderService';
import {
  getAddresses,
  formatAddressShort,
  touchAddressLastUsed,
  type SavedAddress,
} from '../services/addressService';
import { Product } from '../types';
import { auth } from '../firebaseConfig';
import { getWalletData } from '../services/paymentService';
import { RootStackParamList } from '../../App';
import {
  generateShippingOptions,
  formatSizeOrderSummary,
  totalUnitsFromQuantities,
  computeCheckoutTotals,
  buildShippingLabel,
  cleanSizeQuantities,
  productAllowsHomeDelivery,
  citiesMatch,
} from '../utils/orderCheckout';

export const BuyScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { productId, selectedSize: initialSelectedSize } = route.params as { productId: string; selectedSize?: string };

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('wallet');
  const [buyerMessage, setBuyerMessage] = useState('');
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedOrderCode, setConfirmedOrderCode] = useState<string | null>(null);
  const [selectedDeliveryCity, setSelectedDeliveryCity] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  /** Quantité par talla (ex: { M: 2, L: 1 }) */
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(() =>
    initialSelectedSize ? { [initialSelectedSize]: 1 } : {},
  );
  /** Copie éditable dans le modal */
  const [modalQuantities, setModalQuantities] = useState<Record<string, number>>({});

  useFocusEffect(
    React.useCallback(() => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      getWalletData(uid).then((wallet) => {
        if (wallet) setWalletBalance(wallet.balance);
      });
    }, []),
  );

  // Effet pour mettre à jour la méthode de paiement si nécessaire
  useEffect(() => {
    if (selectedPayment === 'cash' && selectedShipping !== 'pickup') {
      // Si l'utilisateur a sélectionné le paiement en espèces mais change la méthode de livraison
      // on revient automatiquement à la wallet
      setSelectedPayment('wallet');
    }
  }, [selectedShipping, selectedPayment]);

  // Effet pour désactiver l'assurance quand le paiement en espèces est sélectionné
  useEffect(() => {
    if (selectedPayment === 'cash') {
      setIncludeInsurance(false);
    }
  }, [selectedPayment]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const data = await getProduct(productId);
      if (data) setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!product?.stock?.length || initialSelectedSize) return;
    setSizeQuantities((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      return { [product.stock![0].talla]: 1 };
    });
  }, [product, initialSelectedSize]);

  const homeDeliveryAllowed = product ? productAllowsHomeDelivery(product) : false;
  const showDeliveryAddressPicker =
    homeDeliveryAllowed && selectedShipping === 'home_delivery' && Boolean(selectedDeliveryCity);

  const addressesForSelectedCity = useMemo(
    () =>
      showDeliveryAddressPicker
        ? savedAddresses.filter((a) => citiesMatch(a.city, selectedDeliveryCity))
        : [],
    [showDeliveryAddressPicker, savedAddresses, selectedDeliveryCity],
  );

  const selectedDeliveryAddress =
    addressesForSelectedCity.find((a) => a.id === selectedDeliveryAddressId) ?? null;

  useEffect(() => {
    if (selectedShipping !== 'home_delivery') {
      setSelectedDeliveryCity('');
      setSelectedDeliveryAddressId(null);
    }
  }, [selectedShipping]);

  useEffect(() => {
    setSelectedDeliveryAddressId(null);
  }, [selectedDeliveryCity]);

  const loadSavedAddresses = React.useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !homeDeliveryAllowed) {
      setSavedAddresses([]);
      return;
    }
    setLoadingAddresses(true);
    try {
      const list = await getAddresses(uid);
      setSavedAddresses(list);
    } catch {
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, [homeDeliveryAllowed]);

  useFocusEffect(
    React.useCallback(() => {
      loadSavedAddresses();
    }, [loadSavedAddresses]),
  );

  useEffect(() => {
    if (!showDeliveryAddressPicker || selectedDeliveryAddressId || addressesForSelectedCity.length === 0) {
      return;
    }
    const preferred = addressesForSelectedCity.find((a) => a.isDefault) ?? addressesForSelectedCity[0];
    setSelectedDeliveryAddressId(preferred.id);
  }, [showDeliveryAddressPicker, addressesForSelectedCity, selectedDeliveryAddressId]);

  const openSizeModal = () => {
    if (!product?.stock?.length) {
      Alert.alert('Sin tallas', 'Este producto no tiene tallas disponibles para editar.');
      return;
    }
    const init: Record<string, number> = {};
    product.stock.forEach((row) => {
      const q = sizeQuantities[row.talla] ?? 0;
      init[row.talla] = Math.min(row.cantidad, Math.max(0, q));
    });
    setModalQuantities(init);
    setShowSizeModal(true);
  };

  const bumpModalQty = (talla: string, delta: number) => {
    if (!product?.stock) return;
    const row = product.stock.find((s) => s.talla === talla);
    if (!row) return;
    setModalQuantities((prev) => {
      const cur = prev[talla] ?? 0;
      const next = Math.min(row.cantidad, Math.max(0, cur + delta));
      return { ...prev, [talla]: next };
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={{ color: '#6b7280', marginTop: 12 }}>Cargando producto...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle" size={32} color="#ef4444" />
        <Text style={{ color: '#ef4444', marginTop: 12 }}>Producto no encontrado</Text>
      </SafeAreaView>
    );
  }

  const shippingOptions = product ? generateShippingOptions(product) : [];

  // Générer les méthodes de paiement basées sur le produit et la méthode de livraison
  const generatePaymentMethods = (product: Product, selectedShipping: string) => {
    const methods = [];

    // RopaNova Wallet (toujours disponible)
    methods.push({
      id: 'wallet',
      name: 'RopaNova Wallet',
      description: `Saldo: RD$${walletBalance.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`,
      icon: 'wallet-outline',
      available: true,
      balance: walletBalance,
    });

    // Transferencia Bancaria (pour comptes vérifiés)
    if (product.seller?.verified) {
      methods.push({
        id: 'bank',
        name: 'Transferencia Bancaria',
        description: 'Banco Popular, BHD León, Banreservas',
        icon: 'business-outline',
        available: true,
        banks: ['Banco Popular', 'BHD León', 'Banreservas'],
      });
    }

    // Pago en Efectivo (pour recogida en persona)
    if (product.tipoDeEntregaPermitida?.recogidaEnPersona) {
      methods.push({
        id: 'cash',
        name: 'Pago en Efectivo',
        description: 'Solo disponible para recogida en persona',
        icon: 'cash-outline',
        available: selectedShipping === 'pickup',
        cashOnly: true,
      });
    }

    return methods;
  };

  const paymentMethods = product ? generatePaymentMethods(product, selectedShipping) : [];

  const sizeSummary = formatSizeOrderSummary(sizeQuantities);
  const { unitCount, subtotal, shippingCost, serviceFee, insuranceFee, total, selectedShippingOption } =
    computeCheckoutTotals(
      product,
      sizeQuantities,
      selectedShipping,
      selectedDeliveryCity,
      shippingOptions,
      includeInsurance,
    );

  const formatCurrency = (amount: number) =>
    `RD$${amount.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`;

  const persistOrderToFirestore = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('NO_AUTH');
    }
    const sellerId = product.seller?.id;
    if (!sellerId) {
      throw new Error('NO_SELLER');
    }
    const sellerName =
      product.seller?.storeName?.trim() ||
      [product.seller?.name, product.seller?.lastname].filter(Boolean).join(' ').trim() ||
      product.seller?.username ||
      'Vendedor';
    const { orderCode } = await createOrder({
      buyerId: user.uid,
      sellerId,
      productId: product.id,
      amount: total,
      productTitle: product.title,
      lineSummary: sizeSummary,
      unitCount,
      productImage: product.images?.[0] || product.image,
      sellerName,
      sellerAvatar: product.seller?.avatar ?? '',
      shippingLabel: buildShippingLabel(
        shippingOptions,
        selectedShipping,
        selectedDeliveryCity,
        selectedDeliveryAddress ? selectedDeliveryAddress.name : undefined,
      ),
      shippingMethodId: selectedShipping,
      deliveryCity: selectedShipping === 'home_delivery' ? selectedDeliveryCity : '',
      deliveryAddressId:
        selectedShipping === 'home_delivery' && selectedDeliveryAddress
          ? selectedDeliveryAddress.id
          : undefined,
      deliveryAddressSummary:
        selectedShipping === 'home_delivery' && selectedDeliveryAddress
          ? formatAddressShort(selectedDeliveryAddress)
          : undefined,
      includeInsurance,
      sizeQuantities: cleanSizeQuantities(sizeQuantities),
    });
    if (selectedShipping === 'home_delivery' && selectedDeliveryAddress) {
      await touchAddressLastUsed(user.uid, selectedDeliveryAddress.id);
    }
    return orderCode;
  };

  const handlePurchase = async () => {
    if (unitCount < 1) {
      Alert.alert(
        'Cantidad requerida',
        'Indica al menos una talla con cantidad mayor a 0 antes de comprar.',
      );
      return;
    }

    // Validation pour la méthode de livraison
    if (!selectedShipping || selectedShipping === 'standard') {
      Alert.alert(
        'Método de envío requerido',
        'Por favor selecciona un método de envío antes de continuar'
      );
      return;
    }

    // Validation pour l'envoi à domicile (uniquement si le vendeur l'autorise sur cette annonce)
    if (selectedShipping === 'home_delivery' && homeDeliveryAllowed) {
      if (!selectedDeliveryCity) {
        Alert.alert('Ciudad requerida', 'Selecciona la ciudad de entrega acordada con el vendedor.');
        return;
      }
      if (!selectedDeliveryAddressId) {
        Alert.alert(
          'Dirección requerida',
          'Selecciona una dirección de envío guardada para esta ciudad, o agrega una en Configuración.',
        );
        return;
      }
    }

    // Validation pour la méthode de paiement
    const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedPayment);
    
    // Validation du paiement en espèces
    if (selectedPayment === 'cash' && selectedShipping !== 'pickup') {
      Alert.alert(
        'Método de pago no válido',
        'El pago en efectivo solo está disponible para recogida en persona'
      );
      return;
    }

    // Validation du solde pour RopaNova Wallet
    if (selectedPayment === 'wallet' && selectedPaymentMethod?.balance && total > selectedPaymentMethod.balance) {
      Alert.alert(
        'Saldo insuficiente',
        `Tu saldo actual es de ${formatCurrency(selectedPaymentMethod.balance)}. Por favor recarga tu wallet antes de continuar.`
      );
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const code = await persistOrderToFirestore();
      setConfirmedOrderCode(code);
      setShowConfirmation(true);
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: string }).message)
          : '';
      if (msg === 'NO_AUTH') {
        Alert.alert('Sesión', 'Inicia sesión para completar la compra.');
      } else if (msg === 'NO_SELLER') {
        Alert.alert('Error', 'No se pudo identificar al vendedor de este producto.');
      } else {
        Alert.alert('Error', 'No se pudo registrar el pedido. Inténtalo de nuevo.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (showConfirmation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compra Confirmada</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <View style={styles.confirmIconBg}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
            </View>
            <Text style={styles.confirmTitle}>¡Compra Exitosa!</Text>
            <Text style={styles.confirmSubtitle}>Tu pedido ha sido confirmado y procesado</Text>
          </View>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={{ uri: product.images?.[0] || product.image }} style={styles.productImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.productMeta}>
                  {product.brand} • {sizeSummary}
                </Text>
                <Text style={styles.productQuantity}>
                  {unitCount} {unitCount === 1 ? 'artículo' : 'artículos'}
                </Text>
                <Text style={styles.productPrice}>{formatCurrency(subtotal)}</Text>
              </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.rowBetween}>
              <Text>Número de pedido:</Text>
              <Text style={styles.bold}>{confirmedOrderCode ?? '—'}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text>Método de envío:</Text>
              <Text style={styles.bold}>
                {selectedShippingOption?.name}
                {selectedShipping === 'home_delivery' && selectedDeliveryCity && ` - ${selectedDeliveryCity}`}
              </Text>
            </View>
            {selectedShipping === 'home_delivery' && selectedDeliveryAddress ? (
              <View style={styles.rowBetween}>
                <Text>Dirección:</Text>
                <Text style={[styles.bold, { flex: 1, textAlign: 'right', marginLeft: 8 }]}>
                  {formatAddressShort(selectedDeliveryAddress)}
                </Text>
              </View>
            ) : null}
            <View style={styles.rowBetween}><Text>Seguro incluido:</Text><Text style={styles.bold}>{includeInsurance ? 'Sí' : 'No'}</Text></View>
            <View style={styles.rowBetween}><Text>Total pagado:</Text><Text style={[styles.bold, { color: '#059669' }]}>{formatCurrency(total)}</Text></View>
          </View>
          <View style={styles.alertBox}>
            <Ionicons name="information-circle-outline" size={20} color="#2563eb" style={{ marginRight: 8 }} />
            <Text style={{ color: '#2563eb', flex: 1 }}>
              Sigue el estado en Mis pedidos → detalle del pedido. El vendedor actualizará cada etapa cuando confirme, envíe y entregue. El pago se mantendrá seguro hasta que confirmes la recepción del producto.
            </Text>
          </View>
          <TouchableOpacity style={styles.mainButton} onPress={() => (navigation as any).navigate('OrdersScreen')}>
            <Text style={styles.mainButtonText}>Ver Mis Pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => (navigation as any).navigate('MainTabs')}>
            <Text style={styles.secondaryButtonText}>Continuar Comprando</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Comprar Ahora</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="lock-closed-outline" size={18} color="#059669" />
              <Text style={{ color: '#059669', fontSize: 13 }}>Seguro</Text>
            </View>
          </View>
          {/* Product Summary */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={{ uri: product.images?.[0] || product.image }} style={styles.productImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.productMeta}>
                  {product.brand} • {sizeSummary}
                </Text>
                <Text style={styles.productQuantity}>
                  {unitCount} {unitCount === 1 ? 'artículo' : 'artículos'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <View style={styles.badge}><Text style={styles.badgeText}>{product.condition}</Text></View>
                  <Text style={styles.productPrice}>{formatCurrency(subtotal)}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={openSizeModal}
              >
                <Ionicons name="create-outline" size={20} color="#059669" />
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Seller Info */}
          {product.seller && (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={{ uri: product.seller.avatar }} style={styles.sellerAvatar} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.sellerName}>{product.seller.name} {product.seller.lastname}</Text>
                    {product.seller.verified && (
                      <View style={styles.verifiedBadge}><Ionicons name="shield-checkmark" size={12} color="#2563eb" /><Text style={styles.verifiedText}>Verificado</Text></View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={12} color="#fbbf24" />
                    <Text style={styles.sellerMeta}>{product.seller.rating}</Text>
                    <Text style={styles.sellerMeta}>({product.seller.reviewCount} reseñas)</Text>
                    <Ionicons name="location-outline" size={12} color="#6b7280" style={{ marginLeft: 6 }} />
                    <Text style={styles.sellerMeta}>{product.seller.location}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Shipping Options */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Opciones de Envío</Text>
            {shippingOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.radioRow, selectedShipping === option.id && styles.radioRowActive]}
                onPress={() => setSelectedShipping(option.id)}
              >
                <Ionicons name={option.icon as any} size={20} color="#059669" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.radioLabel}>{option.name}</Text>
                  <Text style={styles.radioDesc}>{option.description}</Text>
                </View>
                <Text style={styles.radioPrice}>{option.price === 0 ? 'Gratis' : formatCurrency(option.price)}</Text>
                <View style={selectedShipping === option.id ? styles.radioSelected : styles.radioUnselected} />
              </TouchableOpacity>
            ))}
            
            {/* Détails des coûts par ville pour les options de livraison sélectionnées */}
            {selectedShipping === 'home_delivery' && selectedShippingOption?.cities && (
              <View style={styles.shippingDetails}>
                <Text style={styles.shippingDetailsTitle}>Selecciona tu ciudad de entrega:</Text>
                {selectedShippingOption.cities.map((city, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.cityCostRow,
                      selectedShipping === 'home_delivery' && selectedDeliveryCity === city.ciudad && styles.selectedCityRow
                    ]}
                    onPress={() => {
                      if (selectedShipping === 'home_delivery') {
                        setSelectedDeliveryCity(city.ciudad);
                      }
                    }}
                    disabled={selectedShipping !== 'home_delivery'}
                  >
                    <View style={styles.cityInfo}>
                      <Ionicons 
                        name="location" 
                        size={14} 
                        color={selectedShipping === 'home_delivery' && selectedDeliveryCity === city.ciudad ? "#059669" : "#6b7280"} 
                      />
                      <Text style={[
                        styles.cityName,
                        selectedShipping === 'home_delivery' && selectedDeliveryCity === city.ciudad && styles.selectedCityName
                      ]}>
                        {city.ciudad}
                      </Text>
                    </View>
                    <View style={[
                      styles.costBadge,
                      selectedShipping === 'home_delivery' && selectedDeliveryCity === city.ciudad && styles.selectedCostBadge
                    ]}>
                      <Text style={styles.costBadgeText}>{formatCurrency(parseInt(city.precio))}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showDeliveryAddressPicker ? (
              <View style={styles.addressSection}>
                <Text style={styles.shippingDetailsTitle}>Dirección de entrega</Text>
                <Text style={styles.addressSectionHint}>
                  Solo para envío a domicilio. Usa una dirección en {selectedDeliveryCity}.
                </Text>
                {loadingAddresses ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 12 }} />
                ) : addressesForSelectedCity.length === 0 ? (
                  <View style={styles.addressEmptyBox}>
                    <Text style={styles.addressEmptyText}>
                      No tienes direcciones guardadas en {selectedDeliveryCity}.
                    </Text>
                    <TouchableOpacity
                      style={styles.addAddressLink}
                      onPress={() => navigation.navigate('AddAddress')}
                    >
                      <Ionicons name="add-circle-outline" size={18} color="#059669" />
                      <Text style={styles.addAddressLinkText}>Agregar dirección</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  addressesForSelectedCity.map((addr) => (
                    <TouchableOpacity
                      key={addr.id}
                      style={[
                        styles.addressRow,
                        selectedDeliveryAddressId === addr.id && styles.addressRowActive,
                      ]}
                      onPress={() => setSelectedDeliveryAddressId(addr.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.addressRowName}>{addr.name}</Text>
                          {addr.isDefault ? (
                            <View style={styles.addressDefaultBadge}>
                              <Text style={styles.addressDefaultBadgeText}>Principal</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.addressRowLine}>{formatAddressShort(addr)}</Text>
                        <Text style={styles.addressRowMeta}>
                          {addr.recipient} · {addr.phone}
                        </Text>
                      </View>
                      <View
                        style={
                          selectedDeliveryAddressId === addr.id
                            ? styles.radioSelected
                            : styles.radioUnselected
                        }
                      />
                    </TouchableOpacity>
                  ))
                )}
                {addressesForSelectedCity.length > 0 ? (
                  <TouchableOpacity
                    style={styles.addAddressLink}
                    onPress={() => navigation.navigate('AddAddress')}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#059669" />
                    <Text style={styles.addAddressLinkText}>Agregar otra dirección</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
          {/* Payment Method */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.radioRow, 
                  selectedPayment === method.id && styles.radioRowActive, 
                  !method.available && styles.disabledRow
                ]}
                onPress={() => method.available && setSelectedPayment(method.id)}
                disabled={!method.available}
              >
                <Ionicons 
                  name={method.icon as any} 
                  size={20} 
                  color={method.available ? "#059669" : "#9ca3af"} 
                  style={{ marginRight: 8 }} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.radioLabel,
                    !method.available && styles.disabledText
                  ]}>
                    {method.name}
                  </Text>
                  <Text style={[
                    styles.radioDesc,
                    !method.available && styles.disabledText
                  ]}>
                    {method.description}
                  </Text>
                  {/* Badges spéciaux */}
                  {method.balance && (
                    <View style={styles.balanceBadge}>
                      <Text style={styles.balanceText}>
                        Saldo disponible: {formatCurrency(method.balance)}
                      </Text>
                      {method.balance < total && (
                        <TouchableOpacity
                          style={styles.rechargeButton}
                          onPress={() => {
                            (navigation as any).navigate('Wallet');
                          }}
                        >
                          <Ionicons name="add" size={14} color="#059669" />
                          <Text style={styles.rechargeButtonText}>Recargar tu Wallet</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {method.cashOnly && (
                    <View style={[
                      styles.cashOnlyBadge,
                      !method.available && styles.disabledBadge
                    ]}>
                      <Text style={[
                        styles.cashOnlyText,
                        !method.available && styles.disabledBadgeText
                      ]}>
                        Solo para recogida en persona
                      </Text>
                    </View>
                  )}
                </View>
                <View style={selectedPayment === method.id ? styles.radioSelected : styles.radioUnselected} />
              </TouchableOpacity>
            ))}
            
            {/* Informations supplémentaires */}
            <View style={styles.paymentInfo}>
              <Ionicons name="shield-checkmark" size={16} color="#059669" style={{ marginRight: 8 }} />
              <Text style={styles.paymentInfoText}>
                Todos los pagos están protegidos por encriptación SSL de 256 bits
              </Text>
            </View>
          </View>
          {/* Insurance Option */}
          <View style={styles.card}>
            {selectedPayment === 'cash' ? (
              // Message d'avertissement pour paiement en espèces
              <View style={styles.cashWarningBox}>
                <Ionicons name="warning" size={20} color="#d97706" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cashWarningTitle}>Pago en Efectivo - Sin Protección</Text>
                  <Text style={styles.cashWarningText}>
                    Al pagar en efectivo, RopaNova no puede garantizar la protección de tu compra. 
                    Te recomendamos coordinar directamente con el vendedor y verificar el producto 
                    antes del pago. RopaNova no se hace responsable de transacciones en efectivo.
                  </Text>
                </View>
              </View>
            ) : (
              // Option d'assurance normale pour les autres méthodes de paiement
              <>
                <TouchableOpacity 
                  style={[
                    styles.checkboxRow, 
                    selectedPayment === 'cash' && styles.disabledRow
                  ]} 
                  onPress={() => setIncludeInsurance((v) => !v)}
                  disabled={selectedPayment === 'cash'}
                >
                  <View style={[
                    styles.checkbox, 
                    includeInsurance && styles.checkboxChecked,
                    selectedPayment === 'cash' && styles.disabledCheckbox
                  ]}>
                    {includeInsurance && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.radioLabel,
                      selectedPayment === 'cash' && styles.disabledText
                    ]}>
                      Seguro de Compra
                    </Text>
                    <Text style={[
                      styles.radioDesc,
                      selectedPayment === 'cash' && styles.disabledText
                    ]}>
                      Protección completa contra daños, pérdida o productos no conformes
                    </Text>
                  </View>
                  <Text style={[
                    styles.radioPrice,
                    selectedPayment === 'cash' && styles.disabledText
                  ]}>
                    {formatCurrency(Math.round(subtotal * 0.05))}
                  </Text>
                </TouchableOpacity>
                {includeInsurance && (
                  <View style={styles.infoBox}>
                    <Ionicons name="shield-checkmark" size={16} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#059669', fontSize: 13, flex: 1 }}>
                   Cobertura completa: reembolso total si el producto no llega, llega dañado o no corresponde con la descripción.
El reclamo debe realizarse dentro de las 48 horas después de la entrega.

                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
          {/* Message to Seller */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mensaje al Vendedor (Opcional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Escribe un mensaje para el vendedor..."
              value={buyerMessage}
              onChangeText={setBuyerMessage}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <Text style={styles.textAreaCount}>{buyerMessage.length}/500 caracteres</Text>
          </View>
          {/* Order Summary */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Resumen del Pedido</Text>
            <View style={styles.rowBetween}><Text>Subtotal:</Text><Text>{formatCurrency(subtotal)}</Text></View>
            <View style={styles.rowBetween}><Text>Envío:</Text><Text>{shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost)}</Text></View>
            <View style={styles.rowBetween}><Text>Comisión de servicio:</Text><Text>{formatCurrency(serviceFee)}</Text></View>
            {includeInsurance && (
              <View style={styles.rowBetween}><Text>Seguro de compra:</Text><Text>{formatCurrency(insuranceFee)}</Text></View>
            )}
            <View style={styles.separator} />
            <View style={[styles.rowBetween, { marginTop: 4 }]}><Text style={styles.bold}>Total:</Text><Text style={[styles.bold, { color: '#059669' }]}>{formatCurrency(total)}</Text></View>
          </View>
          {/* Protection Notice */}
          {includeInsurance && (
            <View style={styles.alertBox}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" style={{ marginRight: 8 }} />
              <Text style={{ color: '#059669', flex: 1 }}>
                Tu pago se mantiene seguro hasta que confirmes la recepción del producto. Con el seguro adicional, tienes protección completa contra cualquier inconveniente.
              </Text>
            </View>
          )}
          {/* Purchase Button */}
          <TouchableOpacity
            style={[
              styles.mainButton, 
              isProcessing && { opacity: 0.7 },
              (!selectedShipping || selectedShipping === 'standard') && styles.disabledButton
            ]}
            onPress={handlePurchase}
            disabled={isProcessing || !selectedShipping || selectedShipping === 'standard'}
          >
            {isProcessing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.mainButtonText}>Procesando...</Text>
              </View>
            ) : (
              <Text style={styles.mainButtonText}>
                {!selectedShipping || selectedShipping === 'standard' 
                  ? 'Selecciona método de envío' 
                  : `Comprar por ${formatCurrency(total)}`
                }
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.legalText}>
            Al hacer clic en &quot;Comprar&quot;, aceptas nuestros <Text style={styles.link} onPress={() => (navigation as any).navigate('TermsScreen')}>Términos de Servicio</Text> y <Text style={styles.link} onPress={() => (navigation as any).navigate('PrivacyPolicyScreen')}>Política de Privacidad</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal pour éditer la taille et la quantité */}
      {showSizeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tallas y cantidades</Text>
              <TouchableOpacity onPress={() => setShowSizeModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                <Text style={styles.modalSectionHint}>
                  Ajusta la cantidad para cada talla.
                </Text>
                {product.stock?.map((item) => (
                  <View key={item.talla} style={styles.sizeQtyRow}>
                    <View style={styles.sizeQtyRowLeft}>
                      <Text style={styles.sizeQtyTalla}>Talla {item.talla}</Text>
                      <Text style={styles.sizeStockText}>{item.cantidad} disponibles</Text>
                    </View>
                    <View style={styles.quantitySelector}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => bumpModalQty(item.talla, -1)}
                      >
                        <Ionicons name="remove" size={20} color="#059669" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{modalQuantities[item.talla] ?? 0}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => bumpModalQty(item.talla, 1)}
                      >
                        <Ionicons name="add" size={20} color="#059669" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <View style={styles.editSummary}>
                  <Text style={styles.editSummaryTitle}>Resumen</Text>
                  <Text style={styles.editSummaryText}>
                    {formatSizeOrderSummary(modalQuantities)} •{' '}
                    {totalUnitsFromQuantities(modalQuantities)}{' '}
                    {totalUnitsFromQuantities(modalQuantities) === 1 ? 'artículo' : 'artículos'}
                  </Text>
                  <Text style={styles.editSummaryPrice}>
                    Subtotal:{' '}
                    {formatCurrency(product.price * totalUnitsFromQuantities(modalQuantities))}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowSizeModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  const sum = totalUnitsFromQuantities(modalQuantities);
                  if (sum < 1) {
                    Alert.alert(
                      'Cantidad requerida',
                      'Selecciona al menos una unidad en alguna talla.',
                    );
                    return;
                  }
                  setSizeQuantities({ ...modalQuantities });
                  setShowSizeModal(false);
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerButton: { padding: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', flex: 1, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  productImg: { width: 64, height: 64, borderRadius: 8, marginRight: 8 },
  productTitle: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  productMeta: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  productQuantity: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  productPrice: { color: '#059669', fontWeight: 'bold', fontSize: 16, marginLeft: 4 },
  badge: { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4 },
  badgeText: { color: '#059669', fontSize: 12, fontWeight: '500' },
  sellerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  sellerName: { fontWeight: 'bold', color: '#111827', fontSize: 14 },
  sellerMeta: { color: '#6b7280', fontSize: 12, marginRight: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e7ff', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  verifiedText: { color: '#2563eb', fontSize: 11, marginLeft: 2 },
  sectionTitle: { fontWeight: 'bold', fontSize: 15, color: '#111827', marginBottom: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  radioRowActive: { backgroundColor: '#f0fdf4' },
  radioLabel: { fontWeight: '500', color: '#111827', fontSize: 14 },
  radioDesc: { color: '#6b7280', fontSize: 12 },
  radioPrice: { fontWeight: 'bold', color: '#059669', fontSize: 14, marginLeft: 8 },
  radioSelected: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#059669', backgroundColor: '#059669', marginLeft: 12 },
  radioUnselected: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#d1d5db', backgroundColor: '#fff', marginLeft: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#059669', borderColor: '#059669' },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginTop: 8 },
  textArea: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, minHeight: 60, fontSize: 14, marginTop: 6 },
  textAreaCount: { color: '#6b7280', fontSize: 12, textAlign: 'right', marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 2 },
  bold: { fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 10 },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', borderRadius: 8, padding: 10, marginBottom: 18 },
  mainButton: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  mainButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#059669', marginTop: 10 },
  secondaryButtonText: { color: '#059669', fontWeight: 'bold', fontSize: 16 },
  legalText: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 10 },
  link: { color: '#059669', textDecorationLine: 'underline' },
  confirmIconBg: { backgroundColor: '#f0fdf4', borderRadius: 40, width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  confirmTitle: { fontSize: 22, fontWeight: 'bold', color: '#059669', marginBottom: 4 },
  confirmSubtitle: { color: '#6b7280', fontSize: 15, marginBottom: 12 },
  shippingDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  shippingDetailsTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  addressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  addressSectionHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 17,
  },
  addressEmptyBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  addressEmptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 18,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  addressRowActive: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  addressRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  addressRowLine: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  addressRowMeta: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  addressDefaultBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addressDefaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  addAddressLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
  },
  addAddressLinkText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  cityCostRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  cityInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cityName: { fontSize: 14, color: '#374151' },
  costBadge: { backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  costBadgeText: { fontSize: 12, fontWeight: '600', color: 'white' },
  selectedCityRow: { backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8 },
  selectedCityName: { color: '#059669', fontWeight: '600' },
  selectedCostBadge: { backgroundColor: '#047857' },
  selectedSizeText: { color: '#059669', fontWeight: '600' },
  disabledRow: { opacity: 0.5 },
  disabledText: { color: '#9ca3af' },
  balanceBadge: { 
    backgroundColor: '#f0fdf4', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  balanceText: { 
    fontSize: 11, 
    color: '#059669', 
    fontWeight: '500' 
  },
  cashOnlyBadge: { 
    backgroundColor: '#fef3c7', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  cashOnlyText: { 
    fontSize: 11, 
    color: '#d97706', 
    fontWeight: '500' 
  },
  paymentInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0fdf4', 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 12 
  },
  paymentInfoText: { 
    fontSize: 12, 
    color: '#059669', 
    flex: 1 
  },
  digitalWalletBadge: { 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  digitalWalletText: { 
    fontSize: 11, 
    color: 'white', 
    fontWeight: '500' 
  },
  disabledBadge: { 
    backgroundColor: '#f3f4f6' 
  },
  disabledBadgeText: { 
    color: '#9ca3af' 
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6
  },
  cashWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#d97706'
  },
  cashWarningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d97706',
    marginBottom: 4
  },
  cashWarningText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16
  },
  disabledCheckbox: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db'
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 4
  },
  editButtonText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600'
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827'
  },
  modalBody: {
    padding: 20,
  },
  modalBodyScroll: {
    maxHeight: 380,
  },
  modalSectionHint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  sizeQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sizeQtyRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  sizeQtyTalla: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  sizeOption: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  sizeOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4'
  },
  sizeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  sizeOptionTextSelected: {
    color: '#059669'
  },
  sizeStockText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center'
  },
  editSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20
  },
  editSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  editSummaryText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4
  },
  editSummaryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669'
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  modalButtonSecondaryText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600'
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#059669'
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 4,
  },
  rechargeButtonText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600'
  },
});

export default BuyScreen; 