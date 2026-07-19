import { formatJalali, formatRial, toPersianDigits } from "./jalali";

/**
 * SMS template substitution + native sms: URI builder.
 *
 * We do NOT send SMS server-side (that would need a paid gateway like
 * Kavenegar/Farapayamak). Instead we build a mailto-style sms: URI that
 * opens the device's native SMS app pre-filled with the body. Swapping
 * in a real gateway later only means changing this file.
 *
 * Placeholders (filled from an Installment + its Customer + Plan):
 *   {name}              customer full name
 *   {amount}            installment amount, Rial, Persian digits
 *   {dueDate}           Jalali due date, Persian digits
 *   {installmentNo}     1-based installment number
 *   {totalInstallments} plan's installmentsCount
 */

export interface SmsContext {
  name: string;
  amount: number;
  dueDate: Date;
  installmentNo: number;
  totalInstallments: number;
}

/** Substitute placeholders in a template. Leaves unknown ones intact. */
export function renderSmsBody(template: string, ctx: SmsContext): string {
  const due = formatJalali(ctx.dueDate, "D MMMM YYYY");
  return template
    .replaceAll("{name}", ctx.name)
    .replaceAll("{amount}", `${formatRial(ctx.amount)} ریال`)
    .replaceAll("{dueDate}", toPersianDigits(due))
    .replaceAll("{installmentNo}", toPersianDigits(ctx.installmentNo))
    .replaceAll("{totalInstallments}", toPersianDigits(ctx.totalInstallments));
}

/**
 * Build an sms: URI for the native SMS app.
 *   - iOS / modern Android: `sms:<phone>&body=<encoded>`
 *   - older Android:        `sms:<phone>?body=<encoded>`
 * We use `?` which works broadly; iOS tolerates it for the body query.
 */
export function smsUri(phone: string, body: string): string {
  const clean = phone.replace(/[^\d+]/g, "");
  return `sms:${clean}?&body=${encodeURIComponent(body)}`;
}
