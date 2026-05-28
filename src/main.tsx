import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import {
  AccountManagement,
  Admin,
  AdminEventAttendance,
  AdminPlayerAttendance,
  AdminRoundBoard,
  AdminHub,
  EventPage,
  PlayerSnapshot,
  Events,
  Home,
  Login,
  Menu,
  News,
  NewsPostScreen,
  Play,
  RankingLeaderboard,
  PlayerInfo,
  PlayerInfoDetail,
  Signup,
  BadgesCatalog,
} from './screens'
import FeatherIcon from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppContext, ThemeContext } from './context'
import { SPACING, TYPOGRAPHY } from './constants/layout'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()
const NewsStack = createNativeStackNavigator()

function NewsFlow() {
  return (
    <NewsStack.Navigator screenOptions={{ headerShown: true }}>
      <NewsStack.Screen
        name="NewsList"
        component={News}
        options={{
          header: ({ navigation }) => (
            <TopHeader showBack onBack={() => navigation.goBack()} />
          ),
        }}
      />
      <NewsStack.Screen
        name="NewsPost"
        component={NewsPostScreen}
        options={{
          header: ({ navigation }) => (
            <TopHeader showBack onBack={() => navigation.goBack()} />
          ),
        }}
      />
    </NewsStack.Navigator>
  )
}

function TopHeader({
  title,
  showBack = false,
  onBack,
}: {
  title?: string
  showBack?: boolean
  onBack?: () => void
}) {
  const { theme } = useContext(ThemeContext)
  const styles = getHeaderStyles(theme)
  return (
    <View style={styles.wrap}>
      <View style={styles.side}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={8}>
            <Ionicons name="arrow-back-outline" size={22} color={theme.backgroundColor} />
          </TouchableOpacity>
        ) : null}
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.titleSpacer} />}
      <View style={styles.side}>
        <Ionicons name="apps-outline" size={20} color={theme.backgroundColor} />
      </View>
    </View>
  )
}

function Tabs() {
  const { theme } = useContext(ThemeContext)
  const insets = useSafeAreaInsets()
  const styles = getStyles({ theme, insets: { top: 0, bottom: 0, left: 0, right: 0 } })

  return (
    <View style={styles.tabsRoot}>
      {insets.top > 0 ? (
        <View style={[styles.statusBarInset, { height: insets.top }]} />
      ) : null}
      <Tab.Navigator
      style={{ flex: 1 }}
      screenOptions={{
        tabBarActiveTintColor: theme.tabBarActiveTintColor,
        tabBarInactiveTintColor: theme.tabBarInactiveTintColor,
        tabBarStyle: styles.tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <FeatherIcon name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={Events}
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => <FeatherIcon name="calendar" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PlayTab"
        component={Play}
        options={{
          title: 'Play!',
          tabBarIcon: ({ color, size }) => <FeatherIcon name="shield" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MenuTab"
        component={Menu}
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size }) => <FeatherIcon name="menu" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsFlow}
        options={{
          headerShown: false,
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="BadgesCatalog"
        component={BadgesCatalog}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <TopHeader title="Badges" showBack onBack={() => navigation.goBack()} />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminHub}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <TopHeader title="Admin" showBack onBack={() => navigation.navigate('MenuTab')} />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="AdminCreate"
        component={Admin}
        initialParams={{ mode: 'create' }}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <TopHeader title="Create events" showBack onBack={() => navigation.navigate('Admin')} />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="AdminAttendance"
        component={Admin}
        initialParams={{ mode: 'attendance' }}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <TopHeader title="Attendance" showBack onBack={() => navigation.navigate('Admin')} />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="AdminEventAttendance"
        component={AdminEventAttendance}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <TopHeader
              title="Event attendance"
              showBack
              onBack={() => navigation.navigate('AdminAttendance')}
            />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="AdminPlayerAttendance"
        component={AdminPlayerAttendance}
        options={{
          headerShown: true,
          header: ({ navigation, route }) => (
            <TopHeader
              title="Player attendance"
              showBack
              onBack={() =>
                navigation.navigate('AdminEventAttendance', { event: (route as any).params?.event })
              }
            />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="AdminRoundBoard"
        component={AdminRoundBoard}
        options={{
          headerShown: true,
          header: ({ navigation, route }) => (
            <TopHeader
              title="Round board"
              showBack
              onBack={() =>
                navigation.navigate('AdminEventAttendance', { event: (route as any).params?.event })
              }
            />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="PlayerInfo"
        component={PlayerInfo}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <TopHeader title="Player info" showBack onBack={() => navigation.navigate('Admin')} />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="PlayerInfoDetail"
        component={PlayerInfoDetail}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <TopHeader title="Player details" showBack onBack={() => navigation.navigate('PlayerInfo')} />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="RankingLeaderboard"
        component={RankingLeaderboard}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <TopHeader title="Ranked leaderboard" showBack onBack={() => navigation.navigate('Admin')} />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="AccountManagement"
        component={AccountManagement}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <TopHeader title="Account Management" showBack onBack={() => navigation.goBack()} />
          ),
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="EventPage"
        component={EventPage}
        options={{
          headerShown: false,
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="PlayerSnapshot"
        component={PlayerSnapshot}
        options={{
          headerShown: false,
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
    </View>
  )
}

function MainComponent() {
  const insets = useSafeAreaInsets()
  const { theme } = useContext(ThemeContext)
  const { currentUser } = useContext(AppContext)
  const styles = getStyles({ theme, insets })

  return (
    <View style={styles.container}>
      {!currentUser ? <View style={styles.statusBarInset} /> : null}
      {currentUser ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={Tabs} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
        </Stack.Navigator>
      )}
    </View>
  )
}

export function Main() {
  return <MainComponent />
}

const getStyles = ({ theme, insets }: { theme: any; insets: any }) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundColor,
      flex: 1,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    tabsRoot: {
      flex: 1,
    },
    statusBarInset: {
      height: insets.top,
      backgroundColor: theme.tintColor,
    },
    tabBarStyle: {
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      backgroundColor: theme.backgroundColor,
      height: 64,
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.sm,
    },
    tabBarLabel: {
      fontFamily: theme.semiBoldFont,
      fontSize: TYPOGRAPHY.caption,
    },
  })

const getHeaderStyles = (theme: any) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: SPACING.containerPadding,
      paddingVertical: SPACING.headerPadding,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    side: {
      width: 24,
      alignItems: 'center',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      color: theme.backgroundColor,
      fontFamily: theme.boldFont,
      fontSize: TYPOGRAPHY.h4,
    },
    titleSpacer: {
      flex: 1,
    },
  })
