/**
 * Valida si un email tiene un formato válido
 * @param email - Email a validar
 * @returns true si el email es válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida si un monto es válido (mayor a 0)
 * @param amount - Monto a validar
 * @returns true si el monto es válido
 */
export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && !isNaN(amount) && isFinite(amount);
};

/**
 * Valida si una cadena no está vacía después de hacer trim
 * @param value - Valor a validar
 * @returns true si la cadena no está vacía
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Valida si un valor es un número válido
 * @param value - Valor a validar
 * @returns true si es un número válido
 */
export const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Valida si una fecha es válida
 * @param date - Fecha a validar (puede ser Date, string o number)
 * @returns true si la fecha es válida
 */
export const isValidDate = (date: any): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Sanitiza una cadena removiendo caracteres especiales
 * @param value - Cadena a sanitizar
 * @returns Cadena sanitizada
 */
export const sanitizeString = (value: string): string => {
  return value.trim().replace(/[<>\"']/g, '');
};

/**
 * Valida si un objeto tiene las propiedades requeridas
 * @param obj - Objeto a validar
 * @param requiredProps - Array de propiedades requeridas
 * @returns true si el objeto tiene todas las propiedades requeridas
 */
export const hasRequiredProps = (obj: any, requiredProps: string[]): boolean => {
  return requiredProps.every(prop => obj.hasOwnProperty(prop) && obj[prop] !== undefined);
};
