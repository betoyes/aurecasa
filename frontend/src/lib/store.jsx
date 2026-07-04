import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const StoreCtx = createContext(null);

const load = (key, fb) => {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fb;
    } catch {
        return fb;
    }
};
const save = (key, v) => localStorage.setItem(key, JSON.stringify(v));

export const StoreProvider = ({ children }) => {
    const [cart, setCart] = useState(() => load("aure_cart", []));
    const [wishlist, setWishlist] = useState(() => load("aure_wishlist", []));
    const [user, setUser] = useState(() => load("aure_user", null));
    const [miniCartOpen, setMiniCartOpen] = useState(false);

    useEffect(() => save("aure_cart", cart), [cart]);
    useEffect(() => save("aure_wishlist", wishlist), [wishlist]);
    useEffect(() => save("aure_user", user), [user]);

    const addToCart = useCallback((product, opts = {}) => {
        const line = {
            product_id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || "",
            color: opts.color || product.colors?.[0] || "",
            variant: opts.variant || product.variants?.[0] || "",
            quantity: opts.quantity || 1,
        };
        setCart((prev) => {
            const key = `${line.product_id}::${line.color}::${line.variant}`;
            const idx = prev.findIndex(
                (l) => `${l.product_id}::${l.color}::${l.variant}` === key,
            );
            if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + line.quantity };
                return copy;
            }
            return [...prev, line];
        });
        setMiniCartOpen(true);
        toast.success("Adicionado à sacola", { description: product.name });
    }, []);

    const removeFromCart = (index) =>
        setCart((prev) => prev.filter((_, i) => i !== index));

    const updateQty = (index, qty) =>
        setCart((prev) =>
            prev.map((l, i) => (i === index ? { ...l, quantity: Math.max(1, qty) } : l)),
        );

    const clearCart = () => setCart([]);

    const toggleWishlist = useCallback((product) => {
        setWishlist((prev) => {
            const exists = prev.find((p) => p.id === product.id);
            if (exists) {
                toast("Removido dos favoritos");
                return prev.filter((p) => p.id !== product.id);
            }
            toast.success("Adicionado aos favoritos");
            return [
                ...prev,
                {
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0] || "",
                },
            ];
        });
    }, []);

    const inWishlist = (id) => wishlist.some((p) => p.id === id);

    const login = (email, name) => {
        const u = { email, name: name || email.split("@")[0] };
        setUser(u);
        return u;
    };
    const logout = () => setUser(null);

    const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);

    return (
        <StoreCtx.Provider
            value={{
                cart,
                wishlist,
                user,
                miniCartOpen,
                setMiniCartOpen,
                addToCart,
                removeFromCart,
                updateQty,
                clearCart,
                toggleWishlist,
                inWishlist,
                login,
                logout,
                subtotal,
            }}
        >
            {children}
        </StoreCtx.Provider>
    );
};

export const useStore = () => useContext(StoreCtx);
