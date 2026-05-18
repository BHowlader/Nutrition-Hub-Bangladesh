import Link from "next/link";
import { ArrowLeft, Boxes, Edit3, Plus, Search, ShieldCheck } from "lucide-react";
import { formatTaka, products } from "@/lib/products";

export default function AdminProductsPage() {
  const stockTotal = products.reduce((total, product) => total + product.stock, 0);

  return (
    <main className="min-h-screen bg-[#eef0e8] text-ink">
      <section className="shell py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-2 font-black text-moss" href="/">
            <ArrowLeft size={18} />
            Storefront
          </Link>
          <button className="btn-primary">
            <Plus size={18} />
            Add product
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg bg-ink p-8 text-cream shadow-premium">
            <p className="eyebrow">CMS dashboard</p>
            <h1 className="heading-lg">Product management</h1>
            <p className="mt-5 text-cream/65">
              This admin shell is ready to connect to FastAPI endpoints for products,
              categories, stock, pricing, batch info, media, and publishing state.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Products", products.length],
              ["Units in stock", stockTotal],
              ["Low stock", products.filter((product) => product.stock < 35).length]
            ].map(([label, value]) => (
              <article className="rounded-lg border border-ink/10 bg-cream p-5 shadow-premium" key={label}>
                <Boxes className="mb-5 text-gold" size={24} />
                <strong className="block text-3xl font-black">{value}</strong>
                <span className="text-sm text-ink/60">{label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-ink/10 bg-cream p-5 shadow-premium">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Products</h2>
              <p className="text-sm text-ink/60">Manage CMS-ready catalog records.</p>
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-ink/10 bg-white px-4 text-sm text-ink/58">
              <Search size={16} />
              <span>Search products</span>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.14em] text-ink/50">
                  <th className="py-3">Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr className="border-b border-ink/8" key={product.id}>
                    <td className="py-4">
                      <strong className="block">{product.name}</strong>
                      <span className="text-sm text-ink/58">{product.description}</span>
                    </td>
                    <td>{product.category}</td>
                    <td className="font-black">{formatTaka(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-moss/10 px-2 py-1 text-xs font-black text-moss">
                        <ShieldCheck size={13} />
                        Published
                      </span>
                    </td>
                    <td>
                      <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-cream">
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
