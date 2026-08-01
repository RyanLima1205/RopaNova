import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'
import { app } from '../firebaseConfig'
import { logger } from '../utils/logger'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

async function savePushToken(userId: string, token: string): Promise<void> {
  const db = getFirestore(app)
  await updateDoc(doc(db, 'users', userId), { expoPushToken: token })
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    logger.log('🔔 Push notifications non supportées sur simulateur')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    logger.log('🔔 Permission notifications refusée')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'RopaNova',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#059669',
    })
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId
    if (!projectId) {
      logger.log('🔔 projectId introuvable — lance "eas init" dans mobile-app/')
      return null
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
    const token = tokenData.data
    logger.log('🔔 Expo Push Token obtenu:', token)
    await savePushToken(userId, token)
    return token
  } catch (e) {
    logger.error('🔔 Erreur obtention push token:', e)
    return null
  }
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler)
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(handler)
}
