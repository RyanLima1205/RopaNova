import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { Provider } from "react-redux"
import { store } from "./src/store/store"
import { AuthProvider } from "./src/contexts/AuthContext"
import { NotificationProvider } from "./src/contexts/NotificationContext"

// Screens
import HomeScreen from "./src/screens/HomeScreen"
import SearchScreen from "./src/screens/SearchScreen"
import SellScreen from "./src/screens/SellScreen"
import MessagesScreen from "./src/screens/MessagesScreen"
import ProfileScreen from "./src/screens/ProfileScreen"
import ProductDetailScreen from "./src/screens/ProductDetailScreen"
import LoginScreen from "./src/screens/LoginScreen"
import RegisterScreen from "./src/screens/RegisterScreen"

// Icons
import Icon from "react-native-vector-icons/Ionicons"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline"
          } else if (route.name === "Sell") {
            iconName = focused ? "camera" : "camera-outline"
          } else if (route.name === "Messages") {
            iconName = focused ? "chatbubble" : "chatbubble-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          } else {
            iconName = "help-outline"
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#10B981",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Inicio" }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: "Buscar" }} />
      <Tab.Screen name="Sell" component={SellScreen} options={{ title: "Vender" }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: "Mensajes" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
    </Tab.Navigator>
  )
}

const App = () => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <NotificationProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </NotificationProvider>
      </AuthProvider>
    </Provider>
  )
}

export default App
