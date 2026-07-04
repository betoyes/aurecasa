import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrder } from "@/lib/api";
import { brl } from "@/lib/utils-brl";
import { CheckCircle2, Package } from "lucide-react";

export default function Confirmation() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        getOrder(orderId).then(setOrder).catch(() => setOrder(null));
    }, [orderId]);

    if (!order) return <div className="pt-40 text-center container-aure">Carregando…</div>;

    const paymentLabel = { pix: "Pix", credit_card: "Cartão de crédito", boleto: "Boleto bancário" }[order.payment_method];

    return (
        <div className="pt-28 pb-24 fade-in" data-testid="confirmation-page">
            <div className="container-aure max-w-3xl">
                <div className="text-center mb-12">
                    <div className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--aure-bg-2)" }}>
                        <CheckCircle2 size={28} color="var(--aure-salvia)" />
                    </div>
                    <h1 className="font-serif text-4xl md:text-5xl mb-4" style={{ fontWeight: 400 }} data-testid="confirmation-headline">
                        Seu pedido encontrou um lugar na sua casa.
                    </h1>
                    <p style={{ color: "var(--aure-muted)" }}>
                        Pedido <b style={{ color: "var(--aure-ink)" }} data-testid="confirmation-order-number">{order.order_number}</b>
                    </p>
                </div>

                <div className="p-8" style={{ background: "var(--aure-bg-2)", borderRadius: 18 }}>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <div className="ui-label mb-2">Pagamento</div>
                            <div>{paymentLabel}</div>
                        </div>
                        <div>
                            <div className="ui-label mb-2">Status</div>
                            <div>{order.status}</div>
                        </div>
                        <div>
                            <div className="ui-label mb-2">Entrega</div>
                            <div className="text-sm" style={{ color: "var(--aure-muted)" }}>
                                {order.address.endereco}, {order.address.numero}<br />
                                {order.address.bairro} · {order.address.cidade} — {order.address.estado}<br />
                                CEP {order.address.cep}
                            </div>
                        </div>
                        <div>
                            <div className="ui-label mb-2">Prazo estimado</div>
                            <div className="text-sm" style={{ color: "var(--aure-muted)" }}>
                                <Package size={14} className="inline mr-1" /> Produção em até 5 dias úteis + envio
                            </div>
                        </div>
                    </div>

                    <div className="divider my-6" />

                    <div className="ui-label mb-4">Itens</div>
                    <ul className="space-y-3 mb-6">
                        {order.items.map((it) => (
                            <li key={`${it.product_id || it.name}::${it.color || ""}::${it.variant || ""}`} className="flex justify-between text-sm">
                                <span>{it.quantity}× {it.name} {it.color && <span style={{ color: "var(--aure-muted)" }}>· {it.color}</span>}</span>
                                <span>{brl(it.price * it.quantity)}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="divider my-4" />
                    <div className="flex justify-between items-baseline">
                        <span className="ui-label">Total pago</span>
                        <span className="font-serif text-3xl">{brl(order.total)}</span>
                    </div>
                </div>

                <div className="text-center mt-10">
                    <Link to="/colecoes" className="aure-btn-primary" data-testid="confirmation-continue">Continuar explorando a Auré</Link>
                </div>
            </div>
        </div>
    );
}
