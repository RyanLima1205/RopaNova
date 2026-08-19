import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../../App'
import { brandColors } from '../../theme'
import { screenStyles as styles } from './styles'
import { useProductDetail } from './hooks/useProductDetail'
import { useProductActions } from './hooks/useProductActions'
import { useReportProduct } from './hooks/useReportProduct'
import { useRelatedProducts } from './hooks/useRelatedProducts'
import { ProductGallery } from './components/ProductGallery'
import { ProductDetailSkeleton } from './components/ProductDetailSkeleton'
import { ProductIdentityCard } from './components/ProductIdentityCard'
import { TrustRow } from './components/TrustRow'
import { ProductDescription } from './components/ProductDescription'
import { SizeSelector } from './components/SizeSelector'
import { DeliveryOptions } from './components/DeliveryOptions'
import { ProductDetailsAccordion } from './components/ProductDetailsAccordion'
import { SellerCard } from './components/SellerCard'
import { RelatedProducts } from './components/RelatedProducts'
import { BottomPurchaseBar } from './components/BottomPurchaseBar'
import { ReportModal } from './components/ReportModal'

interface RouteParams {
  productId: string
}

type Nav = StackNavigationProp<RootStackParamList, 'ProductDetail'>

export const ProductDetailScreen: React.FC = () => {
  const route = useRoute()
  const navigation = useNavigation<Nav>()
  const { productId } = route.params as RouteParams

  const { product, loading } = useProductDetail(productId)
  const actions = useProductActions(product)
  const report = useReportProduct(product)
  const { products: relatedProducts } = useRelatedProducts(product)

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ProductDetailSkeleton />
      </SafeAreaView>
    )
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle" size={32} color={brandColors.textMuted} />
        <Text style={styles.centeredText}>Producto no encontrado</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ProductGallery
          images={product.gallery}
          title={product.info.title}
          onBack={() => navigation.goBack()}
          onShare={actions.handleShare}
          onFavorite={actions.handleToggleFavorite}
          favorited={actions.favorited}
        />

        <View style={styles.body}>
          <ProductIdentityCard
            info={product.info}
            pricing={product.pricing}
            seller={product.seller}
            onSellerPress={actions.handleViewSellerProfile}
          />
          <TrustRow marketing={product.marketing} delivery={product.delivery} />
          <ProductDescription description={product.info.description} />
          {product.variants.length > 1 && (
            <SizeSelector
              variants={product.variants}
              selectedSize={actions.selectedSize}
              onSelect={actions.setSelectedSize}
            />
          )}
          <DeliveryOptions delivery={product.delivery} />
          <ProductDetailsAccordion info={product.info} />
          <SellerCard seller={product.seller} onPress={actions.handleViewSellerProfile} />
          <RelatedProducts
            products={relatedProducts}
            onProductPress={(id) => navigation.push('ProductDetail', { productId: id })}
          />

          {!actions.isOwnProduct && (
            <TouchableOpacity style={styles.reportLink} onPress={report.open}>
              <Ionicons name="flag-outline" size={14} color={brandColors.textMuted} />
              <Text style={styles.reportLinkText}>Reportar este anuncio</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <BottomPurchaseBar
        price={product.pricing.price}
        onChat={actions.handleContactSeller}
        onBuy={actions.handleBuyNow}
      />

      <ReportModal
        visible={report.visible}
        submitting={report.submitting}
        onClose={report.close}
        onSubmit={report.submit}
      />
    </SafeAreaView>
  )
}
