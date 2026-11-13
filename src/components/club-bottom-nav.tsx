
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
import Svg, { Path } from 'react-native-svg';

export type ClubTab =
  | 'Home'
  | 'Matches'
  | 'Stats'
  | 'Leaderboard'
  | 'More';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type NavigationIconName = IconName | 'shuttlecock';

type NavigationItem = {
  label: ClubTab;
  icon: NavigationIconName;
  selectedIcon: NavigationIconName;
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
    icon: 'shuttlecock',
    selectedIcon: 'shuttlecock',
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
          const iconName = active ? item.selectedIcon : item.icon;
          const iconColor = active ? theme.accent : theme.muted;

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

              {iconName === 'shuttlecock' ? (
                <ShuttlecockIcon size={23} color={iconColor} />
              ) : (
                <Ionicons name={iconName} size={23} color={iconColor} />
              )}

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

function ShuttlecockIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.7 4.7C5.2 9.3 7.8 12.9 11.1 15.1M19.3 4.7C18.8 9.3 16.2 12.9 12.9 15.1M4.8 4.7C8.8 2.4 15.2 2.4 19.2 4.7M7.5 5.4l3.8 9.5M10.5 4.5l1.3 10.8M13.5 4.5l-1.3 10.8M16.5 5.4l-3.8 9.5M11.1 14.9l-1.2 4.2c-.3 1.5 4.2 1.5 4.2 0l-1.2-4.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
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
