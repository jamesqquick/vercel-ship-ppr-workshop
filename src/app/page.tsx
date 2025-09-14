import { Product } from "@/vibes/soul/primitives/product-card";
import { ProductList } from "@/vibes/soul/sections/product-list";

export const experimental_ppr = true;

export default function Home() {
  const products = fetch("http://localhost:3001/api/products", {
    cache: "no-store",
  })
    .then((res) => res.json()) as Promise<Product[]>;
  return (
    <div>
      <h1 className="text-white text-4xl text-center mb-20">My Products</h1>
      <ProductList products={products} />
    </div>
  );
}
