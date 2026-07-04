import "@/App.css";
import { BrowserRouter, Routes, Route, Outlet, useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MiniCart } from "@/components/cart/MiniCart";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import Collection from "@/pages/Collection";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Confirmation from "@/pages/Confirmation";
import Wishlist from "@/pages/Wishlist";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import { About, Contact, Legal, Search } from "@/pages/StaticPages";

const ScrollTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

const Layout = () => (
    <>
        <Header />
        <main style={{ minHeight: "60vh" }}>
            <Outlet />
        </main>
        <MiniCart />
        <Footer />
    </>
);

const LegalRoute = () => {
    const { slug } = useParams();
    return <Legal slug={slug} />;
};

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <ScrollTop />
                <StoreProvider>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/colecoes" element={<Collection />} />
                            <Route path="/novidades" element={<Collection />} />
                            <Route path="/categoria/:slug" element={<Collection />} />
                            <Route path="/busca" element={<Collection />} />
                            <Route path="/produto/:slug" element={<ProductDetail />} />
                            <Route path="/carrinho" element={<Cart />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/pedido/:orderId" element={<Confirmation />} />
                            <Route path="/favoritos" element={<Wishlist />} />
                            <Route path="/conta" element={<Account />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route path="/sobre" element={<About />} />
                            <Route path="/contato" element={<Contact />} />
                            <Route path="/privacidade" element={<LegalRoute />} />
                            <Route path="/termos" element={<LegalRoute />} />
                            <Route path="/trocas" element={<LegalRoute />} />
                            <Route path="/entrega" element={<LegalRoute />} />
                            <Route path="/cuidados" element={<LegalRoute />} />
                            <Route path="/como-produzimos" element={<LegalRoute />} />
                            <Route path="/:slug" element={<LegalRoute />} />
                        </Route>
                    </Routes>
                    <Toaster position="top-right" />
                </StoreProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
