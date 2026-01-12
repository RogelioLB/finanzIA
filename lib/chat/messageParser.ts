import { ChatMessageMetadata, ChartConfig, TableConfig, ActionButtonConfig } from "@/lib/database/sqliteService";

/**
 * Parsea los marcadores especiales en el contenido de un mensaje de la IA
 * Detecta [CHART:...], [TABLE:...], [ACTION:...] y extrae los datos
 */
export function parseMessageMetadata(content: string): ChatMessageMetadata {
  const metadata: ChatMessageMetadata = { type: "text" };

  // Parsear gráficos [CHART:type:{...}]
  const chartRegex = /\[CHART:(\w+):/g;
  const chartMatches = [...content.matchAll(chartRegex)];

  if (chartMatches.length > 0) {
    metadata.charts = chartMatches
      .map((match) => {
        try {
          const chartType = match[1].toLowerCase() as "bar" | "pie" | "line";
          const jsonStr = extractJSONFromMarker(content, match.index! + match[0].length);

          if (!jsonStr) {
            console.warn("[Parser] Could not extract JSON for chart:", match[0]);
            return null;
          }

          const chartData = JSON.parse(jsonStr);
          return {
            type: chartType,
            ...chartData,
          } as ChartConfig;
        } catch (e) {
          console.warn("[Parser] Error parsing chart:", e, "at position:", match.index);
          return null;
        }
      })
      .filter((c) => c !== null) as ChartConfig[];
  }

  // Parsear tablas [TABLE:{...}]
  const tableRegex = /\[TABLE:/g;
  const tableMatches = [...content.matchAll(tableRegex)];

  if (tableMatches.length > 0) {
    metadata.tables = tableMatches
      .map((match) => {
        try {
          const jsonStr = extractJSONFromMarker(content, match.index! + match[0].length);

          if (!jsonStr) {
            console.warn("[Parser] Could not extract JSON for table:", match[0]);
            return null;
          }

          return JSON.parse(jsonStr) as TableConfig;
        } catch (e) {
          console.warn("[Parser] Error parsing table:", e, "at position:", match.index);
          return null;
        }
      })
      .filter((t) => t !== null) as TableConfig[];
  }

  // Parsear botones de acción [ACTION:type:{...}]
  const actionRegex = /\[ACTION:(\w+):/g;
  const actionMatches = [...content.matchAll(actionRegex)];

  if (actionMatches.length > 0) {
    metadata.actionButtons = actionMatches
      .map((match) => {
        try {
          const actionType = match[1] as "save_objective" | "create_budget";
          const jsonStr = extractJSONFromMarker(content, match.index! + match[0].length);

          if (!jsonStr) {
            console.warn("[Parser] Could not extract JSON for action:", match[0]);
            return null;
          }

          const actionData = JSON.parse(jsonStr);
          return {
            type: actionType,
            ...actionData,
          } as ActionButtonConfig;
        } catch (e) {
          console.warn("[Parser] Error parsing action:", e, "at position:", match.index);
          return null;
        }
      })
      .filter((a) => a !== null) as ActionButtonConfig[];
  }

  // Si hay gráficos, tablas o acciones, cambiar tipo
  if (
    (metadata.charts && metadata.charts.length > 0) ||
    (metadata.tables && metadata.tables.length > 0) ||
    (metadata.actionButtons && metadata.actionButtons.length > 0)
  ) {
    metadata.type = "text"; // El texto + visualizaciones
  }

  return metadata;
}

/**
 * Elimina todos los marcadores especiales del contenido del mensaje
 * para que solo muestre el texto limpio al usuario
 */
export function removeMarkers(content: string): string {
  let result = content;
  const markerTypes = ['CHART', 'TABLE', 'ACTION'];

  for (const type of markerTypes) {
    const regex = new RegExp(`\\[${type}:[^\\]]*?:`, 'g');
    let match;

    while ((match = regex.exec(result)) !== null) {
      const markerStart = match.index;
      const markerEnd = findMarkerEnd(result, markerStart);

      if (markerEnd !== -1) {
        const fullMarker = result.substring(markerStart, markerEnd + 1);
        result = result.replace(fullMarker, '');
        regex.lastIndex = markerStart; // Reset regex position
      } else {
        break; // No more valid markers
      }
    }
  }

  return result
    .trim()
    .replace(/\n{3,}/g, "\n\n"); // Limpiar saltos de línea múltiples
}

/**
 * Encuentra la posición de la llave de cierre correspondiente en una cadena JSON
 */
function findMatchingBrace(str: string, startPos: number): number {
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startPos; i < str.length; i++) {
    const char = str[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        return i;
      }
    }
  }

  return -1; // No matching brace found
}

/**
 * Extrae el JSON completo de un marcador, manejando llaves anidadas correctamente
 */
function extractJSONFromMarker(content: string, markerStart: number): string | null {
  const startBrace = content.indexOf('{', markerStart);
  if (startBrace === -1) return null;

  const endBrace = findMatchingBrace(content, startBrace);
  if (endBrace === -1) return null;

  return content.substring(startBrace, endBrace + 1);
}

/**
 * Encuentra la posición del corchete de cierre correspondiente para un marcador completo
 */
function findMarkerEnd(content: string, startPos: number): number {
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startPos; i < content.length; i++) {
    const char = content[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    } else if (char === ']' && braceCount === 0) {
      return i;
    }
  }

  return -1; // No matching bracket found
}

/**
 * Valida que el JSON dentro de los marcadores sea válido
 */
export function validateMarkerJSON(content: string): boolean {
  const allRegex = /\{[\s\S]*?\}/g;
  const matches = content.match(allRegex) || [];

  for (const match of matches) {
    try {
      JSON.parse(match);
    } catch {
      return false;
    }
  }

  return true;
}
