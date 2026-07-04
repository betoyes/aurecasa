import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Send } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/api";

export const Footer = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            await subscribeNewsletter(email);
            toast.success("Inscrição confirmada", {
                description: "Você receberá lançamentos e coleções em primeira mão.",
            });
            setEmail("");
        } catch {
            toast.error("Não foi possível concluir. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <footer
            style={{
                background: "var(--aure-bg-2)",
                borderTop: "1px solid var(--aure-border)",
            }}
            className="pt-20 pb-12"
            data-testid="footer"
        >
            <div className="container-aure">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div>
                        <div className="font-serif text-2xl mb-4">Auré Casa</div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--aure-muted)" }}>
                            Objetos para os detalhes que transformam a casa. Peças contemporâneas de organização, mesa e presença.
                        </p>
                    </div>

                    <div>
                        <div className="ui-label mb-5">Institucional</div>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/sobre" className="hover-underline">Sobre a Auré Casa</Link></li>
                            <li><Link to="/como-produzimos" className="hover-underline">Como produzimos</Link></li>
                            <li><Link to="/cuidados" className="hover-underline">Cuidados com as peças</Link></li>
                            <li><Link to="/trocas" className="hover-underline">Trocas e devoluções</Link></li>
                            <li><Link to="/privacidade" className="hover-underline">Política de privacidade</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="ui-label mb-5">Atendimento</div>
                        <ul className="space-y-3 text-sm">
                            <li><a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="hover-underline">WhatsApp</a></li>
                            <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover-underline">Instagram</a></li>
                            <li><a href="https://pinterest.com" target="_blank" rel="noreferrer" className="hover-underline">Pinterest</a></li>
                            <li><Link to="/contato" className="hover-underline">Contato</Link></li>
                            <li><Link to="/entrega" className="hover-underline">Política de entrega</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="ui-label mb-5">Novidades para a sua casa</div>
                        <p className="text-sm mb-5" style={{ color: "var(--aure-muted)" }}>
                            Receba lançamentos, cores novas e coleções em primeira mão.
                        </p>
                        <form onSubmit={submit} className="flex gap-2" data-testid="footer-newsletter-form">
                            <input
                                type="email"
                                required
                                placeholder="seu@email.com"
                                className="aure-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                data-testid="footer-newsletter-input"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="aure-btn-primary"
                                style={{ padding: "14px 18px" }}
                                data-testid="footer-newsletter-submit"
                                aria-label="Inscrever"
                            >
                                <Send size={15} />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="divider mb-8" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-xs" style={{ color: "var(--aure-muted)" }}>
                    <div>© {new Date().getFullYear()} Auré Casa · Todos os direitos reservados</div>
                    <div className="flex items-center gap-6">
                        <span className="ui-label">Pix</span>
                        <span className="ui-label">Crédito</span>
                        <span className="ui-label">Boleto</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={16} /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
