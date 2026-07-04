import React, { useEffect, useState } from "react";
import { adminStats, adminProducts, adminUpdateProduct, listOrders, updateOrder, adminNewsletter, adminContacts } from "@/lib/api";
import { brl } from "@/lib/utils-brl";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const ORDER_STATUSES = ["Pedido recebido", "Em produção", "Enviado", "Entregue"];
const TABS = ["Dashboard", "Pedidos", "Produtos", "Newsletter", "Contatos", "Configurações"];

export default function Admin() {
    const [tab, setTab] = useState("Dashboard");
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [newsletter, setNewsletter] = useState([]);
    const [contacts, setContacts] = useState([]);

    const load = async () => {
        try {
            const [s, o, p, n, c] = await Promise.all([adminStats(), listOrders(), adminProducts(), adminNewsletter(), adminContacts()]);
            setStats(s); setOrders(o); setProducts(p); setNewsletter(n); setContacts(c);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { load(); }, []);

    const changeStatus = async (id, status) => {
        try {
            await updateOrder(id, { status });
            toast.success("Status atualizado");
            load();
        } catch { toast.error("Erro"); }
    };

    const updateProductPrice = async (id, price) => {
        try {
            await adminUpdateProduct(id, { price: Number(price) });
            toast.success("Preço atualizado");
            load();
        } catch { toast.error("Erro"); }
    };

    return (
        <div className="pt-28 pb-24 fade-in" data-testid="admin-page" style={{ background: "var(--aure-bg)" }}>
            <div className="container-aure">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <div className="ui-label mb-2">Painel · Auré Casa</div>
                        <h1 className="font-serif text-5xl" style={{ fontWeight: 400 }}>Admin</h1>
                    </div>
                </div>

                <div className="flex gap-6 mb-10 overflow-x-auto" style={{ borderBottom: "1px solid var(--aure-border)" }}>
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="pb-3 ui-label"
                            style={{ borderBottom: tab === t ? "2px solid var(--aure-ink)" : "2px solid transparent", color: tab === t ? "var(--aure-ink)" : "var(--aure-muted)" }}
                            data-testid={`admin-tab-${t}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {tab === "Dashboard" && stats && (
                    <div>
                        <div className="grid md:grid-cols-4 gap-4 mb-10">
                            {[
                                { l: "Receita total", v: brl(stats.total_revenue) },
                                { l: "Pedidos", v: stats.total_orders },
                                { l: "Produtos", v: stats.total_products },
                                { l: "Newsletter", v: stats.newsletter_count },
                            ].map((c) => (
                                <div key={c.l} className="p-6" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }} data-testid={`admin-stat-${c.l}`}>
                                    <div className="ui-label mb-2">{c.l}</div>
                                    <div className="font-serif text-3xl">{c.v}</div>
                                </div>
                            ))}
                        </div>

                        <div className="p-8" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }}>
                            <div className="ui-label mb-4">Receita — últimos 7 dias</div>
                            <div style={{ height: 260 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats.chart}>
                                        <XAxis dataKey="day" tick={{ fill: "#8A7D72", fontSize: 12 }} axisLine={{ stroke: "#E6E4E0" }} />
                                        <YAxis tick={{ fill: "#8A7D72", fontSize: 12 }} axisLine={{ stroke: "#E6E4E0" }} />
                                        <Tooltip contentStyle={{ background: "#F9F8F6", border: "1px solid #E6E4E0", borderRadius: 8 }} />
                                        <Line type="monotone" dataKey="revenue" stroke="#9CA896" strokeWidth={2} dot={{ fill: "#C88E77", r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "Pedidos" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--aure-border)" }}>
                                    {["Pedido", "Cliente", "Total", "Método", "Status", "Ação"].map((h) => (
                                        <th key={h} className="text-left py-3 ui-label">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr key={o.id} style={{ borderBottom: "1px solid var(--aure-border)" }} data-testid={`admin-order-${o.order_number}`}>
                                        <td className="py-3">{o.order_number}</td>
                                        <td>{o.customer.nome}</td>
                                        <td>{brl(o.total)}</td>
                                        <td>{o.payment_method}</td>
                                        <td>{o.status}</td>
                                        <td>
                                            <select className="aure-input" value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                                                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && <tr><td colSpan={6} className="py-8 text-center" style={{ color: "var(--aure-muted)" }}>Nenhum pedido ainda</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === "Produtos" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {products.map((p) => (
                            <div key={p.id} className="p-4 flex gap-4" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }} data-testid={`admin-product-${p.slug}`}>
                                <img src={p.images?.[0]} alt="" className="w-24 h-28 object-cover" style={{ borderRadius: 8 }} />
                                <div className="flex-1">
                                    <div className="font-serif text-xl">{p.name}</div>
                                    <div className="text-xs mb-2" style={{ color: "var(--aure-muted)" }}>{p.category}</div>
                                    <label className="ui-label">Preço</label>
                                    <input
                                        type="number"
                                        defaultValue={p.price}
                                        className="aure-input mt-1"
                                        onBlur={(e) => updateProductPrice(p.id, e.target.value)}
                                        data-testid={`admin-product-price-${p.slug}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "Newsletter" && (
                    <div>
                        <p className="ui-label mb-4">{newsletter.length} inscritos</p>
                        <ul className="divide-y" style={{ borderTop: "1px solid var(--aure-border)" }}>
                            {newsletter.map((n) => (
                                <li key={n.id} className="py-3 flex justify-between text-sm">
                                    <span>{n.email}</span>
                                    <span style={{ color: "var(--aure-muted)" }}>{new Date(n.created_at).toLocaleDateString("pt-BR")}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {tab === "Contatos" && (
                    <div className="space-y-4">
                        {contacts.map((c) => (
                            <div key={c.id} className="p-5" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }}>
                                <div className="flex justify-between items-baseline mb-2">
                                    <div className="font-serif text-lg">{c.name}</div>
                                    <div className="text-xs" style={{ color: "var(--aure-muted)" }}>{new Date(c.created_at).toLocaleString("pt-BR")}</div>
                                </div>
                                <div className="text-sm mb-2">{c.email} · {c.subject}</div>
                                <p className="text-sm" style={{ color: "var(--aure-muted)" }}>{c.message}</p>
                            </div>
                        ))}
                        {contacts.length === 0 && <p style={{ color: "var(--aure-muted)" }}>Sem mensagens.</p>}
                    </div>
                )}

                {tab === "Configurações" && (
                    <div className="max-w-2xl space-y-6">
                        <div className="p-6" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }}>
                            <div className="font-serif text-xl mb-2">Pagamentos</div>
                            <p className="text-sm mb-2" style={{ color: "var(--aure-muted)" }}>
                                Configure Mercado Pago ou Pagar.me via variáveis de ambiente:
                            </p>
                            <ul className="text-xs font-mono" style={{ color: "var(--aure-muted)" }}>
                                <li>PAYMENT_PROVIDER=mercadopago | pagarme</li>
                                <li>MERCADO_PAGO_ACCESS_TOKEN=...</li>
                                <li>PAGARME_API_KEY=...</li>
                                <li>WEBHOOK_SECRET=...</li>
                            </ul>
                        </div>
                        <div className="p-6" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }}>
                            <div className="font-serif text-xl mb-2">E-mails (Resend)</div>
                            <p className="text-sm mb-2" style={{ color: "var(--aure-muted)" }}>Variáveis:</p>
                            <ul className="text-xs font-mono" style={{ color: "var(--aure-muted)" }}>
                                <li>RESEND_API_KEY=re_...</li>
                                <li>EMAIL_FROM=onboarding@resend.dev</li>
                                <li>EMAIL_OWNER=admin@aurecasa.com.br</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
