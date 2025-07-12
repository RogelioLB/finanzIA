import { Account } from "@/lib/models/types";
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from 'react-native';
import Animated, { 
  FadeInDown, 
  withTiming, 
  withSequence,
  useSharedValue,
  useAnimatedStyle,
  runOnJS
} from 'react-native-reanimated';
import AccountItem from './Account';

interface AnimatedAccountListProps {
  accounts: Account[];
  handleDelete: (id: string) => void;
  onAnimationComplete?: () => void;
}

const AnimatedAccountList: React.FC<AnimatedAccountListProps> = ({
  accounts,
  handleDelete,
  onAnimationComplete,
}) => {
  // Estado interno que incluye elementos activos y los que se están eliminando
  const [internalAccounts, setInternalAccounts] = useState<
    (Account & { isExiting?: boolean })[]
  >([]);

  // Identificar elementos nuevos y actualizados
  useEffect(() => {
    setInternalAccounts((prev) => {
      // Identificar cuentas eliminadas (están en prev pero no en accounts)
      const exitingAccounts = prev
        .filter((prevAccount) => !accounts.find((a) => a.id === prevAccount.id))
        .map((account) => ({ ...account, isExiting: true }));

      // Combinar cuentas actuales con las que están saliendo
      const updatedAccounts = [
        ...accounts.map((account) => ({
          ...account,
          isExiting: false,
        })),
        ...exitingAccounts,
      ];

      return updatedAccounts;
    });
  }, [accounts]);

  // Remover cuentas que han completado su animación de salida
  const removeAccount = (id: string) => {
    setInternalAccounts((prev) => prev.filter((account) => account.id !== id));

    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  return (
    <View style={styles.container}>
      {internalAccounts.map((account, index) => (
        <ExitingAccountItem
          key={account.id}
          account={account}
          index={index}
          isExiting={account.isExiting || false}
          handleDelete={handleDelete}
          onExitComplete={() => removeAccount(account.id)}
        />
      ))}
    </View>
  );
};

interface ExitingAccountItemProps {
  account: Account;
  index: number;
  isExiting: boolean;
  handleDelete: (id: string) => void;
  onExitComplete: () => void;
}

// Componente para manejar la animación de salida individualmente
const ExitingAccountItem: React.FC<ExitingAccountItemProps> = ({
  account,
  index,
  isExiting,
  handleDelete,
  onExitComplete,
}) => {
  // Valores animados compartidos
  const translateX = useSharedValue(0);
  const backgroundColor = useSharedValue("transparent");

  // Estilo animado para el deslizamiento y cambio de color
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      backgroundColor: backgroundColor.value,
    };
  });

  // Iniciar animación de salida cuando isExiting cambia a true
  useEffect(() => {
    if (isExiting) {
      // Animación de deslizamiento a la izquierda
      translateX.value = withSequence(
        withTiming(0),
        withTiming(-300, { duration: 300 }, (finished) => {
          if (finished) {
            // Notificar que la animación ha terminado
            runOnJS(onExitComplete)();
          }
        })
      );
      
      // Animación de cambio de color a rojo
      backgroundColor.value = withSequence(
        withTiming('transparent'),
        withTiming('rgba(255, 59, 48, 0.8)', { duration: 300 })
      );
    }
  }, [isExiting, translateX, backgroundColor, onExitComplete]);

  return (
    <Animated.View style={animatedStyle}>
      {/* Animación de entrada para nuevos elementos */}
      <Animated.View
        entering={
          isExiting
            ? undefined
            : FadeInDown.delay(index < 3 ? 200 + index * 200 : 200 + 2 * 200)
        }
      >
        <AccountItem
          account={account}
          handleDelete={handleDelete}
          index={index}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 8,
  },
});

export default AnimatedAccountList;
