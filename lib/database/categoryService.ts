import { v4 as uuidv4 } from "uuid";
import { Category, DatabaseResult } from "../models/types";
import { openDatabase } from "./database";

/**
 * Obtiene todas las categorías no eliminadas
 *
 * @returns Promise con el resultado de la operación
 */
export async function getCategories(): Promise<DatabaseResult<Category[]>> {
  const db = openDatabase();

  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const categories = await db.getAllAsync<Category>(
        `SELECT * FROM categories WHERE is_deleted = 0 ORDER BY name`,
        []
      );
      resolve({ success: true, data: categories });
    });
  });
}

/**
 * Obtiene categorías filtradas por tipo
 *
 * @param type Tipo de categoría ('income', 'expense', 'transfer')
 * @returns Promise con el resultado de la operación
 */
export async function getCategoriesByType(
  type: string
): Promise<DatabaseResult<Category[]>> {
  const db = openDatabase();

  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const categories = await db.getAllAsync<Category>(
        `SELECT * FROM categories WHERE type = ? AND is_deleted = 0 ORDER BY name`,
        [type]
      );
      resolve({ success: true, data: categories });
    });
  });
}

/**
 * Obtiene una categoría por su ID
 *
 * @param id ID de la categoría
 * @returns Promise con el resultado de la operación
 */
export async function getCategoryById(
  id: string
): Promise<DatabaseResult<Category>> {
  const db = openDatabase();

  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const category = await db.getFirstAsync<Category>(
        `SELECT * FROM categories WHERE id = ? AND is_deleted = 0`,
        [id]
      );
      if (!category) {
        resolve({ success: false, error: "Categoría no encontrada" });
        return;
      }
      resolve({ success: true, data: category });
    });
  });
}

/**
 * Crea una nueva categoría
 *
 * @param category Datos de la categoría a crear
 * @returns Promise con el resultado de la operación
 */
export async function createCategory(
  category: Omit<
    Category,
    | "id"
    | "created_at"
    | "updated_at"
    | "is_deleted"
    | "sync_status"
    | "last_synced_at"
  >
): Promise<DatabaseResult<Category>> {
  const db = openDatabase();
  const id = uuidv4();
  const now = Date.now();
  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO categories (id, name, type, icon, color, created_at, updated_at, sync_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          category.name,
          category.type,
          category.icon || null,
          category.color || null,
          now,
          now,
          "local",
        ]
      );
      const newCategory: Category = {
        id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        created_at: now,
        updated_at: now,
        is_deleted: 0,
        sync_status: "local",
      };
      resolve({ success: true, data: newCategory });
    });
  });
}
/**
 * Actualiza una categoría
 *
 * @param id ID de la categoría
 * @param categoryData Datos de la categoría a actualizar
 * @returns Promise con el resultado de la operación
 */
export async function updateCategory(
  id: string,
  categoryData: Partial<Category>
): Promise<DatabaseResult<Category>> {
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
  } = categoryData;

  // Construir la consulta dinámicamente
  const fields = Object.keys(updateData);
  if (fields.length === 0) {
    return { success: false, error: "No hay campos para actualizar" };
  }

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const query = `UPDATE categories SET ${setClause}, updated_at = ?, sync_status = 'local' WHERE id = ? AND is_deleted = 0`;

  const values = [...Object.values(updateData), now, id];

  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const result = await db.runAsync(query, values);
      if (result.changes > 0) {
        const { data: category } = await getCategoryById(id);
        resolve({ success: true, data: category });
      } else {
        resolve({ success: false, error: "Categoría no encontrada" });
      }
    });
  });
}
/**
 * Elimina una categoría (marcado lógico)
 *
 * @param id ID de la categoría
 * @returns Promise con el resultado de la operación
 */
export async function deleteCategory(
  id: string
): Promise<DatabaseResult<boolean>> {
  const db = openDatabase();
  const now = Date.now();

  return new Promise((resolve) => {
    db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        `UPDATE categories SET 
           is_deleted = 1, 
           updated_at = ?,
           sync_status = 'local'
           WHERE id = ?`,
        [now, id]
      );
      if (result.changes > 0) {
        resolve({ success: true, data: true });
      } else {
        resolve({ success: false, error: "Categoría no encontrada" });
      }
    });
  });
}
