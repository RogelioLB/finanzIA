export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};
