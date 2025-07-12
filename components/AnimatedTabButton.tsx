import Ionicons from "@expo/vector-icons/Ionicons";
import { TabTrigger } from "expo-router/ui";
import { Pressable } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Icon from "./ui/Icon";

type AnimatedTabButtonProps = {
  name: string;
  icon: "home" | "statistics" | "ai-plan" | "accounts" | "profile";
  href: "/" | "/explore" | "/statistic" | "/ai-plan" | "/accounts" | "/profile";
  isActive: boolean;
  customIcon?: string;
};

export function AnimatedTabButton({
  name,
  icon,
  href,
  isActive,
  customIcon,
}: AnimatedTabButtonProps) {
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(isActive ? -5 : 0, {
            damping: 15,
            stiffness: 120,
          }),
        },
        {
          scale: withSpring(isActive ? 1.1 : 1, {
            damping: 15,
            stiffness: 120,
          }),
        },
      ],
    };
  });

  const colorAnimation = useDerivedValue(() => {
    return withTiming(isActive ? 1 : 0, { duration: 200 });
  });

  const animatedColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorAnimation.value,
      [0, 1],
      ["#a695ff", "#AFFF59"]
    );

    return { color };
  });

  // Normalizar el nombre para evitar problemas con espacios o mayúsculas
  const normalizedName = name.toLowerCase().replace(/\s+/g, " ");

  return (
    <TabTrigger name={normalizedName} href={href as any} asChild>
      <Pressable
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View style={[animatedStyles]}>
          {customIcon ? (
            <Ionicons
              name={customIcon as any}
              size={24}
              color={isActive ? "#AFFF59" : "#FAFAFA"}
            />
          ) : (
            <Icon
              name={icon}
              size={24}
              color={isActive ? "#AFFF59" : "#FAFAFA"}
            />
          )}
        </Animated.View>
        <Animated.Text
          style={[
            {
              marginTop: 4,
              fontSize: 12,
              fontWeight: "500",
              textAlign: "center",
            },
            animatedColorStyle,
          ]}
        >
          {name}
        </Animated.Text>
      </Pressable>
    </TabTrigger>
  );
}
