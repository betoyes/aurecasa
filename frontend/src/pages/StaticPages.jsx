import React, { useState } from "react";
import { sendContact } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export const About = () => (
    <div className="pt-28 pb-24 fade-in container-aure max-w-4xl" data-testid="about-page">
        <div className="ui-label mb-4">Sobre</div>
        <h1 className="font-serif text-5xl md:text-6xl mb-8" style={{ fontWeight: 400 }}>Auré Casa</h1>
        <img src="https://images.pexels.com/photos/7303844/pexels-photo-7303844.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400" alt="" style={{ borderRadius: 18, width: "100%", aspectRatio: "16/9", objectFit: "cover", marginBottom: 32 }} />
        <div className="prose max-w-none" style={{ color: "var(--aure-muted)", lineHeight: 1.8, fontSize: 17 }}>
            <p>Na Auré Casa, acreditamos que os pequenos objetos têm o poder de mudar a forma como vivemos os espaços. Criamos peças para organizar, receber, cuidar e deixar a casa mais leve.</p>
            <p>Nossa coleção nasce de estudos de forma, textura e função — objetos pensados para durar, feitos com atenção aos detalhes que compõem o cotidiano.</p>
            <p>Cada peça é produzida sob demanda, em pequenos lotes, com processos que respeitam a matéria e o tempo de fazer.</p>
        </div>
        <div className="mt-10 flex gap-4">
            <Link to="/colecoes" className="aure-btn-primary">Ver coleção</Link>
            <Link to="/contato" className="aure-btn-secondary">Falar com a gente</Link>
        </div>
    </div>
);

export const Contact = () => {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [loading, setLoading] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendContact(form);
            toast.success("Mensagem enviada", { description: "Responderemos em breve." });
            setForm({ name: "", email: "", subject: "", message: "" });
        } catch { toast.error("Erro ao enviar"); } finally { setLoading(false); }
    };
    return (
        <div className="pt-28 pb-24 fade-in container-aure max-w-2xl" data-testid="contact-page">
            <div className="ui-label mb-4">Fale conosco</div>
            <h1 className="font-serif text-5xl mb-6" style={{ fontWeight: 400 }}>Contato</h1>
            <p className="mb-8" style={{ color: "var(--aure-muted)" }}>Envie sua mensagem — respondemos em até 2 dias úteis.</p>
            <form onSubmit={submit} className="space-y-4" data-testid="contact-form">
                <input className="aure-input" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="contact-name" />
                <input className="aure-input" type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required data-testid="contact-email" />
                <input className="aure-input" placeholder="Assunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="contact-subject" />
                <textarea className="aure-input" rows={6} placeholder="Sua mensagem" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required data-testid="contact-message" />
                <button className="aure-btn-primary" disabled={loading} data-testid="contact-submit">{loading ? "Enviando…" : "Enviar mensagem"}</button>
            </form>
        </div>
    );
};

const legalCopy = {
    privacidade: {
        title: "Política de Privacidade",
        body: "Respeitamos sua privacidade. Coletamos apenas as informações necessárias para processar seu pedido e melhorar sua experiência. Seus dados não são compartilhados com terceiros para fins comerciais. Você pode solicitar a exclusão de suas informações a qualquer momento pelo e-mail de atendimento.",
    },
    termos: {
        title: "Termos de Uso",
        body: "Ao utilizar este site você concorda com nossas políticas comerciais. Os preços e a disponibilidade das peças podem ser alterados sem aviso prévio. Todas as peças são produzidas sob demanda após a confirmação do pedido.",
    },
    trocas: {
        title: "Trocas e Devoluções",
        body: "Aceitamos trocas e devoluções em até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor. Para peças danificadas no transporte, entre em contato em até 48h com fotos do produto para agilizar o processo.",
    },
    entrega: {
        title: "Política de Entrega",
        body: "Enviamos para todo o Brasil por Correios ou transportadora. O prazo é composto por produção sob demanda (até 5 dias úteis) + prazo de transporte definido pela transportadora conforme o CEP de destino.",
    },
    cuidados: {
        title: "Cuidados com as Peças",
        body: "Recomendamos limpeza com pano macio levemente úmido. Evite detergentes abrasivos, exposição prolongada ao sol e imersão em água. As peças possuem sutis camadas que fazem parte da identidade de cada objeto.",
    },
    "como-produzimos": {
        title: "Como produzimos",
        body: "Cada peça Auré Casa é produzida sob demanda, em pequenos lotes, em nosso estúdio. Trabalhamos com material de origem vegetal e processos que respeitam a matéria e o tempo de fazer. As sutis camadas de textura são parte integrante da identidade dos objetos.",
    },
};

export const Legal = ({ slug }) => {
    const c = legalCopy[slug] || { title: "Página", body: "" };
    return (
        <div className="pt-28 pb-24 fade-in container-aure max-w-3xl" data-testid={`legal-${slug}`}>
            <div className="ui-label mb-4">Institucional</div>
            <h1 className="font-serif text-4xl md:text-5xl mb-8" style={{ fontWeight: 400 }}>{c.title}</h1>
            <p style={{ color: "var(--aure-muted)", lineHeight: 1.9, fontSize: 16 }}>{c.body}</p>
        </div>
    );
};

export const Search = () => {
    const params = new URLSearchParams(window.location.search);
    return (
        <div className="pt-28 container-aure fade-in">
            <div className="ui-label mb-2">Busca</div>
            <h1 className="font-serif text-4xl mb-6" style={{ fontWeight: 400 }}>Resultados para “{params.get("q")}”</h1>
            <p style={{ color: "var(--aure-muted)" }}>Use os filtros nas coleções para refinar sua busca.</p>
        </div>
    );
};
