export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatDate(iso: string, dateFormat = "DD MMM YYYY"): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  if (dateFormat.startsWith("MMM")) return `${month} ${day}, ${year}`;
  return `${day} ${month} ${year}`;
}
