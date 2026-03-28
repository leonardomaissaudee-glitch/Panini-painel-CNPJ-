import { forwardRef } from "react"
import { cn } from "@/lib/utils"

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}

export const InputMasked = forwardRef<HTMLInputElement, Props>(function InputMasked(
  { className, error, ...rest },
  ref
) {
  return (
    <div className="space-y-1">
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          error && "border-red-400 focus:border-red-500 focus:ring-red-100",
          className
        )}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})
