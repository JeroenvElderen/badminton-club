
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type MenuItem = {
  title: string;
  subtitle: string;
  icon: IconName;
  danger?: boolean;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type Props = {
  onSwitchToPlayer: () => void;
};

const C = {
  background: '#031B16',
  panel: '#05241D',
  tile: '#082B23',
  iconBackground: '#06372C',
  border: '#155044',
  green: '#00DDA5',
  white: '#F6FBF8',
  muted: '#A9BAB4',
  red: '#FF4758',
};

const SECTIONS: MenuSection[] = [
  {
    title: 'Club Management',
    items: [
      {
        title: 'Club Details',
        subtitle: 'Name, location, info',
        icon: 'calendar-outline',
      },
      {
        title: 'Manage Admins',
        subtitle: 'Roles & permissions',
        icon: 'people-outline',
      },
      {
        title: 'Club Settings',
        subtitle: 'Rules, scoring, courts',
        icon: 'settings-outline',
      },
      {
        title: 'Membership',
        subtitle: 'Registration & access',
        icon: 'document-text-outline',
      },
    ],
  },
  {
    title: 'Data & Tools',
    items: [
      {
        title: 'Import / Export',
        subtitle: 'Backup & restore',
        icon: 'cloud-upload-outline',
      },
      {
        title: 'Statistics',
        subtitle: 'Club analytics',
        icon: 'stats-chart-outline',
      },
      {
        title: 'Match History',
        subtitle: 'Past nights & results',
        icon: 'time-outline',
      },
      {
        title: 'Reports',
        subtitle: 'Attendance & performance',
        icon: 'document-text-outline',
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        title: 'Announcements',
        subtitle: 'Send to members',
        icon: 'megaphone-outline',
      },
      {
        title: 'Messages',
        subtitle: 'Contact members',
        icon: 'mail-outline',
      },
      {
        title: 'Invite Players',
        subtitle: 'Share invite link',
        icon: 'person-add-outline',
      },
      {
        title: 'QR Check-in',
        subtitle: 'Open check-in code',
        icon: 'qr-code-outline',
      },
    ],
  },
  {
    title: 'Support & Legal',
    items: [
      {
        title: 'Help & Support',
        subtitle: 'Guides & FAQ',
        icon: 'help-circle-outline',
      },
      {
        title: 'Privacy & Data',
        subtitle: 'Data management',
        icon: 'shield-checkmark-outline',
      },
      {
        title: 'Terms & Policies',
        subtitle: 'Club rules & policies',
        icon: 'reader-outline',
      },
      {
        title: 'Sign Out',
        subtitle: 'Log out from admin',
        icon: 'log-out-outline',
        danger: true,
      },
    ],
  },
];

function MenuTile({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => [
        styles.tile,
        pressed && styles.tilePressed,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          item.danger && styles.dangerIconBox,
        ]}
      >
        <Ionicons
          name={item.icon}
          size={25}
          color={item.danger ? C.red : C.green}
        />
      </View>

      <View style={styles.tileContent}>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.tileSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={C.white}
      />
    </Pressable>
  );
}

function MenuGroup({
  section,
  onItemPress,
}: {
  section: MenuSection;
  onItemPress: (item: MenuItem) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>

      <View style={styles.tileGrid}>
        {section.items.map(item => (
          <View key={item.title} style={styles.tileCell}>
            <MenuTile
              item={item}
              onPress={() => onItemPress(item)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AdminMorePage({
  onSwitchToPlayer,
}: Props) {
  const signOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Riverside Badminton Club?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const { error } = await supabase.auth.signOut();

              if (error) {
                Alert.alert('Sign Out Failed', error.message);
              }
            })();
          },
        },
      ],
    );
  };

  const onItemPress = (item: MenuItem) => {
    if (item.title === 'Sign Out') {
      signOut();
      return;
    }

    Alert.alert(
      item.title,
      `${item.subtitle}\n\nThis management feature is not connected yet. No club data has been changed.`,
      [{ text: 'OK' }],
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map(section => (
          <MenuGroup
            key={section.title}
            section={section}
            onItemPress={onItemPress}
          />
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={onSwitchToPlayer}
          style={({ pressed }) => [
            styles.switchButton,
            pressed && styles.tilePressed,
          ]}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={23}
            color={C.green}
          />

          <View style={styles.switchText}>
            <Text style={styles.switchTitle}>
              Switch to Player Mode
            </Text>
            <Text style={styles.switchSubtitle}>
              Return to your player dashboard
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={C.white}
          />
        </Pressable>

        <Text style={styles.footer}>
          Riverside Badminton Club
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 34,
    gap: 12,
  },
  section: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: '#07503C',
    borderRadius: 17,
    padding: 12,
    gap: 12,
  },
  sectionTitle: {
    color: C.white,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 9,
    rowGap: 9,
  },
  tileCell: {
    width: '48.5%',
    flexGrow: 1,
    minWidth: 0,
  },
  tile: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.tile,
    paddingRight: 8,
    overflow: 'hidden',
  },
  tilePressed: {
    opacity: 0.7,
  },
  iconBox: {
    width: 45,
    height: '100%',
    minHeight: 76,
    backgroundColor: C.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIconBox: {
    backgroundColor: '#241F21',
  },
  tileContent: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 8,
    paddingRight: 2,
    gap: 5,
  },
  tileTitle: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  tileSubtitle: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 14,
  },
  switchButton: {
    minHeight: 73,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.tile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  switchText: {
    flex: 1,
    gap: 4,
  },
  switchTitle: {
    color: C.green,
    fontSize: 15,
    fontWeight: '800',
  },
  switchSubtitle: {
    color: C.muted,
    fontSize: 12,
  },
  footer: {
    textAlign: 'center',
    color: C.muted,
    fontSize: 11,
    paddingVertical: 12,
  },
});
