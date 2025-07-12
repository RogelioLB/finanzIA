import { AccountsContext } from "@/contexts/AccountsContext";
import { useContext } from "react";

export { NewAccount } from "@/contexts/AccountsContext";

// Hook to access the accounts context
export function useAccounts() {
  const context = useContext(AccountsContext);
  
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  
  return context;
}
