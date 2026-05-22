import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { fetchProductBySlug, fetchProducts, formatTaka, productImage } from "@/lib/products";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { Header } from "@/components/Header";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductBySlug(id);

  if (!product) {
    return { title: "Product Not Found | Nutrition Hub Bangladesh" };
  }

  const title = `${product.name} | Nutrition Hub Bangladesh`;
  const description = product.description
    ? `${product.description.slice(0, 155)}${product.description.length > 155 ? "..." : ""}`
    : `Buy ${product.name} — ${formatTaka(product.price)} at Nutrition Hub Bangladesh. 100% authentic, delivered via Pathao.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(product.image_url ? { images: [{ url: productImage(product), alt: product.name }] } : {}),
    },
  };
}

export async function generateStaticParams() {
  const products = await fetchProducts({ limit: 200 });
  return products.map((product) => ({ id: product.slug }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetchProductBySlug(id);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#04060d] text-cream flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <h1 className="text-4xl font-black mb-4">Product Not Found</h1>
          <p className="text-cream/50 mb-8 max-w-md">The product you are looking for does not exist or has been removed from our catalog.</p>
          <Link href="/products" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-6 text-sm font-black text-ink hover:bg-champagne transition-all">
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        </main>
      </div>
    );
  }

  const all = product.category ? await fetchProducts({ category: product.category.name }) : [];
  const relatedProducts = all.filter((p) => p.id !== product.id).slice(0, 3);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
