import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Speech from 'expo-speech';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLearning } from './state';
import { Button, Icon, Row, Txt, usePalette } from './ui';
export function Pronunciation({ text, audio = null }: { text: string; audio?: string | null }) {
  const s = useLearning(),
    c = usePalette(),
    [busy, setBusy] = useState(false),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState(''),
    [slow, setSlow] = useState(false);
  const player = useAudioPlayer(audio ? { uri: audio } : null, { downloadFirst: true });
  const status = useAudioPlayerStatus(player);
  useEffect(
    () => () => {
      void Speech.stop();
    },
    [],
  );
  async function playDevice(repetitions = 1) {
    setError('');
    setBusy(true);
    try {
      await Speech.stop();
      const voices = await Speech.getAvailableVoicesAsync();
      const voice =
        voices.find((v) => /^zh[-_](CN|Hans)/i.test(v.language)) ??
        voices.find((v) => /^zh[-_](TW|Hant)/i.test(v.language) || /^cmn/i.test(v.language));
      if (!voice) {
        setError(s.t('voiceMissing'));
        return;
      }
      setPlaying(true);
      let remaining = repetitions;
      const speak = () =>
        Speech.speak(text, {
          language: 'zh-CN',
          voice: voice.identifier,
          rate: slow ? 0.65 : 0.9,
          onDone: () => {
            if (--remaining > 0) speak();
            else setPlaying(false);
          },
          onStopped: () => setPlaying(false),
          onError: () => {
            setError(s.t('audioError'));
            setPlaying(false);
          },
        });
      speak();
    } catch {
      setError(s.t('audioError'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 10 }}>
      {audio ? (
        <>
          <Row>
            <Button
              label={s.t(status.playing ? 'stop' : 'play')}
              busy={!status.isLoaded}
              icon={status.playing ? 'pause-outline' : 'play-outline'}
              variant="secondary"
              onPress={() => {
                try {
                  if (status.playing) player.pause();
                  else {
                    void player.seekTo(0);
                    player.play();
                  }
                } catch {
                  setError(s.t('audioError'));
                }
              }}
            />
            <Button
              label={s.t('slow')}
              variant="ghost"
              onPress={() => {
                player.setPlaybackRate(slow ? 1 : 0.75);
                setSlow(!slow);
              }}
            />
          </Row>
          <Txt size={11} color={c.muted}>
            {Math.floor(status.currentTime)} / {Math.floor(status.duration)} s
          </Txt>
        </>
      ) : (
        <>
          <Txt color={c.muted} size={11}>
            {s.t('audioUnavailable')}
          </Txt>
          <Row style={{ flexWrap: 'wrap' }}>
            <Button
              small
              label={s.t(playing ? 'stopSpeaking' : 'deviceVoice')}
              icon={playing ? 'stop-outline' : 'volume-medium-outline'}
              variant="secondary"
              busy={busy}
              onPress={() => {
                if (playing) {
                  void Speech.stop();
                  setPlaying(false);
                } else void playDevice();
              }}
            />
            <Button
              small
              label={`${s.t('repeat')} ×2`}
              variant="ghost"
              disabled={playing || busy}
              onPress={() => {
                void playDevice(2);
              }}
            />
            <Button
              small
              label={`${slow ? '✓ ' : ''}${s.t('slow')}`}
              variant="ghost"
              onPress={() => setSlow(!slow)}
            />
          </Row>
          <Txt color={c.muted} size={10}>
            {s.t('deviceNote')}
          </Txt>
        </>
      )}
      {status.error ? (
        <>
          <Txt size={12} color={c.red}>
            {s.t('audioError')}
          </Txt>
          <Button
            small
            label={s.t('retry')}
            variant="secondary"
            onPress={() => {
              if (audio) player.replace({ uri: audio });
            }}
          />
        </>
      ) : null}
      {error ? (
        <Txt size={12} color={c.red}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

/** Compact device-voice playback for vocabulary cards; full speed/repeat controls are on the detail page. */
export function QuickPronunciation({ text }: { text: string }) {
  const s = useLearning(),
    c = usePalette();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function play() {
    setBusy(true);
    setError('');
    try {
      await Speech.stop();
      const voices = await Speech.getAvailableVoicesAsync();
      const voice =
        voices.find((v) => /^zh[-_](CN|Hans)/i.test(v.language)) ??
        voices.find((v) => /^zh[-_](TW|Hant)/i.test(v.language) || /^cmn/i.test(v.language));
      if (!voice) {
        setError(s.t('voiceMissing'));
        return;
      }
      Speech.speak(text, {
        language: 'zh-CN',
        voice: voice.identifier,
        rate: 0.9,
        onError: () => setError(s.t('audioError')),
      });
    } catch {
      setError(s.t('audioError'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${s.t('deviceVoice')}: ${text}`}
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() => {
          void play();
        }}
        style={{ padding: 8 }}
      >
        <Icon name="volume-medium-outline" size={19} color={c.green} />
      </Pressable>
      {error ? (
        <Txt size={10} color={c.red}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}
