import { clsx } from "clsx";

import {
  type Product,
  ProductCard,
  ProductCardSkeleton,
} from "@/vibes/soul/primitives/product-card";
import * as Skeleton from "@/vibes/soul/primitives/skeleton";
import { Stream, Streamable } from "../../lib/streamable";

interface ProductListProps {
  products: Streamable<Product[]>;
  compareProducts?: Product[];
  className?: string;
  colorScheme?: "light" | "dark";
  aspectRatio?: "5:6" | "3:4" | "1:1";
  emptyStateTitle?: string;
  emptyStateSubtitle?: string;
  placeholderCount?: number;
  removeLabel?: string;
  maxItems?: number;
  maxCompareLimitMessage?: string;
}

/**
 * This component supports various CSS variables for theming. Here's a comprehensive list, along
 * with their default values:
 *
 * ```css
 * :root {
 *   --product-list-light-empty-title: var(--foreground);
 *   --product-list-light-empty-subtitle: var(--contrast-500);
 *   --product-list-dark-empty-title: var(--background);
 *   --product-list-dark-empty-subtitle: var(--contrast-100);
 *   --product-list-empty-state-title-font-family: var(--font-family-heading);
 *   --product-list-empty-state-subtitle-font-family: var(--font-family-body);
 * }
 * ```
 */
export function ProductList({
  products,
  className = "",
  colorScheme = "dark",
  aspectRatio = "5:6",
  emptyStateTitle = "No products found",
  emptyStateSubtitle = "Try browsing our complete catalog of products.",
  placeholderCount = 8,
}: ProductListProps) {
  return (
    <Stream value={products} fallback={<ProductListSkeleton />}>
      {(productsData) => {
        if (productsData.length === 0) {
          return (
            <ProductListEmptyState
              emptyStateSubtitle={emptyStateSubtitle}
              emptyStateTitle={emptyStateTitle}
              placeholderCount={placeholderCount}
            />
          );
        }

        return (
          <div className={clsx("@container w-full", className)}>
            <div className="mx-auto grid grid-cols-1 gap-x-4 gap-y-6 @sm:grid-cols-2 @2xl:grid-cols-3 @2xl:gap-x-5 @2xl:gap-y-8 @5xl:grid-cols-4 @7xl:grid-cols-5">
              {productsData.map((product) => (
                <ProductCard
                  aspectRatio={aspectRatio}
                  colorScheme={colorScheme}
                  imageSizes="(min-width: 80rem) 20vw, (min-width: 64rem) 25vw, (min-width: 42rem) 33vw, (min-width: 24rem) 50vw, 100vw"
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        );
      }}
    </Stream>
  );
}

export function ProductListSkeleton({
  className,
  placeholderCount = 8,
}: Pick<ProductListProps, "className" | "placeholderCount">) {
  return (
    <Skeleton.Root
      className={clsx(
        "group-has-[[data-pending]]/product-list:animate-pulse",
        className
      )}
      pending
    >
      <div className="mx-auto grid grid-cols-1 gap-x-4 gap-y-6 @sm:grid-cols-2 @2xl:grid-cols-3 @2xl:gap-x-5 @2xl:gap-y-8 @5xl:grid-cols-4 @7xl:grid-cols-5">
        {Array.from({ length: placeholderCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </Skeleton.Root>
  );
}

export function ProductListEmptyState({
  className,
  placeholderCount = 8,
  emptyStateTitle,
  emptyStateSubtitle,
}: Pick<
  ProductListProps,
  "className" | "placeholderCount" | "emptyStateTitle" | "emptyStateSubtitle"
>) {
  return (
    <Skeleton.Root className={clsx("relative", className)}>
      <div
        className={clsx(
          "mx-auto grid grid-cols-1 gap-x-4 gap-y-6 [mask-image:linear-gradient(to_bottom,_black_0%,_transparent_90%)] @sm:grid-cols-2 @2xl:grid-cols-3 @2xl:gap-x-5 @2xl:gap-y-8 @5xl:grid-cols-4 @7xl:grid-cols-5"
        )}
      >
        {Array.from({ length: placeholderCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
      <div className="absolute inset-0 mx-auto px-3 py-16 pb-3 @4xl:px-10 @4xl:pt-28 @4xl:pb-10">
        <div className="mx-auto max-w-xl space-y-2 text-center @4xl:space-y-3">
          <h3 className="font-(family-name:--product-list-empty-state-title-font-family,var(--font-family-heading)) text-2xl leading-tight text-(--product-list-empty-state-title,var(--foreground)) @4xl:text-4xl @4xl:leading-none">
            {emptyStateTitle}
          </h3>
          <p className="font-(family-name:--product-list-empty-state-subtitle-font-family,var(--font-family-body)) text-sm text-(--product-list-empty-state-subtitle,var(--contrast-500)) @4xl:text-lg">
            {emptyStateSubtitle}
          </p>
        </div>
      </div>
    </Skeleton.Root>
  );
}
