/**
 * Formatea un timestamp a formato de fecha corta (DD/MM)
 * @param timestamp - Timestamp en milisegundos
 * @returns Fecha formateada como "DD/MM"
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};

/**
 * Formatea un timestamp a formato de fecha con mes abreviado (DD MMM)
 * @param timestamp - Timestamp en milisegundos
 * @returns Fecha formateada como "DD MMM" (ej: "15 Ene")
 */
export const formatDateWithMonth = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate();

  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  const monthAbbr = monthNames[date.getMonth()];
  return `${day} ${monthAbbr}`;
};

/**
 * Formatea un timestamp a formato de fecha completa (DD/MM/YYYY)
 * @param timestamp - Timestamp en milisegundos
 * @returns Fecha formateada como "DD/MM/YYYY"
 */
export const formatFullDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Obtiene el nombre del mes en español
 * @param monthIndex - Índice del mes (0-11)
 * @param short - Si debe retornar la versión abreviada
 * @returns Nombre del mes
 */
export const getMonthName = (monthIndex: number, short: boolean = false): string => {
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const shortMonthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  return short ? shortMonthNames[monthIndex] : monthNames[monthIndex];
};

/**
 * Obtiene el inicio y fin de un mes específico
 * @param year - Año
 * @param month - Mes (0-11)
 * @returns Objeto con fechas de inicio y fin del mes
 */
export const getMonthRange = (year: number, month: number) => {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  return {
    start: startOfMonth.getTime(),
    end: endOfMonth.getTime(),
  };
};
