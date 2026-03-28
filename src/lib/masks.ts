// Utilities for formatting/unformatting Brazilian documents and phones.

export const onlyDigits = (value: string) => (value || "").replace(/\D/g, "");

export const formatCNPJ = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const unformatCNPJ = (value: string) => onlyDigits(value).slice(0, 14);

export const formatCPF = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const unformatCPF = (value: string) => onlyDigits(value).slice(0, 11);

export const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim().replace(/-$/, "");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim().replace(/-$/, "");
};

export const unformatPhone = (value: string) => onlyDigits(value).slice(0, 11);

export const formatCEP = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{0,3})/, "$1-$2").trim().replace(/-$/, "");
};

export const unformatCEP = (value: string) => onlyDigits(value).slice(0, 8);
