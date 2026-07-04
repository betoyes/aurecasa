import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export default function Account() {
    const { user, login, logout } = useStore();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    if (!user) {
        return (
            <div className="pt-32 pb-24 container-aure max-w-md fade-in">
                <h1 className="font-serif text-4xl mb-8" style={{ fontWeight: 400 }}>Entrar</h1>
                <p className="mb-8 text-sm" style={{ color: "var(--aure-muted)" }}>
                    Este é um cadastro de demonstração. Suas informações ficam salvas apenas neste dispositivo.
                </p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        login(email, name);
                        toast.success("Bem-vindo à Auré");
                    }}
                    className="space-y-4"
                >
                    <input className="aure-input" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} data-testid="account-name" />
                    <input className="aure-input" placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="account-email" />
                    <button className="aure-btn-primary w-full justify-center" data-testid="account-submit">Entrar</button>
                </form>
            </div>
        );
    }

    return (
        <div className="pt-32 pb-24 container-aure fade-in" data-testid="account-page">
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <div className="ui-label mb-2">Sua conta</div>
                    <h1 className="font-serif text-5xl" style={{ fontWeight: 400 }}>Olá, {user.name}</h1>
                </div>
                <button onClick={logout} className="aure-btn-ghost" data-testid="account-logout">Sair</button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { title: "Meus pedidos", text: "Acompanhe o status e histórico dos seus pedidos." },
                    { title: "Endereços salvos", text: "Cadastre endereços para agilizar futuras compras." },
                    { title: "Favoritos", text: "Peças que você salvou para revisitar." },
                    { title: "Perfil", text: `E-mail: ${user.email}` },
                ].map((c) => (
                    <div key={c.title} className="p-6" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }}>
                        <div className="font-serif text-xl mb-2">{c.title}</div>
                        <p className="text-sm" style={{ color: "var(--aure-muted)" }}>{c.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
