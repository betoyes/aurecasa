import React from "react";
import { Link } from "react-router-dom";
import { brl } from "@/lib/utils-brl";
import { Heart } from "lucide-react";
import { useStore } from "@/lib/store";

export const ProductCard = ({ product, testIdPrefix = "product-card" }) => {
    const { toggleWishlist, inWishlist } = useStore();
    const liked = inWishlist(product.id);

    return (
        <div className="group flex flex-col gap-4" data-testid={`${testIdPrefix}-${product.slug}`}>
            <Link
                to={`/produto/${product.slug}`}
                className="block relative overflow-hidden"
                style={{
                    aspectRatio: "4 / 5",
                    background: "var(--aure-bg-2)",
                    borderRadius: 14,
                }}
            >
                <img
                    src={product.images?.[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                />
                {product.new && (
                    <span
                        className="absolute top-4 left-4 ui-label px-3 py-1"
                        style={{ background: "var(--aure-bg)", color: "var(--aure-ink)", borderRadius: 999 }}
                    >
                        Novidade
                    </span>
                )}
                <button
                    aria-label="Favoritar"
                    data-testid={`wishlist-toggle-${product.slug}`}
                    onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full transition"
                    style={{ background: "var(--aure-bg)" }}
                >
                    <Heart
                        size={16}
                        fill={liked ? "var(--aure-terracota)" : "none"}
                        color={liked ? "var(--aure-terracota)" : "var(--aure-ink)"}
                    />
                </button>
            </Link>
            <div className="flex flex-col gap-1">
                <Link
                    to={`/produto/${product.slug}`}
                    className="font-serif text-lg leading-tight hover:text-[color:var(--aure-terracota)] transition-colors"
                >
                    {product.name}
                </Link>
                <div className="flex items-baseline justify-between">
                    <span className="text-sm" style={{ color: "var(--aure-muted)" }}>
                        {product.category}
                    </span>
                    <span className="text-sm font-medium">{brl(product.price)}</span>
                </div>
                {product.colors?.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                        {product.colors.slice(0, 4).map((c) => (
                            <span
                                key={c}
                                title={c}
                                className="w-3 h-3 rounded-full"
                                style={{
                                    background: colorToHex(c),
                                    border: "1px solid var(--aure-border-dark)",
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const colorToHex = (name) => {
    const map = {
        Areia: "#D9C7B0",
        "Off-white": "#F1EBE0",
        "Verde Sálvia": "#9CA896",
        "Terracota Clara": "#D4A08A",
        Terracota: "#C88E77",
        "Café com Leite": "#B29985",
        Argila: "#B9836A",
        "Lavanda Suave": "#B3A5B8",
        "Rosa Queimado": "#B7746A",
        "Mostarda Suave": "#C9A76A",
        "Verde Oliva": "#8A8B62",
        Creme: "#EDE4D3",
    };
    return map[name] || "#C9BFB2";
};
