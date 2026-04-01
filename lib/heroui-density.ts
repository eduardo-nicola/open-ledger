/** Alturas alinhadas ao mobile (≈36px) — evita inputs/botões “tarugos”. */

export const compactInput = {
  inputWrapper: "!min-h-11 h-11 py-0",
  input: "text-small",
  label: "text-tiny",
} as const;

export const compactSelect = {
  trigger: "!min-h-9 !h-9 py-0 gap-2",
  value: "text-small",
  label: "text-tiny",
} as const;
