import React, { ReactNode, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { DesignIcon } from "@/components/ui/Icon";
import { getFabContrast } from "@/theme/tokens";

export function FormGroup({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.group}>
      {label ? (
        <Text style={[styles.groupLabel, { color: theme.textTer }]}>{label}</Text>
      ) : null}
      {children}
    </View>
  );
}

interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  prefix?: string;
  suffix?: string;
  maxLength?: number;
  mono?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  prefix,
  suffix,
  maxLength,
  mono,
  autoCapitalize = "sentences",
}: TextFieldProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.field}>
      {label ? (
        <Text style={[styles.fieldLabel, { color: theme.textTer }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputBox,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {prefix ? (
          <Text style={[styles.affix, { color: theme.textTer }]}>{prefix}</Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textTer}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            { color: theme.text, fontVariant: mono ? ["tabular-nums"] : undefined },
          ]}
        />
        {suffix ? (
          <Text style={[styles.affixSm, { color: theme.textTer }]}>{suffix}</Text>
        ) : null}
      </View>
    </View>
  );
}

interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

function SegmentedItem<T extends string>({
  option,
  active,
  onPress,
  accent,
  themeText,
}: {
  option: SegmentedOption<T>;
  active: boolean;
  onPress: () => void;
  accent: string;
  themeText: string;
}) {
  const progress = useSharedValue(active ? 1 : 0);
  const contrast = getFabContrast(accent);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active, progress]);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(0,0,0,0)", accent]
    ),
    transform: [{ scale: withSpring(active ? 1 : 0.96, { damping: 15 }) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [themeText, contrast]),
  }));

  return (
    <Pressable onPress={onPress} style={styles.segBtn}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.segBg, bgStyle]} />
      <Animated.Text style={[styles.segText, textStyle]}>
        {option.label}
      </Animated.Text>
    </Pressable>
  );
}

interface SegmentedFieldProps<T extends string> {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
}

export function SegmentedField<T extends string>({
  label,
  value,
  onChange,
  options,
}: SegmentedFieldProps<T>) {
  const { theme, accent } = useTheme();
  return (
    <View style={styles.field}>
      {label ? (
        <Text style={[styles.fieldLabel, { color: theme.textTer }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.segWrap,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {options.map((o) => (
          <SegmentedItem
            key={o.id}
            option={o}
            active={value === o.id}
            onPress={() => onChange(o.id)}
            accent={accent}
            themeText={theme.text}
          />
        ))}
      </View>
    </View>
  );
}

interface AnimatedChipProps {
  active: boolean;
  onPress: () => void;
  children: ReactNode;
  activeBg?: string;
  activeColor?: string;
}

export function AnimatedChip({
  active,
  onPress,
  children,
  activeBg,
  activeColor,
}: AnimatedChipProps) {
  const { theme, accent } = useTheme();
  const progress = useSharedValue(active ? 1 : 0);
  const bg = activeBg ?? `${accent}1A`;
  const border = activeBg ?? accent;

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active, progress]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.surface, bg]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.border, border]
    ),
    transform: [{ scale: withSpring(active ? 1.04 : 1, { damping: 15 }) }],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.chip, animStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

interface PickerRowProps {
  label: string;
  value: string;
  onPress: () => void;
  icon?: ReactNode;
  valueColor?: string;
}

export function PickerRow({
  label,
  value,
  onPress,
  icon,
  valueColor,
}: PickerRowProps) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pickerRow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      activeOpacity={0.85}
    >
      {icon}
      <Text style={[styles.pickerLabel, { color: theme.textTer }]}>{label}</Text>
      <Text
        style={[
          styles.pickerValue,
          { color: valueColor || theme.text },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <DesignIcon.Chevron size={13} color={theme.textTer} strokeWidth={1.7} />
    </TouchableOpacity>
  );
}

interface ColorSwatchesProps {
  colors: string[];
  selected: string;
  onSelect: (c: string) => void;
}

export function ColorSwatches({ colors, selected, onSelect }: ColorSwatchesProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.colorsRow}>
      {colors.map((c) => {
        const active = c === selected;
        return (
          <TouchableOpacity
            key={c}
            onPress={() => onSelect(c)}
            style={[
              styles.colorDot,
              {
                backgroundColor: c,
                borderColor: active ? theme.text : theme.border,
                borderWidth: active ? 3 : 1,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

interface InfoBoxProps {
  children: ReactNode;
  icon?: ReactNode;
}

export function InfoBox({ children, icon }: InfoBoxProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.infoBox,
        { backgroundColor: theme.surfaceAlt },
      ]}
    >
      {icon ? <View style={{ marginTop: 1 }}>{icon}</View> : null}
      <Text style={[styles.infoText, { color: theme.textSec }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 16 },
  groupLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    paddingBottom: 8,
    fontWeight: "500",
  },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 11, marginBottom: 5, paddingLeft: 4 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    padding: 0,
  },
  affix: { fontSize: 14 },
  affixSm: { fontSize: 13 },
  segWrap: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  segBg: { borderRadius: 9 },
  segText: { fontSize: 12, fontWeight: "600" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  pickerLabel: { flex: 1, fontSize: 12 },
  pickerValue: { fontSize: 14, fontWeight: "500" },
  colorsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  infoBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  infoText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
