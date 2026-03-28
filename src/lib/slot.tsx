import * as React from "react"

/**
 * Componente Slot - permite que o componente filho substitua o elemento pai
 * Similar ao Radix UI Slot, mas implementação simplificada
 */

interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export const Slot = React.forwardRef<any, SlotProps>(
  ({ children, ...props }, forwardedRef) => {
    // Se não houver children ou não for um elemento React válido, retorna null
    if (!children || !React.isValidElement(children)) {
      return null
    }

    // Clona o elemento filho e adiciona as props
    const childProps = children.props as Record<string, any>
    return React.cloneElement(children, {
      ...props,
      ...childProps,
      // Merge classNames se ambos existirem
      className: [props.className, childProps.className]
        .filter(Boolean)
        .join(' ') || undefined,
      ref: forwardedRef,
    } as any)
  }
)

Slot.displayName = "Slot"

// Exporta também como Root para compatibilidade
export const Root = Slot
