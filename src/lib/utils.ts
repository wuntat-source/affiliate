import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = "IDR"): string {
  if (amount === null || amount === undefined) return "-";
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

/**
 * Konversi nilai datetime-local (dianggap WIB/GMT+7) ke ISO string UTC.
 * Input: "2026-10-08T10:01" -> Output: "2026-10-08T03:01:00.000Z"
 */
export function wibToISOString(localDateTime: string): string {
  if (!localDateTime) return "";
  // Tambah offset WIB agar di-parse sebagai GMT+7
  const withOffset = localDateTime.length === 16 ? `${localDateTime}:00+07:00` : `${localDateTime}+07:00`;
  return new Date(withOffset).toISOString();
}

/**
 * Konversi ISO string UTC ke nilai datetime-local WIB.
 * Input: "2026-10-08T03:01:00.000Z" -> Output: "2026-10-08T10:01"
 */
export function isoToWibLocal(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  // Geser ke WIB (+7 jam) lalu ambil format lokal
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 16);
}
