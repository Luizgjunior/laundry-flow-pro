/**
 * Utility functions for masking sensitive client data in the UI.
 * Backend RLS policies already enforce tenant isolation.
 */

/** Mask CPF: shows only first 3 and last 2 digits → "123.***.***-45" */
export function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length < 11) return "***.***.***-**";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

/** Mask phone: shows only last 4 digits → "(••) •••••-1234" */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••-••••";
  const last4 = digits.slice(-4);
  if (digits.length <= 10) {
    return `(••) ••••-${last4}`;
  }
  return `(••) •••••-${last4}`;
}

/** Mask email: shows first 2 chars and domain → "te***@gmail.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

/** Format CPF with dots and dash (unmasked, for forms/internal use) */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/** Format phone (unmasked, for forms/internal use) */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
