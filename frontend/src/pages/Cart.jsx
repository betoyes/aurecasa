import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/utils-brl";
import { Link } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";
import { validateCoupon, checkCEP } from "@/lib/api";
import { toast } from "sonner";
import { formatCEP } from "@/lib/utils-brl";

const FREE = 250;

export default function Cart() {
    const { cart, subtotal, updateQty, removeFromCart } = useStore();
    const [coupon, setCoupon] = useState("");
    const [discount, setDiscount] = useState(0);
    const [freeShipping, setFreeShipping] = useState(false);
    const [cep, setCep] = useState("");
    const [shippingInfo, setShippingInfo] = useState(null);

    const apply = async () => {
        try {
            const r = await validateCoupon(coupon, subtotal);
            setDiscount(r.discount);
            setFreeShipping(r.free_shipping);
            toast.success("Cupom aplicado", { description: r.description });
        } catch (e) {
            toast.error(e.response?.data?.detail || "Cupom inválido");
        }
    };

    const checkShipping = async () => {
        try {
            const r = await checkCEP(cep);
            setShippingInfo(r);
        } catch (e) {
            toast.error(e.response?.data?.detail || "CEP inválido");
        }
    };

    const shipping = subtotal >= FREE || freeShipping ? 0 : shippingInfo?.shipping_cost || 0;
    const total = Math.max(0, subtotal - discount) + shipping;

    if (cart.length === 0) {
        return (
            <div className="pt-40 pb-40 text-center container-aure fade-in">
                <h1 className="font-serif text-5xl mb-4" style={{ fontWeight: 400 }}>Sua sacola está vazia</h1>
                <p className="mb-8" style={{ color: "var(--aure-muted)" }}>Descubra peças que compõem a casa com intenção.</p>
                <Link to="/colecoes" className="aure-btn-primary">Explorar coleção</Link>
            </div>
        );
    }

    return (
        <div className="pt-28 pb-24 fade-in" data-testid="cart-page">
            <div className="container-aure">
                <h1 className="font-serif text-5xl mb-10" style={{ fontWeight: 400 }}>Sacola</h1>
                <div className="grid lg:grid-cols-[1fr_400px] gap-12">
                    <div>
                        <ul className="space-y-6">
                            {cart.map((line, i) => (
                                <li key={i} className="flex gap-6 pb-6" style={{ borderBottom: "1px solid var(--aure-border)" }} data-testid={`cart-line-${i}`}>
                                    <img src={line.image} alt={line.name} className="w-28 h-32 object-cover" style={{ borderRadius: 10 }} />
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between">
                                            <div>
                                                <div className="font-serif text-xl">{line.name}</div>
                                                {line.color && <div className="text-xs mt-1" style={{ color: "var(--aure-muted)" }}>Cor: {line.color}</div>}
                                                {line.variant && <div className="text-xs" style={{ color: "var(--aure-muted)" }}>{line.variant}</div>}
                                            </div>
                                            <button onClick={() => removeFromCart(i)} data-testid={`cart-remove-${i}`}><X size={18} /></button>
                                        </div>
                                        <div className="mt-auto flex items-center justify-between">
                                            <div className="flex items-center" style={{ border: "1px solid var(--aure-border-dark)", borderRadius: 999, padding: "6px 12px", gap: 12 }}>
                                                <button onClick={() => updateQty(i, line.quantity - 1)}><Minus size={12} /></button>
                                                <span className="w-4 text-center text-sm">{line.quantity}</span>
                                                <button onClick={() => updateQty(i, line.quantity + 1)}><Plus size={12} /></button>
                                            </div>
                                            <div className="text-base font-medium">{brl(line.price * line.quantity)}</div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <aside style={{ background: "var(--aure-bg-2)", borderRadius: 18, padding: 28, height: "fit-content" }}>
                        <h2 className="font-serif text-2xl mb-6" style={{ fontWeight: 400 }}>Resumo</h2>

                        <div className="mb-6">
                            <div className="ui-label mb-2">Cupom de desconto</div>
                            <div className="flex gap-2">
                                <input className="aure-input" placeholder="BEMVINDO10" value={coupon} onChange={(e) => setCoupon(e.target.value)} data-testid="cart-coupon-input" />
                                <button onClick={apply} className="aure-btn-secondary" style={{ padding: "10px 16px" }} data-testid="cart-coupon-apply">Aplicar</button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="ui-label mb-2">Calcular frete</div>
                            <div className="flex gap-2">
                                <input className="aure-input" placeholder="00000-000" value={cep} onChange={(e) => setCep(formatCEP(e.target.value))} data-testid="cart-cep-input" />
                                <button onClick={checkShipping} className="aure-btn-secondary" style={{ padding: "10px 16px" }} data-testid="cart-cep-check">Calcular</button>
                            </div>
                            {shippingInfo && (
                                <div className="text-xs mt-2" style={{ color: "var(--aure-muted)" }}>
                                    {shippingInfo.cidade} — {shippingInfo.estado} · {brl(shippingInfo.shipping_cost)} · {shippingInfo.delivery_estimate}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 text-sm" style={{ color: "var(--aure-muted)" }}>
                            <div className="flex justify-between"><span>Subtotal</span><span style={{ color: "var(--aure-ink)" }}>{brl(subtotal)}</span></div>
                            {discount > 0 && <div className="flex justify-between"><span>Cupom</span><span style={{ color: "var(--aure-salvia)" }}>-{brl(discount)}</span></div>}
                            <div className="flex justify-between"><span>Frete</span><span style={{ color: "var(--aure-ink)" }}>{shipping === 0 ? "Grátis" : brl(shipping)}</span></div>
                            {subtotal < FREE && !freeShipping && (
                                <div className="text-xs" style={{ color: "var(--aure-terracota)" }}>Faltam {brl(FREE - subtotal)} para frete grátis</div>
                            )}
                        </div>

                        <div className="divider my-5" />
                        <div className="flex justify-between items-baseline mb-6">
                            <span className="ui-label">Total</span>
                            <span className="font-serif text-3xl" data-testid="cart-total">{brl(total)}</span>
                        </div>

                        <Link to="/checkout" className="aure-btn-primary w-full justify-center" data-testid="cart-checkout">Finalizar compra</Link>
                    </aside>
                </div>
            </div>
        </div>
    );
}
