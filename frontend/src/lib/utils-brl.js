export const brl = (value) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value || 0);

export const installments = (value, months = 6) => {
    const each = value / months;
    return { months, each };
};

export const formatCEP = (v) => {
    const digits = (v || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
};

export const formatCPF = (v) => {
    const d = (v || "").replace(/\D/g, "").slice(0, 11);
    return d
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const formatPhone = (v) => {
    const d = (v || "").replace(/\D/g, "").slice(0, 11);
    if (d.length <= 10)
        return d
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    return d
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
};

export const formatCardNumber = (v) =>
    (v || "")
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 ");
