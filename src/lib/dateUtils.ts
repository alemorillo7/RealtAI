import { format as dateFnsFormat } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formatea una fecha forzando la zona horaria de Madrid (Europe/Madrid)
 */
export function formatInMadrid(date: Date | number, formatStr: string): string {
  // Convertimos la fecha a la zona horaria de Madrid usando Intl
  const madridDate = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).format(date)
  );

  return dateFnsFormat(madridDate, formatStr, { locale: es });
}

/**
 * Obtiene la fecha actual en Madrid en formato YYYY-MM-DD
 */
export function getTodayInMadrid(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}
