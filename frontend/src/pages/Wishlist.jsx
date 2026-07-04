import React from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/utils-brl";
import { Heart, X } from "lucide-react";

export default function Wishlist() {
    const { wishlist, toggleWishlist, addToCart } = useStore();

    if (wishlist.length === 0) {
        return (
            <div className="pt-40 pb-40 text-center container-aure fade-in">
                <Heart size={28} className="mx-auto mb-4" color="var(--aure-terracota)" />
                <h1 className="font-serif text-5xl mb-4" style={{ fontWeight: 400 }}>Sua lista de favoritos está vazia</h1>
                <p className="mb-8" style={{ color: "var(--aure-muted)" }}>Salve suas peças preferidas para revisitar depois.</p>
                <Link to="/colecoes" className="aure-btn-primary">Explorar coleção</Link>
            </div>
        );
    }

    return (
        <div className="pt-28 pb-24 fade-in" data-testid="wishlist-page">
            <div className="container-aure">
                <h1 className="font-serif text-5xl mb-10" style={{ fontWeight: 400 }}>Favoritos</h1>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                    {wishlist.map((p) => (
                        <div key={p.id} className="flex flex-col gap-3" data-testid={`wishlist-item-${p.slug}`}>
                            <div className="relative overflow-hidden" style={{ aspectRatio: "4/5", borderRadius: 14, background: "var(--aure-bg-2)" }}>
                                <Link to={`/produto/${p.slug}`}>
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                </Link>
                                <button onClick={() => toggleWishlist({ id: p.id })} className="absolute top-3 right-3 p-2 rounded-full" style={{ background: "var(--aure-bg)" }}>
                                    <X size={14} />
                                </button>
                            </div>
                            <Link to={`/produto/${p.slug}`} className="font-serif text-lg">{p.name}</Link>
                            <div className="text-sm">{brl(p.price)}</div>
                            <button onClick={() => addToCart({ id: p.id, name: p.name, slug: p.slug, price: p.price, images: [p.image] })} className="aure-btn-secondary justify-center">Adicionar</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
