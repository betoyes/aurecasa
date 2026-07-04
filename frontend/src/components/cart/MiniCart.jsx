import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/utils-brl";
import { X, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";

const FREE_SHIPPING_THRESHOLD = 250;

export const MiniCart = () => {
    const {
        cart,
        subtotal,
        miniCartOpen,
        setMiniCartOpen,
        removeFromCart,
        updateQty,
    } = useStore();

    const missing = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    return (
        <Sheet open={miniCartOpen} onOpenChange={setMiniCartOpen}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md p-0 flex flex-col"
                style={{ background: "var(--aure-bg)" }}
                data-testid="mini-cart"
            >
                <SheetHeader className="px-6 py-5" style={{ borderBottom: "1px solid var(--aure-border)" }}>
                    <SheetTitle className="font-serif text-2xl">Sua sacola</SheetTitle>
                </SheetHeader>

                {subtotal > 0 && (
                    <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--aure-border)" }}>
                        {missing > 0 ? (
                            <div className="text-xs mb-2" style={{ color: "var(--aure-muted)" }}>
                                Faltam <b style={{ color: "var(--aure-ink)" }}>{brl(missing)}</b> para frete grátis
                            </div>
                        ) : (
                            <div className="text-xs mb-2" style={{ color: "var(--aure-salvia)" }}>
                                Você conquistou frete grátis
                            </div>
                        )}
                        <div style={{ height: 4, background: "var(--aure-bg-2)", borderRadius: 999 }}>
                            <div
                                style={{
                                    height: 4,
                                    width: `${pct}%`,
                                    background: "var(--aure-salvia)",
                                    borderRadius: 999,
                                    transition: "width 0.4s",
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {cart.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="font-serif text-xl mb-2">Sua sacola está vazia</p>
                            <p className="text-sm mb-6" style={{ color: "var(--aure-muted)" }}>
                                Descubra peças que compõem a casa com intenção.
                            </p>
                            <Link
                                to="/colecoes"
                                onClick={() => setMiniCartOpen(false)}
                                className="aure-btn-primary"
                                data-testid="mini-cart-explore"
                            >
                                Explorar coleção
                            </Link>
                        </div>
                    ) : (
                        <ul className="space-y-5">
                            {cart.map((line, i) => (
                                <li
                                    key={`${line.product_id}-${i}`}
                                    className="flex gap-4"
                                    data-testid={`mini-cart-line-${line.slug}`}
                                >
                                    <Link to={`/produto/${line.slug}`} onClick={() => setMiniCartOpen(false)}>
                                        <img
                                            src={line.image}
                                            alt={line.name}
                                            className="w-20 h-24 object-cover"
                                            style={{ borderRadius: 8 }}
                                        />
                                    </Link>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-serif text-base">{line.name}</div>
                                                {line.color && (
                                                    <div className="text-xs" style={{ color: "var(--aure-muted)" }}>
                                                        Cor: {line.color}
                                                    </div>
                                                )}
                                                {line.variant && (
                                                    <div className="text-xs" style={{ color: "var(--aure-muted)" }}>
                                                        {line.variant}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(i)}
                                                aria-label="Remover"
                                                data-testid={`mini-cart-remove-${i}`}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="mt-auto flex justify-between items-center">
                                            <div className="flex items-center gap-3" style={{ border: "1px solid var(--aure-border-dark)", borderRadius: 999, padding: "4px 10px" }}>
                                                <button onClick={() => updateQty(i, line.quantity - 1)} aria-label="-" data-testid={`mini-cart-dec-${i}`}>
                                                    <Minus size={12} />
                                                </button>
                                                <span className="text-sm w-4 text-center">{line.quantity}</span>
                                                <button onClick={() => updateQty(i, line.quantity + 1)} aria-label="+" data-testid={`mini-cart-inc-${i}`}>
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                            <div className="text-sm font-medium">{brl(line.price * line.quantity)}</div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="px-6 py-5" style={{ borderTop: "1px solid var(--aure-border)" }}>
                        <div className="flex justify-between mb-4">
                            <span className="ui-label">Subtotal</span>
                            <span className="font-medium">{brl(subtotal)}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Link
                                to="/checkout"
                                onClick={() => setMiniCartOpen(false)}
                                className="aure-btn-primary text-center justify-center"
                                data-testid="mini-cart-checkout"
                            >
                                Finalizar compra
                            </Link>
                            <Link
                                to="/carrinho"
                                onClick={() => setMiniCartOpen(false)}
                                className="aure-btn-ghost text-center"
                                data-testid="mini-cart-view-cart"
                            >
                                Ver sacola completa
                            </Link>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
