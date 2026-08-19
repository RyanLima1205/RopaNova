
import { useEffect, useRef } from 'react'
import { View, Image } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import type { NavigatorScreenParams } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat'
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue'
import { brandColors } from './src/theme'
import { HomeScreen } from './src/screens/HomeScreen'
import { SearchScreen } from './src/screens/SearchScreen'
import { SellScreen } from './src/screens/SellScreen'
import { MessagesScreen } from './src/screens/MessagesScreen'
import { ChatScreen } from './src/screens/ChatScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'
import { StoreScreen } from './src/screens/Store/StoreScreen'
import { ProductDetailScreen } from './src/screens/ProductDetail/ProductDetailScreen'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'
import { AccountSettingsScreen } from './src/screens/AccountSettingsScreen'
import { PrivacySettingsScreen } from './src/screens/PrivacySettingsScreen'
import { PaymentSettingsScreen } from './src/screens/PaymentSettingsScreen'
import { AddressSettingsScreen } from './src/screens/AddressSettingsScreen'
import { WalletScreen } from './src/screens/WalletScreen'
import { AddPaymentMethodScreen } from './src/screens/AddPaymentMethodScreen'
import { AddAddressScreen } from './src/screens/AddAddressScreen'
import { RechargeWalletScreen } from './src/screens/RechargeWalletScreen'
import { WithdrawWalletScreen } from './src/screens/WithdrawWalletScreen'
import { HelpCenterScreen } from './src/screens/HelpCenterScreen'
import { ContactSupportScreen } from './src/screens/ContactSupportScreen'
import { TermsScreen } from './src/screens/TermsScreen'
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen'
import { SellerReviewsScreen } from './src/screens/SellerReviewsScreen'
import { WriteReviewScreen } from './src/screens/WriteReviewScreen'
import { BuyScreen } from './src/screens/BuyScreen'
import OrdersScreen from './src/screens/OrdersScreen'
import OrderDetailScreen from './src/screens/OrderDetailScreen'
import { FavoritesScreen } from './src/screens/FavoritesScreen'
import SellerOrderDetailScreen from './src/screens/SellerOrderDetailScreen'
import SellerStatsScreen from './src/screens/SellerStatsScreen'
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen'
import { useAuth } from './src/contexts/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import { AuthProvider } from './src/contexts/AuthContext'
import { FavoritesProvider } from './src/contexts/FavoritesContext'
import AccountTypeSelectionScreen from './src/screens/AccountTypeSelectionScreen'
import { ErrorBoundary } from './src/components/ErrorBoundary'
import { addNotificationResponseListener } from './src/services/notificationService'

export type TabParamList = {
  Home: undefined
  Search: undefined
  Sell: undefined
  Messages: undefined
  Profile: undefined
}

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined
  ProductDetail: { productId: string }
  SellScreen: { editMode?: boolean; productId?: string; productData?: any }
  DashboardScreen: undefined
  SettingsScreen: undefined
  AccountSettings: undefined
  PrivacySettings: undefined
  PaymentSettings: undefined
  AddPaymentMethod: undefined
  AddressSettings: undefined
  AddAddress: { addressId?: string } | undefined
  Wallet: undefined
  RechargeWallet: undefined
  WithdrawWallet: undefined
  HelpCenter: undefined
  ContactSupport: undefined
  Terms: undefined
  PrivacyPolicy: undefined
  CookiesSettings: undefined
  Messages: undefined
  Chat: { 
    conversationId: string
    productInfo?: {
      id: string
      title: string
      price: number
      image: string
      sellerId: string
      sellerName: string
      selectedSize?: string
    }
  }
  UserProfile: { viewUserId: string }
  SellerReviews: { sellerId: string }
  WriteReview: { orderId: string }
  Buy: { productId: string; selectedSize?: string; selectedQuantity?: number }
  OrdersScreen: undefined
  OrderDetail: { orderId: string }
  SellerOrderDetail: { orderId: string }
  SellerStats: undefined
  NotificationSettings: undefined
  FavoritesScreen: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()
const AuthStack = createStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="AccountTypeSelection" component={AccountTypeSelectionScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: brandColors.white, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={require('./assets/Logo-Full-RopaNova.jpeg')}
        style={{ width: '70%', aspectRatio: 3264 / 1360 }}
        resizeMode="contain"
      />
    </View>
  );
}

const TabNavigator = () => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline'
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline'
            } else if (route.name === 'Sell') {
              iconName = focused ? 'add-circle' : 'add-circle-outline'
            } else if (route.name === 'Messages') {
              iconName = focused ? 'chatbubble' : 'chatbubble-outline'
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline'
            } else {
              iconName = 'home-outline'
            }

            return <Ionicons name={iconName} size={size} color={color} />
          },
          tabBarActiveTintColor: brandColors.primaryUI,
          tabBarInactiveTintColor: brandColors.textSecondary,
          tabBarStyle: {
            backgroundColor: brandColors.surface,
            borderTopWidth: 1,
            borderTopColor: brandColors.border,
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerShown: false,
        })}
      >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ tabBarLabel: 'Buscar' }}
      />
      <Tab.Screen 
        name="Sell" 
        component={SellScreen}
        options={{ tabBarLabel: 'Vender' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{ tabBarLabel: 'Mensajes' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
      </Tab.Navigator>
    </SafeAreaView>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <FavoritesProvider>
              <MainAppContent />
            </FavoritesProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function MainAppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    BebasNeue_400Regular,
  });
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>
      const nav = navigationRef.current
      if (!nav) return
      if (data.type === 'message' && data.conversationId) {
        nav.navigate('Chat', { conversationId: data.conversationId })
      } else if (data.type === 'order' && data.orderId) {
        nav.navigate('SellerOrderDetail', { orderId: data.orderId })
      } else if (data.type === 'order_status' && data.orderId) {
        nav.navigate('OrderDetail', { orderId: data.orderId })
      } else if (data.type === 'wallet') {
        nav.navigate('Wallet')
      }
    })
    return () => sub.remove()
  }, [])

  if (loading || !fontsLoaded) return <SplashScreen />;

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="SellScreen" component={SellScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
        <Stack.Screen name="PaymentSettings" component={PaymentSettingsScreen} />
        <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
        <Stack.Screen name="AddressSettings" component={AddressSettingsScreen} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="RechargeWallet" component={RechargeWalletScreen} />
        <Stack.Screen name="WithdrawWallet" component={WithdrawWalletScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="UserProfile" component={StoreScreen} />
        <Stack.Screen name="SellerReviews" component={SellerReviewsScreen} />
        <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
          <Stack.Screen name="Buy" component={BuyScreen} />
          <Stack.Screen name="OrdersScreen" component={OrdersScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="FavoritesScreen" component={FavoritesScreen} />
          <Stack.Screen name="SellerOrderDetail" component={SellerOrderDetailScreen} />
          <Stack.Screen name="SellerStats" component={SellerStatsScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
