import { useSQLiteService } from "@/lib/database/sqliteService";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Objective {
  id: string;
  title: string;
  amount: number;
  current_amount: number;
  type: "savings" | "debt";
  credit_wallet_id?: string;
  due_date?: number;
  is_archived: number;
  created_at: number;
  updated_at: number;
  // Campos calculados
  progress?: number;
  remaining?: number;
  monthlyPayment?: number;
  monthsRemaining?: number;
}

interface CreateObjectiveParams {
  title: string;
  amount: number;
  current_amount?: number;
  type: "savings" | "debt";
  credit_wallet_id?: string;
  due_date?: number;
}

interface UpdateObjectiveParams {
  title?: string;
  amount?: number;
  current_amount?: number;
  type?: "savings" | "debt";
  credit_wallet_id?: string;
  due_date?: number;
}

interface ObjectivesContextType {
  objectives: Objective[];
  savingsGoals: Objective[];
  debts: Objective[];
  isLoading: boolean;
  error: string | null;
  refreshObjectives: () => Promise<void>;
  createObjective: (params: CreateObjectiveParams) => Promise<string>;
  updateObjective: (id: string, params: UpdateObjectiveParams) => Promise<void>;
  deleteObjective: (id: string) => Promise<void>;
  addProgress: (id: string, amount: number) => Promise<void>;
  getObjectiveById: (id: string) => Objective | undefined;
  getTotalDebt: () => number;
  getTotalSavings: () => number;
  getMonthlyPaymentNeeded: () => number;
}

const ObjectivesContext = createContext<ObjectivesContextType | undefined>(undefined);

export const useObjectives = () => {
  const context = useContext(ObjectivesContext);
  if (context === undefined) {
    throw new Error("useObjectives must be used within an ObjectivesProvider");
  }
  return context;
};

interface ObjectivesProviderProps {
  children: React.ReactNode;
}

// Función auxiliar para calcular campos derivados
const enrichObjective = (obj: Objective): Objective => {
  const progress = obj.amount > 0 ? (obj.current_amount / obj.amount) * 100 : 0;
  const remaining = Math.max(0, obj.amount - obj.current_amount);

  let monthsRemaining = 0;
  let monthlyPayment = 0;

  if (obj.due_date && remaining > 0) {
    const now = Date.now();
    const msPerMonth = 30 * 24 * 60 * 60 * 1000;
    monthsRemaining = Math.max(1, Math.ceil((obj.due_date - now) / msPerMonth));
    monthlyPayment = remaining / monthsRemaining;
  }

  return {
    ...obj,
    progress: Math.min(100, progress),
    remaining,
    monthsRemaining,
    monthlyPayment,
  };
};

export const ObjectivesProvider: React.FC<ObjectivesProviderProps> = ({
  children,
}) => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sqliteService = useSQLiteService();

  // Cargar objetivos desde la base de datos
  const refreshObjectives = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const objectivesData = await sqliteService.getObjectives();
      // Enriquecer con campos calculados y filtrar archivados
      const enrichedObjectives = (objectivesData as any[])
        .filter((obj: any) => obj.is_archived !== 1)
        .map((obj: any) => enrichObjective(obj as Objective));

      setObjectives(enrichedObjectives);
    } catch (err) {
      console.error("Error loading objectives:", err);
      setError("Error al cargar los objetivos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Crear nuevo objetivo
  const createObjective = useCallback(
    async (params: CreateObjectiveParams) => {
      try {
        setError(null);
        const id = await sqliteService.createObjective(params);
        await refreshObjectives();
        return id;
      } catch (err) {
        console.error("Error creating objective:", err);
        setError("Error al crear el objetivo");
        throw err;
      }
    },
    [refreshObjectives]
  );

  // Actualizar objetivo existente
  const updateObjective = useCallback(
    async (id: string, params: UpdateObjectiveParams) => {
      try {
        setError(null);
        await sqliteService.updateObjective(id, params);
        await refreshObjectives();
      } catch (err) {
        console.error("Error updating objective:", err);
        setError("Error al actualizar el objetivo");
        throw err;
      }
    },
    [refreshObjectives]
  );

  // Agregar progreso a un objetivo (para ahorros o pagos de deuda)
  const addProgress = useCallback(
    async (id: string, amount: number) => {
      try {
        setError(null);
        const objective = objectives.find(obj => obj.id === id);
        if (!objective) throw new Error("Objetivo no encontrado");

        const newCurrentAmount = objective.current_amount + amount;
        await sqliteService.updateObjective(id, {
          current_amount: Math.min(newCurrentAmount, objective.amount),
        });
        await refreshObjectives();
      } catch (err) {
        console.error("Error adding progress:", err);
        setError("Error al actualizar el progreso");
        throw err;
      }
    },
    [objectives, refreshObjectives]
  );

  // Eliminar objetivo
  const deleteObjective = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await sqliteService.deleteObjective(id);
        await refreshObjectives();
      } catch (err) {
        console.error("Error deleting objective:", err);
        setError("Error al eliminar el objetivo");
        throw err;
      }
    },
    [refreshObjectives]
  );

  // Obtener objetivo por ID
  const getObjectiveById = useCallback(
    (id: string): Objective | undefined => {
      return objectives.find((obj) => obj.id === id);
    },
    [objectives]
  );

  // Obtener total de deudas pendientes
  const getTotalDebt = useCallback((): number => {
    return objectives
      .filter(obj => obj.type === "debt")
      .reduce((sum, obj) => sum + (obj.remaining || 0), 0);
  }, [objectives]);

  // Obtener total ahorrado
  const getTotalSavings = useCallback((): number => {
    return objectives
      .filter(obj => obj.type === "savings")
      .reduce((sum, obj) => sum + obj.current_amount, 0);
  }, [objectives]);

  // Obtener pago mensual necesario para todas las metas
  const getMonthlyPaymentNeeded = useCallback((): number => {
    return objectives.reduce((sum, obj) => sum + (obj.monthlyPayment || 0), 0);
  }, [objectives]);

  // Filtrar por tipo
  const savingsGoals = objectives.filter(obj => obj.type === "savings");
  const debts = objectives.filter(obj => obj.type === "debt");

  // Cargar objetivos al montar el componente
  useEffect(() => {
    refreshObjectives();
  }, [refreshObjectives]);

  const value: ObjectivesContextType = {
    objectives,
    savingsGoals,
    debts,
    isLoading,
    error,
    refreshObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
    addProgress,
    getObjectiveById,
    getTotalDebt,
    getTotalSavings,
    getMonthlyPaymentNeeded,
  };

  return (
    <ObjectivesContext.Provider value={value}>
      {children}
    </ObjectivesContext.Provider>
  );
};
