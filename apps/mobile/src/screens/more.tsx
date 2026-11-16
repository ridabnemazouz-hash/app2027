import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useLearning } from '../state';
import { Card, Heading, Icon, Row, Shell, Txt, usePalette, type IconName } from '../ui';

export function MoreScreen() {
  const s = useLearning();
  const c = usePalette();
  const links: {
    key: 'vocabulary' | 'progress' | 'tutor' | 'settings' | 'account';
    path: string;
    icon: IconName;
  }[] = [
    { key: 'vocabulary', path: '/vocabulary', icon: 'albums-outline' },
    { key: 'progress', path: '/progress', icon: 'stats-chart-outline' },
    { key: 'tutor', path: '/tutor', icon: 'chatbubble-ellipses-outline' },
    { key: 'settings', path: '/settings', icon: 'options-outline' },
    { key: 'account', path: '/account', icon: 'person-outline' },
  ];
  return (
    <Shell active="/more">
      <Heading title={s.t('more')} subtitle={s.t('learnChinese')} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {links.map((link, index) => (
          <Pressable
            key={link.key}
            accessibilityRole="button"
            accessibilityLabel={s.t(link.key)}
            onPress={() => router.push(link.path as '/')}
          >
            <Row style={{ padding: 20, borderTopWidth: index ? 1 : 0, borderColor: c.border }}>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: c.soft }}>
                <Icon name={link.icon} color={c.green} />
              </View>
              <Txt weight="600" style={{ flex: 1 }}>
                {s.t(link.key)}
              </Txt>
              <Icon name={s.rtl ? 'chevron-back' : 'chevron-forward'} size={17} color={c.muted} />
            </Row>
          </Pressable>
        ))}
      </Card>
    </Shell>
  );
}
