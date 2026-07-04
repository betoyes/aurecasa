import React, { useEffect, useState } from "react";
import { adminStats, adminProducts, listOrders, adminNewsletter, adminContacts } from "@/lib/api";
import { adminUpdateOrder, adminVerify, clearToken, getToken } from "@/lib/adminApi";
import { brl } from "@/lib/utils-brl";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import AdminProducts from "@/pages/AdminProducts";
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
    const [tracking, setTracking] = useState({});
    const [authed, setAuthed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!getToken()) { navigate("/admin/login"); return; }
        adminVerify().then(() => setAuthed(true)).catch(() => { clearToken(); navigate("/admin/login"); });
    }, [navigate]);

    const load = async () => {
        try {
            const [s, o, p, n, c] = await Promise.all([adminStats(), listOrders(), adminProducts(), adminNewsletter(), adminContacts()]);
            setStats(s); setOrders(o); setProducts(p); setNewsletter(n); setContacts(c);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { if (authed) load(); }, [authed]);

    const changeStatus = async (id, status) => {
        try { await adminUpdateOrder(id, { status }); toast.success("Status atualizado (e-mail enviado se Resend configurado)"); load(); }
        catch { toast.error("Erro"); }
    };

    const saveTracking = async (id) => {
        try { await adminUpdateOrder(id, { tracking_code: tracking[id] || "" }); toast.success("Rastreio salvo"); load(); }
        catch { toast.error("Erro"); }
    };

    const logout = () => { clearToken(); navigate("/admin/login"); };

    if (!authed) return <div className="pt-40 text-center" style={{ color: "var(--aure-muted)" }}>Verificando…</div>;

    return (
        <div className="pt-28 pb-24 fade-in" data-testid="admin-page" style={{ background: "var(--aure-bg)" }}>
            <div className="container-aure">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <div className="ui-label mb-2">Painel · Auré Casa</div>
                        <h1 className="font-serif text-5xl" style={{ fontWeight: 400 }}>Admin</h1>
                    </div>
                    <button onClick={logout} className="aure-btn-ghost flex items-center gap-2" data-testid="admin-logout"><LogOut size={14} /> Sair</button>
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
                    <div className="space-y-4">
                        {orders.map((o) => (
                            <div key={o.id} className="p-5" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }} data-testid={`admin-order-${o.order_number}`}>
                                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                                    <div>
                                        <div className="font-serif text-xl">{o.order_number}</div>
                                        <div className="text-xs" style={{ color: "var(--aure-muted)" }}>{new Date(o.created_at).toLocaleString("pt-BR")} · {o.payment_method}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-serif text-2xl">{brl(o.total)}</div>
                                        <div className="text-xs" style={{ color: "var(--aure-muted)" }}>{o.status}</div>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                                    <div>
                                        <div className="ui-label mb-1">Cliente</div>
                                        <div>{o.customer.nome} · {o.customer.email} · {o.customer.celular}</div>
                                    </div>
                                    <div>
                                        <div className="ui-label mb-1">Endereço</div>
                                        <div style={{ color: "var(--aure-muted)" }}>{o.address.endereco}, {o.address.numero} · {o.address.bairro} · {o.address.cidade}/{o.address.estado} · CEP {o.address.cep}</div>
                                    </div>
                                </div>
                                <ul className="text-sm mb-3">
                                    {o.items.map((it, i) => <li key={i}>{it.quantity}× {it.name} {it.color && `· ${it.color}`} — {brl(it.price * it.quantity)}</li>)}
                                </ul>
                                <div className="flex gap-3 flex-wrap items-center">
                                    <select className="aure-input" style={{ maxWidth: 200 }} value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} data-testid={`admin-status-${o.order_number}`}>
                                        {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                    <input className="aure-input" style={{ maxWidth: 220 }} placeholder="Código de rastreio" defaultValue={o.tracking_code || ""} onChange={(e) => setTracking({ ...tracking, [o.id]: e.target.value })} data-testid={`admin-tracking-${o.order_number}`} />
                                    <button onClick={() => saveTracking(o.id)} className="aure-btn-secondary" style={{ padding: "10px 16px" }}>Salvar rastreio</button>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <p style={{ color: "var(--aure-muted)" }}>Nenhum pedido ainda.</p>}
                    </div>
                )}

                {tab === "Produtos" && <AdminProducts />}

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
