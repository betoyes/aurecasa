"""Testes da API pública: produtos, categorias, cupons, CEP, pedidos, newsletter, contato."""


class TestRoot:
    def test_root_ok(self, client):
        resp = client.get("/api/")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestProducts:
    def test_lista_produtos_seed(self, client):
        resp = client.get("/api/products")
        assert resp.status_code == 200
        products = resp.json()
        assert len(products) == 8
        assert all("_id" not in p for p in products)

    def test_filtro_por_categoria(self, client):
        resp = client.get("/api/products", params={"category": "organizacao"})
        assert resp.status_code == 200
        products = resp.json()
        assert len(products) == 2
        assert all(p["category_slug"] == "organizacao" for p in products)

    def test_busca_case_insensitive(self, client):
        resp = client.get("/api/products", params={"q": "VASO"})
        assert resp.status_code == 200
        names = [p["name"] for p in resp.json()]
        assert "Vaso Almada" in names

    def test_busca_com_caracteres_de_regex_nao_quebra(self, client):
        resp = client.get("/api/products", params={"q": "a(b*["})
        assert resp.status_code == 200
        assert resp.json() == []

    def test_filtro_preco_e_ordenacao(self, client):
        resp = client.get("/api/products", params={"min_price": 100, "sort": "price_asc"})
        assert resp.status_code == 200
        prices = [p["price"] for p in resp.json()]
        assert prices == sorted(prices)
        assert all(price >= 100 for price in prices)

    def test_produto_por_slug(self, client):
        resp = client.get("/api/products/vaso-almada")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Vaso Almada"

    def test_produto_inexistente_404(self, client):
        assert client.get("/api/products/nao-existe").status_code == 404

    def test_categorias(self, client):
        resp = client.get("/api/categories")
        assert resp.status_code == 200
        slugs = {c["slug"] for c in resp.json()}
        assert "organizacao" in slugs and len(slugs) == 5


class TestCoupons:
    def test_cupom_percentual(self, client):
        resp = client.post("/api/coupons/validate", json={"code": "bemvindo10", "subtotal": 200})
        assert resp.status_code == 200
        data = resp.json()
        assert data["discount"] == 20.0
        assert data["free_shipping"] is False

    def test_cupom_frete_gratis_abaixo_do_minimo(self, client):
        resp = client.post("/api/coupons/validate", json={"code": "FRETEGRATIS", "subtotal": 100})
        assert resp.status_code == 400

    def test_cupom_invalido(self, client):
        resp = client.post("/api/coupons/validate", json={"code": "NAOEXISTE", "subtotal": 100})
        assert resp.status_code == 404


class TestCEP:
    def test_cep_valido(self, client):
        resp = client.post("/api/shipping/cep", json={"cep": "01310-100"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["estado"] == "SP"
        assert data["shipping_cost"] > 0

    def test_cep_invalido(self, client):
        assert client.post("/api/shipping/cep", json={"cep": "123"}).status_code == 400


ORDER_PAYLOAD = {
    "customer": {"nome": "Cliente Teste", "email": "cliente@teste.com"},
    "address": {"cep": "01310100", "cidade": "São Paulo", "estado": "SP"},
    "items": [{"product_id": "vaso-almada", "name": "Vaso Almada", "quantity": 1, "price": 139.0}],
    "subtotal": 139.0,
    "shipping": 24.9,
    "total": 163.9,
    "payment_method": "pix",
}


class TestOrders:
    def test_criar_e_buscar_pedido(self, client):
        created = client.post("/api/orders", json=ORDER_PAYLOAD)
        assert created.status_code == 200
        order = created.json()
        assert order["status"] == "Pedido recebido"
        assert order["order_number"].startswith("AC")

        by_id = client.get(f"/api/orders/{order['id']}")
        assert by_id.status_code == 200

        by_number = client.get(f"/api/orders/{order['order_number']}")
        assert by_number.status_code == 200
        assert by_number.json()["id"] == order["id"]

    def test_pedido_inexistente_404(self, client):
        assert client.get("/api/orders/nao-existe").status_code == 404

    def test_lista_de_pedidos_nao_e_publica(self, client):
        # GET /api/orders (lista) foi removido — só POST existe na rota
        assert client.get("/api/orders").status_code == 405

    def test_patch_pedido_exige_admin(self, client):
        order = client.post("/api/orders", json=ORDER_PAYLOAD).json()
        resp = client.patch(f"/api/orders/{order['id']}", json={"status": "Enviado"})
        assert resp.status_code == 401


class TestNewsletterContato:
    def test_newsletter_inscricao_e_duplicata(self, client):
        payload = {"email": "novo@teste.com", "name": "Novo"}
        assert client.post("/api/newsletter", json=payload).status_code == 200
        # Duplicata não erra nem duplica
        assert client.post("/api/newsletter", json=payload).status_code == 200

    def test_newsletter_email_invalido(self, client):
        resp = client.post("/api/newsletter", json={"email": "nao-e-email"})
        assert resp.status_code == 422

    def test_contato_salva_mensagem(self, client):
        resp = client.post("/api/contact", json={
            "name": "Contato Teste",
            "email": "contato@teste.com",
            "message": "Olá <script>alert(1)</script>",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
