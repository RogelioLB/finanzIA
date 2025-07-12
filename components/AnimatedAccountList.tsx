import { Account } from "@/lib/models/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import AccountItem from "./Account";

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

      return updatedAccounts.sort((a, b) => b.created_at - a.created_at);
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

  // Manejar la finalización de la animación con un timeout de respaldo
  const animationTimeoutRef = useRef<number | null>(null);

  // Función para limpiar el timeout si existe
  const cleanupTimeout = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  // Función para completar la animación
  const completeAnimation = useCallback(() => {
    cleanupTimeout();
    onExitComplete();
  }, [cleanupTimeout, onExitComplete]);

  // Iniciar animación de salida cuando isExiting cambia a true
  useEffect(() => {
    if (isExiting) {
      // Primero limpiar cualquier timeout anterior
      cleanupTimeout();

      // Crear un timeout de respaldo para asegurar que la animación se complete
      // incluso si la animación de React Native Reanimated falla
      animationTimeoutRef.current = setTimeout(() => {
        completeAnimation();
      }, 500); // Duración total de la animación con margen de seguridad

      // Animación de deslizamiento a la izquierda
      translateX.value = withSequence(
        withTiming(0, { duration: 50 }), // Pequeña pausa inicial
        withTiming(-300, { duration: 400 }, (finished) => {
          if (finished) {
            // Notificar que la animación ha terminado
            runOnJS(completeAnimation)();
          }
        })
      );
    }

    // Limpieza al desmontar
    return () => {
      cleanupTimeout();

      // Cancelar las animaciones en curso
      cancelAnimation(translateX);
    };
  }, [isExiting, translateX, completeAnimation, cleanupTimeout]);

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
