import { cn } from "@/lib/utils"
import { FormField } from "./FormField"

type Option = { value: string; label: string }

type Props = {
  label: string
  placeholder?: string
  options: Option[]
  value?: string
  onChange: (v: string) => void
  error?: string
}

export function SelectField({ label, placeholder, options, value, onChange, error }: Props) {
  return (
    <FormField label={label} error={error}>
      <select
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          !value && "text-muted-foreground"
        )}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder || "Selecione"}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
