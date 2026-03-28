export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {message}
    </div>
  )
}
