
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

const C = {
  bg: '#031B16',
  card: '#05251E',
  tile: '#092D26',
  border: '#12483D',
  white: '#F6FBF8',
  muted: '#A6B8B1',
  green: '#00D995',
  mint: '#78DCC0',
  blue: '#48A9FF',
  purple: '#A454F5',
  orange: '#FF873C',
  red: '#FF565D',
};

const HERO = require('../../assets/images/shuttleheader.png');

type MenuId =
  | 'profile'
  | 'skill'
  | 'members'
  | 'club'
  | 'notifications'
  | 'appearance'
  | 'language'
  | 'settings'
  | 'help'
  | 'contact'
  | 'terms'
  | 'version';

type MenuItem = {
  id: MenuId;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Club & Account',
    items: [
      {
        id: 'profile',
        title: 'My Profile',
        subtitle: 'View and edit\nyour details',
        icon: 'person-outline',
        color: C.green,
      },
      {
        id: 'skill',
        title: 'Skill Level',
        subtitle: 'Current level\nand history',
        icon: 'stats-chart-outline',
        color: C.blue,
      },
      {
        id: 'members',
        title: 'Club Members',
        subtitle: 'View all players',
        icon: 'people-outline',
        color: C.purple,
      },
      {
        id: 'club',
        title: 'Club Info',
        subtitle: 'About our club',
        icon: 'shield-outline',
        color: C.orange,
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Match updates\nand reminders',
        icon: 'notifications-outline',
        color: C.green,
      },
      {
        id: 'appearance',
        title: 'Appearance',
        subtitle: 'Dark mode\nand theme',
        icon: 'contrast-outline',
        color: C.blue,
      },
      {
        id: 'language',
        title: 'Language',
        subtitle: 'English',
        icon: 'globe-outline',
        color: C.purple,
      },
      {
        id: 'settings',
        title: 'App Settings',
        subtitle: 'General settings',
        icon: 'settings-outline',
        color: C.orange,
      },
    ],
  },
  {
    title: 'Help & Support',
    items: [
      {
        id: 'help',
        title: 'Help Centre',
        subtitle: 'FAQs and guides',
        icon: 'help-circle-outline',
        color: C.green,
      },
      {
        id: 'contact',
        title: 'Contact Admin',
        subtitle: 'Get in touch',
        icon: 'chatbox-outline',
        color: C.blue,
      },
      {
        id: 'terms',
        title: 'Terms & Privacy',
        subtitle: 'Policies and terms',
        icon: 'document-text-outline',
        color: C.purple,
      },
      {
        id: 'version',
        title: 'App Version',
        subtitle: 'v1.0.0',
        icon: 'information-circle-outline',
        color: C.orange,
      },
    ],
  },
];

const CLUB_MEMBERS = [
  { name: 'Priya Sharma', skill: 'Advanced', avatar: 47 },
  { name: 'Alex Tan', skill: 'Intermediate', avatar: 12 },
  { name: 'Emily Wong', skill: 'Beginner', avatar: 44 },
  { name: 'Daniel Kim', skill: 'Intermediate', avatar: 11 },
  { name: 'James Lee', skill: 'Intermediate', avatar: 15 },
  { name: 'Sarah Lim', skill: 'Advanced', avatar: 45 },
  { name: 'Mark Chen', skill: 'Intermediate', avatar: 14 },
  { name: 'Hannah Ng', skill: 'Beginner', avatar: 48 },
  { name: 'Tom Wilson', skill: 'Beginner', avatar: 13 },
  { name: 'Laura Bennett', skill: 'Beginner', avatar: 49 },
];

function Avatar({
  image = 12,
  size = 46,
}: {
  image?: number;
  size?: number;
}) {
  return (
    <Image
      source={{
        uri: `https://i.pravatar.cc/150?img=${image}`,
      }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.tile,
        borderWidth: 1.5,
        borderColor: '#E7F1ED',
      }}
    />
  );
}

function SkillBadge({ skill }: { skill: string }) {
  const color =
    skill === 'Advanced'
      ? '#9A257B'
      : skill === 'Intermediate'
        ? '#5444D8'
        : '#AF267F';

  return (
    <View style={[s.skillBadge, { backgroundColor: color }]}>
      <Text style={s.skillBadgeText}>{skill}</Text>
    </View>
  );
}

function MenuCard({
  item,
  onPress,
}: {
  item: MenuItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.menuCard,
        pressed && s.pressed,
      ]}
    >
      <Ionicons
        name={item.icon}
        size={27}
        color={item.color}
        style={s.menuIcon}
      />

      <Text
        style={s.menuTitle}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {item.title}
      </Text>

      <Text
        style={s.menuSubtitle}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {item.subtitle}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={15}
        color={C.white}
        style={s.menuArrow}
      />
    </Pressable>
  );
}

function Section({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: MenuItem[];
  onSelect: (id: MenuId) => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>

      <View style={s.sectionGrid}>
        {items.map(item => (
          <MenuCard
            key={item.id}
            item={item}
            onPress={() => onSelect(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={s.settingRow}>
      <Ionicons name={icon} size={21} color={C.green} />

      <View style={s.settingInfo}>
        <Text style={s.settingTitle}>{title}</Text>
        {subtitle && (
          <Text style={s.settingSubtitle}>{subtitle}</Text>
        )}
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: '#29453D',
          true: '#008B65',
        }}
        thumbColor={value ? C.green : '#A3B3AE'}
      />
    </View>
  );
}

function InfoRow({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{title}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function DetailModal({
  selected,
  onClose,
  name,
  setName,
  email,
  setEmail,
  matchNotifications,
  setMatchNotifications,
  reminders,
  setReminders,
  clubNews,
  setClubNews,
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  vibration,
  setVibration,
}: {
  selected: MenuId | null;
  onClose: () => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  matchNotifications: boolean;
  setMatchNotifications: (value: boolean) => void;
  reminders: boolean;
  setReminders: (value: boolean) => void;
  clubNews: boolean;
  setClubNews: (value: boolean) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  language: string;
  setLanguage: (value: string) => void;
  vibration: boolean;
  setVibration: (value: boolean) => void;
}) {
  const item = SECTIONS.flatMap(section => section.items).find(
    entry => entry.id === selected,
  );

  const [message, setMessage] = useState('');

  if (!selected || !item) return null;

  function renderContent() {
    switch (selected) {
      case 'profile':
        return (
          <View style={s.detailContent}>
            <View style={s.profileModalHeader}>
              <Avatar size={74} />
              <SkillBadge skill="Intermediate" />
              <Text style={s.mutedText}>
                Member since April 2024
              </Text>
            </View>

            <Text style={s.fieldLabel}>Display Name</Text>
            <TextInput
              style={s.textField}
              value={name}
              onChangeText={setName}
              placeholderTextColor={C.muted}
              placeholder="Your name"
            />

            <Text style={s.fieldLabel}>Email Address</Text>
            <TextInput
              style={s.textField}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={C.muted}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={s.helperText}>
              Changes are stored in this screen temporarily.
              Account syncing will be enabled when authentication
              is connected.
            </Text>
          </View>
        );

      case 'skill':
        return (
          <View style={s.detailContent}>
            <View style={s.skillHero}>
              <Ionicons
                name="stats-chart-outline"
                size={35}
                color={C.blue}
              />
              <Text style={s.detailLarge}>Intermediate</Text>
              <Text style={s.mutedText}>
                Your current club skill level
              </Text>
            </View>

            <InfoRow title="Current Level" value="Intermediate" />
            <InfoRow title="Matches Played" value="24" />
            <InfoRow title="Win Rate" value="58%" />
            <InfoRow title="Avg. Points" value="5.2" />

            <Text style={s.helperText}>
              Skill level history and administrator assessments
              will be connected to club records later.
            </Text>
          </View>
        );

      case 'members':
        return (
          <View style={s.detailContent}>
            <Text style={s.mutedText}>
              Riverside club players
            </Text>

            {CLUB_MEMBERS.map(member => (
              <View key={member.name} style={s.memberRow}>
                <Avatar image={member.avatar} size={39} />

                <View style={s.memberInfo}>
                  <Text style={s.memberName}>{member.name}</Text>
                  <Text style={s.memberSkill}>{member.skill}</Text>
                </View>

                <Ionicons
                  name="person-outline"
                  size={18}
                  color={C.muted}
                />
              </View>
            ))}
          </View>
        );

      case 'club':
        return (
          <View style={s.detailContent}>
            <View style={s.skillHero}>
              <Text style={s.clubEmoji}>🏸</Text>
              <Text style={s.detailLarge}>
                Riverside Badminton Club
              </Text>
              <Text style={s.mutedText}>
                Play. Improve. Connect.
              </Text>
            </View>

            <InfoRow title="Club Courts" value="4" />
            <InfoRow title="Main Sport" value="Badminton" />
            <InfoRow title="Primary Format" value="Doubles" />

            <Text style={s.helperText}>
              Official club address, contact details and session
              information will be provided by the club administrator.
            </Text>
          </View>
        );

      case 'notifications':
        return (
          <View style={s.detailContent}>
            <SettingRow
              icon="tennisball-outline"
              title="Match Updates"
              subtitle="Match results and schedule changes"
              value={matchNotifications}
              onChange={setMatchNotifications}
            />

            <SettingRow
              icon="alarm-outline"
              title="Session Reminders"
              subtitle="Upcoming club sessions"
              value={reminders}
              onChange={setReminders}
            />

            <SettingRow
              icon="megaphone-outline"
              title="Club Announcements"
              subtitle="Important club news"
              value={clubNews}
              onChange={setClubNews}
            />

            <Text style={s.helperText}>
              These are local preferences. Push notifications
              will become active after backend integration.
            </Text>
          </View>
        );

      case 'appearance':
        return (
          <View style={s.detailContent}>
            <SettingRow
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Preferred appearance setting"
              value={darkMode}
              onChange={setDarkMode}
            />

            <View style={s.themePreview}>
              <Ionicons
                name="color-palette-outline"
                size={27}
                color={C.green}
              />
              <Text style={s.settingTitle}>
                Riverside Emerald
              </Text>
              <Text style={s.settingSubtitle}>
                Current club theme
              </Text>
            </View>

            <Text style={s.helperText}>
              Riverside currently uses its dark emerald theme.
              The switch saves your preference locally in this
              screen; additional themes will be implemented later.
            </Text>
          </View>
        );

      case 'language':
        return (
          <View style={s.detailContent}>
            {['English', 'Nederlands', 'Ελληνικά'].map(option => (
              <Pressable
                key={option}
                style={s.choiceRow}
                onPress={() => setLanguage(option)}
              >
                <Text style={s.choiceText}>{option}</Text>

                {language === option && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={C.green}
                  />
                )}
              </Pressable>
            ))}

            <Text style={s.helperText}>
              Language selection is a demonstration preference.
              Translated interfaces will be added in a later phase.
            </Text>
          </View>
        );

      case 'settings':
        return (
          <View style={s.detailContent}>
            <SettingRow
              icon="phone-portrait-outline"
              title="Haptic Feedback"
              subtitle="Vibration for supported actions"
              value={vibration}
              onChange={setVibration}
            />

            <InfoRow title="App Platform" value="iOS" />
            <InfoRow title="App Version" value="1.0.0" />
            <InfoRow title="Current Theme" value="Emerald Dark" />

            <Text style={s.helperText}>
              Settings currently affect the demonstration
              interface only.
            </Text>
          </View>
        );

      case 'help':
        return (
          <View style={s.detailContent}>
            <Text style={s.detailSectionTitle}>
              Frequently Asked Questions
            </Text>

            <Text style={s.faqQuestion}>
              How do I mark my attendance?
            </Text>
            <Text style={s.faqAnswer}>
              Open Matches, select Attendance and choose your
              attendance status for the club session.
            </Text>

            <Text style={s.faqQuestion}>
              Where can I view my results?
            </Text>
            <Text style={s.faqAnswer}>
              Open Matches for match results, or Statistics
              for your performance overview.
            </Text>

            <Text style={s.faqQuestion}>
              How do rankings work?
            </Text>
            <Text style={s.faqAnswer}>
              Open Leaderboard and select Win Rate, Matches,
              Points or Form to change the ranking method.
            </Text>

            <Text style={s.faqQuestion}>
              How many courts does Riverside have?
            </Text>
            <Text style={s.faqAnswer}>
              The club match planner supports four courts.
            </Text>
          </View>
        );

      case 'contact':
        return (
          <View style={s.detailContent}>
            <Text style={s.mutedText}>
              Send a message to the club administrator.
            </Text>

            <TextInput
              style={[s.textField, s.messageField]}
              multiline
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message..."
              placeholderTextColor={C.muted}
            />

            <Pressable
              style={s.actionButton}
              onPress={() => {
                if (!message.trim()) {
                  Alert.alert(
                    'Message Required',
                    'Please enter your message first.',
                  );
                  return;
                }

                Alert.alert(
                  'Not Connected Yet',
                  'Your message has not been sent. Admin messaging will be enabled when the backend is connected.',
                );
              }}
            >
              <Ionicons
                name="send-outline"
                size={17}
                color={C.white}
              />
              <Text style={s.actionButtonText}>
                Send Message
              </Text>
            </Pressable>
          </View>
        );

      case 'terms':
        return (
          <View style={s.detailContent}>
            <Text style={s.detailSectionTitle}>
              Terms & Privacy
            </Text>

            <Text style={s.bodyText}>
              Riverside Badminton Club is currently running
              a demonstration version of its player application.
            </Text>

            <Text style={s.bodyText}>
              Match results, attendance, player profiles and
              preferences are demonstration data until the
              application is connected to its live database.
            </Text>

            <Text style={s.bodyText}>
              Official Terms of Use and the Privacy Policy
              must be supplied and approved by the club before
              production launch.
            </Text>
          </View>
        );

      case 'version':
        return (
          <View style={s.detailContent}>
            <View style={s.skillHero}>
              <Ionicons
                name="information-circle-outline"
                size={44}
                color={C.orange}
              />

              <Text style={s.detailLarge}>
                Riverside
              </Text>

              <Text style={s.mutedText}>
                Badminton Club App
              </Text>
            </View>

            <InfoRow title="Version" value="1.0.0" />
            <InfoRow title="Platform" value="iOS" />
            <InfoRow title="Build Stage" value="Development" />
            <InfoRow title="Interface" value="Player App" />
          </View>
        );
    }
  }

  return (
    <Modal
      visible={selected !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />

        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <View style={s.modalHeadingGroup}>
              <Ionicons
                name={item.icon}
                size={23}
                color={item.color}
              />

              <Text style={s.modalTitle}>
                {item.title}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={s.closeButton}
            >
              <Ionicons
                name="close"
                size={20}
                color={C.white}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.modalScroll}
          >
            {renderContent()}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={s.doneButton}
          >
            <Text style={s.doneButtonText}>
              Done
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MorePage() {
  const [selected, setSelected] =
    useState<MenuId | null>(null);

  const [name, setName] = useState('Alex Tan');
  const [email, setEmail] = useState('');

  const [matchNotifications, setMatchNotifications] =
    useState(true);
  const [reminders, setReminders] = useState(true);
  const [clubNews, setClubNews] = useState(true);

  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('English');
  const [vibration, setVibration] = useState(true);

  function handleLogout() {
    Alert.alert(
      'Log Out',
      'Sign out of your Riverside account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Authentication Not Connected',
              'Real logout will be available once the login system is implemented.',
            );
          },
        },
      ],
    );
  }

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* HERO HEADER */}

        <View style={s.hero}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={s.heroImage}
          />

          <View
            pointerEvents="none"
            style={s.heroTint}
          />

          <LinearGradient
            colors={[
              'rgba(3,27,22,0.48)',
              'rgba(3,27,22,0.12)',
              'rgba(3,27,22,0.18)',
              'rgba(3,27,22,0.58)',
              'rgba(3,27,22,0.88)',
              C.bg,
            ]}
            locations={[0, 0.2, 0.4, 0.62, 0.82, 1]}
            style={s.heroOverlay}
          >
            <View style={s.brandRow}>
              <View style={s.brand}>
                <Text style={s.brandIcon}>🏸</Text>

                <View>
                  <Text style={s.brandText}>
                    Riverside
                  </Text>
                  <Text style={s.brandText}>
                    Badminton Club
                  </Text>
                </View>
              </View>

              <View style={s.brandRight}>
                <View style={s.bell}>
                  <Ionicons
                    name="notifications-outline"
                    size={25}
                    color={C.white}
                  />
                  <View style={s.redDot} />
                </View>

                <Avatar size={43} />
              </View>
            </View>

            <View style={s.titleBlock}>
              <Text style={s.heroTitle}>
                Mo<Text style={s.heroMint}>re</Text>
              </Text>

              <Text style={s.heroSubtitle}>
                Manage your account and app settings
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* PAGE CONTENT */}

        <View style={s.content}>
          <Pressable
            onPress={() => setSelected('profile')}
            style={s.profileCard}
          >
            <Avatar size={69} />

            <View style={s.profileInfo}>
              <Text
                style={s.profileName}
                numberOfLines={1}
              >
                {name}
              </Text>

              <SkillBadge skill="Intermediate" />

              <Text style={s.memberSince}>
                Member since Apr 2024
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={23}
              color={C.white}
            />
          </Pressable>

          {SECTIONS.map(section => (
            <Section
              key={section.title}
              title={section.title}
              items={section.items}
              onSelect={setSelected}
            />
          ))}

          <Pressable
            onPress={handleLogout}
            style={s.logoutCard}
          >
            <Ionicons
              name="log-out-outline"
              size={29}
              color={C.red}
            />

            <Text style={s.logoutText}>
              Log Out
            </Text>

            <Ionicons
              name="chevron-forward"
              size={22}
              color={C.white}
            />
          </Pressable>
        </View>
      </ScrollView>

      <DetailModal
        selected={selected}
        onClose={() => setSelected(null)}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        matchNotifications={matchNotifications}
        setMatchNotifications={setMatchNotifications}
        reminders={reminders}
        setReminders={setReminders}
        clubNews={clubNews}
        setClubNews={setClubNews}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
        vibration={vibration}
        setVibration={setVibration}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scrollContent: {
    paddingBottom: 28,
  },

  /* HEADER */

  hero: {
    height: 210,
    overflow: 'hidden',
    backgroundColor: C.bg,
  },

  heroImage: {
    position: 'absolute',
    width: '150%',
    height: '105%',
    right: -40,
    top: 1,
  },

  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,42,32,0.14)',
  },

  heroOverlay: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },

  brandRow: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  brandIcon: {
    fontSize: 29,
  },

  brandText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },

  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  bell: {
    padding: 4,
  },

  redDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },

  titleBlock: {
    paddingBottom: 28,
  },

  heroTitle: {
    color: C.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },

  heroMint: {
    color: C.mint,
  },

  heroSubtitle: {
    color: C.white,
    fontSize: 13,
    marginTop: 1,
  },

  /* CONTENT */

  content: {
    paddingHorizontal: 12,
    gap: 18,
    marginTop: -3,
  },

  /* PROFILE */

  profileCard: {
    minHeight: 102,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: C.card,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  profileInfo: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 5,
  },

  profileName: {
    color: C.white,
    fontSize: 19,
    fontWeight: '800',
  },

  skillBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#5444D8',
    alignSelf: 'flex-start',
  },

  skillBadgeText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '600',
  },

  memberSince: {
    color: C.muted,
    fontSize: 12,
  },

  /* SECTIONS */

  section: {
    gap: 9,
  },

  sectionTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
    paddingHorizontal: 3,
  },

  sectionGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  menuCard: {
    flex: 1,
    minWidth: 0,
    height: 122,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.card,
    paddingHorizontal: 9,
    paddingTop: 14,
    paddingBottom: 10,
    justifyContent: 'flex-start',
  },

  pressed: {
    backgroundColor: '#103A2F',
  },

  menuIcon: {
    marginBottom: 11,
  },

  menuTitle: {
    color: C.white,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },

  menuSubtitle: {
    color: C.muted,
    fontSize: 9,
    lineHeight: 12,
    paddingRight: 1,
  },

  menuArrow: {
    position: 'absolute',
    right: 5,
    bottom: 7,
  },

  /* LOG OUT */

  logoutCard: {
    height: 58,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#4E3828',
    backgroundColor: '#1A2621',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
    marginTop: 3,
  },

  logoutText: {
    color: C.red,
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },

  /* MODAL */

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  modalCard: {
    backgroundColor: '#082A23',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    maxHeight: '82%',
    padding: 16,
    gap: 13,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalHeadingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },

  modalTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
  },

  closeButton: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: C.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalScroll: {
    paddingBottom: 5,
  },

  detailContent: {
    gap: 13,
  },

  profileModalHeader: {
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
  },

  mutedText: {
    color: C.muted,
    fontSize: 12,
    textAlign: 'center',
  },

  fieldLabel: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },

  textField: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    color: C.white,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },

  helperText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  skillHero: {
    alignItems: 'center',
    gap: 9,
    paddingVertical: 18,
  },

  detailLarge: {
    color: C.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 12,
    gap: 10,
  },

  infoLabel: {
    color: C.muted,
    fontSize: 13,
  },

  infoValue: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
  },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  memberInfo: {
    flex: 1,
    gap: 4,
  },

  memberName: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },

  memberSkill: {
    color: C.muted,
    fontSize: 11,
  },

  clubEmoji: {
    fontSize: 40,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  settingInfo: {
    flex: 1,
    gap: 4,
  },

  settingTitle: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },

  settingSubtitle: {
    color: C.muted,
    fontSize: 11,
  },

  themePreview: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: 'center',
    padding: 20,
    gap: 9,
  },

  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.card,
  },

  choiceText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
  },

  detailSectionTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
  },

  faqQuestion: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
  },

  faqAnswer: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  messageField: {
    minHeight: 125,
  },

  actionButton: {
    backgroundColor: '#00A978',
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  actionButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },

  bodyText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
  },

  doneButton: {
    backgroundColor: '#00A978',
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
  },

  doneButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
