import { SQLiteRunResult } from "expo-sqlite";
import { Account, DatabaseResult } from "../models/types";
import { openDatabase } from "./database";

// Función para generar un ID único sin depender de uuid
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Crea una nueva cuenta
 *
 * @param account Datos de la cuenta a crear
 * @returns Promise con el resultado de la operación
 */
export async function createAccount(
  account: Omit<
    Account,
    | "id"
    | "created_at"
    | "updated_at"
    | "is_deleted"
    | "sync_status"
    | "last_synced_at"
  >
): Promise<DatabaseResult<Account>> {
  const db = openDatabase();
  const id = generateUniqueId();
  const now = Date.now();

  return new Promise((resolve) => {
    try {
      db.withTransactionAsync(async () => {
        try {
          const result = (await db.runAsync(
            `INSERT INTO accounts (
              id, name, balance, currency, color, icon,
              created_at, updated_at, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              account.name,
              account.balance || 0,
              account.currency || "USD",
              account.color ?? null,
              account.icon ?? null,
              now,
              now,
              "local",
            ]
          )) as SQLiteRunResult;

          if (result.changes > 0) {
            const newAccount: Account = {
              id,
              name: account.name,
              balance: account.balance || 0,
              currency: account.currency || "USD",
              color: account.color,
              icon: account.icon,
              created_at: now,
              updated_at: now,
              is_deleted: 0,
              sync_status: "local",
              last_synced_at: undefined,
            };
            resolve({ success: true, data: newAccount });
          } else {
            resolve({ success: false, error: "Error al crear la cuenta" });
          }
        } catch (error) {
          console.error("Error en SQL:", error);
          resolve({
            success: false,
            error: `Error SQL: ${(error as Error).message}`,
          });
        }
      }).catch((error) => {
        console.error("Error en transacción:", error);
        resolve({
          success: false,
          error: `Error de transacción: ${(error as Error).message}`,
        });
      });
    } catch (error) {
      console.error("Error general:", error);
      resolve({
        success: false,
        error: `Error general: ${(error as Error).message}`,
      });
    }
  });
}

/**
 * Obtiene todas las cuentas no eliminadas
 *
 * @returns Promise con el resultado de la operación
 */
export async function getAccounts(): Promise<DatabaseResult<Account[]>> {
  const db = openDatabase();
  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const accounts = await db.getAllAsync<Account>(
        `SELECT * FROM accounts WHERE is_deleted = 0 ORDER BY name`
      );

      resolve({ success: true, data: accounts });
    });
  });
}

/**
 * Obtiene una cuenta por su ID
 *
 * @param id ID de la cuenta
 * @returns Promise con el resultado de la operación
 */
export async function getAccountById(
  id: string
): Promise<DatabaseResult<Account>> {
  const db = openDatabase();

  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const account = await db.getFirstAsync<Account>(
        `SELECT * FROM accounts WHERE id = ? AND is_deleted = 0`,
        [id]
      );
      if (!account) {
        resolve({ success: false, error: "Cuenta no encontrada" });
        return;
      }
      resolve({ success: true, data: account });
    }).catch((error: Error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

/**
 * Actualiza el saldo de una cuenta
 *
 * @param id ID de la cuenta
 * @param amount Cantidad a añadir (positiva) o restar (negativa)
 * @returns Promise con el resultado de la operación
 */
export async function updateAccountBalance(
  id: string,
  amount: number
): Promise<DatabaseResult<Account>> {
  const db = openDatabase();
  const now = Date.now();

  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        `UPDATE accounts SET 
         balance = balance + ?, 
         updated_at = ?,
         sync_status = 'local'
         WHERE id = ? AND is_deleted = 0`,
        [amount, now, id]
      );

      if (result.changes > 0) {
        // Obtenemos la cuenta actualizada
        const account = await db.getFirstAsync<Account>(
          `SELECT * FROM accounts WHERE id = ?`,
          [id]
        );
        if (account) {
          resolve({ success: true, data: account });
        } else {
          resolve({ success: false, error: "No se pudo actualizar la cuenta" });
        }
      } else {
        resolve({ success: false, error: "Cuenta no encontrada" });
      }
    }).catch((error: Error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

/**
 * Actualiza una cuenta
 *
 * @param id ID de la cuenta
 * @param accountData Datos de la cuenta a actualizar
 * @returns Promise con el resultado de la operación
 */
export async function updateAccount(
  id: string,
  accountData: Partial<Account>
): Promise<DatabaseResult<Account>> {
  const db = openDatabase();
  const now = Date.now();

  // Excluimos campos que no deben actualizarse directamente
  const {
    id: _,
    created_at,
    updated_at,
    is_deleted,
    sync_status,
    last_synced_at,
    ...updateData
  } = accountData;

  // Construir la consulta dinámicamente
  const fields = Object.keys(updateData);
  if (fields.length === 0) {
    return { success: false, error: "No hay campos para actualizar" };
  }

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const query = `UPDATE accounts SET ${setClause}, updated_at = ?, sync_status = 'local' WHERE id = ? AND is_deleted = 0`;

  const values = [...Object.values(updateData), now, id];

  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const result = await db.runAsync(query, values);

      if (result.changes > 0) {
        // Obtenemos la cuenta actualizada
        const account = await db.getFirstAsync<Account>(
          `SELECT * FROM accounts WHERE id = ?`,
          [id]
        );

        if (account) {
          resolve({ success: true, data: account });
        } else {
          resolve({ success: false, error: "No se pudo actualizar la cuenta" });
        }
      } else {
        resolve({ success: false, error: "Cuenta no encontrada" });
      }
    }).catch((error: Error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

/**
 * Elimina una cuenta (marcado lógico)
 *
 * @param id ID de la cuenta
 * @returns Promise con el resultado de la operación
 */
export async function deleteAccount(
  id: string
): Promise<DatabaseResult<boolean>> {
  const db = openDatabase();
  const now = Date.now();

  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const result = (await db.runAsync(
        `UPDATE accounts SET 
         is_deleted = 1, 
         updated_at = ?,
         sync_status = 'local'
         WHERE id = ?`,
        [now, id]
      )) as SQLiteRunResult;

      if (result.changes > 0) {
        resolve({ success: true, data: true });
      } else {
        resolve({ success: false, error: "Cuenta no encontrada" });
      }
    }).catch((error: Error) => {
      console.log(error);
      resolve({ success: false, error: error.message });
    });
  });
}
