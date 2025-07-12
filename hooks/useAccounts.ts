import { getAccounts } from "@/lib/database/accountService";
import { Account } from "@/lib/models/types";
import { useState } from "react";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  getAccounts().then((res) => {
    console.log(res);
    setAccounts(res.data || []);
  });
  return { accounts };
}
