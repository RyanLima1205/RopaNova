import React, { useState } from 'react'
import { View, Text, ScrollView, StatusBar, Image, TouchableOpacity, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../../App'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebaseConfig'
import { brandColors } from '../../theme'
import { screenStyles as styles } from './styles'
import { useStoreDetail } from './hooks/useStoreDetail'
import { useStoreCatalog } from './hooks/useStoreCatalog'
import { useFollowStore } from './hooks/useFollowStore'
import { resolveStoreTheme } from './theme/resolveStoreTheme'
import { StoreHeader } from './components/StoreHeader'
import { StoreTabs, StoreTab } from './components/StoreTabs'
import { OwnerBar } from './components/OwnerBar'
import { SectionRenderer } from './components/sections/SectionRenderer'
import { SectionType } from '../../types/store'

type Nav = StackNavigationProp<RootStackParamList>

/** Sections toujours visibles sur l'onglet "Inicio" quand StoreTabs est affiché. */
const nonTabSections: SectionType[] = ['PRODUCTS', 'INFO']

export const StoreScreen: React.FC = () => {
  const route = useRoute()
  const navigation = useNavigation<Nav>()
  const { user } = useAuth()
  const viewUserIdParam = (route.params as { viewUserId?: string } | undefined)?.viewUserId?.trim()
  const storeId = viewUserIdParam || user?.id || ''

  const { store, loading } = useStoreDetail(storeId)
  const { products, loading: productsLoading } = useStoreCatalog(store?.identity.id ?? null)
  const { isFollowing, loading: followLoading, toggleFollow } = useFollowStore(
    store?.identity.id ?? '',
    auth.currentUser?.uid ?? ''
  )
  const [activeTab, setActiveTab] = useState<StoreTab>('inicio')

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="refresh" size={32} color={brandColors.primaryUI} />
        <Text style={styles.centeredText}>Cargando tienda...</Text>
      </SafeAreaView>
    )
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle" size={32} color={brandColors.textMuted} />
        <Text style={styles.centeredText}>Tienda no encontrada</Text>
      </SafeAreaView>
    )
  }

  const resolvedTheme = resolveStoreTheme(store.storefront.theme, store.identity.plan)
  // kind === 'private' : jamais d'onglets. plan START : une seule page.
  const showTabs = store.identity.kind === 'store' && store.identity.plan !== 'start'
  const featuredProducts = products.filter((p) => store.storefront.featuredProductIds.includes(p.id))

  const handleProductPress = (productId: string) => navigation.push('ProductDetail', { productId })
  const handleViewAllReviews = () => navigation.navigate('SellerReviews', { sellerId: store.identity.id })
  const handleShare = () => {
    const { identity } = store
    const link = `ropanova://store/${identity.username?.replace(/^@/, '') || identity.id}`
    const message = [`¡Mira la tienda "${identity.name}" en RopaNova!`, identity.tagline, link]
      .filter(Boolean)
      .join('\n\n')
    // Share.share() ouvre la feuille de partage native (WhatsApp, Instagram, copier, etc.)
    Share.share({ message, title: identity.name })
  }

  const visibleSections: SectionType[] = !showTabs
    ? store.storefront.sections
    : activeTab === 'inicio'
      ? store.storefront.sections.filter((section) => !nonTabSections.includes(section))
      : activeTab === 'productos'
        ? ['PRODUCTS']
        : ['INFO']

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={brandColors.surface} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={brandColors.textPrimary} />
          </TouchableOpacity>
          <Image
            source={require('../../../assets/Logo-Full-RopaNova.jpeg')}
            style={styles.topBarLogo}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={26} color={brandColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <StoreHeader
          identity={store.identity}
          stats={store.stats}
          isOwner={store.isOwner}
          accentColor={resolvedTheme.accent}
          isFollowing={isFollowing}
          followLoading={followLoading}
          onFollow={toggleFollow}
        />
        <OwnerBar visible={store.isOwner} />
        {showTabs && <StoreTabs active={activeTab} onChange={setActiveTab} accentColor={resolvedTheme.accent} />}

        <View>
          {visibleSections.map((section) => (
            <SectionRenderer
              key={section}
              type={section}
              store={store}
              products={products}
              featuredProducts={featuredProducts}
              productsLoading={productsLoading}
              onProductPress={handleProductPress}
              onViewAllReviews={handleViewAllReviews}
              accentColor={resolvedTheme.accent}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
