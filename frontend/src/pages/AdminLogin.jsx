import React, { useState } from "react";
import { adminLogin, saveToken } from "@/lib/adminApi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const r = await adminLogin(email, password);
            saveToken(r.token);
            toast.success("Autenticado");
            navigate("/admin");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Falha no login");
        } finally { setLoading(false); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--aure-bg)" }}>
            <form onSubmit={submit} className="w-full max-w-md p-10" style={{ background: "var(--aure-bg-2)", borderRadius: 18 }} data-testid="admin-login-form">
                <div className="ui-label mb-3">Painel Auré Casa</div>
                <h1 className="font-serif text-4xl mb-8" style={{ fontWeight: 400 }}>Entrar</h1>
                <input className="aure-input mb-3" type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="admin-login-email" />
                <input className="aure-input mb-6" type="password" required placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="admin-login-password" />
                <button className="aure-btn-primary w-full justify-center" disabled={loading} data-testid="admin-login-submit">
                    {loading ? "Entrando…" : "Entrar"}
                </button>
            </form>
        </div>
    );
}
