import { Account } from "@/lib/models/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import { FlexAlignType, Text, TextStyle, View, ViewStyle } from "react-native";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "react-native-popup-menu";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function AccountItem({
  account,
  handleDelete,
  index,
}: {
  account: Account;
  handleDelete: (id: string) => void;
  index: number;
}) {
  // Definimos la animación según el índice del elemento
  const entering =
    index < 3
      ? FadeInDown.delay(index * 100)
          .springify()
          .damping(12) // Primeros 3 elementos con delay creciente
      : FadeInDown.delay(300).springify(); // Resto de elementos con el mismo delay

  return (
    <Animated.View
      key={account.id}
      className="bg-white rounded-lg p-4 flex-row justify-between items-center my-1"
      entering={entering}
    >
      <View className="flex-row items-center gap-5">
        <Ionicons name={account.icon as any} size={24} color="black" />
        <View>
          <Text className="text-lg font-bold">{account.name}</Text>
          <Text className="text-gray-500">
            {account.balance} {account.currency}
          </Text>
        </View>
      </View>
      <Menu>
        <MenuTrigger
          customStyles={{
            TriggerTouchableComponent: Ionicons,
            triggerTouchable: {
              name: "ellipsis-horizontal",
              size: 24,
              color: "black",
            },
          }}
        ></MenuTrigger>
        <MenuOptions customStyles={styles}>
          <MenuOption onSelect={() => {}} customStyles={styles}>
            <Text className="text-black font-bold">Edit</Text>
            <Octicons name="pencil" size={24} color="black" />
          </MenuOption>
          <MenuOption
            onSelect={() => handleDelete(account.id)}
            customStyles={{ optionWrapper: styles.optionWrapper }}
          >
            <Text className="text-red-500 font-bold">Delete</Text>
            <Octicons name="trash" size={24} color="red" />
          </MenuOption>
        </MenuOptions>
      </Menu>
    </Animated.View>
  );
}

const styles: {
  optionsContainer: ViewStyle;
  optionWrapper: ViewStyle;
  optionTouchable: ViewStyle;
  optionText: TextStyle;
} = {
  optionsContainer: {
    backgroundColor: "#FAFAFA",
    padding: 20,
    borderRadius: 16,
    width: 150,
  },
  optionWrapper: {
    flexDirection: "row",
    alignItems: "center" as FlexAlignType,
    justifyContent: "space-between",
    gap: 20,
  },
  optionTouchable: {},
  optionText: {
    color: "brown",
  },
};
