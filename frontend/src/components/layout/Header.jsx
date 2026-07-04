import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { AnnouncementBar } from "./AnnouncementBar";

const NAV = [
    { to: "/novidades", label: "Novidades" },
    { to: "/colecoes", label: "Coleções" },
    { to: "/categoria/bancada-lavabo", label: "Bancada & Lavabo" },
    { to: "/categoria/organizacao", label: "Organização" },
    { to: "/categoria/mesa-receber", label: "Mesa & Receber" },
    { to: "/categoria/presentes", label: "Presentes" },
    { to: "/sobre", label: "Sobre a Auré" },
];

export const Header = () => {
    const { cart, wishlist, setMiniCartOpen } = useStore();
    const [searchOpen, setSearchOpen] = useState(false);
    const [q, setQ] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    const cartCount = cart.reduce((s, l) => s + l.quantity, 0);

    const submitSearch = (e) => {
        e.preventDefault();
        if (q.trim()) {
            navigate(`/busca?q=${encodeURIComponent(q.trim())}`);
            setSearchOpen(false);
            setQ("");
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <AnnouncementBar />
            <header
                style={{
                    background: "rgba(249, 248, 246, 0.92)",
                    backdropFilter: "blur(18px)",
                    borderBottom: "1px solid var(--aure-border)",
                }}
            >
                <div className="container-aure flex items-center justify-between py-5">
                    <button
                        className="lg:hidden"
                        onClick={() => setMobileOpen(true)}
                        data-testid="header-mobile-menu"
                        aria-label="Menu"
                    >
                        <Menu size={22} />
                    </button>

                    <Link
                        to="/"
                        className="font-serif text-2xl tracking-tight"
                        data-testid="header-logo"
                        style={{ color: "var(--aure-ink)" }}
                    >
                        Auré Casa
                    </Link>

                    <nav className="hidden lg:flex items-center gap-8">
                        {NAV.map((n) => (
                            <NavLink
                                key={n.to}
                                to={n.to}
                                data-testid={`nav-${n.to.split("/").pop()}`}
                                className={({ isActive }) =>
                                    `ui-label hover-underline transition-colors ${
                                        isActive ? "text-[color:var(--aure-terracota)]" : ""
                                    }`
                                }
                                style={{ color: "var(--aure-ink)" }}
                            >
                                {n.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-5" style={{ color: "var(--aure-ink)" }}>
                        <button
                            onClick={() => setSearchOpen((s) => !s)}
                            aria-label="Buscar"
                            data-testid="header-search-btn"
                        >
                            <Search size={19} />
                        </button>
                        <Link to="/conta" aria-label="Conta" data-testid="header-account-btn">
                            <User size={19} />
                        </Link>
                        <Link to="/favoritos" className="relative" aria-label="Favoritos" data-testid="header-wishlist-btn">
                            <Heart size={19} />
                            {wishlist.length > 0 && (
                                <span
                                    className="absolute -top-1 -right-2 text-[10px] rounded-full px-1"
                                    style={{ background: "var(--aure-terracota)", color: "#fff" }}
                                >
                                    {wishlist.length}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setMiniCartOpen(true)}
                            className="relative"
                            aria-label="Sacola"
                            data-testid="header-cart-btn"
                        >
                            <ShoppingBag size={19} />
                            {cartCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-2 text-[10px] rounded-full px-1"
                                    style={{ background: "var(--aure-ink)", color: "var(--aure-bg)" }}
                                >
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {searchOpen && (
                    <div style={{ borderTop: "1px solid var(--aure-border)" }} className="fade-in">
                        <form onSubmit={submitSearch} className="container-aure py-4 flex gap-3">
                            <input
                                autoFocus
                                className="aure-input"
                                placeholder="Buscar por peças, categorias, cores..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                data-testid="header-search-input"
                            />
                            <button type="submit" className="aure-btn-primary" data-testid="header-search-submit">
                                Buscar
                            </button>
                        </form>
                    </div>
                )}

                {mobileOpen && (
                    <div
                        className="fixed inset-0 z-50 lg:hidden"
                        style={{ background: "var(--aure-bg)" }}
                    >
                        <div className="container-aure py-6 flex justify-between items-center">
                            <span className="font-serif text-xl">Auré Casa</span>
                            <button onClick={() => setMobileOpen(false)} data-testid="mobile-menu-close">
                                <X size={22} />
                            </button>
                        </div>
                        <nav className="container-aure flex flex-col gap-6 mt-8">
                            {NAV.map((n) => (
                                <Link
                                    key={n.to}
                                    to={n.to}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-2xl font-serif"
                                    data-testid={`mobile-nav-${n.to.split("/").pop()}`}
                                >
                                    {n.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </header>
        </div>
    );
};
