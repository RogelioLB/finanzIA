import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import AddBalanceIcon from "../icons/add-balance";
import AiPlanIcon from "../icons/ai-plan";
import HistoryIcon from "../icons/history";
import HomeIcon from "../icons/home";
import NotificationIcon from "../icons/notification";
import PaymentIcon from "../icons/paymment";
import ProfileIcon from "../icons/profile";
import StatisticsIcon from "../icons/statistics";
import TransferIcon from "../icons/transfer";

export default function Icon({ name, size, color }: IconProps) {
  switch (name) {
    case "home":
      return <HomeIcon width={size} height={size} fill={color} />;
    case "statistics":
      return <StatisticsIcon width={size} height={size} fill={color} />;
    case "ai-plan":
      return <AiPlanIcon width={size} height={size} fill={color} />;
    case "accounts":
      return <HistoryIcon width={size} height={size} fill={color} />;
    case "profile":
      return <ProfileIcon width={size} height={size} fill={color} />;
    case "notification":
      return <NotificationIcon width={size} height={size} fill={color} />;
    case "transfer":
      return <TransferIcon width={size} height={size} fill={color} />;
    case "add-balance":
      return <AddBalanceIcon width={size} height={size} fill={color} />;
    case "spend":
      return <PaymentIcon width={size} height={size} fill={color} />;
    case "subscription":
      return <MaterialIcons name="subscriptions" size={size} color={color} />;
    case "wallet":
      return <Ionicons name="wallet" size={size} color={color} />;
  }
}

export interface IconProps {
  name:
    | "home"
    | "statistics"
    | "ai-plan"
    | "accounts"
    | "profile"
    | "notification"
    | "transfer"
    | "add-balance"
    | "spend"
    | "subscription"
    | "wallet";
  size: number;
  color: string;
}

interface DesignIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const iconDefaults = (props: DesignIconProps) => ({
  size: props.size ?? 22,
  color: props.color ?? 'currentColor',
  strokeWidth: props.strokeWidth ?? 1.6,
});

const vb = '0 0 24 24';

export const DesignIcon = {
  Home: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>;
  },
  List: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 7h16M4 12h16M4 17h10" /></Svg>;
  },
  Debt: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="6" width="18" height="13" rx="2" /><Path d="M3 11h18" /></Svg>;
  },
  Envelope: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="5" width="18" height="14" rx="2" /><Path d="M3 8l9 6 9-6" /></Svg>;
  },
  Plus: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth ?? 2} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>;
  },
  Close: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth ?? 1.7} strokeLinecap="round"><Path d="M6 6l12 12M18 6L6 18" /></Svg>;
  },
  Mic: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Rect x="9" y="3" width="6" height="11" rx="3" /><Path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Svg>;
  },
  Back: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth ?? 1.7} strokeLinecap="round" strokeLinejoin="round"><Path d="M15 6l-6 6 6 6" /></Svg>;
  },
  Chevron: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth ?? 1.7} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 6l6 6-6 6" /></Svg>;
  },
  Settings: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="3" /><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></Svg>;
  },
  Sun: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="4" /><Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></Svg>;
  },
  Moon: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Svg>;
  },
  Check: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth ?? 2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12l5 5 9-11" /></Svg>;
  },
  TrendUp: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 17l6-6 4 4 8-8" /><Path d="M14 7h7v7" /></Svg>;
  },
  TrendDown: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 7l6 6 4-4 8 8" /><Path d="M14 17h7v-7" /></Svg>;
  },
  Backspace: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth ?? 1.7} strokeLinecap="round" strokeLinejoin="round"><Path d="M22 5H9l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" /><Path d="M14 9l4 4M18 9l-4 4" /></Svg>;
  },
  Food: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 2v7a3 3 0 0 0 3 3v10M9 2v7a3 3 0 0 1-3 3M15 14v8M15 4c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v8h-3v10" /></Svg>;
  },
  Transport: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 17h14M5 17l1.5-7h11L19 17M5 17v3M19 17v3" /><Circle cx="8" cy="14" r="1" /><Circle cx="16" cy="14" r="1" /></Svg>;
  },
  Fun: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="9" /><Path d="M9 10h.01M15 10h.01M8 15c1 1.5 2.5 2 4 2s3-.5 4-2" /></Svg>;
  },
  Home2: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>;
  },
  Health: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" /></Svg>;
  },
  Bag: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 7h14l-1 13H6zM9 7a3 3 0 0 1 6 0" /></Svg>;
  },
  Bolt: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M13 2L4 14h7l-1 8 9-12h-7z" /></Svg>;
  },
  Phone: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Rect x="6" y="2" width="12" height="20" rx="2" /><Path d="M11 18h2" /></Svg>;
  },
  Education: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M2 9l10-5 10 5-10 5z" /><Path d="M6 11v5c0 2 3 3 6 3s6-1 6-3v-5" /></Svg>;
  },
  Pet: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Circle cx="5" cy="9" r="2" /><Circle cx="19" cy="9" r="2" /><Circle cx="9" cy="5" r="2" /><Circle cx="15" cy="5" r="2" /><Path d="M12 12c-3 0-6 3-6 6 0 2 2 3 4 3l2-1 2 1c2 0 4-1 4-3 0-3-3-6-6-6z" /></Svg>;
  },
  Wallet: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6H6a2 2 0 0 1-2-2 2 2 0 0 1 2-2h13V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2" /><Circle cx="16.5" cy="13" r="1" /></Svg>;
  },
  Card: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="6" width="18" height="13" rx="2" /><Path d="M3 10h18" /></Svg>;
  },
  Cash: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Rect x="2" y="7" width="20" height="11" rx="1.5" /><Circle cx="12" cy="12.5" r="2.5" /><Path d="M5 10v5M19 10v5" /></Svg>;
  },
  Dots: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Circle cx="5" cy="12" r="1.5" fill={color} stroke="none" /><Circle cx="12" cy="12" r="1.5" fill={color} stroke="none" /><Circle cx="19" cy="12" r="1.5" fill={color} stroke="none" /></Svg>;
  },
  Bank: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v2H3V9z" /><Path d="M6 11v8M10 11v8M14 11v8M18 11v8M3 19h18" /></Svg>;
  },
  Stocks: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 17l6-6 4 4 8-8" /><Path d="M14 7h7v7" /></Svg>;
  },
  PiggyBank: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 11V9a7 7 0 0 0-14 0v2a7 7 0 0 0 5 6.7V19h4v-1.3A7 7 0 0 0 19 11z" /><Path d="M19 11h2M12 6v2" /></Svg>;
  },
  Bond: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="18" height="18" rx="2" /><Path d="M7 8h10M7 12h5M7 16h8" /></Svg>;
  },
  Crypto: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L10.5 19.25m1.267-.161L11.5 15m.267 4.089L10.5 19.25m0 0L8 18.689M11.5 15l-2.5-.5m5 .5 2.5-.5M11.5 15 10 11m0 0 1.5 4m-1.5-4L8 10m3.5 5L14 14m0 0 1.5.5M14 14 15 11m0 3L13.5 15M15 11l-1 3M15 11l1.5-1M8 10l1.5 1.5M8 10l-2 1.5" /></Svg>;
  },
  Eye: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" /></Svg>;
  },
  EyeOff: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><Path d="M1 1l22 22" /></Svg>;
  },
  Alert: (props: DesignIconProps) => {
    const { size, color, strokeWidth } = iconDefaults(props);
    return <Svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2L2 22h20L12 2z" /><Path d="M12 9v4M12 16h.01" /></Svg>;
  },
};