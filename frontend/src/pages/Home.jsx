import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryCard } from "@/components/product/CategoryCard";
import { subscribeNewsletter } from "@/lib/api";
import { toast } from "sonner";

const CAT_IMGS = {
    "bancada-lavabo": "https://images.unsplash.com/photo-1600566753051-6057a2f5c3d5?w=1400&q=85&auto=format",
    organizacao: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&q=85&auto=format",
    "mesa-receber": "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1400&q=85&auto=format",
    presentes: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=85&auto=format",
};

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [spotlight, setSpotlight] = useState(null);
    const [email, setEmail] = useState("");

    useEffect(() => {
        getProducts({ featured: true }).then((data) => {
            setFeatured(data.slice(0, 4));
            const bc = data.find((p) => p.slug === "bowl-casca");
            setSpotlight(bc || data[0]);
        });
    }, []);

    const submitNewsletter = async (e) => {
        e.preventDefault();
        try {
            await subscribeNewsletter(email);
            toast.success("Inscrição confirmada");
            setEmail("");
        } catch {
            toast.error("Tente novamente");
        }
    };

    return (
        <div className="fade-in" data-testid="home-page">
            {/* HERO */}
            <section className="relative overflow-hidden" style={{ minHeight: "90vh" }}>
                <img
                    src="https://images.unsplash.com/photo-1615529182904-14819c35db37?w=2000&q=85&auto=format"
                    alt="Interior contemporâneo com objetos Auré Casa"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(249,248,246,0.85) 0%, rgba(249,248,246,0.15) 60%)" }} />
                <div className="relative container-aure flex items-center" style={{ minHeight: "90vh", paddingTop: 120 }}>
                    <div className="max-w-2xl">
                        <div className="ui-label mb-6" data-testid="hero-eyebrow">Nova coleção · 2026</div>
                        <h1
                            className="font-serif leading-[1.05] mb-8"
                            style={{ fontSize: "clamp(2.75rem, 6vw, 5rem)", color: "var(--aure-ink)", fontWeight: 400 }}
                            data-testid="hero-headline"
                        >
                            Objetos para os detalhes que transformam a casa.
                        </h1>
                        <p className="text-lg mb-10 max-w-xl" style={{ color: "var(--aure-muted)" }}>
                            Pequenas peças para organizar, compor e tornar os espaços cotidianos mais seus.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/colecoes" className="aure-btn-primary" data-testid="hero-cta-primary">
                                Conheça a coleção
                            </Link>
                            <Link to="/novidades" className="aure-btn-secondary" data-testid="hero-cta-secondary">
                                Ver novidades
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section className="section-pad">
                <div className="container-aure">
                    <div className="flex justify-between items-end mb-12">
                        <h2 className="font-serif text-4xl md:text-5xl" style={{ fontWeight: 400 }}>
                            Categorias
                        </h2>
                        <Link to="/colecoes" className="aure-btn-ghost hidden md:inline-block">Ver todas</Link>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <CategoryCard title="Bancada & Lavabo" image={CAT_IMGS["bancada-lavabo"]} to="/categoria/bancada-lavabo" description="Cuidado diário" />
                        <CategoryCard title="Organização" image={CAT_IMGS["organizacao"]} to="/categoria/organizacao" description="Pequenos itens em ordem" />
                        <CategoryCard title="Mesa & Receber" image={CAT_IMGS["mesa-receber"]} to="/categoria/mesa-receber" description="Detalhes à mesa" />
                        <CategoryCard title="Presentes" image={CAT_IMGS["presentes"]} to="/categoria/presentes" description="Selecionados a dedo" />
                    </div>
                </div>
            </section>

            {/* FEATURED */}
            <section className="section-pad" style={{ background: "var(--aure-bg-2)" }}>
                <div className="container-aure">
                    <div className="max-w-2xl mb-16">
                        <div className="ui-label mb-4">Coleção em destaque</div>
                        <h2 className="font-serif text-4xl md:text-5xl mb-4" style={{ fontWeight: 400 }}>
                            Pequenos rituais, objetos com intenção.
                        </h2>
                        <p className="text-base" style={{ color: "var(--aure-muted)" }}>
                            Peças para a casa que unem forma, textura e função.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                        {featured.map((p) => (
                            <ProductCard key={p.id} product={p} testIdPrefix="home-featured" />
                        ))}
                    </div>
                </div>
            </section>

            {/* EDITORIAL BRAND BLOCK */}
            <section className="section-pad">
                <div className="container-aure grid md:grid-cols-2 gap-12 md:gap-24 items-center">
                    <div className="order-2 md:order-1">
                        <div className="ui-label mb-4">Design para a rotina</div>
                        <h2 className="font-serif text-4xl md:text-5xl mb-6 leading-tight" style={{ fontWeight: 400 }}>
                            Objetos que compõem a casa, dia a dia.
                        </h2>
                        <p className="text-base leading-relaxed mb-8" style={{ color: "var(--aure-muted)" }}>
                            Na Auré Casa, acreditamos que os pequenos objetos têm o poder de mudar a forma como vivemos os espaços. Criamos peças para organizar, receber, cuidar e deixar a casa mais leve.
                        </p>
                        <Link to="/sobre" className="aure-btn-secondary" data-testid="brand-block-cta">Conheça a Auré</Link>
                    </div>
                    <div className="order-1 md:order-2">
                        <img
                            src="https://images.pexels.com/photos/7303844/pexels-photo-7303844.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=900"
                            alt="Ambiente Auré Casa"
                            style={{ borderRadius: 18, aspectRatio: "4/5", objectFit: "cover", width: "100%" }}
                        />
                    </div>
                </div>
            </section>

            {/* SPOTLIGHT */}
            {spotlight && (
                <section className="section-pad" style={{ background: "var(--aure-bg-2)" }}>
                    <div className="container-aure grid md:grid-cols-2 gap-12 md:gap-24 items-center">
                        <div>
                            <img
                                src={spotlight.images?.[0]}
                                alt={spotlight.name}
                                style={{ borderRadius: 18, aspectRatio: "1", objectFit: "cover", width: "100%" }}
                            />
                        </div>
                        <div>
                            <div className="ui-label mb-4">Objeto em foco</div>
                            <h2 className="font-serif text-4xl md:text-5xl mb-4" style={{ fontWeight: 400 }}>
                                Um detalhe que puxa conversa.
                            </h2>
                            <p className="text-base mb-6" style={{ color: "var(--aure-muted)" }}>
                                {spotlight.description}
                            </p>
                            <Link to={`/produto/${spotlight.slug}`} className="aure-btn-primary" data-testid="spotlight-cta">
                                Conheça o {spotlight.name}
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* INSPIRATION */}
            <section className="section-pad">
                <div className="container-aure">
                    <div className="max-w-2xl mb-16">
                        <div className="ui-label mb-4">Inspiração</div>
                        <h2 className="font-serif text-4xl md:text-5xl" style={{ fontWeight: 400 }}>
                            Como a Auré vive na casa.
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: "No lavabo", img: "https://images.unsplash.com/photo-1600566753051-6057a2f5c3d5?w=1200&q=85&auto=format" },
                            { title: "Na bancada", img: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=85&auto=format" },
                            { title: "No home office", img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=85&auto=format" },
                        ].map((c) => (
                            <div key={c.title} className="relative overflow-hidden group" style={{ aspectRatio: "4/5", borderRadius: 18 }}>
                                <img src={c.img} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute bottom-6 left-6 font-serif text-2xl text-white">{c.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* NEWSLETTER */}
            <section className="section-pad" style={{ background: "var(--aure-ink)", color: "var(--aure-bg)" }}>
                <div className="container-aure text-center max-w-2xl mx-auto">
                    <div className="ui-label mb-6" style={{ color: "var(--aure-bg)", opacity: 0.7 }}>Newsletter</div>
                    <h2 className="font-serif text-4xl md:text-5xl mb-4" style={{ fontWeight: 400 }}>
                        Novidades para a sua casa.
                    </h2>
                    <p className="mb-8" style={{ opacity: 0.75 }}>
                        Receba lançamentos, cores novas e coleções em primeira mão.
                    </p>
                    <form onSubmit={submitNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" data-testid="home-newsletter-form">
                        <input
                            type="email"
                            required
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="aure-input"
                            style={{ color: "var(--aure-bg)", borderColor: "rgba(249,248,246,0.3)" }}
                            data-testid="home-newsletter-input"
                        />
                        <button type="submit" className="aure-btn-primary" style={{ background: "var(--aure-bg)", color: "var(--aure-ink)" }} data-testid="home-newsletter-submit">
                            Quero receber
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
