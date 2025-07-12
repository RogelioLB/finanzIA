import AnimatedAlert from "@/components/AnimatedAlert";
import { NoAccountsView } from "@/components/views/no-accounts";
import { NoBalanceView } from "@/components/views/no-balance";
import { NotEnoughAccountsView } from "@/components/views/not-enough-accounts";
import { TransferFormView } from "@/components/views/transfer";
import { useAccounts } from "@/hooks/useAccounts";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransferScreen() {
  const { accounts, transferBalance } = useAccounts();
  const [fromAccount, setFromAccount] = useState<string>("");
  const [toAccount, setToAccount] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const router = useRouter();
  


  // Filtrar cuentas con balance > 0
  const accountsWithBalance = useMemo(() => {
    return accounts.filter((account) => account.balance > 0);
  }, [accounts]);

  // Filtrar cuentas que no sean la seleccionada como origen
  const availableDestinationAccounts = useMemo(() => {
    return accounts.filter((account) => account.id !== fromAccount);
  }, [accounts, fromAccount]);

  // Resetear toAccount cuando cambia fromAccount
  useEffect(() => {
    setToAccount("");
    setError(null);
  }, [fromAccount]);

  // Inicializar fromAccount si hay cuentas con balance
  useEffect(() => {
    if (accountsWithBalance.length > 0 && !fromAccount) {
      setFromAccount(accountsWithBalance[0].id);
    }
  }, [accountsWithBalance, fromAccount]);

  // Función para manejar la transferencia
  const handleTransfer = useCallback(async () => {
    try {
      setError(null);

      // Validaciones
      if (!fromAccount) {
        setError("Select an origin account");
        return;
      }
      if (!toAccount) {
        setError("Select a destination account");
        return;
      }

      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        setError("Enter a valid positive amount");
        return;
      }

      const sourceAccount = accounts.find((acc) => acc.id === fromAccount);
      if (!sourceAccount || sourceAccount.balance < transferAmount) {
        setError("Insufficient balance for transfer");
        return;
      }

      // Ocultar teclado
      Keyboard.dismiss();

      // Ejecutar transferencia
      await transferBalance(fromAccount, toAccount, transferAmount);
      
      // Mostrar la alerta después de la transferencia exitosa
      // El timeout asegura que React complete otros ciclos de renderizado primero
      setTimeout(() => {
        setShowSuccessAlert(true);
      }, 500);
      
      // Limpiar formulario
      setAmount("");
      setFromAccount("");
      setToAccount("");
    } catch {
      setError("An error occurred during the transfer");
    }
  }, [fromAccount, toAccount, amount, accounts, transferBalance]);

  // Renderizar la interfaz adecuada según el estado
  const renderContent = () => {
    // Caso 1: No hay cuentas
    if (accounts.length === 0) {
      return <NoAccountsView />;
    }

    // Caso 2: Hay cuentas pero ninguna con fondos
    if (accountsWithBalance.length === 0) {
      return <NoBalanceView />;
    }

    // Caso 3: No hay suficientes cuentas para transferir (menos de 2)
    if (accounts.length < 2) {
      return <NotEnoughAccountsView />;
    }

    // Caso 4: Todo está listo para transferir
    return (
      <TransferFormView
        accountsWithBalance={accountsWithBalance}
        availableDestinationAccounts={availableDestinationAccounts}
        fromAccount={fromAccount}
        toAccount={toAccount}
        amount={amount}
        error={error}
        setFromAccount={setFromAccount}
        setToAccount={setToAccount}
        setAmount={setAmount}
        handleTransfer={handleTransfer}
      />
    );
  };



  return (
    <>
      {/* Alerta de éxito - Colocada fuera del SafeAreaView para mayor prioridad */}
      <AnimatedAlert
        visible={showSuccessAlert}
        title="¡Transferencia exitosa!"
        message="Los fondos han sido transferidos correctamente entre tus cuentas"
        confirmText="Aceptar"
        confirmButtonColor="#38C172" // Color verde
        onConfirm={() => {
          setShowSuccessAlert(false);
        }}
        onDismiss={() => {
          setShowSuccessAlert(false);
        }}
      />

      <SafeAreaView className="p-4 flex-1">
        <View className="flex-row">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View>
            <Text className="text-3xl font-bold">Transfer balance</Text>
            <Text className="text-gray-500">
              Select the origin and destination accounts, and the amount to
              transfer.
            </Text>
          </View>
        </View>
        {renderContent()}
      </SafeAreaView>
    </>
  );
}

// Vista cuando no hay cuentas

// Vista cuando hay cuentas pero sin fondos

// Vista cuando no hay suficientes cuentas para transferir
// Vista del formulario de transferencia
