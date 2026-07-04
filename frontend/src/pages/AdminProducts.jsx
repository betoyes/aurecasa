import React, { useEffect, useState } from "react";
import { adminUpload, adminCreateProduct, adminUpdateProductFull, adminDeleteProduct, adminGetProducts } from "@/lib/adminApi";
import { toast } from "sonner";
import { X, Upload, Star, Plus, Trash2, Link2 } from "lucide-react";
import { brl } from "@/lib/utils-brl";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const absUrl = (u) => (u?.startsWith("http") ? u : `${BACKEND_URL}${u}`);

const CATEGORIES = [
    { slug: "bancada-lavabo", name: "Bancada & Lavabo" },
    { slug: "organizacao", name: "Organização" },
    { slug: "mesa-receber", name: "Mesa & Receber" },
    { slug: "presentes", name: "Presentes" },
    { slug: "objetos-decorativos", name: "Objetos Decorativos" },
];

const empty = () => ({
    id: "", slug: "", name: "", category: "Organização", category_slug: "organizacao",
    price: 0, sale_price: null, description: "", long_description: "",
    colors: [], dimensions: "", materials: "", care: "",
    production_time: "Produção em até 5 dias úteis",
    stock_status: "Produzido sob demanda", stock: 999,
    images: [], variants: [], combines_with: [],
    featured: false, new: false, bestseller: false, unavailable: false,
});

const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [editing, setEditing] = useState(null);
    const [imgUrl, setImgUrl] = useState("");

    const load = () => adminGetProducts().then(setProducts).catch(() => {});
    useEffect(() => { load(); }, []);

    const openNew = () => setEditing(empty());
    const openEdit = (p) => setEditing({ ...empty(), ...p });

    const save = async () => {
        try {
            const doc = { ...editing };
            if (!doc.id) doc.id = doc.slug || slugify(doc.name);
            if (!doc.slug) doc.slug = slugify(doc.name);
            doc.price = Number(doc.price) || 0;
            doc.category_slug = CATEGORIES.find((c) => c.name === doc.category)?.slug || "organizacao";
            const existing = products.find((p) => p.id === doc.id);
            if (existing) {
                await adminUpdateProductFull(doc.id, doc);
                toast.success("Produto atualizado");
            } else {
                await adminCreateProduct(doc);
                toast.success("Produto criado");
            }
            setEditing(null);
            load();
        } catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
    };

    const del = async (id) => {
        if (!window.confirm("Excluir este produto?")) return;
        await adminDeleteProduct(id);
        toast.success("Excluído");
        load();
    };

    const upload = async (file) => {
        if (!file) return;
        try {
            const r = await adminUpload(file);
            setEditing((cur) => ({ ...cur, images: [...cur.images, r.url] }));
            toast.success("Imagem enviada");
        } catch (e) { toast.error(e.response?.data?.detail || "Falha no upload"); }
    };

    const addUrl = () => {
        if (!imgUrl.trim()) return;
        setEditing((cur) => ({ ...cur, images: [...cur.images, imgUrl.trim()] }));
        setImgUrl("");
    };

    const moveImg = (i, dir) => {
        const arr = [...editing.images];
        const j = i + dir;
        if (j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        setEditing({ ...editing, images: arr });
    };
    const removeImg = (i) => setEditing({ ...editing, images: editing.images.filter((_, k) => k !== i) });
    const setMain = (i) => {
        const arr = [...editing.images];
        const [m] = arr.splice(i, 1);
        arr.unshift(m);
        setEditing({ ...editing, images: arr });
    };

    return (
        <div data-testid="admin-products">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-serif text-3xl" style={{ fontWeight: 400 }}>Produtos</h2>
                    <p className="text-sm" style={{ color: "var(--aure-muted)" }}>{products.length} peças cadastradas</p>
                </div>
                <button onClick={openNew} className="aure-btn-primary" data-testid="admin-product-new"><Plus size={14} /> Novo produto</button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                    <div key={p.id} className="p-4 flex gap-3" style={{ background: "var(--aure-bg-2)", borderRadius: 14 }}>
                        <img src={absUrl(p.images?.[0] || "")} alt="" className="w-20 h-24 object-cover" style={{ borderRadius: 8 }} />
                        <div className="flex-1 min-w-0">
                            <div className="font-serif text-lg truncate">{p.name}</div>
                            <div className="text-xs mb-2" style={{ color: "var(--aure-muted)" }}>{p.category} · {brl(p.price)}</div>
                            <div className="flex gap-1 flex-wrap mb-2">
                                {p.new && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--aure-salvia)", color: "#fff" }}>Novidade</span>}
                                {p.featured && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--aure-terracota)", color: "#fff" }}>Destaque</span>}
                                {p.unavailable && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#999", color: "#fff" }}>Indisponível</span>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(p)} className="text-xs hover-underline" data-testid={`admin-edit-${p.slug}`}>Editar</button>
                                <button onClick={() => del(p.id)} className="text-xs" style={{ color: "#c00" }} data-testid={`admin-delete-${p.slug}`}>Excluir</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6" style={{ background: "rgba(44,40,37,0.5)" }} data-testid="admin-product-modal">
                    <div className="w-full max-w-4xl my-8 p-8" style={{ background: "var(--aure-bg)", borderRadius: 18 }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-serif text-2xl" style={{ fontWeight: 400 }}>{editing.id ? "Editar produto" : "Novo produto"}</h3>
                            <button onClick={() => setEditing(null)}><X /></button>
                        </div>

                        <div className="grid md:grid-cols-[1fr_320px] gap-8">
                            <div className="space-y-3">
                                <div className="grid md:grid-cols-2 gap-3">
                                    <input className="aure-input" placeholder="Nome*" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} data-testid="admin-field-name" />
                                    <input className="aure-input" placeholder="Slug (URL)" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
                                    <input className="aure-input" type="number" step="0.01" placeholder="Preço R$" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} data-testid="admin-field-price" />
                                    <input className="aure-input" type="number" step="0.01" placeholder="Preço promocional (opcional)" value={editing.sale_price || ""} onChange={(e) => setEditing({ ...editing, sale_price: e.target.value ? Number(e.target.value) : null })} />
                                    <select className="aure-input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                                        {CATEGORIES.map((c) => <option key={c.slug}>{c.name}</option>)}
                                    </select>
                                    <input className="aure-input" placeholder="Dimensões" value={editing.dimensions} onChange={(e) => setEditing({ ...editing, dimensions: e.target.value })} />
                                    <input className="aure-input" type="number" placeholder="Estoque" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
                                    <input className="aure-input" placeholder="Prazo de produção" value={editing.production_time} onChange={(e) => setEditing({ ...editing, production_time: e.target.value })} />
                                </div>
                                <textarea className="aure-input" rows={3} placeholder="Descrição curta" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} data-testid="admin-field-description" />
                                <textarea className="aure-input" rows={4} placeholder="Descrição longa" value={editing.long_description} onChange={(e) => setEditing({ ...editing, long_description: e.target.value })} />
                                <textarea className="aure-input" rows={2} placeholder="Materiais e cuidados" value={editing.materials} onChange={(e) => setEditing({ ...editing, materials: e.target.value, care: e.target.value })} />
                                <input className="aure-input" placeholder="Cores (separadas por vírgula: Areia, Verde Sálvia)" value={editing.colors.join(", ")} onChange={(e) => setEditing({ ...editing, colors: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                                <input className="aure-input" placeholder="Produtos relacionados (slugs separados por vírgula)" value={editing.combines_with.join(", ")} onChange={(e) => setEditing({ ...editing, combines_with: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                                <div className="flex flex-wrap gap-4 text-sm mt-2">
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={editing.new} onChange={(e) => setEditing({ ...editing, new: e.target.checked })} /> Novidade</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Destaque</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={editing.bestseller} onChange={(e) => setEditing({ ...editing, bestseller: e.target.checked })} /> Mais vendido</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" checked={editing.unavailable} onChange={(e) => setEditing({ ...editing, unavailable: e.target.checked })} /> Indisponível</label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="ui-label">Imagens · a primeira é a principal</div>
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {editing.images.map((img, i) => (
                                        <div key={i} className="flex gap-2 items-center p-2" style={{ background: "var(--aure-bg-2)", borderRadius: 8 }}>
                                            <img src={absUrl(img)} alt="" className="w-12 h-12 object-cover rounded" />
                                            <div className="flex-1 text-xs truncate">{i === 0 && <Star size={10} fill="currentColor" className="inline mr-1" style={{ color: "var(--aure-terracota)" }} />}{img.split("/").pop()}</div>
                                            <button onClick={() => setMain(i)} title="Principal" className="text-xs"><Star size={12} /></button>
                                            <button onClick={() => moveImg(i, -1)} title="Subir" className="text-xs">↑</button>
                                            <button onClick={() => moveImg(i, 1)} title="Descer" className="text-xs">↓</button>
                                            <button onClick={() => removeImg(i)} title="Remover"><Trash2 size={12} color="#c00" /></button>
                                        </div>
                                    ))}
                                </div>
                                <label className="aure-btn-secondary justify-center cursor-pointer" style={{ padding: "10px 16px" }} data-testid="admin-upload-btn">
                                    <Upload size={14} /> Enviar arquivo
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
                                </label>
                                <div className="flex gap-2">
                                    <input className="aure-input" placeholder="Cole URL da imagem" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} />
                                    <button onClick={addUrl} className="aure-btn-secondary" style={{ padding: "10px 12px" }}><Link2 size={14} /></button>
                                </div>

                                <div className="pt-4" style={{ borderTop: "1px solid var(--aure-border)" }}>
                                    <div className="ui-label mb-2">Prévia</div>
                                    <div className="p-3" style={{ background: "var(--aure-bg-2)", borderRadius: 10 }}>
                                        {editing.images[0] && <img src={absUrl(editing.images[0])} alt="" className="w-full h-32 object-cover rounded mb-2" />}
                                        <div className="font-serif text-base">{editing.name || "Sem nome"}</div>
                                        <div className="text-xs" style={{ color: "var(--aure-muted)" }}>{editing.category}</div>
                                        <div className="text-sm mt-1">{brl(Number(editing.price) || 0)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditing(null)} className="aure-btn-ghost">Cancelar</button>
                            <button onClick={save} className="aure-btn-primary" data-testid="admin-product-save">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
