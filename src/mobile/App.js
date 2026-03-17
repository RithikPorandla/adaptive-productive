import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TodayScreen } from './screens/TodayScreen';
import { TasksScreen } from './screens/TasksScreen';
import { FocusScreen } from './screens/FocusScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { theme } from './theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.muted,
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingTop: 8,
            },
            tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="Today"
            component={TodayScreen}
            options={{ tabBarLabel: 'Today', tabBarIcon: ({ color, size }) => <Ionicons name="today" size={size} color={color} /> }}
          />
          <Tab.Screen
            name="Tasks"
            component={TasksScreen}
            options={{ tabBarLabel: 'Tasks', tabBarIcon: ({ color, size }) => <Ionicons name="checkbox" size={size} color={color} /> }}
          />
          <Tab.Screen
            name="Focus"
            component={FocusScreen}
            options={{ tabBarLabel: 'Focus', tabBarIcon: ({ color, size }) => <Ionicons name="timer" size={size} color={color} /> }}
          />
          <Tab.Screen
            name="Progress"
            component={ProgressScreen}
            options={{ tabBarLabel: 'Progress', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} /> }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
