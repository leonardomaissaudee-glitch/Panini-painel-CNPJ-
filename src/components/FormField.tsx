import { Label } from '@/components/ui/label'

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
    </div>
  )
}
