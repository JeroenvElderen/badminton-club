
import { useAppTheme } from '@/providers/theme-provider';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ClubTab =
  | 'Home'
  | 'Matches'
  | 'Stats'
  | 'Leaderboard'
  | 'More';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type NavigationItem = {
  label: ClubTab;
  icon: IconName;
  selectedIcon: IconName;
};

type ClubBottomNavProps = {
  activeTab: ClubTab;
  onTabChange: (tab: ClubTab) => void;
};

const NAV_ITEMS: NavigationItem[] = [
  {
    label: 'Home',
    icon: 'home-outline',
    selectedIcon: 'home',
  },
  {
    label: 'Matches',
    icon: 'tennisball-outline',
    selectedIcon: 'tennisball',
  },
  {
    label: 'Stats',
    icon: 'stats-chart-outline',
    selectedIcon: 'stats-chart',
  },
  {
    label: 'Leaderboard',
    icon: 'trophy-outline',
    selectedIcon: 'trophy',
  },
  {
    label: 'More',
    icon: 'menu-outline',
    selectedIcon: 'menu',
  },
];

export default function ClubBottomNav({
  activeTab,
  onTabChange,
}: ClubBottomNavProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(0, insets.bottom - 14),
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      ]}
    >
      <View style={styles.navigation}>
        {NAV_ITEMS.map(item => {
          const active = activeTab === item.label;

          return (
            <Pressable
              key={item.label}
              onPress={() => onTabChange(item.label)}
              style={({ pressed }) => [
                styles.navButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{
                selected: active,
              }}
            >
              {active && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: theme.accent },
                  ]}
                />
              )}

              <Ionicons
                name={
                  active
                    ? item.selectedIcon
                    : item.icon
                }
                size={23}
                color={
                  active
                    ? theme.accent
                    : theme.muted
                }
              />

              <Text
                style={[
                  styles.navLabel,
                  {
                    color: active
                      ? theme.accent
                      : theme.muted,
                  },
                  active && styles.activeLabel,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00140F',
    borderTopWidth: 1,
    borderTopColor: '#173C31',
    zIndex: 100,
    elevation: 10,
  },

  navigation: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  activeIndicator: {
    position: 'absolute',
    top: -1,
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#00D995',
  },

  navLabel: {
    color: '#B7C6BF',
    fontSize: 10,
    fontWeight: '500',
  },

  activeLabel: {
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
  },
});
