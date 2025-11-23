# Configuración del Plan Financiero con IA

## 📦 Instalación de Dependencias

Para habilitar la funcionalidad de Plan Financiero con IA, necesitas instalar los siguientes paquetes:

```bash
npm install ai @ai-sdk/openai
```

O con yarn:

```bash
yarn add ai @ai-sdk/openai
```

## 🔑 Configuración de API Key

1. Crea un archivo `.env.local` en la raíz del proyecto (puedes copiar `.env.local.example`):

```bash
cp .env.local.example .env.local
```

2. Obtén tu API key de OpenAI:
   - Ve a https://platform.openai.com/api-keys
   - Crea una nueva API key
   - Copia la key

3. Agrega tu API key al archivo `.env.local`:

```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

## 🚀 Uso

Una vez configurado:

1. Asegúrate de tener al menos **10 transacciones** en la app
2. Ve a la pestaña **"AI Plan"** en la navegación inferior
3. Presiona el botón **"Generar Plan con IA"**
4. Espera unos segundos mientras la IA analiza tus finanzas
5. ¡Revisa tu plan financiero personalizado!

## 📊 Qué Genera el Plan

El plan financiero incluye:

- **📊 Resumen General**: Análisis de tu situación financiera actual
- **💰 Presupuesto Mensual**: Ingresos, gastos y ahorro estimado
- **💡 Recomendaciones**: Sugerencias priorizadas para mejorar tus finanzas
- **📈 Patrones de Gasto**: Análisis de tus categorías de gasto principales
- **🎯 Metas Sugeridas**: Objetivos financieros alcanzables con plazos

## 🔒 Seguridad

- La API key **NUNCA** debe ser commiteada al repositorio
- El archivo `.env.local` está en `.gitignore` por defecto
- Solo se envían datos agregados (no información personal) a OpenAI
- Las transacciones excluidas (suscripciones pendientes) no se incluyen en el análisis

## 💰 Costos

- El plan usa el modelo `gpt-4o-mini` que es muy económico
- Cada generación de plan cuesta aproximadamente $0.001 - $0.002 USD
- Se recomienda establecer límites de uso en tu cuenta de OpenAI

## 🛠️ Troubleshooting

### Error: "Cannot find module 'ai'"
```bash
npm install ai @ai-sdk/openai
```

### Error: "OPENAI_API_KEY is not defined"
Verifica que:
1. El archivo `.env.local` existe en la raíz
2. La variable está correctamente escrita: `OPENAI_API_KEY=sk-...`
3. Reinicia el servidor de desarrollo después de agregar la key

### Error: "Se requieren al menos 10 transacciones"
Agrega más transacciones a la app antes de generar el plan.

## 📝 Notas

- El plan se genera en tiempo real, no se guarda automáticamente
- Puedes regenerar el plan cuantas veces quieras
- Cada regeneración puede dar resultados ligeramente diferentes
- El análisis mejora con más transacciones (recomendado: 30+)
