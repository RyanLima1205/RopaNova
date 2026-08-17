import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore'
import { app, auth } from '../../../firebaseConfig'
import { ProductDetail } from '../../../types/product'
import { logger } from '../../../utils/logger'

export const REPORT_REASONS = [
  'Producto falso o engañoso',
  'Precio incorrecto o sospechoso',
  'Fotos inapropiadas',
  'Vendedor fraudulento',
  'Contenido prohibido',
  'Otro',
]

/** Ouverture, soumission et état du signalement d'une fiche produit. */
export function useReportProduct(product: ProductDetail | null) {
  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const open = useCallback(() => {
    if (!auth.currentUser) {
      Alert.alert('Inicio de sesión requerido', 'Inicia sesión para reportar este anuncio.')
      return
    }
    setVisible(true)
  }, [])

  const close = useCallback(() => setVisible(false), [])

  const submit = useCallback(
    async (reason: string) => {
      const user = auth.currentUser
      if (!user || !product) return
      setSubmitting(true)
      try {
        const db = getFirestore(app)
        await addDoc(collection(db, 'reports'), {
          productId: product.info.id,
          productTitle: product.info.title,
          sellerId: product.seller.id || null,
          reporterId: user.uid,
          reason,
          createdAt: serverTimestamp(),
        })
        setVisible(false)
        Alert.alert(
          'Reporte enviado',
          'Gracias por ayudarnos a mantener RopaNova seguro. Revisaremos tu reporte a la brevedad.',
        )
      } catch (err) {
        logger.error('Error al enviar reporte:', err)
        Alert.alert('Error', 'No se pudo enviar el reporte. Intenta de nuevo.')
      } finally {
        setSubmitting(false)
      }
    },
    [product],
  )

  return { visible, submitting, open, close, submit }
}
