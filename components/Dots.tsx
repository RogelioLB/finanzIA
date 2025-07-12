import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableWithoutFeedback } from "react-native";

export default function Dots() {
  return (
    <TouchableWithoutFeedback>
      <Ionicons name="ellipsis-horizontal" size={24} color="black" />
    </TouchableWithoutFeedback>
  );
}
