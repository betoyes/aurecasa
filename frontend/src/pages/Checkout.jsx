import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { brl, formatCEP, formatCPF, formatPhone, formatCardNumber, installments } from "@/lib/utils-brl";
import { checkCEP, createOrder } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { QrCode, Copy, CheckCircle2 } from "lucide-react";

const STEPS = ["Identificação", "Entrega", "Pagamento", "Confirmação"];

export default function Checkout() {
    const { cart, subtotal, clearCart } = useStore();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState({ nome: "", cpf: "", email: "", celular: "" });
    const [address, setAddress] = useState({ cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" });
    const [payment, setPayment] = useState({ method: "pix", card_number: "", card_name: "", card_expiry: "", card_cvv: "", installments: 1 });
    const [shippingCost, setShippingCost] = useState(0);

    const total = subtotal + shippingCost;

    if (cart.length === 0 && step < 3) {
        return <div className="pt-40 text-center container-aure">Sacola vazia. <a href="/colecoes" className="hover-underline">Voltar para a loja</a>.</div>;
    }

    const lookupCEP = async () => {
        try {
            const r = await checkCEP(address.cep);
            setAddress((a) => ({ ...a, endereco: r.endereco, bairro: r.bairro, cidade: r.cidade, estado: r.estado }));
            setShippingCost(subtotal >= 250 ? 0 : r.shipping_cost);
            toast.success("Endereço encontrado");
        } catch (e) {
            toast.error(e.response?.data?.detail || "CEP inválido");
        }
    };

    const submit = async () => {
        setLoading(true);
        try {
            const order = await createOrder({
                customer,
                address,
                items: cart.map((l) => ({
                    product_id: l.product_id,
                    name: l.name,
                    color: l.color,
                    variant: l.variant,
                    quantity: l.quantity,
                    price: l.price,
                })),
                subtotal,
                shipping: shippingCost,
                discount: 0,
                total,
                payment_method: payment.method,
                installments: payment.installments,
            });
            clearCart();
            navigate(`/pedido/${order.order_number}`);
        } catch {
            toast.error("Erro ao criar pedido");
        } finally {
            setLoading(false);
        }
    };

    const canNext = () => {
        if (step === 0) return customer.nome && customer.cpf && customer.email && customer.celular;
        if (step === 1) return address.cep && address.endereco && address.numero && address.cidade && address.estado;
        return true;
    };

    return (
        <div className="pt-28 pb-24 fade-in" data-testid="checkout-page">
            <div className="container-aure max-w-6xl">
                <h1 className="font-serif text-5xl mb-8" style={{ fontWeight: 400 }}>Finalizar compra</h1>

                <div className="flex gap-4 mb-10 overflow-x-auto">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: i <= step ? "var(--aure-ink)" : "var(--aure-bg-2)", color: i <= step ? "var(--aure-bg)" : "var(--aure-muted)" }}>
                                {i + 1}
                            </div>
                            <span className="ui-label" style={{ color: i === step ? "var(--aure-ink)" : "var(--aure-muted)" }}>{s}</span>
                            {i < STEPS.length - 1 && <div style={{ width: 40, height: 1, background: "var(--aure-border)" }} />}
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-[1fr_360px] gap-12">
                    <div>
                        {step === 0 && (
                            <div className="space-y-4" data-testid="checkout-step-identification">
                                <h2 className="font-serif text-2xl mb-4" style={{ fontWeight: 400 }}>Identificação</h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input className="aure-input" placeholder="Nome completo" value={customer.nome} onChange={(e) => setCustomer({ ...customer, nome: e.target.value })} data-testid="checkout-nome" />
                                    <input className="aure-input" placeholder="CPF" value={customer.cpf} onChange={(e) => setCustomer({ ...customer, cpf: formatCPF(e.target.value) })} data-testid="checkout-cpf" />
                                    <input className="aure-input" placeholder="E-mail" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} data-testid="checkout-email" />
                                    <input className="aure-input" placeholder="Celular" value={customer.celular} onChange={(e) => setCustomer({ ...customer, celular: formatPhone(e.target.value) })} data-testid="checkout-celular" />
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-4" data-testid="checkout-step-shipping">
                                <h2 className="font-serif text-2xl mb-4" style={{ fontWeight: 400 }}>Entrega</h2>
                                <div className="flex gap-3">
                                    <input className="aure-input" placeholder="CEP" value={address.cep} onChange={(e) => setAddress({ ...address, cep: formatCEP(e.target.value) })} data-testid="checkout-cep" />
                                    <button onClick={lookupCEP} className="aure-btn-secondary" style={{ padding: "12px 20px" }} data-testid="checkout-cep-lookup">Buscar</button>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <input className="aure-input md:col-span-2" placeholder="Endereço" value={address.endereco} onChange={(e) => setAddress({ ...address, endereco: e.target.value })} data-testid="checkout-endereco" />
                                    <input className="aure-input" placeholder="Número" value={address.numero} onChange={(e) => setAddress({ ...address, numero: e.target.value })} data-testid="checkout-numero" />
                                    <input className="aure-input" placeholder="Complemento" value={address.complemento} onChange={(e) => setAddress({ ...address, complemento: e.target.value })} />
                                    <input className="aure-input" placeholder="Bairro" value={address.bairro} onChange={(e) => setAddress({ ...address, bairro: e.target.value })} />
                                    <input className="aure-input" placeholder="Cidade" value={address.cidade} onChange={(e) => setAddress({ ...address, cidade: e.target.value })} data-testid="checkout-cidade" />
                                    <input className="aure-input" placeholder="Estado (UF)" maxLength={2} value={address.estado} onChange={(e) => setAddress({ ...address, estado: e.target.value.toUpperCase() })} data-testid="checkout-estado" />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4" data-testid="checkout-step-payment">
                                <h2 className="font-serif text-2xl mb-4" style={{ fontWeight: 400 }}>Pagamento</h2>
                                <div className="mb-4 p-3 text-xs" style={{ background: "var(--aure-bg-2)", borderRadius: 8, color: "var(--aure-muted)" }}>
                                    Este checkout está em modo demo. Configure Mercado Pago ou Pagar.me nas variáveis de ambiente para produção.
                                </div>
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[{ v: "pix", l: "Pix" }, { v: "credit_card", l: "Cartão" }, { v: "boleto", l: "Boleto" }].map((o) => (
                                        <button
                                            key={o.v}
                                            onClick={() => setPayment({ ...payment, method: o.v })}
                                            className="px-4 py-3 rounded-full text-sm"
                                            style={{
                                                border: "1px solid var(--aure-border-dark)",
                                                background: payment.method === o.v ? "var(--aure-ink)" : "transparent",
                                                color: payment.method === o.v ? "var(--aure-bg)" : "var(--aure-ink)",
                                            }}
                                            data-testid={`checkout-payment-${o.v}`}
                                        >
                                            {o.l}
                                        </button>
                                    ))}
                                </div>

                                {payment.method === "pix" && (
                                    <div style={{ background: "var(--aure-bg-2)", borderRadius: 14, padding: 24 }}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <QrCode size={20} />
                                            <span className="ui-label">Pix · demonstração</span>
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div style={{ width: 180, height: 180, background: "#fff", borderRadius: 8, display: "grid", placeItems: "center", padding: 12 }}>
                                                <svg width="150" height="150" viewBox="0 0 150 150">
                                                    {Array.from({ length: 20 }).map((_, r) =>
                                                        Array.from({ length: 20 }).map((_, c) => {
                                                            const on = (r * c + r + c) % 3 === 0;
                                                            return on ? <rect key={`${r}-${c}`} x={c * 7} y={r * 7} width="6" height="6" fill="#2C2825" /> : null;
                                                        }),
                                                    )}
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm mb-3" style={{ color: "var(--aure-muted)" }}>
                                                    Escaneie o QR ou copie o código para pagar.
                                                </p>
                                                <div className="flex gap-2 mb-4">
                                                    <input className="aure-input" readOnly value="00020126aureecasa5204000053039865802BR6009SAO PAULO6304DEMO" />
                                                    <button className="aure-btn-secondary" style={{ padding: "10px 14px" }} onClick={() => toast("Código copiado")} data-testid="checkout-pix-copy"><Copy size={14} /></button>
                                                </div>
                                                <div className="text-xs" style={{ color: "var(--aure-terracota)" }}>Expira em 30 min · demonstração</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {payment.method === "credit_card" && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <input className="aure-input md:col-span-2" placeholder="Número do cartão" value={payment.card_number} onChange={(e) => setPayment({ ...payment, card_number: formatCardNumber(e.target.value) })} data-testid="checkout-card-number" />
                                        <input className="aure-input md:col-span-2" placeholder="Nome impresso no cartão" value={payment.card_name} onChange={(e) => setPayment({ ...payment, card_name: e.target.value.toUpperCase() })} />
                                        <input className="aure-input" placeholder="Validade MM/AA" value={payment.card_expiry} onChange={(e) => setPayment({ ...payment, card_expiry: e.target.value })} />
                                        <input className="aure-input" placeholder="CVV" value={payment.card_cvv} onChange={(e) => setPayment({ ...payment, card_cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                                        <select className="aure-input md:col-span-2" value={payment.installments} onChange={(e) => setPayment({ ...payment, installments: Number(e.target.value) })} data-testid="checkout-installments">
                                            {[1, 2, 3, 4, 5, 6].map((n) => {
                                                const inst = installments(total, n);
                                                return <option key={n} value={n}>{n}x de {brl(inst.each)} sem juros — Total: {brl(total)}</option>;
                                            })}
                                        </select>
                                    </div>
                                )}

                                {payment.method === "boleto" && (
                                    <div className="p-6" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }}>
                                        <p className="text-sm mb-2">O boleto será gerado após a confirmação e enviado por e-mail.</p>
                                        <p className="text-xs" style={{ color: "var(--aure-muted)" }}>Prazo de compensação: 1 a 2 dias úteis · demonstração.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between mt-10">
                            <button onClick={() => setStep(Math.max(0, step - 1))} className="aure-btn-ghost" disabled={step === 0} data-testid="checkout-back">Voltar</button>
                            {step < 2 ? (
                                <button onClick={() => setStep(step + 1)} className="aure-btn-primary" disabled={!canNext()} data-testid="checkout-next">Continuar</button>
                            ) : (
                                <button onClick={submit} className="aure-btn-primary" disabled={loading} data-testid="checkout-submit">
                                    {loading ? "Processando..." : "Confirmar pedido"}
                                </button>
                            )}
                        </div>
                    </div>

                    <aside style={{ background: "var(--aure-bg-2)", borderRadius: 18, padding: 24, height: "fit-content" }}>
                        <h3 className="font-serif text-xl mb-4" style={{ fontWeight: 400 }}>Seu pedido</h3>
                        <ul className="space-y-3 mb-4 text-sm">
                            {cart.map((l, i) => (
                                <li key={i} className="flex justify-between gap-4">
                                    <span>{l.quantity}× {l.name} {l.color && <span style={{ color: "var(--aure-muted)" }}>· {l.color}</span>}</span>
                                    <span>{brl(l.price * l.quantity)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="divider my-4" />
                        <div className="text-sm space-y-2" style={{ color: "var(--aure-muted)" }}>
                            <div className="flex justify-between"><span>Subtotal</span><span style={{ color: "var(--aure-ink)" }}>{brl(subtotal)}</span></div>
                            <div className="flex justify-between"><span>Frete</span><span style={{ color: "var(--aure-ink)" }}>{shippingCost === 0 ? "A calcular" : brl(shippingCost)}</span></div>
                        </div>
                        <div className="divider my-4" />
                        <div className="flex justify-between items-baseline">
                            <span className="ui-label">Total</span>
                            <span className="font-serif text-2xl">{brl(total)}</span>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
