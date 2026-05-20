import { products } from "@/lib/products";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { Header } from "@/components/Header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }));
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);

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

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  return (
    <ProductDetailClient product={product} relatedProducts={relatedProducts} />
  );
}
