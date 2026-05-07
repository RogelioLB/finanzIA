import React from "react";
import { DesignIcon } from "@/components/ui/Icon";

type IconComp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const EMOJI_MAP: Record<string, IconComp> = {
  "🍔": DesignIcon.Food,
  "🍕": DesignIcon.Food,
  "🥗": DesignIcon.Food,
  "🍎": DesignIcon.Food,
  "🚗": DesignIcon.Transport,
  "🚙": DesignIcon.Transport,
  "🚕": DesignIcon.Transport,
  "🚌": DesignIcon.Transport,
  "🎬": DesignIcon.Fun,
  "🎮": DesignIcon.Fun,
  "🎵": DesignIcon.Fun,
  "🎉": DesignIcon.Fun,
  "🛍️": DesignIcon.Bag,
  "🛒": DesignIcon.Bag,
  "💡": DesignIcon.Bolt,
  "⚡": DesignIcon.Bolt,
  "💊": DesignIcon.Health,
  "🏥": DesignIcon.Health,
  "❤️": DesignIcon.Health,
  "🏠": DesignIcon.Home2,
  "🏡": DesignIcon.Home2,
  "📚": DesignIcon.Education,
  "🎓": DesignIcon.Education,
  "📱": DesignIcon.Phone,
  "☎️": DesignIcon.Phone,
  "💰": DesignIcon.Cash,
  "💵": DesignIcon.Cash,
  "💸": DesignIcon.Cash,
  "💼": DesignIcon.Bag,
  "💳": DesignIcon.Card,
  "🏦": DesignIcon.Bank,
  "📈": DesignIcon.Stocks,
  "📊": DesignIcon.Stocks,
  "💻": DesignIcon.Stocks,
  "🪙": DesignIcon.Crypto,
  "💎": DesignIcon.PiggyBank,
  "🐷": DesignIcon.PiggyBank,
  "🐶": DesignIcon.Pet,
  "🐱": DesignIcon.Pet,
  "🎁": DesignIcon.Bag,
  "💭": DesignIcon.Dots,
};

const NAME_MAP: { test: RegExp; icon: IconComp }[] = [
  { test: /comida|food|restaurante|despensa/i, icon: DesignIcon.Food },
  { test: /transport|uber|gasolina|auto/i, icon: DesignIcon.Transport },
  { test: /entreten|fun|cine|spotify|netflix|música/i, icon: DesignIcon.Fun },
  { test: /compra|shopping|bag/i, icon: DesignIcon.Bag },
  { test: /servicio|luz|gas|agua|internet|cfe/i, icon: DesignIcon.Bolt },
  { test: /salud|health|medic|farmacia/i, icon: DesignIcon.Health },
  { test: /casa|home|hogar|renta/i, icon: DesignIcon.Home2 },
  { test: /educa|school|escuela|libro/i, icon: DesignIcon.Education },
  { test: /telef|phone|celular/i, icon: DesignIcon.Phone },
  { test: /salario|sueldo|nómina|nomina/i, icon: DesignIcon.Cash },
  { test: /freelance|trabajo/i, icon: DesignIcon.Stocks },
  { test: /regalo|gift/i, icon: DesignIcon.Bag },
  { test: /invers|stocks|crypto/i, icon: DesignIcon.Stocks },
  { test: /pet|mascota/i, icon: DesignIcon.Pet },
];

export function resolveCategoryIcon(category?: {
  icon?: string;
  name?: string;
}): IconComp {
  if (!category) return DesignIcon.Dots;
  const ic = category.icon || "";
  if (EMOJI_MAP[ic]) return EMOJI_MAP[ic];
  for (const m of NAME_MAP) {
    if (m.test.test(category.name || "")) return m.icon;
  }
  return DesignIcon.Dots;
}

interface CategoryIconProps {
  category?: { icon?: string; name?: string };
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function CategoryIcon({
  category,
  size = 16,
  color,
  strokeWidth = 1.7,
}: CategoryIconProps) {
  const I = resolveCategoryIcon(category);
  return <I size={size} color={color} strokeWidth={strokeWidth} />;
}
