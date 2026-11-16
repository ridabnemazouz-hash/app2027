import React, { useRef, useState } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { useLearning } from './state';
import { Button, Row, Txt, usePalette } from './ui';
export function Drawing({
  onSave,
}: {
  onSave: (paths: string[], seconds: number) => Promise<void>;
}) {
  const s = useLearning(),
    c = usePalette(),
    [paths, setPaths] = useState<string[]>([]),
    [current, setCurrent] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const path = useRef('');
  const started = useRef<number | null>(null);
  const [size, setSize] = useState(280);
  return (
    <View style={{ gap: 14, alignItems: 'center' }}>
      <View
        accessible
        accessibilityLabel={s.t('writeHint')}
        style={{
          width: '100%',
          maxWidth: 350,
          aspectRatio: 1,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          backgroundColor: c.bg,
          overflow: 'hidden',
          ...(Platform.OS === 'web' ? ({ touchAction: 'none' } as unknown as ViewStyle) : {}),
        }}
        onLayout={(e) => setSize(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          if (started.current === null) started.current = Date.now();
          setMessage('');
          const { locationX: x, locationY: y } = e.nativeEvent;
          path.current = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          setCurrent(path.current);
        }}
        onResponderMove={(e) => {
          const { locationX: x, locationY: y } = e.nativeEvent;
          path.current += ` L ${Math.max(0, Math.min(size, x)).toFixed(1)} ${Math.max(0, Math.min(size, y)).toFixed(1)}`;
          setCurrent(path.current);
        }}
        onResponderRelease={() => {
          if (path.current.includes('L')) setPaths((prev) => [...prev, path.current]);
          setCurrent('');
        }}
        onResponderTerminate={() => {
          setCurrent('');
          path.current = '';
        }}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} pointerEvents="none">
          <Line
            x1={size / 2}
            y1={0}
            x2={size / 2}
            y2={size}
            stroke={c.border}
            strokeDasharray="6 5"
          />
          <Line
            x1={0}
            y1={size / 2}
            x2={size}
            y2={size / 2}
            stroke={c.border}
            strokeDasharray="6 5"
          />
          <Line x1={0} y1={0} x2={size} y2={size} stroke={c.border} strokeDasharray="6 5" />
          <Line x1={size} y1={0} x2={0} y2={size} stroke={c.border} strokeDasharray="6 5" />
          {[...paths, current].filter(Boolean).map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke={c.text}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </View>
      <Row>
        <Button
          label={s.t('clear')}
          variant="secondary"
          icon="refresh-outline"
          disabled={busy}
          onPress={() => {
            setPaths([]);
            setCurrent('');
            setMessage('');
            started.current = null;
          }}
        />
        <Button
          label={s.t('savePractice')}
          icon="checkmark"
          busy={busy}
          disabled={!paths.length}
          onPress={() => {
            setBusy(true);
            void onSave(
              paths,
              Math.min(
                60,
                Math.max(1, Math.round((Date.now() - (started.current ?? Date.now())) / 1000)),
              ),
            )
              .then(() => {
                setMessage(s.t('savedWriting'));
                setPaths([]);
                started.current = null;
              })
              .catch(() => setMessage(s.t('saveError')))
              .finally(() => setBusy(false));
          }}
        />
      </Row>
      {message ? (
        <Txt size={12} color={c.green}>
          {message}
        </Txt>
      ) : null}
    </View>
  );
}
