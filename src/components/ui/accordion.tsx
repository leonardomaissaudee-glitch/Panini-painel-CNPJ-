"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface AccordionContextValue {
  openItems: Set<string>
  toggleItem: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple"
  defaultValue?: string | string[]
  collapsible?: boolean
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, type = "single", defaultValue, children, ...props }, ref) => {
    const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
      if (Array.isArray(defaultValue)) {
        return new Set(defaultValue)
      }
      return defaultValue ? new Set([defaultValue]) : new Set()
    })

    const toggleItem = (value: string) => {
      setOpenItems((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(value)) {
          newSet.delete(value)
        } else {
          if (type === "single") {
            newSet.clear()
          }
          newSet.add(value)
        }
        return newSet
      })
    }

    return (
      <AccordionContext.Provider value={{ openItems, toggleItem }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    return (
      <div ref={ref} data-value={value} className={cn("border-b", className)} {...props}>
        {children}
      </div>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const value = (props as any)["data-value"] || ""

    const handleClick = () => {
      context?.toggleItem(value)
    }

    const isOpen = context?.openItems.has(value) || false

    return (
      <button
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        data-state={isOpen ? "open" : "closed"}
        onClick={handleClick}
        type="button"
        {...props}
      >
        {children}
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </button>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const itemElement = React.useRef<HTMLDivElement>(null)
    const [value, setValue] = React.useState("")

    React.useEffect(() => {
      const item = itemElement.current?.closest("[data-value]")
      if (item) {
        setValue(item.getAttribute("data-value") || "")
      }
    }, [])

    const isOpen = context?.openItems.has(value) || false

    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className={cn("overflow-hidden text-sm", className)}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        <div ref={itemElement} className="pb-4 pt-0">
          {children}
        </div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
