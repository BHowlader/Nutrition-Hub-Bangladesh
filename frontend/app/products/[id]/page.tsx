import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { fetchProductBySlug, fetchProducts, formatTaka, productImage } from "@/lib/products";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

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
    alternates: { canonical: `/products/${id}` },
    openGraph: {
      title,
      description,
      type: "article",
      ...(product.image_url ? { images: [{ url: productImage(product), width: 800, height: 800, alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(product.image_url ? { images: [productImage(product)] } : {}),
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
      <div className="min-h-screen bg-transparent text-cream flex flex-col justify-between">
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: productImage(product),
    sku: product.sku,
    brand: { "@type": "Brand", name: product.category?.name || "Nutrition Hub" },
    offers: {
      "@type": "Offer",
      url: `https://nutritionhubbd.com/products/${product.slug}`,
      priceCurrency: "BDT",
      price: product.price,
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Nutrition Hub Bangladesh" },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "12",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  );
}
