import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct, getProducts } from "@/lib/api";
import { brl, installments } from "@/lib/utils-brl";
import { useStore } from "@/lib/store";
import { colorToHex, ProductCard } from "@/components/product/ProductCard";
import { Heart, Minus, Plus, Star, Truck, Package, ShieldCheck } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function ProductDetail() {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [selectedImg, setSelectedImg] = useState(0);
    const [color, setColor] = useState("");
    const [variant, setVariant] = useState("");
    const [qty, setQty] = useState(1);
    const [related, setRelated] = useState([]);
    const { addToCart, toggleWishlist, inWishlist } = useStore();

    useEffect(() => {
        setSelectedImg(0);
        getProduct(slug).then((p) => {
            setProduct(p);
            setColor(p.colors?.[0] || "");
            setVariant(p.variants?.[0] || "");
        });
        getProducts({ category: "mesa-receber" }).then((all) => setRelated(all.slice(0, 4)));
    }, [slug]);

    // Cross-sell memoizado (evita recomputar filter/slice a cada render)
    const crossSell = useMemo(
        () => (product ? related.filter((p) => p.id !== product.id).slice(0, 4) : []),
        [related, product],
    );

    if (!product) return <div className="pt-40 text-center" style={{ color: "var(--aure-muted)" }}>Carregando…</div>;

    const inst = installments(product.price, 6);
    const liked = inWishlist(product.id);

    return (
        <div className="pt-28 pb-24 fade-in" data-testid="product-page">
            <div className="container-aure">
                <div className="text-xs mb-8" style={{ color: "var(--aure-muted)" }}>
                    <Link to="/" className="hover-underline">Início</Link>
                    <span className="mx-2">/</span>
                    <Link to={`/categoria/${product.category_slug}`} className="hover-underline">{product.category}</Link>
                    <span className="mx-2">/</span>
                    <span>{product.name}</span>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Gallery */}
                    <div>
                        {/* Desktop: single main image + thumbs */}
                        <div className="hidden md:block">
                            <div style={{ background: "var(--aure-bg-2)", borderRadius: 18, aspectRatio: "1", overflow: "hidden" }}>
                                <img
                                    src={product.images?.[selectedImg]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    data-testid="product-main-image"
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-3 mt-4">
                                {product.images?.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImg(i)}
                                        className="overflow-hidden"
                                        style={{
                                            borderRadius: 10,
                                            aspectRatio: "1",
                                            outline: selectedImg === i ? "1px solid var(--aure-ink)" : "none",
                                            outlineOffset: 2,
                                        }}
                                        data-testid={`product-thumb-${i}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Mobile: horizontal swipe gallery, first two visible */}
                        <div
                            className="md:hidden -mx-6 px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3"
                            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                            data-testid="product-mobile-gallery"
                        >
                            {product.images?.map((img, i) => (
                                <div
                                    key={i}
                                    className="flex-shrink-0 snap-start"
                                    style={{
                                        width: "82%",
                                        aspectRatio: "1",
                                        background: "var(--aure-bg-2)",
                                        borderRadius: 18,
                                        overflow: "hidden",
                                    }}
                                >
                                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div>
                        <div className="ui-label mb-3">{product.category}</div>
                        <h1 className="font-serif text-4xl md:text-5xl mb-3" style={{ fontWeight: 400 }} data-testid="product-title">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex" style={{ color: "var(--aure-terracota)" }}>
                                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} fill="currentColor" strokeWidth={0} />)}
                            </div>
                            <span className="text-sm" style={{ color: "var(--aure-muted)" }}>
                                ({product.reviews?.length || 0} avaliações)
                            </span>
                        </div>

                        <div className="mb-1">
                            <span className="text-3xl font-serif" data-testid="product-price">{brl(product.price)}</span>
                        </div>
                        <div className="text-sm mb-8" style={{ color: "var(--aure-muted)" }}>
                            ou em até {inst.months}x de {brl(inst.each)} sem juros
                        </div>

                        <p className="text-base leading-relaxed mb-8" style={{ color: "var(--aure-muted)" }}>
                            {product.description}
                        </p>

                        {product.important_note && (
                            <div className="mb-6 p-4 text-sm" style={{ background: "var(--aure-bg-2)", borderRadius: 10, color: "var(--aure-ink)" }}>
                                {product.important_note}
                            </div>
                        )}

                        {product.colors?.length > 0 && (
                            <div className="mb-6">
                                <div className="ui-label mb-3">Cor · {color}</div>
                                <div className="flex gap-3" data-testid="product-color-selector">
                                    {product.colors.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            title={c}
                                            className={`color-swatch ${color === c ? "active" : ""}`}
                                            style={{ background: colorToHex(c), width: 32, height: 32 }}
                                            data-testid={`product-color-${c}`}
                                            aria-label={c}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {product.variants?.length > 0 && (
                            <div className="mb-6">
                                <div className="ui-label mb-3">Variação</div>
                                <div className="flex gap-2 flex-wrap">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setVariant(v)}
                                            className="px-4 py-2 text-sm rounded-full"
                                            style={{
                                                border: "1px solid var(--aure-border-dark)",
                                                background: variant === v ? "var(--aure-ink)" : "transparent",
                                                color: variant === v ? "var(--aure-bg)" : "var(--aure-ink)",
                                            }}
                                            data-testid={`product-variant-${v}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center" style={{ border: "1px solid var(--aure-border-dark)", borderRadius: 999, padding: "8px 14px", gap: 12 }}>
                                <button onClick={() => setQty(Math.max(1, qty - 1))} data-testid="product-qty-dec"><Minus size={14} /></button>
                                <span className="w-4 text-center text-sm">{qty}</span>
                                <button onClick={() => setQty(qty + 1)} data-testid="product-qty-inc"><Plus size={14} /></button>
                            </div>
                            <div className="text-xs" style={{ color: "var(--aure-muted)" }}>
                                {product.stock_status}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 mb-8">
                            <button
                                className="aure-btn-primary flex-1 justify-center"
                                onClick={() => addToCart(product, { color, variant, quantity: qty })}
                                data-testid="product-add-to-cart"
                            >
                                Adicionar à sacola
                            </button>
                            <button
                                className="aure-btn-secondary"
                                onClick={() => toggleWishlist(product)}
                                data-testid="product-add-to-wishlist"
                            >
                                <Heart size={16} fill={liked ? "var(--aure-terracota)" : "none"} color={liked ? "var(--aure-terracota)" : "var(--aure-ink)"} />
                                {liked ? "Salvo" : "Favoritar"}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-10 text-xs" style={{ color: "var(--aure-muted)" }}>
                            <div className="flex flex-col items-start gap-2">
                                <Package size={16} /> {product.production_time}
                            </div>
                            <div className="flex flex-col items-start gap-2">
                                <Truck size={16} /> Envio para todo o Brasil
                            </div>
                            <div className="flex flex-col items-start gap-2">
                                <ShieldCheck size={16} /> Trocas em até 7 dias
                            </div>
                        </div>

                        <Accordion type="single" collapsible className="w-full" data-testid="product-accordion">
                            <AccordionItem value="desc">
                                <AccordionTrigger>Descrição</AccordionTrigger>
                                <AccordionContent style={{ color: "var(--aure-muted)" }}>
                                    {product.long_description || product.description}
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="dim">
                                <AccordionTrigger>Dimensões</AccordionTrigger>
                                <AccordionContent style={{ color: "var(--aure-muted)" }}>{product.dimensions}</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="mat">
                                <AccordionTrigger>Materiais e cuidados</AccordionTrigger>
                                <AccordionContent style={{ color: "var(--aure-muted)" }}>
                                    <div className="mb-2">{product.materials}</div>
                                    <div>{product.care}</div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="shp">
                                <AccordionTrigger>Envio</AccordionTrigger>
                                <AccordionContent style={{ color: "var(--aure-muted)" }}>{product.shipping_info}</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="faq">
                                <AccordionTrigger>Perguntas frequentes</AccordionTrigger>
                                <AccordionContent style={{ color: "var(--aure-muted)" }}>
                                    <p className="mb-2"><b>É feito sob demanda?</b> Sim, produzimos após a confirmação do pedido, em até 5 dias úteis.</p>
                                    <p className="mb-2"><b>Posso trocar?</b> Sim, aceitamos trocas em até 7 dias após o recebimento.</p>
                                    <p><b>Como é o envio?</b> Enviamos para todo o Brasil por transportadora ou Correios.</p>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>

                {/* Reviews */}
                {product.reviews?.length > 0 && (
                    <section className="mt-24">
                        <h2 className="font-serif text-3xl mb-8" style={{ fontWeight: 400 }}>Avaliações</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {product.reviews.map((r, i) => (
                                <div key={`${r.author}-${r.date}`} className="p-6" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }} data-testid={`review-${i}`}>
                                    <div className="flex" style={{ color: "var(--aure-terracota)" }}>
                                        {Array.from({ length: r.rating }).map((_, k) => <Star key={k} size={13} fill="currentColor" strokeWidth={0} />)}
                                    </div>
                                    <h3 className="font-serif text-lg mt-2 mb-2">{r.title}</h3>
                                    <p className="text-sm" style={{ color: "var(--aure-muted)" }}>{r.text}</p>
                                    <div className="text-xs mt-4" style={{ color: "var(--aure-muted)" }}>{r.author} · {r.date}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Cross-sell */}
                {related.length > 0 && (
                    <section className="mt-24">
                        <h2 className="font-serif text-3xl mb-8" style={{ fontWeight: 400 }}>Combina com</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                            {crossSell.map((p) => (
                                <ProductCard key={p.id} product={p} testIdPrefix="cross-sell" />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Sticky mobile add to cart */}
            <div className="fixed bottom-0 left-0 right-0 p-4 lg:hidden z-40" style={{ background: "var(--aure-bg)", borderTop: "1px solid var(--aure-border)" }}>
                <button
                    onClick={() => addToCart(product, { color, variant, quantity: qty })}
                    className="aure-btn-primary w-full justify-center"
                    data-testid="product-sticky-add"
                >
                    Adicionar à sacola · {brl(product.price * qty)}
                </button>
            </div>
        </div>
    );
}
