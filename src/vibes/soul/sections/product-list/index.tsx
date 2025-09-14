import { clsx } from "clsx";

import {
  type Product,
  ProductCard,
  ProductCardSkeleton,
} from "@/vibes/soul/primitives/product-card";
import * as Skeleton from "@/vibes/soul/primitives/skeleton";

interface ProductListProps {
  products: Product[];
}

export function ProductList({
  products
}: ProductListProps) {
  const productsData = products;
  //some use case to use `.then` here that will cause an infinite loop
  if (productsData.length === 0) {
    return (
      <ProductListEmptyState
      />
    );
  }

  return (
    <div className={clsx("@container w-full")}>
      <div className="mx-auto grid grid-cols-1 gap-x-4 gap-y-6 @sm:grid-cols-2 @2xl:grid-cols-3 @2xl:gap-x-5 @2xl:gap-y-8 @5xl:grid-cols-4 @7xl:grid-cols-5">
        {productsData.map((product) => (
          <ProductCard
            imageSizes="(min-width: 80rem) 20vw, (min-width: 64rem) 25vw, (min-width: 42rem) 33vw, (min-width: 24rem) 50vw, 100vw"
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </div>
  );
}

export function ProductListSkeleton() {
  return (
    <Skeleton.Root
      className={clsx(
        "group-has-[[data-pending]]/product-list:animate-pulse"      )}
      pending
    >
      <div className="mx-auto grid grid-cols-1 gap-x-4 gap-y-6 @sm:grid-cols-2 @2xl:grid-cols-3 @2xl:gap-x-5 @2xl:gap-y-8 @5xl:grid-cols-4 @7xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </Skeleton.Root>
  );
}

export function ProductListEmptyState() {
  return (
    <Skeleton.Root className={clsx("relative")}>
      <div
        className={clsx(
          "mx-auto grid grid-cols-1 gap-x-4 gap-y-6 [mask-image:linear-gradient(to_bottom,_black_0%,_transparent_90%)] @sm:grid-cols-2 @2xl:grid-cols-3 @2xl:gap-x-5 @2xl:gap-y-8 @5xl:grid-cols-4 @7xl:grid-cols-5"
        )}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
      <div className="absolute inset-0 mx-auto px-3 py-16 pb-3 @4xl:px-10 @4xl:pt-28 @4xl:pb-10">
        <div className="mx-auto max-w-xl space-y-2 text-center @4xl:space-y-3">
          <h3 className="font-(family-name:--product-list-empty-state-title-font-family,var(--font-family-heading)) text-2xl leading-tight text-(--product-list-empty-state-title,var(--foreground)) @4xl:text-4xl @4xl:leading-none">
            No products found
          </h3>
          <p className="font-(family-name:--product-list-empty-state-subtitle-font-family,var(--font-family-body)) text-sm text-(--product-list-empty-state-subtitle,var(--contrast-500)) @4xl:text-lg">
            Try browsing our complete catalog of products.
          </p>
        </div>
      </div>
    </Skeleton.Root>
  );
}
