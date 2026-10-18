
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

type Screen = 'welcome' | 'login' | 'register';
type Step = 1 | 2 | 3;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const C = {
  bg: '#031B16',
  card: '#102C27',
  border: '#31534A',
  green: '#00D995',
  mint: '#78DCC0',
  white: '#F6FBF8',
  muted: '#B3C4BE',
};

const HERO = require('../../assets/images/match.png');

function Field({
  label,
  value,
  onChangeText,
  icon,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: IconName;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={s.field}>
      <Ionicons name={icon} size={25} color={C.white} />

      <View style={s.fieldContent}>
        <Text style={s.fieldLabel}>{label}</Text>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#79948A"
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !visible}
          selectionColor={C.green}
        />
      </View>

      {secureTextEntry && (
        <Pressable onPress={() => setVisible(!visible)}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={C.white}
          />
        </Pressable>
      )}
    </View>
  );
}

function PrimaryButton({
  title,
  onPress,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={[s.primaryButton, loading && { opacity: 0.65 }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={C.white} />
      ) : (
        <>
          <Text style={s.primaryText}>{title}</Text>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={C.white}
          />
        </>
      )}
    </Pressable>
  );
}

export default function AuthScreen() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('English');

  function back() {
    if (screen === 'register' && step > 1) {
      setStep((step - 1) as Step);
    } else {
      setScreen('welcome');
      setStep(1);
    }
  }

  async function login() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
    } catch (error) {
      Alert.alert(
        'Login failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      Alert.alert(
        'Email required',
        'Enter your email address first.'
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim()
      );

      if (error) throw error;

      Alert.alert(
        'Check your email',
        'If an account exists, password reset instructions will be sent. Complete the reset through the email link.'
      );
    } catch (error) {
      Alert.alert(
        'Reset failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function continueRegistration() {
    if (step === 1) {
      if (!fullName.trim() || !email.trim()) {
        Alert.alert('Missing details', 'Enter your name and email.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        Alert.alert('Invalid email', 'Enter a valid email address.');
        return;
      }

      if (
        password.length < 8 ||
        !/[a-zA-Z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        Alert.alert(
          'Password requirements',
          'Use at least 8 characters, including a letter and a number.'
        );
        return;
      }

      if (!displayName.trim()) {
        setDisplayName(fullName.trim());
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!displayName.trim()) {
        Alert.alert('Display name required');
        return;
      }

      if (birthDate.trim()) {
        const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(birthDate);
        const date = new Date(`${birthDate}T12:00:00Z`);
        const validDate =
          validFormat &&
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === birthDate &&
          date <= new Date();

        if (!validDate) {
          Alert.alert(
            'Invalid date',
            'Enter your date of birth as YYYY-MM-DD.'
          );
          return;
        }
      }

      setStep(3);
    }
  }

  async function register() {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            display_name: displayName.trim(),
            date_of_birth: birthDate || null,
            skill_level: skillLevel,
            notifications_enabled: notifications,
            dark_mode: darkMode,
            language,
          },
        },
      });

      if (error) throw error;

      if (!data.session) {
        Alert.alert(
          'Verify your email',
          'Your registration has been submitted. Check your email to confirm your account, then log in.',
          [
            {
              text: 'Go to login',
              onPress: () => setScreen('login'),
            },
          ]
        );
      }
      // With a session, the app's auth listener opens Home.
    } catch (error) {
      Alert.alert(
        'Registration failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function Progress() {
    return (
      <View style={s.progress}>
        {(['Account', 'Details', 'Settings'] as const).map(
          (label, index) => {
            const number = index + 1;
            const done = number < step;
            const active = number === step;

            return (
              <View key={label} style={s.progressItem}>
                <View
                  style={[
                    s.progressCircle,
                    (done || active) && s.progressActive,
                  ]}
                >
                  {done ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={C.bg}
                    />
                  ) : (
                    <Text
                      style={[
                        s.progressNumber,
                        (done || active) && { color: C.bg },
                      ]}
                    >
                      {number}
                    </Text>
                  )}
                </View>
                <Text style={s.progressLabel}>{label}</Text>
              </View>
            );
          }
        )}
      </View>
    );
  }

  function Preference({
    icon,
    title,
    description,
    value,
    onChange,
  }: {
    icon: IconName;
    title: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
  }) {
    return (
      <View style={s.preference}>
        <Ionicons name={icon} size={27} color={C.white} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.preferenceTitle}>{title}</Text>
          <Text style={s.preferenceDescription}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#31534A', true: '#00A875' }}
          thumbColor={C.white}
        />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Image
        source={HERO}
        style={s.backgroundImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[
          'rgba(0,20,15,0.58)',
          'rgba(0,20,15,0.82)',
          C.bg,
        ]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            s.content,
            screen === 'welcome' && s.welcomeContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {screen === 'welcome' ? (
            <>
              <View style={s.brand}>
                <Text style={s.brandIcon}>🏸</Text>
                <Text style={s.brandText}>
                  Riverside{'\n'}Badminton Club
                </Text>
              </View>

              <View style={s.welcomeHeading}>
                <Text style={s.welcomeTitle}>
                  Play{'\n'}Connect{'\n'}
                  <Text style={{ color: C.green }}>Improve</Text>
                </Text>
                <Text style={s.welcomeDescription}>
                  Join our community, track your matches
                  and see your progress.
                </Text>
              </View>

              <View style={s.welcomeBottom}>
                <PrimaryButton
                  title="Log In"
                  onPress={() => setScreen('login')}
                />
                <Pressable
                  style={s.secondaryButton}
                  onPress={() => {
                    setStep(1);
                    setScreen('register');
                  }}
                >
                  <Text style={s.secondaryButtonText}>
                    Create Account
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={C.white}
                  />
                </Pressable>
                <Text style={s.footnote}>
                  A friendly badminton community{'\n'}
                  for all skill levels
                </Text>
              </View>
            </>
          ) : (
            <>
              <Pressable onPress={back} style={s.backButton}>
                <Ionicons
                  name="chevron-back"
                  size={27}
                  color={C.white}
                />
              </Pressable>

              {screen === 'register' && <Progress />}

              <View style={s.formHeading}>
                <Text style={s.heading}>
                  {screen === 'login'
                    ? 'Welcome back!'
                    : step === 1
                      ? 'Create your account'
                      : step === 2
                        ? 'Tell us about you'
                        : 'Almost done!'}
                </Text>

                <Text style={s.subheading}>
                  {screen === 'login'
                    ? 'Log in to Riverside Badminton Club'
                    : step === 1
                      ? "Let's get you started"
                      : step === 2
                        ? 'This helps us match you with the right players and show accurate stats.'
                        : 'A few final preferences to get the best experience.'}
                </Text>
              </View>

              {screen === 'login' && (
                <View style={s.form}>
                  <Field
                    label="Email address"
                    value={email}
                    onChangeText={setEmail}
                    icon="mail-outline"
                    keyboardType="email-address"
                  />
                  <Field
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    icon="lock-closed-outline"
                    secureTextEntry
                  />
                  <Pressable
                    onPress={resetPassword}
                    disabled={loading}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    <Text style={s.link}>Forgot password?</Text>
                  </Pressable>

                  <PrimaryButton
                    title="Log In"
                    onPress={login}
                    loading={loading}
                  />

                  <Pressable
                    onPress={() => {
                      setStep(1);
                      setScreen('register');
                    }}
                  >
                    <Text style={s.bottomLink}>
                      Don't have an account?{' '}
                      <Text style={s.link}>Create Account</Text>
                    </Text>
                  </Pressable>
                </View>
              )}

              {screen === 'register' && step === 1 && (
                <View style={s.form}>
                  <Field
                    label="Full name"
                    value={fullName}
                    onChangeText={setFullName}
                    icon="person-outline"
                    autoCapitalize="words"
                  />
                  <Field
                    label="Email address"
                    value={email}
                    onChangeText={setEmail}
                    icon="mail-outline"
                    keyboardType="email-address"
                  />
                  <Field
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    icon="lock-closed-outline"
                    secureTextEntry
                  />

                  <View style={s.requirements}>
                    {[
                      ['At least 8 characters', password.length >= 8],
                      ['Includes a number', /[0-9]/.test(password)],
                      ['Includes a letter', /[a-zA-Z]/.test(password)],
                    ].map(([label, valid]) => (
                      <View key={String(label)} style={s.requirement}>
                        <Ionicons
                          name={
                            valid
                              ? 'checkmark-circle'
                              : 'ellipse-outline'
                          }
                          color={valid ? C.green : C.muted}
                          size={19}
                        />
                        <Text style={s.requirementText}>
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <PrimaryButton
                    title="Continue"
                    onPress={continueRegistration}
                  />

                  <Text style={s.bottomLink}>
                    Already have an account?{' '}
                    <Text
                      style={s.link}
                      onPress={() => setScreen('login')}
                    >
                      Log In
                    </Text>
                  </Text>
                </View>
              )}

              {screen === 'register' && step === 2 && (
                <View style={s.form}>
                  <View style={s.avatarPlaceholder}>
                    <Ionicons
                      name="person"
                      size={55}
                      color={C.mint}
                    />
                  </View>

                  <Field
                    label="Display name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    icon="person-outline"
                    autoCapitalize="words"
                  />
                  <Field
                    label="Date of birth"
                    value={birthDate}
                    onChangeText={setBirthDate}
                    icon="calendar-outline"
                    placeholder="YYYY-MM-DD"
                  />

                  <Text style={s.fieldLabel}>Skill level</Text>

                  <View style={s.skillOptions}>
                    {['Beginner', 'Intermediate', 'Advanced'].map(
                      level => (
                        <Pressable
                          key={level}
                          onPress={() => setSkillLevel(level)}
                          style={[
                            s.skillOption,
                            skillLevel === level && s.skillSelected,
                          ]}
                        >
                          <Text
                            style={[
                              s.skillText,
                              skillLevel === level && {
                                color: C.green,
                              },
                            ]}
                          >
                            {level}
                          </Text>
                        </Pressable>
                      )
                    )}
                  </View>

                  <PrimaryButton
                    title="Continue"
                    onPress={continueRegistration}
                  />
                </View>
              )}

              {screen === 'register' && step === 3 && (
                <View style={s.form}>
                  <Preference
                    icon="notifications-outline"
                    title="Notifications"
                    description="Match updates, reminders and announcements"
                    value={notifications}
                    onChange={setNotifications}
                  />
                  <Preference
                    icon="moon-outline"
                    title="Dark mode"
                    description="Use dark theme"
                    value={darkMode}
                    onChange={setDarkMode}
                  />

                  <View style={s.preference}>
                    <Ionicons
                      name="globe-outline"
                      size={27}
                      color={C.white}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.preferenceTitle}>Language</Text>
                      <Text style={s.preferenceDescription}>
                        {language}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        Alert.alert('Language', 'Choose language', [
                          {
                            text: 'English',
                            onPress: () => setLanguage('English'),
                          },
                          {
                            text: 'Dutch',
                            onPress: () => setLanguage('Dutch'),
                          },
                          { text: 'Cancel', style: 'cancel' },
                        ])
                      }
                    >
                      <Ionicons
                        name="chevron-down"
                        size={22}
                        color={C.white}
                      />
                    </Pressable>
                  </View>

                  <View style={{ height: 25 }} />

                  <PrimaryButton
                    title="Create Account"
                    onPress={register}
                    loading={loading}
                  />

                  <Text style={s.terms}>
                    By creating an account, you agree to the
                    club's Terms of Service and Privacy Policy.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  content: {
    flexGrow: 1,
    paddingTop: 65,
    paddingHorizontal: 25,
    paddingBottom: 45,
  },
  welcomeContent: {
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  brandIcon: {
    fontSize: 42,
  },
  brandText: {
    color: C.white,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
  },
  welcomeHeading: {
    marginTop: 60,
    marginBottom: 70,
  },
  welcomeTitle: {
    color: C.white,
    fontSize: 45,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -1,
  },
  welcomeDescription: {
    color: C.white,
    fontSize: 17,
    lineHeight: 26,
    marginTop: 14,
  },
  welcomeBottom: {
    gap: 13,
  },
  primaryButton: {
    backgroundColor: '#00A976',
    minHeight: 57,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 17,
    gap: 12,
  },
  primaryText: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 53,
    borderWidth: 1,
    borderColor: '#6B8C80',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  secondaryButtonText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 16,
  },
  footnote: {
    color: C.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 13,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 20,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 45,
  },
  progressItem: {
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#668076',
    backgroundColor: '#19342C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressActive: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  progressNumber: {
    color: C.white,
    fontWeight: '800',
  },
  progressLabel: {
    color: C.white,
    fontSize: 12,
  },
  formHeading: {
    marginBottom: 27,
    gap: 6,
  },
  heading: {
    color: C.white,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subheading: {
    color: C.white,
    fontSize: 17,
    lineHeight: 25,
  },
  form: {
    gap: 14,
  },
  field: {
    backgroundColor: 'rgba(22,50,43,0.92)',
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 13,
    minHeight: 69,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fieldContent: {
    flex: 1,
    paddingVertical: 8,
  },
  fieldLabel: {
    color: C.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    color: C.white,
    fontSize: 15,
    paddingVertical: 3,
  },
  link: {
    color: C.green,
    fontWeight: '700',
  },
  bottomLink: {
    color: C.white,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  requirements: {
    gap: 8,
    marginVertical: 3,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  requirementText: {
    color: C.white,
    fontSize: 13,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#194C3E',
    borderWidth: 2,
    borderColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  skillOptions: {
    flexDirection: 'row',
    gap: 7,
  },
  skillOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  skillSelected: {
    borderColor: C.green,
    backgroundColor: '#064432',
  },
  skillText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  preference: {
    backgroundColor: 'rgba(22,50,43,0.92)',
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 13,
    minHeight: 81,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  preferenceTitle: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
  },
  preferenceDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  terms: {
    color: C.muted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },
});
