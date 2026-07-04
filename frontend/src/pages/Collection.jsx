import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getProducts, getCategories } from "@/lib/api";
import { ProductCard } from "@/components/product/ProductCard";

const CATEGORY_INTROS = {
    "bancada-lavabo": {
        title: "Bancada & Lavabo",
        intro: "Peças para o cuidado diário: bandejas, saboneteiras e composições que trazem calma às superfícies mais usadas da casa.",
    },
    organizacao: {
        title: "Organização",
        intro: "Objetos que reúnem o dia a dia com discrição — divisórias suaves, porta-utensílios e recipientes que compõem sem competir.",
    },
    "mesa-receber": {
        title: "Mesa & Receber",
        intro: "Detalhes para a mesa: bowls, porta-copos e acessórios pensados para encontros despretensiosos e memoráveis.",
    },
    presentes: {
        title: "Presentes",
        intro: "Uma seleção pensada para presentear: peças de presença, embalagem cuidadosa e uma escolha sensível.",
    },
    "objetos-decorativos": {
        title: "Objetos Decorativos",
        intro: "Vasos e cachepôs de presença tranquila. Objetos para compor estantes, aparadores e mesas laterais.",
    },
    novidades: {
        title: "Novidades",
        intro: "As chegadas mais recentes da Auré Casa — peças em novas cores e coleções.",
    },
    colecoes: {
        title: "Coleções",
        intro: "Toda a coleção Auré Casa: peças que unem forma, textura e função.",
    },
};

export default function Collection() {
    const { slug } = useParams();
    const currentSlug = slug || "colecoes";
    const info = CATEGORY_INTROS[currentSlug] || { title: "Coleção", intro: "" };

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        color: "",
        priceMax: 200,
        sort: "",
        availability: "",
    });
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const params = {};
        if (currentSlug === "novidades") params.new = true;
        else if (currentSlug === "presentes") params.featured = true;
        else if (currentSlug !== "colecoes") params.category = currentSlug;
        const q = searchParams.get("q");
        if (q) params.q = q;

        setLoading(true);
        getProducts(params).then((data) => {
            setProducts(data);
            setLoading(false);
        });
    }, [currentSlug, searchParams]);

    const filtered = useMemo(() => {
        let list = [...products];
        if (filters.color) list = list.filter((p) => p.colors?.includes(filters.color));
        if (filters.priceMax) list = list.filter((p) => p.price <= filters.priceMax);
        if (filters.availability === "novidades") list = list.filter((p) => p.new);
        if (filters.availability === "bestseller") list = list.filter((p) => p.bestseller);
        if (filters.sort === "price_asc") list.sort((a, b) => a.price - b.price);
        if (filters.sort === "price_desc") list.sort((a, b) => b.price - a.price);
        return list;
    }, [products, filters]);

    const allColors = useMemo(() => {
        const s = new Set();
        products.forEach((p) => p.colors?.forEach((c) => s.add(c)));
        return Array.from(s);
    }, [products]);

    return (
        <div className="pt-32 pb-24 fade-in" data-testid="collection-page">
            <div className="container-aure">
                {/* Header */}
                <div className="max-w-3xl mb-14">
                    <div className="ui-label mb-4">Coleção</div>
                    <h1 className="font-serif text-5xl md:text-6xl mb-6" style={{ fontWeight: 400 }} data-testid="collection-title">
                        {info.title}
                    </h1>
                    <p className="text-lg" style={{ color: "var(--aure-muted)" }}>{info.intro}</p>
                </div>

                <div className="grid lg:grid-cols-[240px_1fr] gap-10">
                    {/* Filters */}
                    <aside className="space-y-8" data-testid="collection-filters">
                        <div>
                            <div className="ui-label mb-4">Ordenar</div>
                            <select
                                className="aure-input"
                                value={filters.sort}
                                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                                data-testid="filter-sort"
                            >
                                <option value="">Padrão</option>
                                <option value="price_asc">Menor preço</option>
                                <option value="price_desc">Maior preço</option>
                            </select>
                        </div>

                        <div>
                            <div className="ui-label mb-4">Cor</div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilters({ ...filters, color: "" })}
                                    className="text-xs px-3 py-1 rounded-full"
                                    style={{
                                        border: "1px solid var(--aure-border-dark)",
                                        background: filters.color === "" ? "var(--aure-ink)" : "transparent",
                                        color: filters.color === "" ? "var(--aure-bg)" : "var(--aure-ink)",
                                    }}
                                    data-testid="filter-color-all"
                                >
                                    Todas
                                </button>
                                {allColors.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setFilters({ ...filters, color: c })}
                                        className="text-xs px-3 py-1 rounded-full"
                                        style={{
                                            border: "1px solid var(--aure-border-dark)",
                                            background: filters.color === c ? "var(--aure-ink)" : "transparent",
                                            color: filters.color === c ? "var(--aure-bg)" : "var(--aure-ink)",
                                        }}
                                        data-testid={`filter-color-${c}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="ui-label mb-4">Faixa de preço</div>
                            <input
                                type="range"
                                min={40}
                                max={200}
                                step={10}
                                value={filters.priceMax}
                                onChange={(e) => setFilters({ ...filters, priceMax: Number(e.target.value) })}
                                className="w-full"
                                data-testid="filter-price"
                            />
                            <div className="text-sm mt-2" style={{ color: "var(--aure-muted)" }}>Até R$ {filters.priceMax}</div>
                        </div>

                        <div>
                            <div className="ui-label mb-4">Disponibilidade</div>
                            <div className="flex flex-col gap-2 text-sm">
                                {[
                                    { v: "", l: "Todos" },
                                    { v: "novidades", l: "Novidades" },
                                    { v: "bestseller", l: "Mais vendidos" },
                                ].map((o) => (
                                    <label key={o.v} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="availability"
                                            checked={filters.availability === o.v}
                                            onChange={() => setFilters({ ...filters, availability: o.v })}
                                        />
                                        {o.l}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Grid */}
                    <div>
                        {loading ? (
                            <div style={{ color: "var(--aure-muted)" }}>Carregando…</div>
                        ) : filtered.length === 0 ? (
                            <div className="py-24 text-center" style={{ color: "var(--aure-muted)" }}>
                                Nenhuma peça encontrada com esses filtros.
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10" data-testid="collection-grid">
                                {filtered.map((p) => (
                                    <ProductCard key={p.id} product={p} testIdPrefix="collection-item" />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
