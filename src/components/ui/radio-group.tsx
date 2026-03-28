"use client"

import * as React from "react"
import { CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({})

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onValueChange'> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const currentValue = value ?? internalValue

    const handleValueChange = (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    }

    return (
      <RadioGroupContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
        <div
          ref={ref}
          className={cn("grid gap-2", className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isChecked = context.value === value

    const handleChange = () => {
      context.onValueChange?.(value)
    }

    return (
      <div className="flex items-center space-x-2">
        <button
          type="button"
          role="radio"
          aria-checked={isChecked}
          data-state={isChecked ? "checked" : "unchecked"}
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onClick={handleChange}
        >
          {isChecked && (
            <CircleIcon className="h-2.5 w-2.5 fill-primary" />
          )}
        </button>
        <input
          ref={ref}
          type="radio"
          className="sr-only"
          id={id}
          value={value}
          checked={isChecked}
          onChange={handleChange}
        />
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
