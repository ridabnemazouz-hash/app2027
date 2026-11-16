import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Grid2X2 from 'lucide-react-native/icons/grid-2x2';
import Map from 'lucide-react-native/icons/map';
import Layers from 'lucide-react-native/icons/layers';
import Sparkles from 'lucide-react-native/icons/sparkles';
import BookOpen from 'lucide-react-native/icons/book-open';
import ChartNoAxesCombined from 'lucide-react-native/icons/chart-no-axes-combined';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import UserRound from 'lucide-react-native/icons/user-round';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import Clock from 'lucide-react-native/icons/clock';
import Flame from 'lucide-react-native/icons/flame';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Heart from 'lucide-react-native/icons/heart';
import Circle from 'lucide-react-native/icons/circle';
import CircleDot from 'lucide-react-native/icons/circle-dot';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Volume2 from 'lucide-react-native/icons/volume-2';
import Play from 'lucide-react-native/icons/play';
import Pause from 'lucide-react-native/icons/pause';
import Square from 'lucide-react-native/icons/square';
import Eye from 'lucide-react-native/icons/eye';
import Flower2 from 'lucide-react-native/icons/flower-2';
import Sun from 'lucide-react-native/icons/sun';
import Leaf from 'lucide-react-native/icons/leaf';
import Brush from 'lucide-react-native/icons/brush';
import Search from 'lucide-react-native/icons/search';
import Bell from 'lucide-react-native/icons/bell';
import Info from 'lucide-react-native/icons/info';
import X from 'lucide-react-native/icons/x';
import Check from 'lucide-react-native/icons/check';
import Flag from 'lucide-react-native/icons/flag';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import FileText from 'lucide-react-native/icons/file-text';
import Mic from 'lucide-react-native/icons/mic';
import type { LucideIcon } from 'lucide-react-native';
import { router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useLearning, type MessageKey } from './state';
export function usePalette() {
  const { preferences } = useLearning();
  const system = useColorScheme();
  const dark =
    preferences.theme === 'dark' || (preferences.theme === 'system' && system === 'dark');
  return dark
    ? {
        dark,
        bg: '#171c1a',
        card: '#222925',
        text: '#f5f4ed',
        muted: '#aaa99e',
        border: '#383a33',
        red: '#f07468',
        redBg: '#3b2624',
        soft: '#2b2e25',
        green: '#9ac6ad',
      }
    : {
        dark,
        bg: '#f8f6ef',
        card: '#ffffff',
        text: '#20251e',
        muted: '#7b8074',
        border: '#e5e7dc',
        red: '#ba3d36',
        redBg: '#f8eee7',
        soft: '#eef1e7',
        green: '#547c69',
      };
}
const iconMap = {
  'grid-outline': Grid2X2,
  'map-outline': Map,
  'albums-outline': Layers,
  'sparkles-outline': Sparkles,
  'book-outline': BookOpen,
  'stats-chart-outline': ChartNoAxesCombined,
  'chatbubble-ellipses-outline': MessageCircle,
  'options-outline': SlidersHorizontal,
  'person-outline': UserRound,
  'chevron-back': ChevronLeft,
  'chevron-forward': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'arrow-back': ArrowLeft,
  'arrow-forward': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-up-outline': ArrowUp,
  'time-outline': Clock,
  'flame-outline': Flame,
  'refresh-outline': RefreshCw,
  'sync-outline': RefreshCw,
  heart: Heart,
  'heart-outline': Heart,
  'checkmark-circle': CircleCheck,
  'checkmark-circle-outline': CircleCheck,
  'radio-button-on': CircleDot,
  'radio-button-off': Circle,
  'volume-medium-outline': Volume2,
  play: Play,
  'play-outline': Play,
  pause: Pause,
  'pause-outline': Pause,
  'stop-outline': Square,
  'eye-outline': Eye,
  'flower-outline': Flower2,
  'sunny-outline': Sun,
  'leaf-outline': Leaf,
  'brush-outline': Brush,
  'search-outline': Search,
  'notifications-outline': Bell,
  'information-circle-outline': Info,
  close: X,
  'close-outline': X,
  checkmark: Check,
  'flag-outline': Flag,
  'ellipsis-horizontal-outline': Ellipsis,
  'document-text-outline': FileText,
  'mic-outline': Mic,
} satisfies Record<string, LucideIcon>;
export type IconName = keyof typeof iconMap;
export function Icon({
  name,
  size = 21,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const c = usePalette();
  const Glyph = iconMap[name];
  return (
    <Glyph
      size={size}
      color={color ?? c.text}
      strokeWidth={1.7}
      fill={name === 'heart' ? (color ?? c.red) : 'none'}
    />
  );
}
export function Txt({
  children,
  size = 14,
  color,
  weight = '400',
  serif = false,
  style,
  mandarin = false,
  numberOfLines,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: TextStyle['fontWeight'];
  serif?: boolean;
  style?: StyleProp<TextStyle>;
  mandarin?: boolean;
  numberOfLines?: number;
}) {
  const c = usePalette(),
    { rtl } = useLearning();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: size,
          lineHeight: size * 1.5,
          color: color ?? c.text,
          fontWeight: weight,
          textAlign: rtl && !mandarin ? 'right' : 'left',
          writingDirection: mandarin ? 'ltr' : rtl ? 'rtl' : 'auto',
          fontFamily: serif
            ? Platform.OS === 'ios'
              ? 'Georgia'
              : Platform.OS === 'web'
                ? 'Georgia'
                : 'serif'
            : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { rtl } = useLearning();
  return (
    <View
      style={[{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }, style]}
    >
      {children}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const c = usePalette();
  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 20,
          padding: 22,
          gap: 14,
          shadowColor: '#162017',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: c.dark ? 0 : 0.045,
          shadowRadius: 18,
          elevation: c.dark ? 0 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  busy = false,
  small = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'inverse' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = usePalette();
  const { rtl } = useLearning();
  const shownIcon =
    rtl && icon === 'arrow-forward'
      ? 'arrow-back'
      : rtl && icon === 'arrow-back'
        ? 'arrow-forward'
        : icon;
  const fg =
    variant === 'inverse'
      ? '#20251e'
      : variant === 'primary'
        ? c.dark
          ? '#20251e'
          : '#fff'
        : variant === 'danger'
          ? c.red
          : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: small ? 44 : 50,
          paddingHorizontal: small ? 14 : 20,
          paddingVertical: 10,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            variant === 'primary'
              ? c.text
              : variant === 'inverse'
                ? '#f7f7f2'
                : variant === 'secondary'
                  ? c.soft
                  : variant === 'danger'
                    ? c.redBg
                    : 'transparent',
          opacity: disabled || busy ? 0.5 : pressed ? 0.78 : 1,
        },
        style,
      ]}
    >
      <Row style={{ gap: 9, justifyContent: 'center' }}>
        {busy ? (
          <ActivityIndicator color={fg} />
        ) : icon ? (
          <Icon name={shownIcon!} size={18} color={fg} />
        ) : null}
        <Txt size={small ? 12 : 14} color={fg} weight="600" style={{ textAlign: 'center' }}>
          {label}
        </Txt>
      </Row>
    </Pressable>
  );
}
export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: active ? c.text : c.border,
        borderRadius: 11,
        backgroundColor: active ? c.text : c.card,
      }}
    >
      <Txt size={12} weight="500" color={active ? c.bg : c.muted}>
        {label}
      </Txt>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  multiline = false,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
}) {
  const c = usePalette(),
    { rtl } = useLearning();
  return (
    <View style={{ gap: 7 }}>
      <Txt size={12} weight="600">
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={keyboardType === 'email-address' || secureTextEntry ? 'none' : 'sentences'}
        autoCorrect={!secureTextEntry && keyboardType !== 'email-address'}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        style={{
          minHeight: 50,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 12,
          padding: 14,
          color: c.text,
          backgroundColor: c.card,
          fontSize: 15,
          textAlign: rtl ? 'right' : 'left',
          ...(multiline ? { height: 100, textAlignVertical: 'top' as const } : {}),
        }}
      />
    </View>
  );
}
export function Meter({ value, color }: { value: number; color?: string }) {
  const c = usePalette();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ height: 5, borderRadius: 8, backgroundColor: c.border, overflow: 'hidden' }}
    >
      <View
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          backgroundColor: color ?? c.green,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
export function Badge({ children, red = false }: { children: React.ReactNode; red?: boolean }) {
  const c = usePalette();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 6,
        paddingHorizontal: 9,
        paddingVertical: 4,
        backgroundColor: red ? c.redBg : c.soft,
      }}
    >
      <Txt size={10} weight="600" color={red ? c.red : c.green}>
        {children}
      </Txt>
    </View>
  );
}
export function SectionTitle({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
      <Txt size={18} weight="600">
        {title}
      </Txt>
      {action && onPress ? (
        <Button label={action} variant="ghost" small onPress={onPress} icon="arrow-forward" />
      ) : null}
    </Row>
  );
}
export function Heading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  const c = usePalette();
  return (
    <View style={{ gap: 7, marginBottom: 10 }}>
      {eyebrow ? (
        <Txt
          color={c.red}
          weight="600"
          size={11}
          style={{ letterSpacing: 1.7, textTransform: 'uppercase' }}
        >
          {eyebrow}
        </Txt>
      ) : null}
      <Txt serif size={34} style={{ lineHeight: 42 }}>
        {title}
      </Txt>
      {subtitle ? <Txt color={c.muted}>{subtitle}</Txt> : null}
    </View>
  );
}
export function Empty({
  title,
  subtitle,
  icon = 'leaf-outline',
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  action?: React.ReactNode;
}) {
  const c = usePalette();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 40 }}>
      <View style={{ padding: 14, backgroundColor: c.soft, borderRadius: 40 }}>
        <Icon name={icon} size={26} color={c.green} />
      </View>
      <Txt weight="600" size={18} style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      {subtitle ? (
        <Txt color={c.muted} style={{ textAlign: 'center', maxWidth: 400 }}>
          {subtitle}
        </Txt>
      ) : null}
      {action}
    </Card>
  );
}
export const navItems: { key: MessageKey; path: string; icon: IconName }[] = [
  { key: 'home', path: '/', icon: 'grid-outline' },
  { key: 'learn', path: '/learn', icon: 'map-outline' },
  { key: 'vocabulary', path: '/vocabulary', icon: 'albums-outline' },
  { key: 'practice', path: '/practice', icon: 'sparkles-outline' },
  { key: 'library', path: '/library', icon: 'book-outline' },
  { key: 'progress', path: '/progress', icon: 'stats-chart-outline' },
  { key: 'tutor', path: '/tutor', icon: 'chatbubble-ellipses-outline' },
];
export function Shell({
  children,
  active,
  noNav = false,
}: {
  children: React.ReactNode;
  active?: string;
  noNav?: boolean;
}) {
  const c = usePalette(),
    s = useLearning(),
    path = usePathname(),
    insets = useSafeAreaInsets(),
    { width } = useWindowDimensions();
  const desktop = width >= 1024;
  const link = (item: (typeof navItems)[number], compact = false) => {
    const selected = (active ?? path) === item.path;
    return (
      <Pressable
        key={item.path}
        accessibilityRole="button"
        accessibilityLabel={s.t(item.key)}
        accessibilityState={{ selected }}
        onPress={() => router.push(item.path as '/')}
        style={{
          minHeight: 48,
          paddingHorizontal: compact ? 7 : 15,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: selected ? c.soft : 'transparent',
          flex: compact ? 1 : undefined,
        }}
      >
        <Row style={{ gap: 12, flexDirection: compact ? 'column' : s.rtl ? 'row-reverse' : 'row' }}>
          <Icon name={item.icon} size={compact ? 21 : 19} color={selected ? c.text : c.muted} />
          <Txt
            size={compact ? 9 : 13}
            weight={selected ? '600' : '400'}
            color={selected ? c.text : c.muted}
          >
            {s.t(item.key)}
          </Txt>
          {!compact && selected ? (
            <View
              style={{
                marginLeft: 'auto',
                width: 5,
                height: 5,
                borderRadius: 5,
                backgroundColor: c.red,
              }}
            />
          ) : null}
        </Row>
      </Pressable>
    );
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <Row style={{ flex: 1, alignItems: 'stretch', gap: 0 }}>
        {desktop && !noNav ? (
          <View
            style={{
              width: 228,
              padding: 22,
              borderRightWidth: s.rtl ? 0 : 1,
              borderLeftWidth: s.rtl ? 1 : 0,
              borderColor: c.border,
              backgroundColor: c.card,
            }}
          >
            <Logo />
            <View style={{ height: 42 }} />
            <Txt
              size={9}
              weight="600"
              color={c.muted}
              style={{ letterSpacing: 1.5, marginBottom: 15 }}
            >
              MANDARIN · 中文
            </Txt>
            <View accessibilityLabel={s.t('navLabel')} style={{ gap: 6 }}>
              {navItems.map((i) => link(i))}
            </View>
            <View style={{ flex: 1, minHeight: 40 }} />
            <Card style={{ padding: 15, backgroundColor: c.bg, gap: 10 }}>
              <Icon name="flower-outline" color={c.red} />
              <Txt size={12} weight="600">
                {s.t('learnChinese')}
              </Txt>
              <Txt size={10} color={c.muted}>
                {s.t('tip')}
              </Txt>
            </Card>
            <View style={{ height: 12 }} />
            {link({ key: 'settings', path: '/settings', icon: 'options-outline' })}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/account')}
              style={{ borderTopWidth: 1, borderColor: c.border, paddingTop: 18, marginTop: 10 }}
            >
              <Row>
                <Avatar />
                <View style={{ flex: 1 }}>
                  <Txt size={12} weight="600" numberOfLines={1}>
                    {s.user?.name ?? s.t('localProfile')}
                  </Txt>
                  <Txt size={10} color={c.muted}>
                    {s.user ? s.t('online') : s.t('local')}
                  </Txt>
                </View>
                <Icon name={s.rtl ? 'chevron-back' : 'chevron-forward'} size={15} />
              </Row>
            </Pressable>
          </View>
        ) : null}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: desktop ? 42 : 20,
              paddingTop: desktop ? 25 : 15,
              paddingBottom: 40,
              flexGrow: 1,
            }}
          >
            <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', gap: 22 }}>
              <Row
                style={{
                  justifyContent: 'space-between',
                  paddingBottom: desktop ? 21 : 12,
                  borderBottomWidth: 1,
                  borderColor: c.border,
                }}
              >
                {desktop && !noNav ? (
                  <Row>
                    <Txt size={12} color={c.muted}>
                      {s.t(navItems.find((i) => i.path === (active ?? path))?.key ?? 'learn')}
                    </Txt>
                    <Txt size={12} color={c.muted}>
                      /
                    </Txt>
                    <Txt size={12}>HanziGo</Txt>
                  </Row>
                ) : (
                  <Logo small />
                )}
                <Row style={{ gap: 14 }}>
                  <Badge>{s.user ? s.t(s.syncStatus) : s.t('local')}</Badge>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={s.t('settings')}
                    onPress={() => router.push('/settings')}
                    style={{ padding: 8 }}
                  >
                    <Icon name="options-outline" size={20} />
                  </Pressable>
                </Row>
              </Row>
              {!s.ready ? (
                <View style={{ gap: 18 }}>
                  <ActivityIndicator color={c.red} />
                  <Txt>{s.t('loading')}</Txt>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={{ height: 100, borderRadius: 20, backgroundColor: c.border }}
                    />
                  ))}
                </View>
              ) : (
                children
              )}
              {s.error || s.notice ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={s.clearError}
                  style={{ padding: 16, borderRadius: 12, backgroundColor: c.redBg }}
                >
                  <Row>
                    <Icon name="information-circle-outline" color={c.red} />
                    <Txt color={c.red} style={{ flex: 1 }}>
                      {s.t((s.error || s.notice) as MessageKey)}
                    </Txt>
                    <Icon name="close" size={16} />
                  </Row>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Row>
      {!desktop && !noNav ? (
        <Row
          style={{
            gap: 0,
            paddingHorizontal: 8,
            paddingTop: 5,
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: c.card,
            borderTopWidth: 1,
            borderColor: c.border,
          }}
        >
          {[
            navItems[0]!,
            navItems[1]!,
            navItems[3]!,
            navItems[4]!,
            { key: 'more' as const, path: '/more', icon: 'ellipsis-horizontal-outline' as const },
          ].map((i) => link(i, true))}
        </Row>
      ) : null}
    </View>
  );
}
export function Avatar() {
  const c = usePalette();
  return (
    <View
      style={{
        height: 34,
        width: 34,
        borderRadius: 12,
        backgroundColor: c.redBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="person-outline" size={17} color={c.red} />
    </View>
  );
}
export function Logo({ small = false }: { small?: boolean }) {
  const c = usePalette();
  return (
    <Row style={{ gap: 9 }}>
      <View
        style={{
          width: small ? 30 : 36,
          height: small ? 30 : 36,
          borderRadius: 10,
          backgroundColor: c.red,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{ fontSize: small ? 21 : 25, color: '#fff', fontWeight: '600', lineHeight: 32 }}
        >
          汉
        </Text>
      </View>
      <Txt size={small ? 19 : 23} weight="600" style={{ letterSpacing: -0.8 }}>
        HanziGo<Txt color={c.red}>.</Txt>
      </Txt>
    </Row>
  );
}
export const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stack: { gap: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
});
