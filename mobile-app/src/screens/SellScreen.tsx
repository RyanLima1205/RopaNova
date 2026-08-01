import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  Dimensions,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import { logger } from '../utils/logger'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, auth } from '../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { useEffect } from 'react';

const { width } = Dimensions.get('window')

const popularBrands = [
  'Zara', 'Nike', 'Adidas', 'Mango', 'H&M', 'Pull&Bear', 'Bershka', 'Stradivarius', 'Levi’s', 'Puma', 'Reebok', 'Under Armour', 'Tommy Hilfiger', 'Guess', 'Lacoste', 'Gucci', 'Louis Vuitton', 'Prada', 'Chanel', 'Hermès', 'Sin marca', 'Otra'
];

export const SellScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute()
  const { editMode, productId, productData } = route.params as any || {}
  
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    subcategoria: '',
    marca: '',
    condicionGeneral: '',
    precio: '',
    color: [] as string[],
    material: '',
    location: '',
    shippingAvailable: false,
    shippingPrice: '',
    estadoGeneral: 8,
    estadoTelaMaterial: 8,
    notasSobreElEstado: '',
    measurements: {
      chest: '',
      waist: '',
      length: '',
      shoulders: '',
      hips: '',
      inseam: '',
    },
    defectosEspecificos: '',
    autenticidad: 'no-especificado',
    stock: [{ talla: '', cantidad: 1 }],
    tipoDeEntregaPermitida: {
      envioAPuntoDeRecogida: false,
      recogidaEnPersona: false,
      envioADomicilio: false,
    },
    ciudadRecogidaEnPersona: '',
    ciudadesParaEnvioADomicilio: [] as { ciudad: string; precio: string }[],
    instruccionesParaEntrega: '',
  })

  const [brandQuery, setBrandQuery] = useState('');
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [otherBrand, setOtherBrand] = useState('');
  const [sizeDropdownIndex, setSizeDropdownIndex] = useState<number | null>(null);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  // Estado para mostrar los tooltips informativos
  const [showTallaInfo, setShowTallaInfo] = useState(false);
  const [showEntregaInfo, setShowEntregaInfo] = useState(false);
  const [showColorInfo, setShowColorInfo] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (editMode && productData) {
      setIsEditing(true);

      logger.log('Cargando datos del producto para edición:', productData);

      const loadOriginalData = async () => {
        if (productId) {
          try {
            const db = getFirestore(app);
            const productRef = doc(db, 'products', productId);
            const productSnap = await getDoc(productRef);
            
            if (productSnap.exists()) {
              const originalData = productSnap.data();
              logger.log('Datos originales obtenidos:', originalData);
              
              const convertedData = {
                titulo: originalData.titulo || '',
                descripcion: originalData.descripcion || '',
                categoria: originalData.categoria || '',
                subcategoria: originalData.subcategoria || '',
                marca: originalData.marca || '',
                condicionGeneral: originalData.condicionGeneral || '',
                precio: originalData.precio || '',
                color: originalData.color || [],
                material: originalData.material || '',
                location: originalData.location || '',
                shippingAvailable: originalData.shippingAvailable || false,
                shippingPrice: originalData.shippingPrice || '',
                estadoGeneral: originalData.estadoGeneral || 8,
                estadoTelaMaterial: originalData.estadoTelaMaterial || 8,
                notasSobreElEstado: originalData.notasSobreElEstado || '',
                measurements: originalData.measurements || {
                  chest: '',
                  waist: '',
                  length: '',
                  shoulders: '',
                  hips: '',
                  inseam: '',
                },
                defectosEspecificos: originalData.defectosEspecificos || '',
                autenticidad: originalData.autenticidad || 'no-especificado',
                stock: originalData.stock && originalData.stock.length > 0 
                  ? originalData.stock.map((item: any) => ({
                      talla: item.talla || '',
                      cantidad: item.cantidad || 1
                    }))
                  : [{ talla: '', cantidad: 1 }],
                tipoDeEntregaPermitida: originalData.tipoDeEntregaPermitida || {
                  envioAPuntoDeRecogida: false,
                  recogidaEnPersona: false,
                  envioADomicilio: false,
                },
                ciudadRecogidaEnPersona: originalData.ciudadRecogidaEnPersona || '',
                ciudadesParaEnvioADomicilio: originalData.ciudadesParaEnvioADomicilio || [],
                instruccionesParaEntrega: originalData.instruccionesParaEntrega || '',
              };
              
              logger.log('Datos convertidos para el formulario:', convertedData);
              setFormData(convertedData);
              setSelectedImages(originalData.images || []);
            } else {
              logger.log('Sin datos originales, usando los datos recibidos');
              const convertedData = {
                titulo: productData.title || productData.titulo || '',
                descripcion: productData.description || productData.descripcion || '',
                categoria: productData.category || productData.categoria || '',
                subcategoria: productData.subcategory || productData.subcategoria || '',
                marca: productData.brand || productData.marca || '',
                condicionGeneral: productData.condition || productData.condicionGeneral || '',
                precio: productData.price || productData.precio || '',
                color: productData.color || [],
                material: productData.material || '',
                location: productData.location || '',
                shippingAvailable: productData.shippingAvailable || false,
                shippingPrice: productData.shippingPrice || '',
                estadoGeneral: productData.estadoGeneral || 8,
                estadoTelaMaterial: productData.estadoTelaMaterial || 8,
                notasSobreElEstado: productData.notasSobreElEstado || '',
                measurements: productData.measurements || {
                  chest: '',
                  waist: '',
                  length: '',
                  shoulders: '',
                  hips: '',
                  inseam: '',
                },
                defectosEspecificos: productData.defectosEspecificos || '',
                autenticidad: productData.autenticidad || 'no-especificado',
                stock: productData.stock && productData.stock.length > 0 
                  ? productData.stock.map((item: any) => ({
                      talla: item.talla || '',
                      cantidad: item.cantidad || 1
                    }))
                  : [{ talla: '', cantidad: 1 }],
                tipoDeEntregaPermitida: productData.tipoDeEntregaPermitida || {
                  envioAPuntoDeRecogida: false,
                  recogidaEnPersona: false,
                  envioADomicilio: false,
                },
                ciudadRecogidaEnPersona: productData.ciudadRecogidaEnPersona || '',
                ciudadesParaEnvioADomicilio: productData.ciudadesParaEnvioADomicilio || [],
                instruccionesParaEntrega: productData.instruccionesParaEntrega || '',
              };
              
              logger.log('Datos convertidos para el formulario:', convertedData);
              setFormData(convertedData);
              setSelectedImages(productData.images || []);
            }
          } catch (error) {
            logger.error('Error al cargar los datos originales:', error);
            const convertedData = {
              titulo: productData.title || productData.titulo || '',
              descripcion: productData.description || productData.descripcion || '',
              categoria: productData.category || productData.categoria || '',
              subcategoria: productData.subcategory || productData.subcategoria || '',
              marca: productData.brand || productData.marca || '',
              condicionGeneral: productData.condition || productData.condicionGeneral || '',
              precio: productData.price || productData.precio || '',
              color: productData.color || [],
              material: productData.material || '',
              location: productData.location || '',
              shippingAvailable: productData.shippingAvailable || false,
              shippingPrice: productData.shippingPrice || '',
              estadoGeneral: productData.estadoGeneral || 8,
              estadoTelaMaterial: productData.estadoTelaMaterial || 8,
              notasSobreElEstado: productData.notasSobreElEstado || '',
              measurements: productData.measurements || {
                chest: '',
                waist: '',
                length: '',
                shoulders: '',
                hips: '',
                inseam: '',
              },
              defectosEspecificos: productData.defectosEspecificos || '',
              autenticidad: productData.autenticidad || 'no-especificado',
              stock: productData.stock && productData.stock.length > 0 
                ? productData.stock.map((item: any) => ({
                    talla: item.talla || '',
                    cantidad: item.cantidad || 1
                  }))
                : [{ talla: '', cantidad: 1 }],
              tipoDeEntregaPermitida: productData.tipoDeEntregaPermitida || {
                envioAPuntoDeRecogida: false,
                recogidaEnPersona: false,
                envioADomicilio: false,
              },
              ciudadRecogidaEnPersona: productData.ciudadRecogidaEnPersona || '',
              ciudadesParaEnvioADomicilio: productData.ciudadesParaEnvioADomicilio || [],
              instruccionesParaEntrega: productData.instruccionesParaEntrega || '',
            };
            
            logger.log('Datos convertidos para el formulario (fallback):', convertedData);
            setFormData(convertedData);
            setSelectedImages(productData.images || []);
          }
        } else {
          const convertedData = {
            titulo: productData.title || productData.titulo || '',
            descripcion: productData.description || productData.descripcion || '',
            categoria: productData.category || productData.categoria || '',
            subcategoria: productData.subcategory || productData.subcategoria || '',
            marca: productData.brand || productData.marca || '',
            condicionGeneral: productData.condition || productData.condicionGeneral || '',
            precio: productData.price || productData.precio || '',
            color: productData.color || [],
            material: productData.material || '',
            location: productData.location || '',
            shippingAvailable: productData.shippingAvailable || false,
            shippingPrice: productData.shippingPrice || '',
            estadoGeneral: productData.estadoGeneral || 8,
            estadoTelaMaterial: productData.estadoTelaMaterial || 8,
            notasSobreElEstado: productData.notasSobreElEstado || '',
            measurements: productData.measurements || {
              chest: '',
              waist: '',
              length: '',
              shoulders: '',
              hips: '',
              inseam: '',
            },
            defectosEspecificos: productData.defectosEspecificos || '',
            autenticidad: productData.autenticidad || 'no-especificado',
            stock: productData.stock && productData.stock.length > 0 
              ? productData.stock.map((item: any) => ({
                  talla: item.talla || '',
                  cantidad: item.cantidad || 1
                }))
              : [{ talla: '', cantidad: 1 }],
            tipoDeEntregaPermitida: productData.tipoDeEntregaPermitida || {
              envioAPuntoDeRecogida: false,
              recogidaEnPersona: false,
              envioADomicilio: false,
            },
            ciudadRecogidaEnPersona: productData.ciudadRecogidaEnPersona || '',
            ciudadesParaEnvioADomicilio: productData.ciudadesParaEnvioADomicilio || [],
            instruccionesParaEntrega: productData.instruccionesParaEntrega || '',
          };
          
          logger.log('Datos convertidos para el formulario:', convertedData);
          setFormData(convertedData);
          setSelectedImages(productData.images || []);
        }
      };
      
      loadOriginalData();
    }
  }, [editMode, productData, productId]);

  const filteredBrands = brandQuery.length > 0
    ? popularBrands.filter(b => b.toLowerCase().includes(brandQuery.toLowerCase()))
    : popularBrands;

  const sortedBrands = [
    ...popularBrands.filter(b => b !== 'Sin marca' && b !== 'Otra').sort((a, b) => a.localeCompare(b)),
    'Sin marca',
    'Otra',
  ];

  const categories = {
    Mujer: ['Vestidos', 'Pantalones', 'Zapatos', 'Blusas', 'T-shirts', 'Faldas', 'Shorts', 'Licras', 'Fajas', 'Trajes de Baño', 'Accesorios', 'Lencerias', 'Ropa Interior', 'Camisas','Deportivas', 'Uniformes'],
    Hombre: ['T-shirts', 'Camisas','Poloches', 'Pantalones',' Shorts', 'Zapatos', 'Abrigos', 'Deportiva', 'Accesorios', 'Trajes de Baño', 'Gorras', 'Franelas', 'Deportivas', 'Uniformes'],
    Niños: ['Ropa Bebé', 'Niña', 'Niño', 'Zapatos', 'Accesorios'],
    Libros: ['Novela', 'Infantil', 'Educativo', 'Cómics', 'Cocina', 'Autoayuda', 'Ciencia Ficción', 'Misterio', 'Otros'],
  }

  const conditionOptions = [
    { value: 'nuevo', label: 'Nuevo', description: 'Producto sin uso previo' },
    { value: 'segunda-mano', label: 'Segunda Mano', description: 'Producto usado anteriormente' },
  ]

  const authenticityOptions = [
    { value: '100% original', label: '100% Original', description: 'Producto de marca auténtico' },
    { value: 'replica', label: 'Réplica', description: 'Copia o imitación del producto original' },
    { value: 'no-especificado', label: 'No Especificado', description: 'No se especifica la autenticidad' },
  ]

  const colorOptions = [
    { name: 'Negro', value: 'negro', color: '#000000' },
    { name: 'Blanco', value: 'blanco', color: '#FFFFFF' },
    { name: 'Gris', value: 'gris', color: '#808080' },
    { name: 'Azul', value: 'azul', color: '#0066CC' },
    { name: 'Azul Marino', value: 'azul-marino', color: '#001f3f' },
    { name: 'Rojo', value: 'rojo', color: '#FF4136' },
    { name: 'Rosa', value: 'rosa', color: '#FF69B4' },
    { name: 'Verde', value: 'verde', color: '#2ECC40' },
    { name: 'Amarillo', value: 'amarillo', color: '#FFDC00' },
    { name: 'Naranja', value: 'naranja', color: '#FF851B' },
    { name: 'Morado', value: 'morado', color: '#B10DC9' },
    { name: 'Marrón', value: 'marron', color: '#8B4513' },
  ]

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Permite el acceso a la galería para agregar fotos.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - selectedImages.length, // Límite de 10 imágenes en total
    });

    if (!result.canceled) {
      // Expo SDK 49+ usa result.assets
      const uris = result.assets ? (result.assets as any[]).map(asset => asset.uri) : [];
      setSelectedImages(prev => [...prev, ...uris].slice(0, 10));
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value,
        },
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = () => {
    setTriedSubmit(true);
    if (!formData.titulo || !formData.precio || selectedImages.length === 0 || !formData.categoria || !formData.subcategoria || !formData.condicionGeneral || formData.color.length === 0) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios')
      return
    }
    const hasDelivery = Object.values(formData.tipoDeEntregaPermitida).some(Boolean);
    if (!hasDelivery) {
      Alert.alert('Error', 'Debes seleccionar al menos un tipo de entrega (punto de recogida, recogida en persona o envío a domicilio).');
      return;
    }
    handleUpdateProduct();
  }

  const handleUpdateProduct = async () => {
    if (!productId) return;
    
    try {
      setIsPublishing(true);
      const db = getFirestore(app);
      const productRef = doc(db, 'products', productId);
      
      // Preparar los datos actualizados
      const updatedData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria,
        marca: formData.marca,
        condicionGeneral: formData.condicionGeneral,
        precio: formData.precio,
        color: formData.color,
        material: formData.material,
        location: formData.location,
        shippingAvailable: formData.shippingAvailable,
        shippingPrice: formData.shippingPrice,
        estadoGeneral: formData.estadoGeneral,
        estadoTelaMaterial: formData.estadoTelaMaterial,
        notasSobreElEstado: formData.notasSobreElEstado,
        measurements: formData.measurements,
        defectosEspecificos: formData.defectosEspecificos,
        autenticidad: formData.autenticidad,
        stock: normalizeStockCantidadesForSave(formData.stock),
        tipoDeEntregaPermitida: formData.tipoDeEntregaPermitida,
        ciudadRecogidaEnPersona: formData.ciudadRecogidaEnPersona,
        ciudadesParaEnvioADomicilio: formData.ciudadesParaEnvioADomicilio,
        instruccionesParaEntrega: formData.instruccionesParaEntrega,
        images: selectedImages,
        updatedAt: new Date(),
      };
      
      await updateDoc(productRef, updatedData);
      
      Alert.alert(
        '¡Guardado!', 
        'Los cambios han sido guardados exitosamente.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      logger.error('Error al actualizar:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios. Inténtalo de nuevo.');
    } finally {
      setIsPublishing(false);
    }
  }

  const getConditionColor = (value: number) => {
    if (value >= 9) return '#059669'
    if (value >= 7) return '#fbbf24'
    return '#ef4444'
  }

  const getConditionLabel = (value: number) => {
    if (value >= 9) return 'Excelente'
    if (value >= 7) return 'Bueno'
    if (value >= 5) return 'Regular'
    return 'Malo'
  }

  const toggleColor = (colorValue: string) => {
    const currentColors = formData.color
    const isSelected = currentColors.includes(colorValue)
    const newColors = isSelected
      ? currentColors.filter((c) => c !== colorValue)
      : [...currentColors, colorValue]
    handleInputChange('color', newColors)
  }

  const addStockItem = () => {
    setFormData(prev => ({
      ...prev,
      stock: [...prev.stock, { talla: '', cantidad: 1 }]
    }))
  }

  const removeStockItem = (index: number) => {
    if (sizeDropdownIndex === index) {
      setShowSizeModal(false);
      setSizeDropdownIndex(null);
    } else {
      setSizeDropdownIndex((prev) => {
        if (prev === null) return null;
        if (prev > index) return prev - 1;
        return prev;
      });
    }
    setFormData((prev) => ({
      ...prev,
      stock: prev.stock.filter((_, i) => i !== index),
    }));
  };

  const updateStockItem = (index: number, field: 'talla' | 'cantidad', value: string | number) => {
    setFormData(prev => {
      const newStock = [...prev.stock];
      if (field === 'talla') {
        newStock[index].talla = value as string;
      } else {
        newStock[index].cantidad = value as number;
      }
      return { ...prev, stock: newStock };
    });
  };

  // Solo números; 0 = campo vacío o en proceso de escritura (se corrige al perder foco o al guardar)
  const parseCantidadInput = (text: string): number => {
    const digits = text.replace(/\D/g, '');
    if (digits === '') return 0;
    const n = parseInt(digits, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const handleStockCantidadChange = (index: number, text: string) => {
    updateStockItem(index, 'cantidad', parseCantidadInput(text));
  };

  const finalizeStockCantidad = (index: number) => {
    setFormData(prev => {
      const newStock = [...prev.stock];
      const q = newStock[index]?.cantidad;
      if (newStock[index] && (!q || q < 1)) {
        newStock[index].cantidad = 1;
      }
      return { ...prev, stock: newStock };
    });
  };

  const normalizeStockCantidadesForSave = (
    stock: { talla: string; cantidad: number }[]
  ) =>
    stock.map((row) => ({
      ...row,
      cantidad: Math.max(1, Math.floor(Number(row.cantidad)) || 0),
    }));

  const resetSellFormToEmpty = () => {
    setFormData({
      titulo: '', descripcion: '', categoria: '', subcategoria: '', marca: '', condicionGeneral: '', precio: '', color: [], material: '', location: '', shippingAvailable: false, shippingPrice: '', estadoGeneral: 8, estadoTelaMaterial: 8, notasSobreElEstado: '', measurements: { chest: '', waist: '', length: '', shoulders: '', hips: '', inseam: '' }, defectosEspecificos: '', autenticidad: 'no-especificado', stock: [{ talla: '', cantidad: 1 }], tipoDeEntregaPermitida: { envioAPuntoDeRecogida: false, recogidaEnPersona: false, envioADomicilio: false }, ciudadRecogidaEnPersona: '', ciudadesParaEnvioADomicilio: [], instruccionesParaEntrega: '',
    });
    setSelectedImages([]);
    setTriedSubmit(false);
  };

  const navigateToOwnProfileTab = () => {
    if (route.name === 'SellScreen') {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } else {
      (navigation as { navigate: (name: 'Profile') => void }).navigate('Profile');
    }
  };

  const dismissPublishSuccessAndGoToProfile = () => {
    resetSellFormToEmpty();
    navigateToOwnProfileTab();
  };

  const handleDeliveryMethodChange = (method: keyof typeof formData.tipoDeEntregaPermitida) => {
    setFormData(prev => ({
      ...prev,
      tipoDeEntregaPermitida: {
        ...prev.tipoDeEntregaPermitida,
        [method]: !prev.tipoDeEntregaPermitida[method],
      },
    }));
  };

  // Mapa de tallas por subcategoría (alineado con AdvancedFilters)
  const sizeOptions: Record<string, string[]> = {
    // Ropa general (XS-XXXL)
    'T-shirts': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Camisas': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Blusas': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Vestidos': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Faldas': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Shorts': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Licras': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Trajes de Baño': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Ropa Interior': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Deportivas': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Deportiva': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Uniformes': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Poloches': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Abrigos': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    'Franelas': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'],
    
    // Pantalones (tallas americanas)
    'Pantalones': ['26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '38', '40', '42', '44', 'Única', 'Otra talla'],
    // Zapatos adultos (tallas americanas)
    'Zapatos': ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', 'Única', 'Otra talla'],
    // Zapatos infantiles
    'Zapatos Infantiles': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', 'Única', 'Otra talla'],
    // Ropa bebé (por meses)
    'Ropa de Bebé (0-24 meses)': ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M', 'Única', 'Otra talla'],
    'Ropa Bebé': ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M', 'Única', 'Otra talla'],
    // Ropa niños (por edad)
    'Ropa de Niña (2-12 años)': ['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '14', '16', 'Única', 'Otra talla'],
    'Ropa de Niño (2-12 años)': ['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '14', '16', 'Única', 'Otra talla'],
    'Niña': ['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '14', '16', 'Única', 'Otra talla'],
    'Niño': ['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '14', '16', 'Única', 'Otra talla'],
    // Accesorios y artículos de talla única
    'Accesorios': ['Única'],
    'Accesorios Infantiles': ['Única'],
    'Gorras': ['Única'],
    'Lencerias': ['Única'],
    'Juguetes y Juegos': ['Única'],
    'Disfraces': ['Única'],
    'Artículos Deportivos Infantiles': ['Única'],
    
    // Libros
    'Universitarios': ['Único'],
    'Novelas Románticas': ['Único'],
    'Negocios': ['Único'],
    'Autoayuda y Motivación': ['Único'],
    'Cocina': ['Único'],
    'Salud y Bienestar': ['Único'],
    'Religiosos': ['Único'],
    'Historia Dominicana': ['Único'],
    'Idiomas': ['Único'],
    'Infantiles': ['Único'],
    'Libros': ['Único'],
    'Novela': ['Único'],
    'Infantil': ['Único'],
    'Educativo': ['Único'],
    'Cómics': ['Único'],
    'Autoayuda': ['Único'],
    'Ciencia Ficción': ['Único'],
    'Misterio': ['Único'],
    'Otros': ['Único'],
    
    // Sin coincidencia, se usarán tallas por defecto (ver getSortedSizes)
  };

  const getSortedSizes = (subcategory: string) => {
    const options = sizeOptions[subcategory] || ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Única', 'Otra talla'];
    // Siempre colocar 'Única', 'Único' y 'Otra talla' al final
    const filtered = options.filter(opt => opt !== 'Única' && opt !== 'Único' && opt !== 'Otra talla');
    const uniqueOptions = options.filter(opt => opt === 'Única' || opt === 'Único');
    return [...filtered, ...uniqueOptions, 'Otra talla'];
  };

  const [showInPersonCityModal, setShowInPersonCityModal] = useState(false);
  const inPersonCities = [
    'Santo Domingo', 'Santiago', 'La Romana', 'Puerto Plata', 
    'Punta Cana', 'Barahona', 'San Pedro de Macorís', 'La Vega'
  ];
  // Agrega la ciudad de recogida en persona al formData

  const allCities = [
    'Santo Domingo', 'Santiago', 'La Romana', 'Puerto Plata', 
    'Punta Cana', 'Barahona', 'San Pedro de Macorís', 'La Vega'
  ];

  // Gestionar la selección/deselección de una ciudad para envío a domicilio
  const toggleDeliveryCity = (ciudad: string) => {
    setFormData(prev => {
      const exists = prev.ciudadesParaEnvioADomicilio.find((c: any) => c.ciudad === ciudad);
      if (exists) {
        return {
          ...prev,
          ciudadesParaEnvioADomicilio: prev.ciudadesParaEnvioADomicilio.filter((c: any) => c.ciudad !== ciudad),
        };
      } else {
        return {
          ...prev,
          ciudadesParaEnvioADomicilio: [...prev.ciudadesParaEnvioADomicilio, { ciudad, precio: '' }],
        };
      }
    });
  };

  // Gestionar el cambio de precio para una ciudad de envío
  const setDeliveryCityPrice = (ciudad: string, precio: string) => {
    setFormData(prev => ({
      ...prev,
      ciudadesParaEnvioADomicilio: prev.ciudadesParaEnvioADomicilio.map((c: any) =>
        c.ciudad === ciudad ? { ...c, precio } : c
      ),
    }));
  };

  // Validación global del formulario
  const isFormValid = () => {
    const hasDelivery = Object.values(formData.tipoDeEntregaPermitida).some(Boolean);
    if (!formData.titulo || !formData.precio || selectedImages.length === 0 || !hasDelivery) return false;
    return true;
  };

  // Guardado automático del formulario
  React.useEffect(() => {
    AsyncStorage.setItem('sellFormDraft', JSON.stringify({ ...formData, selectedImages }));
  }, [formData, selectedImages]);

  // Limpiar los datos antiguos al montar el componente
  React.useEffect(() => {
    (async () => {
      try {
        const draft = await AsyncStorage.getItem('sellFormDraft');
        if (draft) {
          const parsed = JSON.parse(draft);
          // Si el borrador antiguo contiene claves obsoletas, eliminarlo
          if (parsed.conditionCleanliness || parsed.conditionColor || parsed.conditionShape || parsed.conditionVerified) {
            await AsyncStorage.removeItem('sellFormDraft');
            logger.log('Borrador antiguo eliminado: contiene claves obsoletas');
          }
        }
      } catch (error) {
        logger.log('Error al limpiar el borrador:', error);
      }
    })();
  }, []);

  // Restauración del formulario al montar (solo una vez)
  React.useEffect(() => {
    if (draftRestored) return;
    (async () => {
      const draft = await AsyncStorage.getItem('sellFormDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        // Eliminar las claves antiguas que ya no se usan
        const cleanedData = {
          titulo: parsed.titulo || '',
          descripcion: parsed.descripcion || '',
          categoria: parsed.categoria || '',
          subcategoria: parsed.subcategoria || '',
          marca: parsed.marca || '',
          condicionGeneral: parsed.condicionGeneral || '',
          precio: parsed.precio || '',
          color: parsed.color || [],
          material: parsed.material || '',
          location: parsed.location || '',
          shippingAvailable: parsed.shippingAvailable || false,
          shippingPrice: parsed.shippingPrice || '',
          estadoGeneral: parsed.estadoGeneral || 8,
          estadoTelaMaterial: parsed.estadoTelaMaterial || 8,
          notasSobreElEstado: parsed.notasSobreElEstado || '',
          measurements: parsed.measurements || { chest: '', waist: '', length: '', shoulders: '', hips: '', inseam: '' },
          defectosEspecificos: parsed.defectosEspecificos || '',
          autenticidad: parsed.autenticidad || 'no-especificado',
          stock: parsed.stock || [{ talla: '', cantidad: 1 }],
          tipoDeEntregaPermitida: parsed.tipoDeEntregaPermitida || { envioAPuntoDeRecogida: false, recogidaEnPersona: false, envioADomicilio: false },
          ciudadRecogidaEnPersona: parsed.ciudadRecogidaEnPersona || '',
          ciudadesParaEnvioADomicilio: parsed.ciudadesParaEnvioADomicilio || [],
          instruccionesParaEntrega: parsed.instruccionesParaEntrega || '',
        };
        setFormData(cleanedData);
        if (parsed.selectedImages) setSelectedImages(parsed.selectedImages);
      }
      setDraftRestored(true);
    })();
  }, [draftRestored]);

  const db = getFirestore(app);
  const storage = getStorage(app);

  // Subir una imagen a Firebase Storage
  const uploadImage = async (imageUri: string, imageName: string): Promise<string> => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error('Usuario no conectado');
      }

      logger.log('Iniciando subida de imagen:', imageUri);
      
      // Verificar si ya es una URL pública (no necesita subirse)
      if (imageUri.startsWith('http') && !imageUri.includes('firebasestorage.googleapis.com')) {
        logger.log('La imagen ya es una URL pública:', imageUri);
        return imageUri;
      }
      
      // Verificar si es una URI local de Expo (necesita subirse)
      if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
        logger.log('URI local detectado, subiendo a Firebase Storage...');
      } else if (imageUri.startsWith('http') && imageUri.includes('firebasestorage.googleapis.com')) {
        logger.log('La imagen ya está en Firebase Storage:', imageUri);
        return imageUri;
      } else {
        logger.log('URI de imagen inválida:', imageUri);
        throw new Error('URI de imagen inválida');
      }
      
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Error al obtener: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      logger.log('Blob creado, tamaño:', blob.size);
      
      const storageRef = ref(storage, `products/${uid}/${imageName}`);
      logger.log('Referencia de storage creada:', storageRef.fullPath);
      
      const uploadResult = await uploadBytes(storageRef, blob);
      logger.log('Subida completada:', uploadResult);
      
      const downloadURL = await getDownloadURL(storageRef);
      logger.log('URL de descarga obtenida:', downloadURL);
      
      return downloadURL;
    } catch (error: any) {
      logger.error('Error detallado al subir la imagen:', error);
      logger.error('Tipo de error:', typeof error);
      logger.error('Mensaje de error:', error.message);
      logger.error('Código de error:', error.code);
      
      throw error;
    }
  };

  async function publierProduit() {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para publicar un anuncio.');
      return;
    }
    
    setIsPublishing(true);
    // Crear el objeto en el orden exacto deseado
    const produit: any = {};
    
    // 1. FOTOS DEL PRODUCTO (Images) - Subida a Firebase Storage
    try {
      const uploadedImageUrls = [];
      for (let i = 0; i < selectedImages.length; i++) {
        try {
          const imageName = `product_${Date.now()}_${i}.jpg`;
          const imageUrl = await uploadImage(selectedImages[i], imageName);
          uploadedImageUrls.push(imageUrl);
          logger.log(`Imagen ${i + 1} subida:`, imageUrl);
        } catch (imageError) {
          logger.error(`Error al subir imagen ${i}:`, imageError);
        }
      }
      produit.images = uploadedImageUrls;
      logger.log('Todas las imágenes subidas:', produit.images);
    } catch (error) {
      logger.error('Error general al subir imágenes:', error);
      produit.images = [];
    }
    
    // 2. INFORMACIÓN BÁSICA (Basic Information)
    produit.titulo = formData.titulo;
    produit.descripcion = formData.descripcion;
    produit.categoria = formData.categoria;
    produit.subcategoria = formData.subcategoria;
    
    // 3. EVALUACIÓN DEL ESTADO (Condition Assessment)
    produit.condicionGeneral = formData.condicionGeneral;
    produit.autenticidad = formData.autenticidad;
    produit.estadoGeneral = formData.estadoGeneral;
    produit.estadoTelaMaterial = formData.estadoTelaMaterial;
    produit.notasSobreElEstado = formData.notasSobreElEstado;
    produit.defectosEspecificos = formData.defectosEspecificos;
    
    // 4. DETALLES DEL PRODUCTO (Product Details)
    produit.marca = formData.marca;
    produit.material = formData.material;
    produit.color = formData.color;
    produit.stock = normalizeStockCantidadesForSave(formData.stock);
    
    // 5. MEDIDAS (Measurements)
    produit.measurements = formData.measurements;
    
    // 6. PRECIO (Pricing)
    produit.precio = formData.precio;
    
    // 7. UBICACIÓN Y ENVÍO (Location and Shipping)
    produit.tipoDeEntregaPermitida = formData.tipoDeEntregaPermitida;
    produit.ciudadRecogidaEnPersona = formData.ciudadRecogidaEnPersona;
    produit.ciudadesParaEnvioADomicilio = formData.ciudadesParaEnvioADomicilio;
    produit.instruccionesParaEntrega = formData.instruccionesParaEntrega;
    produit.location = formData.location;
    produit.shippingAvailable = formData.shippingAvailable;
    produit.shippingPrice = formData.shippingPrice;
    
    // 8. METADATOS (Metadata)
    produit.userId = user.uid;
    produit.createdAt = new Date();
    
    logger.log('Producto a guardar en Firestore:', produit);
    
    try {
      await addDoc(collection(db, 'products'), produit);
      setIsPublishing(false);
      Alert.alert('¡Éxito!', '¡Su Anuncio ha sido publicado exitosamente!', [
        { text: 'OK', onPress: dismissPublishSuccessAndGoToProfile },
      ]);
    } catch (e: any) {
      setIsPublishing(false);
      Alert.alert('Error', 'Error al publicar: ' + (e.message || e));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Artículo' : 'Vender Artículo'}
        </Text>
        <TouchableOpacity 
          style={[
            styles.publishButton,
            ((triedSubmit && !isFormValid()) || isPublishing) && styles.publishButtonDisabled
          ]} 
          onPress={async () => {
            setTriedSubmit(true);
            if (!isFormValid()) return;
            if (isEditing) {
              handleSubmit();
            } else {
            await publierProduit();
            }
          }}
          disabled={isPublishing}
        >
          <Text style={styles.publishButtonText}>
            {isPublishing ? (isEditing ? 'Guardando...' : 'Publicando...') : (isEditing ? 'Guardar' : 'Publicar')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotos del Producto</Text>
          <Text style={styles.sectionSubtitle}>Agrega hasta 10 fotos. La primera será la foto principal.</Text>
          {/* Vista de la foto principal */}
          {selectedImages[0] && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Image source={{ uri: selectedImages[0] }} style={styles.mainImagePreview} />
            </View>
          )}
          {/* Cuadrícula de miniaturas (excepto la foto principal) */}
          <View style={styles.imageGrid}>
            {selectedImages.slice(1).map((image, index) => (
              <View key={index + 1} style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.productImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index + 1)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
                {/* Botones Subir/Bajar */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 2 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (index + 1 > 1) {
                        const newImages = [...selectedImages];
                        const temp = newImages[index + 1];
                        newImages[index + 1] = newImages[index];
                        newImages[index] = temp;
                        setSelectedImages(newImages);
                      }
                    }}
                    disabled={index + 1 === 1}
                    style={{ opacity: index + 1 === 1 ? 0.3 : 1, marginRight: 4 }}
                  >
                    <Ionicons name="arrow-up" size={18} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (index + 1 < selectedImages.length - 1) {
                        const newImages = [...selectedImages];
                        const temp = newImages[index + 1];
                        newImages[index + 1] = newImages[index + 2];
                        newImages[index + 2] = temp;
                        setSelectedImages(newImages);
                      }
                    }}
                    disabled={index + 1 === selectedImages.length - 1}
                    style={{ opacity: index + 1 === selectedImages.length - 1 ? 0.3 : 1 }}
                  >
                    <Ionicons name="arrow-down" size={18} color="#374151" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {selectedImages.length < 10 && (
              <TouchableOpacity
                style={[styles.addImageButton, triedSubmit && selectedImages.length === 0 && { borderColor: 'red' }]}
                onPress={handleImageUpload}
              >
            <Ionicons name="camera-outline" size={32} color="#6b7280" />
                <Text style={styles.addImageText}>Agregar Foto</Text>
          </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Título del Producto *</Text>
            <TextInput
              style={[styles.input, triedSubmit && !formData.titulo && { borderColor: 'red' }]}
              placeholder="Ej: Vestido elegante de noche Zara talla M"
              value={formData.titulo}
              onChangeText={(value) => handleInputChange('titulo', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe tu producto: estado, características especiales, motivo de venta..."
              value={formData.descripcion}
              onChangeText={(value) => handleInputChange('descripcion', value)}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Categoría *</Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, triedSubmit && !formData.categoria && { borderColor: 'red' }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[
                styles.dropdownButtonText,
                !formData.categoria && styles.dropdownPlaceholder
              ]}>
                {formData.categoria || 'Seleccionar categoría'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subcategoría *</Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, triedSubmit && !formData.subcategoria && { borderColor: 'red' }]}
              onPress={() => setShowSubcategoryModal(true)}
              disabled={!formData.categoria}
            >
              <Text style={[
                styles.dropdownButtonText,
                (!formData.subcategoria || !formData.categoria) && styles.dropdownPlaceholder
              ]}>
                {formData.categoria 
                  ? (formData.subcategoria || 'Seleccionar subcategoría')
                  : 'Primero selecciona una categoría'
                }
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={formData.categoria ? "#6b7280" : "#d1d5db"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Condition Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluación del Estado</Text>
          <Text style={styles.sectionSubtitle}>Evalúa honestamente el estado de tu producto</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Condición General *</Text>
            <View style={[styles.optionsContainer, triedSubmit && !formData.condicionGeneral && { borderColor: 'red', borderWidth: 2, borderRadius: 8, padding: 4 }]}> 
              {conditionOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionChip,
                    formData.condicionGeneral === option.value && styles.optionChipActive,
                  ]}
                  onPress={() => handleInputChange('condicionGeneral', option.value)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      formData.condicionGeneral === option.value && styles.optionChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Autenticidad</Text>
            <View style={styles.optionsContainer}>
              {authenticityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionChip,
                    formData.autenticidad === option.value && styles.optionChipActive,
                  ]}
                  onPress={() => handleInputChange('autenticidad', option.value)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      formData.autenticidad === option.value && styles.optionChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.separator} />

          <Text style={styles.subsectionTitle}>Evaluación Detallada</Text>

          {/* Condition Sliders */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderItem}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Estado General</Text>
                <Text style={[styles.sliderValue, { color: getConditionColor(formData.estadoGeneral) }]}>
                  {formData.estadoGeneral}/10 - {getConditionLabel(formData.estadoGeneral)}
                </Text>
              </View>
              <View style={styles.sliderContainer}>
                <View style={[styles.sliderTrack, { backgroundColor: '#e5e7eb' }]}>
                  <View 
                    style={[
                      styles.sliderFill, 
                      { 
                        width: `${(formData.estadoGeneral / 10) * 100}%`,
                        backgroundColor: getConditionColor(formData.estadoGeneral)
                      }
                    ]} 
                  />
                </View>
                <View style={styles.sliderButtons}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.sliderButton,
                        formData.estadoGeneral === value && styles.sliderButtonActive
                      ]}
                      onPress={() => handleInputChange('estadoGeneral', value)}
                    >
                      <Text style={[
                        styles.sliderButtonText,
                        formData.estadoGeneral === value && styles.sliderButtonTextActive
                      ]}>
                        {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

            {/* Similar sliders for other condition aspects */}
            <View style={styles.sliderItem}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Tela/Material</Text>
                <Text style={[styles.sliderValue, { color: getConditionColor(formData.estadoTelaMaterial) }]}>
                  {formData.estadoTelaMaterial}/10 - {getConditionLabel(formData.estadoTelaMaterial)}
                </Text>
              </View>
              <View style={styles.sliderContainer}>
                <View style={[styles.sliderTrack, { backgroundColor: '#e5e7eb' }]}>
                  <View 
                    style={[
                      styles.sliderFill, 
                      { 
                        width: `${(formData.estadoTelaMaterial / 10) * 100}%`,
                        backgroundColor: getConditionColor(formData.estadoTelaMaterial)
                      }
                    ]} 
                  />
                </View>
                <View style={styles.sliderButtons}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.sliderButton,
                        formData.estadoTelaMaterial === value && styles.sliderButtonActive
                      ]}
                      onPress={() => handleInputChange('estadoTelaMaterial', value)}
                    >
                      <Text style={[
                        styles.sliderButtonText,
                        formData.estadoTelaMaterial === value && styles.sliderButtonTextActive
                      ]}>
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notas sobre el Estado</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe cualquier defecto, desgaste o característica especial..."
              value={formData.notasSobreElEstado}
              onChangeText={(value) => handleInputChange('notasSobreElEstado', value)}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Defectos Específicos (si los hay)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Manchas, agujeros, decoloración, etc..."
              value={formData.defectosEspecificos}
              onChangeText={(value) => handleInputChange('defectosEspecificos', value)}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Producto</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Marca *</Text>
              {/* Campo de búsqueda de marca con sugerencias y flecha */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1 },
                    triedSubmit && !formData.marca && { borderColor: 'red' }
                  ]}
                  placeholder="Ej: Nike, Adidas, Sin marca..."
                  value={brandQuery || (formData.marca !== 'Otra' ? formData.marca : '')}
                  onChangeText={text => {
                    setBrandQuery(text);
                    handleInputChange('marca', text);
                  }}
                  onFocus={() => setBrandQuery('')}
                  editable={!showBrandInput}
                />
                <TouchableOpacity onPress={() => setShowBrandModal(true)} style={{ marginLeft: 8 }}>
                  <Ionicons name="chevron-down" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {/* Sugerencias de marcas */}
              {!showBrandInput && brandQuery.length > 0 && (
                <View style={styles.suggestionsList}>
                  {filteredBrands.map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={styles.suggestionItem}
                      onPress={() => {
                        if (brand === 'Otra') {
                          setShowBrandInput(true);
                          setOtherBrand('');
                          handleInputChange('marca', 'Otra');
                        } else if (brand === 'Sin marca') {
                          setShowBrandInput(false);
                          handleInputChange('marca', 'Sin marca');
                        } else {
                          setShowBrandInput(false);
                          handleInputChange('marca', brand);
                        }
                        setBrandQuery('');
                      }}
                    >
                      <Text style={styles.suggestionText}>{brand}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {/* Campo de texto libre si se elige "Otra", debajo */}
              {showBrandInput && formData.marca === 'Otra' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Introduzca la Marca"
                    value={otherBrand}
                    onChangeText={text => setOtherBrand(text)}
                    onEndEditing={() => handleInputChange('marca', otherBrand)}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={() => { setShowBrandInput(false); setOtherBrand(''); handleInputChange('marca', ''); }}>
                    <Ionicons name="close" size={20} color="#ef4444" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Material</Text>
            <TextInput
              style={styles.input}
                placeholder="Ej: 100% Algodón, Poliéster 95%..."
                value={formData.material}
                onChangeText={(value) => handleInputChange('material', value)}
            />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.inputLabel}>Colores *</Text>
              <TouchableOpacity onPress={() => setShowColorInfo(true)}>
                <Ionicons name="help-circle-outline" size={18} color="#6b7280" style={{ marginLeft: 4, marginTop: -8 }} />
              </TouchableOpacity>
            </View>
            <View style={[styles.colorGrid, triedSubmit && formData.color.length === 0 && { borderColor: 'red', borderWidth: 2, borderRadius: 8, padding: 4 }] }>
              {colorOptions.map((colorOption) => (
                <TouchableOpacity
                  key={colorOption.value}
                  style={[
                    styles.colorButton,
                    { backgroundColor: colorOption.color },
                    formData.color.includes(colorOption.value) && styles.colorButtonActive
                  ]}
                  onPress={() => toggleColor(colorOption.value)}
                >
                  {formData.color.includes(colorOption.value) && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {triedSubmit && formData.color.length === 0 && (
              <Text style={{ color: 'red', marginTop: 4, fontSize: 13 }}>
                Debes seleccionar al menos un color.
              </Text>
            )}
            {formData.color.length > 0 && (
              <View style={styles.selectedColors}>
                {formData.color.map((selectedColor) => {
                  const colorInfo = colorOptions.find((c) => c.value === selectedColor)
                  return (
                    <View key={selectedColor} style={styles.colorBadge}>
                      <View 
                        style={[
                          styles.colorDot, 
                          { backgroundColor: colorInfo?.color }
                        ]} 
                      />
                      <Text style={styles.colorBadgeText}>{colorInfo?.name}</Text>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.stockHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>Stock y Tallas</Text>
                <TouchableOpacity onPress={() => setShowTallaInfo(true)}>
                  <Ionicons name="help-circle-outline" size={18} color="#6b7280" style={{ marginLeft: 4, marginTop: -8 }} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addStockButton} onPress={addStockItem}>
                <Ionicons name="add" size={16} color="#059669" />
                <Text style={styles.addStockButtonText}>Agregar Talla</Text>
              </TouchableOpacity>
            </View>
            {formData.stock.map((item, index) => {
              const currentSizeOptions = getSortedSizes(formData.subcategoria);
              const isOtherSize = item.talla && !currentSizeOptions.includes(item.talla);
              return (
                <View key={index} style={styles.stockItem}>
                  {/* Columna talla */}
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Talla</Text>
                    <TouchableOpacity
                      style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => { setSizeDropdownIndex(index); setShowSizeModal(true); }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: item.talla ? '#111827' : '#9ca3af', fontSize: 16 }}>
                        {item.talla || 'Seleccionar talla'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#6b7280" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                    {/* Campo de texto si se seleccionó "Otra talla" o talla personalizada */}
                    {(item.talla === 'Otra talla' || isOtherSize) && (
                      <TextInput
                        style={[styles.input, { marginTop: 4, minWidth: 60 }]}
                        placeholder="Agregar talla"
                        value={isOtherSize ? item.talla : ''}
                        onChangeText={(value) => updateStockItem(index, 'talla', value)}
                      />
                    )}
                  </View>
                  {/* Columna cantidad */}
                  <View style={{ width: 80, marginRight: 8 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Cantidad</Text>
                    <TextInput
                      style={[styles.input]}
                      placeholder="Cant."
                      value={item.cantidad < 1 ? '' : String(item.cantidad)}
                      onChangeText={(text) => handleStockCantidadChange(index, text)}
                      onBlur={() => finalizeStockCantidad(index)}
                      keyboardType="numeric"
                    />
                  </View>
                  {formData.stock.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeStockButton}
                      onPress={() => removeStockItem(index)}
                    >
                      <Ionicons name="close" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            <Text style={styles.stockTotal}>
              {(() => {
                const total = formData.stock.reduce(
                  (sum, item) => sum + (item.cantidad >= 1 ? item.cantidad : 0),
                  0
                );
                return `Total en stock: ${total} ${total === 1 ? 'unidad' : 'unidades'}`;
              })()}
            </Text>
            {/* Modal para la selección de talla */}
            <Modal
              visible={showSizeModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowSizeModal(false)}
            >
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSizeModal(false)}>
                <View style={[styles.modalContent, { maxHeight: 350, justifyContent: 'flex-start' }]}>  
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Seleccionar la talla</Text>
                    <TouchableOpacity onPress={() => setShowSizeModal(false)}>
                      <Ionicons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.modalList}>
                    {sizeDropdownIndex !== null &&
                      formData.stock[sizeDropdownIndex] &&
                      getSortedSizes(formData.subcategoria).map((size) => {
                        const stockRow = formData.stock[sizeDropdownIndex];
                        return (
                      <TouchableOpacity
                        key={size}
                        style={styles.modalItem}
                        onPress={() => {
                          updateStockItem(sizeDropdownIndex, 'talla', size);
                          setShowSizeModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>{size}</Text>
                        {stockRow.talla === size && (
                          <Ionicons name="checkmark" size={20} color="#059669" />
                        )}
                      </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>

        {/* Measurements */}
        {(formData.categoria === 'Mujer' || formData.categoria === 'Hombre') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medidas (Opcional)</Text>
            <Text style={styles.sectionSubtitle}>Ayuda a los compradores a conocer el ajuste exacto</Text>
            
            {/* Medidas para partes SUPERIORES (Vestidos, Camisas, T-shirts, etc.) */}
            {['Vestidos', 'Camisas', 'T-shirts', 'Blusas', 'Poloches', 'Abrigos', 'Franelas'].includes(formData.subcategoria) && (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Pecho/Busto (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="90"
                      value={formData.measurements.chest}
                      onChangeText={(value) => handleInputChange('measurements.chest', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Cintura (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="70"
                      value={formData.measurements.waist}
                      onChangeText={(value) => handleInputChange('measurements.waist', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Largo (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="60"
                      value={formData.measurements.length}
                      onChangeText={(value) => handleInputChange('measurements.length', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Hombros (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="40"
                      value={formData.measurements.shoulders}
                      onChangeText={(value) => handleInputChange('measurements.shoulders', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Medidas para partes INFERIORES (Pantalones, Shorts, Faldas) */}
            {['Pantalones', 'Shorts', 'Faldas'].includes(formData.subcategoria) && (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Cintura (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="70"
                      value={formData.measurements.waist}
                      onChangeText={(value) => handleInputChange('measurements.waist', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Cadera (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="95"
                      value={formData.measurements.hips}
                      onChangeText={(value) => handleInputChange('measurements.hips', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Entrepierna (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="75"
                      value={formData.measurements.inseam}
                      onChangeText={(value) => handleInputChange('measurements.inseam', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Largo Total (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="100"
                      value={formData.measurements.length}
                      onChangeText={(value) => handleInputChange('measurements.length', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Medidas para VESTIDOS (combina superior e inferior) */}
            {formData.subcategoria === 'Vestidos' && (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Pecho/Busto (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="90"
                      value={formData.measurements.chest}
                      onChangeText={(value) => handleInputChange('measurements.chest', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Cintura (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="70"
                      value={formData.measurements.waist}
                      onChangeText={(value) => handleInputChange('measurements.waist', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Cadera (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="95"
                      value={formData.measurements.hips}
                      onChangeText={(value) => handleInputChange('measurements.hips', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Largo Total (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="100"
                      value={formData.measurements.length}
                      onChangeText={(value) => handleInputChange('measurements.length', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Hombros (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="40"
                      value={formData.measurements.shoulders}
                      onChangeText={(value) => handleInputChange('measurements.shoulders', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Entrepierna (cm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="75"
                      value={formData.measurements.inseam}
                      onChangeText={(value) => handleInputChange('measurements.inseam', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Precio</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Precio de Venta (RD$) *</Text>
            <TextInput
              style={[styles.input, triedSubmit && !formData.precio && { borderColor: 'red' }]}
              placeholder="0"
              value={formData.precio}
              onChangeText={(value) => handleInputChange('precio', value)}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Location and Shipping */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación y Envío</Text>
          {/* Mensaje de error si no se selecciona ningún tipo de entrega al intentar publicar */}
          {triedSubmit && !Object.values(formData.tipoDeEntregaPermitida).some(Boolean) && (
            <Text style={{ color: 'red', marginTop: 4, marginBottom: 8, fontSize: 13 }}>
              Debes seleccionar al menos un tipo de entrega.
            </Text>
          )}
          
          {/* Casillas de verificación para los tipos de entrega */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.inputLabel}>
                Tipo de Entrega permitida <Text style={{ color: '#111827', fontWeight: '600' }}>*</Text>
              </Text>
              <TouchableOpacity onPress={() => setShowEntregaInfo(true)}>
                <Ionicons name="help-circle-outline" size={18} color="#6b7280" style={{ marginLeft: 4, marginTop: -8 }} />
          </TouchableOpacity>
        </View>
            <View style={{ flexDirection: 'column', gap: 16 }}>
              <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleDeliveryMethodChange('envioAPuntoDeRecogida')}>
                <View style={[styles.checkbox, formData.tipoDeEntregaPermitida.envioAPuntoDeRecogida && styles.checkboxActive]}>
                  {formData.tipoDeEntregaPermitida.envioAPuntoDeRecogida && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Envío a Punto de Recogida</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleDeliveryMethodChange('recogidaEnPersona')}>
                <View style={[styles.checkbox, formData.tipoDeEntregaPermitida.recogidaEnPersona && styles.checkboxActive]}>
                  {formData.tipoDeEntregaPermitida.recogidaEnPersona && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Recogida en Persona</Text>
              </TouchableOpacity>
              {/* Selector de ciudad para Recogida en persona */}
              {formData.tipoDeEntregaPermitida.recogidaEnPersona && (
                <View style={{ marginLeft: 32, marginTop: 4 }}>
                  <Text style={[styles.inputLabel, { fontSize: 13, marginBottom: 4 }]}>Ciudad para Recogida en Persona</Text>
                  <View style={styles.inputGroup}>
                    <TouchableOpacity
                      style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => setShowInPersonCityModal(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: formData.ciudadRecogidaEnPersona ? '#111827' : '#9ca3af', fontSize: 16 }}>
                        {formData.ciudadRecogidaEnPersona || 'Seleccionar ciudad'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#6b7280" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  </View>
                  <View style={{
                    marginTop: 12,
                    backgroundColor: '#e6f7ec',
                    borderRadius: 10,
                    padding: 10,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#16a34a" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#166534', fontWeight: 'bold', fontSize: 14, marginBottom: 2 }}>
                        Consejos para una Entrega Segura y Agradable
                      </Text>
                      <Text style={{ color: '#166534', fontSize: 13, lineHeight: 18 }}>
                        • Prefiere siempre Lugares Públicos y bien iluminados (Cafés, Centros Comerciales, Estaciones de metro, etc.).{"\n"}
                        • Si es posible, acude Acompañado o Avisa a Alguien de Confianza del Lugar y la Hora del Encuentro.{"\n"}
                        • Confía en tu Intuición: si algo no te parece seguro, Reprograma la cita o Elige otro lugar.{"\n"}
                        ¡Una Entrega Segura es una Experiencia Positiva para Todos!
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              <TouchableOpacity style={styles.checkboxContainer} onPress={() => handleDeliveryMethodChange('envioADomicilio')}>
                <View style={[styles.checkbox, formData.tipoDeEntregaPermitida.envioADomicilio && styles.checkboxActive]}>
                  {formData.tipoDeEntregaPermitida.envioADomicilio && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Envío a Domicilio</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo de precio de envío solo si Envío a domicilio está marcado */}
          {formData.tipoDeEntregaPermitida.envioADomicilio && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ciudades para Envío a Domicilio</Text>
              {allCities.map((ciudad) => {
                const selected = formData.ciudadesParaEnvioADomicilio.find((c: any) => c.ciudad === ciudad);
                return (
                  <View key={ciudad} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <TouchableOpacity
                      style={[styles.checkbox, selected && styles.checkboxActive, { marginRight: 8 }]}
                      onPress={() => toggleDeliveryCity(ciudad)}
                    >
                      {selected && <Ionicons name="checkmark" size={16} color="white" />}
                    </TouchableOpacity>
                    <Text style={[styles.checkboxLabel, { minWidth: 120 }]}>{ciudad}</Text>
                    {selected && (
                      <TextInput
                        style={[styles.input, { width: 130, marginLeft: 12 }]}
                        placeholder="Precio (RD$)"
                        value={selected.precio}
                        onChangeText={(value) => setDeliveryCityPrice(ciudad, value)}
                        keyboardType="numeric"
                        numberOfLines={1}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}
          {/* Campo de texto para instrucciones especiales */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Instrucciones para la entrega (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej: Solo entrego los fines de semana. El punto de recogida se acuerda después de la compra. Entrega en mano solo en el centro."
              value={formData.instruccionesParaEntrega || ''}
              onChangeText={value => setFormData({ ...formData, instruccionesParaEntrega: value })}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Preview */}
        {formData.titulo && formData.precio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vista Previa</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewContent}>
                {selectedImages.length > 0 && (
                  <Image source={{ uri: selectedImages[0] }} style={styles.previewImage} />
                )}
                <View style={styles.previewInfo}>
                  <Text style={styles.previewTitle}>{formData.titulo}</Text>
                  <Text style={styles.previewPrice}>
                    RD${Number(formData.precio).toLocaleString()}
                  </Text>
                  <View style={styles.previewBadges}>
                    {formData.condicionGeneral && (
                      <View style={styles.previewBadge}>
                        <Text style={styles.previewBadgeText}>
                          {conditionOptions.find((opt) => opt.value === formData.condicionGeneral)?.label}
                        </Text>
                      </View>
                    )}
                    {formData.estadoGeneral && (
                      <View style={styles.previewBadge}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={styles.previewBadgeText}>{formData.estadoGeneral}/10</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.previewLocation}>{formData.location}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {Object.keys(categories).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.modalItem}
                  onPress={async () => {
                    handleInputChange('categoria', category);
                    handleInputChange('subcategoria', '');
                    await AsyncStorage.removeItem('sellFormDraft');
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{category}</Text>
                  {formData.categoria === category && (
                    <Ionicons name="checkmark" size={20} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        visible={showSubcategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubcategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Subcategoría</Text>
              <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {formData.categoria && categories[formData.categoria as keyof typeof categories].map((subcategory) => (
                <TouchableOpacity
                  key={subcategory}
                  style={styles.modalItem}
                  onPress={() => {
                    handleInputChange('subcategoria', subcategory)
                    setShowSubcategoryModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{subcategory}</Text>
                  {formData.subcategoria === subcategory && (
                    <Ionicons name="checkmark" size={20} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de selección completa de marcas */}
      <Modal
        visible={showBrandModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBrandModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Todas las marcas</Text>
              <TouchableOpacity onPress={() => setShowBrandModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {sortedBrands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  style={styles.modalItem}
                  onPress={() => {
                    if (brand === 'Otra') {
                      setShowBrandInput(true);
                      setOtherBrand('');
                      handleInputChange('marca', 'Otra');
                    } else if (brand === 'Sin marca') {
                      setShowBrandInput(false);
                      handleInputChange('marca', 'Sin marca');
                    } else {
                      setShowBrandInput(false);
                      handleInputChange('marca', brand);
                    }
                    setShowBrandModal(false);
                    setBrandQuery('');
                  }}
                >
                  <Text style={styles.modalItemText}>{brand}</Text>
                  {formData.marca === brand && (
                    <Ionicons name="checkmark" size={20} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para la selección de la ciudad de recogida en persona */}
      <Modal
        visible={showInPersonCityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInPersonCityModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInPersonCityModal(false)}>
          <View style={[styles.modalContent, { maxHeight: 350, justifyContent: 'flex-start' }]}>  
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar ciudad</Text>
              <TouchableOpacity onPress={() => setShowInPersonCityModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {inPersonCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, ciudadRecogidaEnPersona: city }));
                    setShowInPersonCityModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{city}</Text>
                  {formData.ciudadRecogidaEnPersona === city && (
                    <Ionicons name="checkmark" size={20} color="#059669" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal info-bulle Stock y Tallas */}
      <Modal visible={showTallaInfo} transparent animationType="fade" onRequestClose={() => setShowTallaInfo(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTallaInfo(false)}>
          <View style={[styles.modalContent, { padding: 24, maxWidth: 320, alignSelf: 'center', marginTop: 80 }]}>  
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>¿Cómo funciona?</Text>
            <Text style={{ fontSize: 15 }}>
              Selecciona la Talla del Producto. Si vendes varias tallas, añade una Línea por Talla. &quot;Otra talla&quot; permite ingresar una Talla Personalizada.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Modal info-bulle Tipo de Entrega */}
      <Modal visible={showEntregaInfo} transparent animationType="fade" onRequestClose={() => setShowEntregaInfo(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEntregaInfo(false)}>
          <View style={[styles.modalContent, { padding: 24, maxWidth: 320, alignSelf: 'center', marginTop: 80 }]}>  
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>¿Qué opción elegir?</Text>
            <Text style={{ fontSize: 15 }}>
              Elige al menos un Tipo de Entrega. Puedes ofrecer Recogida en Persona, Envío a Domicilio o a Punto de Recogida.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Modal info-bulle Colores */}
      <Modal visible={showColorInfo} transparent animationType="fade" onRequestClose={() => setShowColorInfo(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowColorInfo(false)}>
          <View style={[styles.modalContent, { padding: 24, maxWidth: 320, alignSelf: 'center', marginTop: 80 }]}>  
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>¿Cómo seleccionar colores?</Text>
            <Text style={{ fontSize: 15 }}>
              Selecciona uno o varios Colores que correspondan al Producto.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  publishButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  publishButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  publishButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  optionChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  optionChipText: {
    fontSize: 14,
    color: '#374151',
  },
  optionChipTextActive: {
    color: 'white',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
    width: (width - 64) / 3,
    height: (width - 64) / 3,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  addImageButton: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  addImageText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  sliderGroup: {
    gap: 16,
  },
  sliderItem: {
    marginBottom: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  sliderContainer: {
    gap: 8,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonActive: {
    backgroundColor: '#059669',
  },
  sliderButtonText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  sliderButtonTextActive: {
    color: 'white',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorButtonActive: {
    borderColor: '#059669',
    borderWidth: 3,
  },
  selectedColors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  colorBadgeText: {
    fontSize: 12,
    color: '#374151',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addStockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addStockButtonText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeStockButton: {
    padding: 8,
  },
  stockTotal: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  previewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  previewContent: {
    flexDirection: 'row',
    gap: 12,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  previewBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  previewBadgeText: {
    fontSize: 10,
    color: '#374151',
  },
  previewLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#111827',
  },
  suggestionsList: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 120,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#374151',
  },
  mainImagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    resizeMode: 'cover',
  },
}) 