import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
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
    | "subscription";
  size: number;
  color: string;
}
