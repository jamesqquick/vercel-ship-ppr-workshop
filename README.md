# Vercel SHIP PPR Workshop


![QR Code](/images/qr-code.png)

Following along below for a hands-on opportunity to learn about some of the intricacies of streaming and data loading in Next.js. 

This workshop will walk through building some of the key concepts we've implemented into [VIBES](https://vibes.site/), a copy and paste UI component library that is deeply integrated with Next.js. You can specifically refer to the [Product List VIBES component](https://vibes.site/docs/soul/product-list) and the [Streamable component](https://vibes.site/docs/soul/streamable) for a finished version of what we'll be building in this workshop.

## Overview

In this workshop, we're going to focus on the following scenario. Imagine you're tasked with building a UI component library that integrates with data loading patterns in Next.js. Our specific goal is to create a `ProductList` component that:

- integrates with React Suspense
- can handle both synchronous and asynchronous data
- implements streaming and loading states
- supports PPR

This is a different take than other UI libraries. Options like ShadCN and Radix UI provide low-level primitives for building components, but they don't offer built-in support for data fetching and loading states. Those are great options, but we're taking a different approach. Our approach will be to create a higher-level abstraction that makes it easy to build data-driven components with built-in support for streaming and loading states.

## Getting Started

Install dependencies:

```bash
npm install
```

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Initial Code Overview

The initial codebase provides a `ProductList` component that works with synchronous data. The styling in this component is already done for you. It also depends on a few other components that have already been included as well, such as `ProductCard`, `Skeleton`, etc. You can find all of these components (a mix of utils, primitives, and sections) in the `src/vibes/soul` directory. That said, the only UI component you will need to make changes to is the `ProductList` component. The goal is to enhance the `ProductList` component to support asynchronous data loading, streaming, and loading states.

On the root page route, we are passing static product data to the `ProductList` component. 

```tsx src/app/page.tsx
export default function Home() {
  return (
    <div>
      <h1 className="text-white text-4xl text-center mb-20">My Products</h1>
      <ProductList products={defaultProducts} />
    </div>
  );
}

const defaultProducts: Product[] = [
  {
    id: '1',
    title: 'Philodendron Imperial Red',
    subtitle: 'Indoor Plant',
    badge: 'Popular',
    price: '$44.95',
    image: {
      src: 'https://storage.googleapis.com/s.mkswft.com/RmlsZTowNzAzMzk0Ni01NGNhLTQ3ZDYtODgyYi0wYWI3NTUzNTU4YjQ=/kv08IvX08j.jpeg',
      alt: 'Philodendron Imperial Red',
    },
    href: '#',
    rating: 4,
  },
  //...
]
```

## Loading Data Asynchronously

As-is, the `ProductList` component is designed to work with synchronous data. This means the data needs to be loaded before it's passed to the component itself. However, we can update the data loading in the page component to simulate asynchronous data fetching. To do this, create a promise that resolves the product data after a delay, simulating a network request. Then, await this promise to reference the data itself. To use `await`, you'll also need to mark the page component as `async`.

```tsx
export default async function Home() {
  const products = await (new Promise(res => setTimeout(() => res(defaultProducts), 2000)) as Promise<Product[]>);

  return (
    <div>
      <h1 className="text-white text-4xl text-center mb-20">My Products</h1>
      <ProductList products={products} />
    </div>
  );
}
```

By default, components in Next.js are server components which enables us to use async/await for data fetching on the server. As of now, this is basic Server-Side Rendering (SSR) which means that all data is loaded on the server before any markup is sent back to the client. This is true even for static markup like the `h1` header. We can improve this by taking advantage of React's Suspense and streaming capabilities. This will allow us to immediately send the initial static HTML to the client while the product data is still being fetched and then stream in the product data when it's ready.

## Add Streaming and with Suspense

To support streaming and loading states, you have to wrap a component that asynchronously fetches data in a `Suspense` component. This allows React to suspend rendering until the data is ready, showing a fallback UI in the meantime. To support this, we need to update the `ProductList` component to:

- be marked as `async`
- accept a promise for the `products` prop that resolves to the array of data
- uses `await` to resolve the promise before rendering

Start by updating the `ProductListProps` interface to accept a `Promise<Product[]>` for the `products` prop.

```tsx
interface ProductListProps {
  products: Promise<Product[]>;
  //other props...
}
```

Then, mark the `ProductList` component as an `async` function and use `await` to resolve the product data.


```tsx
export async function ProductList({
  products,
  className = "",
  colorScheme = "dark",
  aspectRatio = "5:6",
  emptyStateTitle = "No products found",
  emptyStateSubtitle = "Try browsing our complete catalog of products.",
  placeholderCount = 8,
}: ProductListProps) {
  const productsData = await products;
  //...
}
```

In the page component, remove the `await` from the promise and pass the promise directly to the `ProductList` component. This will allow the `ProductList` to handle the promise internally. You should also remove the `async` keyword from the page component since we're not using `await` there anymore.

```tsx
export default function Home() {

  const products = new Promise(res => setTimeout(() => res(defaultProducts), 2000)) as Promise<Product[]>;
  return (
    <div>
      <h1 className="text-white text-4xl text-center mb-20">My Products</h1>
        <ProductList products={products} colorScheme="dark" />
    </div>
  );
}
```
Lastly, you can incorporate streaming and loading by importing the `Suspense` component from React, wrapping the `ProductList` component with it, and adding a simple loading text as the `fallback`. This will allow you to show a fallback UI while the product data is being fetched.


```tsx
<Suspense fallback={<div>Loading...</div>}>
  <ProductList products={products} />
</Suspense>
```

## PPR Overview

Let's stop for a second and talk about what just happened. By using `Suspense`, we are able start sending initial HTML to the client immediately, while the product data is still being fetched. This means that the user can see the static content (like the header) right away. Then the product list will be streamed in once it's ready. 

One important thing to note, though, is that **this still requires a full trip to the application server**. This isn't a fully static page that is stored on a CDN and is replicated around the world. This is where [Partial Prerendering](https://nextjs.org/docs/app/getting-started/partial-prerendering)(PPR) could help improve our performance. 

PPR allows the static part of your application to be served from a CDN, while still allowing dynamic data to be fetched on the server and streamed to the client. In this case, the markup for the page layout including the header will be served from the CDN, while the product data will still be fetched on the server and streamed to the client.

The beautiful thing is that this is all handled automatically by Next.js. You don't have to do anything special to enable PPR. Just use `Suspense` and `async/await` in your components, and Next.js will take care of the rest as long as you enable PPR in your `next.config.js` file:

```ts
import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  experimental: {
    ppr: 'incremental',
  },
}
 
export default nextConfig
```

You'll also need to mark your route to support experimental PPR.

```tsx
export const experimental_ppr = true
```

From now on, we will continue to focus on improving the developer experience of the `ProductList` component. All of the updates we will make will still be supported by PPR.

## Improving the Loading State UI

This works but it doesn't look great. Already included in the `ProductList` component is a `ProductListSkeleton` component that can be used as a fallback UI. Import and use that component to display a much nicer loading state.

```tsx
import { ProductList, ProductListSkeleton } from "@/vibes/soul/sections/product-list";
//...

<Suspense fallback={<ProductListSkeleton />}>
  <ProductList products={products} />
</Suspense>

//...
```

This looks a lot better, but there are two things we can improve from a developer experience point of view.  

- the `ProductList` component only works on the server since it depends on `async/await` for loading data
- the user has to manually wrap the `ProductList` component in `Suspense` (instead, we could handle that internally)

Let's start by addressing the first bullet point by updating the `ProductList` component use the new React function `use` instead of `async/await` This way, the user can use a client component if they want.

##  Update ProductList to Use `use`

To prove that the current implementation doesn't support client components, mark the root page component with the `'use client'` directive.

```tsx
'use client';
import { Product } from "@/vibes/soul/primitives/product-card";
import { ProductList, ProductListSkeleton } from "@/vibes/soul/sections/product-list";
import { Suspense } from "react";
//...
```

You will see the following error indicating that `ProductList` is an async Client Component, which is not allowed.

```bash
<ProductList> is an async Client Component. Only Server Components can be async at the moment. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server.
```

Thankfully, React provides a new function called `use` that allows us to use promises (pun intended 😜) in both Server and Client components. This function also integrates with `Suspense` so we will be able to maintain streaming and loading patterns.

Update the `ProductList` component to use the `use` function from React and remove the reference to `async/await`. This will allow it to work in both Server and Client components.

```tsx
//...other imports
import { use } from "react";

//...component code
const productsData = use(products);
//...
```
Now, if you try to run the app again, you will see that the `ProductList` component works in a Client Component without any issues.


## Accept Synchronous and Asynchronous Data

Right now, we are requiring the user of the  `ProductList` component to pass a promise for the `products` prop. However, it would be more flexible if we allowed the user to pass either synchronous data (an array of products) or asynchronous data (a promise that resolves to an array of products). To do this, update the `ProductListProps` interface to accept either a `Product[]` or a `Promise<Product[]>`.

```tsx
interface ProductListProps {
  products: Product[] | Promise<Product[]>;
  // other props...
}
```

Then, update the `ProductList` component to handle both cases. You can use the `use` function to resolve the promise if it is one, or use the data directly if not:

```tsx
const productsData = products instanceof Promise ? use(products) : products;
```
  
You can test that this works by passing both synchronous and asynchronous data to the `ProductList` component in the page component:

Asynchronous data:
```tsx
    const products = new Promise(res => setTimeout(() => res(defaultProducts), 2000)) as Promise<Product[]>;

    //...

    <ProductList products={products} colorScheme="dark" />
```

Synchronous data:
```tsx
<ProductList products={defaultProducts} colorScheme="dark" />
```

This adds more flexibility to the `ProductList` component, but it is a bit inconvenient to have to manually check if the `products` prop is a promise or not every time we use it. To improve this, we can create a type alias for `Streamable` data and an abstraction that handles the logic of checking if the data is a promise or not.


```tsx
export type Streamable<T> = T | Promise<T>;
```

Then, update the props interface to use this new type alias:

```tsx 
interface ProductListProps {
  products: Streamable<Product[]>;
  // other props...
}
```

This `Streamable` type can now be used throughout the codebase to represent data that can be either synchronous or asynchronous. Now we can address one of the previous painpoints which was the fact that the user has to manually wrap the `ProductList` component in a `Suspense` component. We can handle this internally by creating a wrapper component that will take care of the `Suspense` logic for us.


## Handle `Suspense` Internally

To simplify the developer experience for using the `ProductList` component, we can create a wrapper component that automatically handles the `Suspense` logic. Add the following wrapper component at the bottom of the `ProductList` component.

This wrapper accepts the same props as the `ProductList` component and wraps it in a `Suspense` component with a fallback of `ProductListSkeleton`. Make sure to add the appropriate import for `Suspense` as well.

```tsx
import { Suspense } from "react";
//...

export default function ProductListWrapper(props: ProductListProps) {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductList {...props}/>
    </Suspense>
  );
}
```

Then, you can update the page component to import and use this new wrapper instead of the `ProductList` component directly. 

```tsx
//...other imports
import ProductListWrapper from "@/vibes/soul/sections/product-list";


//...
<ProductListWrapper products={products} colorScheme="dark" />
```

We've now simplified the developer experience for the user of the component, but this still requires manual experience for the component author when creating new components. It all exposes an awkwardly named `ProductListWrapper` component instead of the more intuitive `ProductList`. Let's see if we can create an abstraction to make that more intuitive as well.

## Create A Replicable Experience for Internal Streaming Handling

Start by adding these two helper functions for appropriately handling synchronous and asynchronous data to the bottom of the `ProductList` component. These functions will help us determine if the data is a promise or not and handle the data appropriately.

```tsx
export function useStreamable<T>(streamable: Streamable<T>): T {
  return isPromise(streamable) ? use(streamable) : streamable;
}

function isPromise<T>(value: Streamable<T>): value is Promise<T> {
  return value instanceof Promise;
}
```

Now, we need something to help abstract away the process of wrapping async data loading components in `Suspense`. We can create a `Stream` component that abstracts the `Suspense` wrapping. Additionally, we can create a `UseStreamable` component that will accept a `Streamable` value and render its children with the resolved value (think Render Props). Add the following to the bottom of the `ProductList` component:

```tsx
function UseStreamable<T>({
  value,
  children,
}: {
  value: Streamable<T>;
  children: (value: T) => React.ReactNode;
}) {
  return children(useStreamable(value));
}

export function Stream<T>({
  value,
  fallback,
  children,
}: {
  value: Streamable<T>;
  fallback?: React.ReactNode;
  children: (value: T) => React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <UseStreamable value={value}>{children}</UseStreamable>
    </Suspense>
  );
}
```

Before using this abstraction, you'll need to remove the `ProductListWrapper` component you created earlier. Additionally, you'll need to update the page component to use `ProductList` component again instead of the `ProductListWrapper` component.


```tsx
import { Product } from "@/vibes/soul/primitives/product-card";
import { ProductList } from "@/vibes/soul/sections/product-list";


export default function Home() {

  const products = new Promise(res => setTimeout(() => res(defaultProducts), 2000)) as Promise<Product[]>;
  return (
    <div>
      <h1 className="text-white text-4xl text-center mb-20">My Products</h1>
        <ProductList products={products} colorScheme="dark" />
    </div>
  );
}
```

Then, use this abstraction internally in the `ProductList` component. The final result will look like this:

```tsx
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
```

Now, we have a clean abstraction that allows us to handle streaming of asynchronous data and loading states internally with no extra work necessary from the user. We also still allow the flexibility for the user to pass either synchronous or asynchronous data to the `ProductList` component.

## Tricky Performance Issue

Earlier, we created a `useStreamable` function that allows us to abstract the login for handling both synchronous and asynchronous data.

```tsx
export function useStreamable<T>(streamable: Streamable<T>): T {
  return isPromise(streamable) ? use(streamable) : streamable;
}
```

Let's explore a slightly different version of this that will lead to a pretty interesting performance issue. Instead of manually checking if `streamable` is a promise, we can use `Promise.resolve` to convert it to a promise if it isn't one already. Seemingly, this solution is a tiny bit simpler. Update the `useStreamable` function like so:

```tsx
export function useStreamable<T>(streamable: Streamable<T>): T {
  return use(Promise.resolve(streamable));
}
```

Make sure that your home page still includes the `use client` directive and refresh the page. Things should still work as expected. Now, instead of passing a promise to the `ProductList` component, pass the synchronous data directly:

```tsx
<ProductList products={defaultProducts} colorScheme="dark" />
```

You'll see you now get an error:

```bash
A component was suspended by an uncached promise. Creating promises inside a Client Component or hook is not yet supported, except via a Suspense-compatible library or framework.
```

The problem here is that `Promise.resolve` is creating a new promise from the synchronous data every time the component renders. This leads to an infinite loop of re-renders because the component.

To solve for this, we need to implement a caching strategy for promises. Basically, the first time we see a promise, we save it in the cache. Then, each time we reference a promise, we check the cache first. If it exists, we return the cached promise; if not, we create a new promise and save it in the cache.

In this simplified example, we can store our promise cache in a `map` like so:

```tsx
const promiseCache = new Map<string, Promise<unknown>>();
```

Then, we can update the `useStreamable` function to check the cache before creating a new promise:

```tsx
export function useStreamable<T>(streamable: Streamable<T>, key: string): T {
  if(!isPromise(streamable)) {
    return streamable;
  }

  if(!promiseCache.has(key)) {
    promiseCache.set(key, Promise.resolve(streamable));
  }
  return use(promiseCache.get(key) as Promise<T>);
}
```

Notice, `useStreamable` now accepts a `key` parameter. This key will be used to store and retrieve the promise from the cache. This also means we need to pass a key to `ProductList` component and on down to `useStreamable`. For now, we can prop drill this to get to the right place. Update `ProductListProps` to include a `queryKey` prop:

```tsx
interface ProductListProps {
  products: Streamable<Product[]>;
  queryKey: string;
  // other props...
}
```

Then, we'll need to pass the `queryKey` prop to the `Stream` component, then down to the `UseStreamable` component, and finally to the `useStreamable` function. The full code will look like this:

```tsx
import { clsx } from "clsx";

import {
  type Product,
  ProductCard,
  ProductCardSkeleton,
} from "@/vibes/soul/primitives/product-card";
import * as Skeleton from "@/vibes/soul/primitives/skeleton";
import { Suspense, use } from "react";

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
  queryKey: string;
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
  colorScheme = "light",
  aspectRatio = "5:6",
  emptyStateTitle = "No products found",
  emptyStateSubtitle = "Try browsing our complete catalog of products.",
  placeholderCount = 8,
  queryKey
}: ProductListProps) {
  return (
    <Stream value={products} fallback={<ProductListSkeleton />} queryKey={queryKey}>
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
export type Streamable<T> = T | Promise<T>;


export function useStreamable<T>(streamable: Streamable<T>, key: string): T {
  console.log("useStreamable", key);
  if(!isPromise(streamable)) {
    return streamable;
  }

  if(!promiseCache.has(key)) {
    console.log("first time using streamable", key);
    promiseCache.set(key, Promise.resolve(streamable));
  }
  return use(promiseCache.get(key) as Promise<T>);
}

function isPromise<T>(value: Streamable<T>): value is Promise<T> {
  return value instanceof Promise;
}

function UseStreamable<T>({
  value,
  children,
  queryKey
}: {
  value: Streamable<T>;
  children: (value: T) => React.ReactNode;
  queryKey: string;
}) {
  return children(useStreamable(value, queryKey));
}

export function Stream<T>({
  value,
  fallback,
  children,
  queryKey
}: {
  value: Streamable<T>;
  fallback?: React.ReactNode;
  children: (value: T) => React.ReactNode;
  queryKey: string;
}) {
  return (
    <Suspense fallback={fallback}>
      <UseStreamable value={value} queryKey={queryKey}>{children}</UseStreamable>
    </Suspense>
  );
}


const promiseCache = new Map<string, Promise<unknown>>();
```

Lastly, you'll need to pass the `queryKey` prop to the `ProductList` component in the page component.

```tsx
<ProductList products={defaultProducts} colorScheme="dark" queryKey="products-list"/>
```

Now each combination of asynchronous and synchronous data and server and client component should work.

## Final Example

You've done a lot of work that so far has been included directly in the `ProductList` component.

The next obvious step would be to move the streaming patterns into a separate utility file so that you can reuse it across different components. This will allow you to create a consistent developer experience for all components that need to handle streaming and loading states.

That said, there are still a few different details we didn't address. First is a more fully fleshed out setup for handling caching of promises. The second is how to handle streaming and promise caching for multiple promises being passed to a component.

Thankfully, the final example already with all of those details exists in this repo. You can find it in `src/vibes/soul/lib/streamable.tsx`.

## Wrap Up

Congratulations! You've now learned about how to build a copy and paste UI component that integrates with Next.js, data loading, and streaming!

Checkout out [VIBES](https://vibes.site/) to see how we use these patterns in a real-world set of components.

