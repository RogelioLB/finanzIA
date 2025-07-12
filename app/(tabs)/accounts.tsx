import TransitionLayout from "@/components/ui/TransitionLayout";
import { useAccounts } from "@/hooks/useAccounts";
import Ionicons from "@expo/vector-icons/Ionicons";

import AnimatedAccountList from "@/components/AnimatedAccountList";
import DeleteAlert from "@/components/DeleteAlert";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountsScreen() {
  const { accounts, deleteAccount } = useAccounts();
  const [showConfirmDeleteAlert, setShowConfirmDeleteAlert] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const router = useRouter();
  const handleDelete = async (id: string) => {
    setAccountToDelete(id);
    setShowConfirmDeleteAlert(true);
  };

  const confirmDelete = async () => {
    try {
      // Primero ocultar el diálogo
      setShowConfirmDeleteAlert(false);
      
      // Luego eliminar la cuenta si existe un ID
      if (accountToDelete) {
        // Ya no necesitamos esperar a que la animación termine
        // porque el componente AnimatedListWithExitHandling maneja eso
        await deleteAccount(accountToDelete);
      }

      // Finalmente limpiar el estado
      setAccountToDelete(null);
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
    }
  };
  return (
    <TransitionLayout>
      <SafeAreaView className="">
        <View className="gap-4 p-4">
          <View className="flex-row justify-end">
            <TouchableOpacity
              className="bg-primary/80 rounded-full px-2 py-2"
              onPress={() => router.push("/accounts/add")}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View className="gap-4">
            <Text className="text-3xl font-bold">All Accounts</Text>
            <AnimatedAccountList
              accounts={accounts}
              handleDelete={handleDelete}
            />
          </View>
        </View>
        <DeleteAlert
          show={showConfirmDeleteAlert}
          setShow={setShowConfirmDeleteAlert}
          handleDelete={async () => await confirmDelete()}
        />
      </SafeAreaView>
    </TransitionLayout>
  );
}
