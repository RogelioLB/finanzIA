import { useLocalSearchParams } from "expo-router";
import SubscriptionForm from "../../../components/views/subscriptions/SubscriptionForm";

export default function EditSubscriptionScreen() {
  const { id } = useLocalSearchParams();
  
  return <SubscriptionForm mode="edit" subscriptionId={id as string} />;
}
