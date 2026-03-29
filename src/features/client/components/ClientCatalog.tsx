import { products } from "@/data/products"
import { ProductCard } from "@/components/ProductCard"

export function ClientCatalog() {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
