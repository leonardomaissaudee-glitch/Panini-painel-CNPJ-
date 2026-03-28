type Props = {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  error?: string
}

export function CheckboxField({ label, checked, onChange, error }: Props) {
  return (
    <div className="space-y-1">
      <label className="flex items-start gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
