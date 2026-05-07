import { Redirect } from "expo-router";

// Las tarjetas de crédito ahora se gestionan dentro de la pantalla de Cuentas
// (agrupadas junto a débito, efectivo y wallets), así que redirigimos.
export default function CreditCardsIndexRedirect() {
  return <Redirect href="/wallets" />;
}
