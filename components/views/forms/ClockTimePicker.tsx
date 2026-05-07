import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureEvent,
  GestureHandlerRootView,
  HandlerStateChangeEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
  TapGestureHandler,
  TapGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { getFabContrast } from "@/theme/tokens";

interface ClockTimePickerProps {
  visible: boolean;
  initialDate: number;
  onClose: () => void;
  onConfirm: (timestamp: number) => void;
}

type Mode = "hour" | "minute";

const SIZE = 260;
const RADIUS = SIZE / 2 - 18;
const CENTER = SIZE / 2;

function angleFromCoords(x: number, y: number) {
  const dx = x - CENTER;
  const dy = y - CENTER;
  let theta = Math.atan2(dy, dx) * (180 / Math.PI);
  // 0 deg should be at top (12 o'clock)
  theta = (theta + 90 + 360) % 360;
  return theta;
}

export default function ClockTimePicker({
  visible,
  initialDate,
  onClose,
  onConfirm,
}: ClockTimePickerProps) {
  const { theme, accent } = useTheme();
  const [date, setDate] = useState(new Date(initialDate));
  const [mode, setMode] = useState<Mode>("hour");
  const [period, setPeriod] = useState<"AM" | "PM">(
    new Date(initialDate).getHours() >= 12 ? "PM" : "AM"
  );

  useEffect(() => {
    if (visible) {
      const d = new Date(initialDate);
      setDate(d);
      setPeriod(d.getHours() >= 12 ? "PM" : "AM");
      setMode("hour");
    }
  }, [visible, initialDate]);

  const hour24 = date.getHours();
  const hour12 = ((hour24 + 11) % 12) + 1;
  const minute = date.getMinutes();

  const hourDeg = (hour12 % 12) * 30;
  const minuteDeg = minute * 6;
  const targetDeg = mode === "hour" ? hourDeg : minuteDeg;

  const handDeg = useSharedValue(targetDeg);

  useEffect(() => {
    handDeg.value = withTiming(targetDeg, { duration: 200 });
  }, [targetDeg, handDeg]);

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${handDeg.value}deg` }],
  }));

  const setHourFromAngle = (angle: number) => {
    let h = Math.round(angle / 30) % 12;
    if (h === 0) h = 12;
    const newDate = new Date(date);
    const h24 =
      period === "AM" ? (h === 12 ? 0 : h) : h === 12 ? 12 : h + 12;
    newDate.setHours(h24);
    setDate(newDate);
  };

  const setMinuteFromAngle = (angle: number) => {
    const m = Math.round(angle / 6) % 60;
    const newDate = new Date(date);
    newDate.setMinutes(m);
    setDate(newDate);
  };

  const handleAngle = (angle: number) => {
    if (mode === "hour") {
      setHourFromAngle(angle);
    } else {
      setMinuteFromAngle(angle);
    }
  };

  const onPanEvent = (
    e: GestureEvent<PanGestureHandlerEventPayload>
  ) => {
    handleAngle(angleFromCoords(e.nativeEvent.x, e.nativeEvent.y));
  };

  const onTapEvent = (
    e: HandlerStateChangeEvent<TapGestureHandlerEventPayload>
  ) => {
    if (e.nativeEvent.state === 4) {
      // ACTIVE = 4 in gesture-handler State enum
      handleAngle(angleFromCoords(e.nativeEvent.x, e.nativeEvent.y));
    }
  };

  const togglePeriod = () => {
    const next = period === "AM" ? "PM" : "AM";
    setPeriod(next);
    const d = new Date(date);
    if (next === "PM" && d.getHours() < 12) d.setHours(d.getHours() + 12);
    else if (next === "AM" && d.getHours() >= 12) d.setHours(d.getHours() - 12);
    setDate(d);
  };

  const handleConfirm = () => {
    onConfirm(date.getTime());
    onClose();
  };

  const formatHM = (n: number) => n.toString().padStart(2, "0");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.bg }]}>
          <Text style={[styles.title, { color: theme.textTer }]}>
            SELECCIONAR HORA
          </Text>

          {/* Time display */}
          <View style={styles.timeRow}>
            <TouchableOpacity onPress={() => setMode("hour")} activeOpacity={0.85}>
              <Text
                style={[
                  styles.timeNum,
                  {
                    color: mode === "hour" ? theme.text : theme.textTer,
                    backgroundColor:
                      mode === "hour" ? `${accent}33` : "transparent",
                  },
                ]}
              >
                {formatHM(hour12)}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.timeColon, { color: theme.text }]}>:</Text>
            <TouchableOpacity
              onPress={() => setMode("minute")}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.timeNum,
                  {
                    color: mode === "minute" ? theme.text : theme.textTer,
                    backgroundColor:
                      mode === "minute" ? `${accent}33` : "transparent",
                  },
                ]}
              >
                {formatHM(minute)}
              </Text>
            </TouchableOpacity>

            <View style={styles.periodCol}>
              <TouchableOpacity
                onPress={() => period !== "AM" && togglePeriod()}
                style={[
                  styles.periodBtn,
                  {
                    backgroundColor:
                      period === "AM" ? `${accent}33` : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: period === "AM" ? theme.text : theme.textTer },
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => period !== "PM" && togglePeriod()}
                style={[
                  styles.periodBtn,
                  {
                    backgroundColor:
                      period === "PM" ? `${accent}33` : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: period === "PM" ? theme.text : theme.textTer },
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Clock face */}
          <View
            style={[
              styles.clockWrap,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TapGestureHandler onHandlerStateChange={onTapEvent}>
              <PanGestureHandler
                onGestureEvent={onPanEvent}
                minDist={2}
              >
                <View
                  style={[
                    styles.clock,
                    { backgroundColor: "transparent" },
                  ]}
                  collapsable={false}
                >
                {/* Hand wrapper at clock center, 0x0 — rotated; child hand extends upward */}
                <Animated.View style={[styles.handWrapper, handStyle]}>
                  <View
                    pointerEvents="none"
                    style={[styles.hand, { backgroundColor: accent }]}
                  />
                </Animated.View>

                {/* Numbers */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const labelNum = i === 0 ? 12 : i;
                  const minuteNum = i * 5;
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const x = CENTER + Math.cos(angle) * RADIUS;
                  const y = CENTER + Math.sin(angle) * RADIUS;
                  const isHourActive = mode === "hour" && hour12 === labelNum;
                  const isMinActive =
                    mode === "minute" && minute === minuteNum;
                  const active = isHourActive || isMinActive;
                  return (
                    <View
                      key={i}
                      pointerEvents="none"
                      style={[
                        styles.numCell,
                        {
                          left: x - 18,
                          top: y - 18,
                          backgroundColor: active ? accent : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active
                            ? getFabContrast(accent)
                            : theme.text,
                          fontSize: 14,
                          fontWeight: active ? "700" : "500",
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {mode === "hour"
                          ? labelNum
                          : minuteNum.toString().padStart(2, "0")}
                      </Text>
                    </View>
                  );
                })}

                {/* Center dot */}
                <View
                  pointerEvents="none"
                  style={[styles.center, { backgroundColor: accent }]}
                />
                </View>
              </PanGestureHandler>
            </TapGestureHandler>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.actionBtn, { backgroundColor: theme.surfaceAlt }]}
            >
              <Text style={[styles.actionText, { color: theme.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.actionBtn, { backgroundColor: accent }]}
            >
              <Text
                style={[
                  styles.actionText,
                  { color: getFabContrast(accent) },
                ]}
              >
                Listo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: "500",
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 4,
  },
  timeNum: {
    fontSize: 46,
    fontWeight: "600",
    letterSpacing: -2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 76,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  timeColon: {
    fontSize: 46,
    fontWeight: "600",
  },
  periodCol: {
    marginLeft: 8,
    gap: 4,
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  periodText: { fontSize: 13, fontWeight: "600" },
  clockWrap: {
    width: SIZE + 12,
    height: SIZE + 12,
    borderRadius: (SIZE + 12) / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  clock: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    position: "relative",
  },
  numCell: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  handWrapper: {
    position: "absolute",
    left: CENTER,
    top: CENTER,
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  hand: {
    position: "absolute",
    bottom: 0,
    width: 2,
    height: RADIUS - 22,
    borderRadius: 1,
    transform: [{ translateX: -1 }],
  },
  center: {
    position: "absolute",
    left: CENTER - 5,
    top: CENTER - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontSize: 14, fontWeight: "600" },
});
