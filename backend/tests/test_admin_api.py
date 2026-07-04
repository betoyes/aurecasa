"""Testes da área admin: auth (login/cookie/rate limit), CRUD de produtos, pedidos, stats e upload."""
import io
import time

import server
from .conftest import ADMIN_EMAIL, ADMIN_PASSWORD


class TestAdminLogin:
    def test_login_ok_retorna_token_e_cookie(self, client):
        resp = client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 200
        assert "token" in resp.json()
        set_cookie = resp.headers.get("set-cookie", "")
        assert "aure_admin_session" in set_cookie
        assert "httponly" in set_cookie.lower()

    def test_login_senha_errada_401(self, client):
        resp = client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": "errada"})
        assert resp.status_code == 401

    def test_login_sem_senha_configurada_503(self, client, monkeypatch):
        monkeypatch.setattr(server, "ADMIN_PASSWORD", "")
        resp = client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": "x"})
        assert resp.status_code == 503

    def test_rate_limit_apos_5_falhas(self, client):
        for _ in range(5):
            resp = client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": "errada"})
            assert resp.status_code == 401
        # 6ª tentativa bloqueada, mesmo com a senha certa
        resp = client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 429

    def test_store_de_falhas_tem_teto(self, client, monkeypatch):
        # Muitos IPs distintos não podem crescer o store sem limite
        monkeypatch.setattr(server, "LOGIN_STORE_MAX_IPS", 3)
        now = time.monotonic()
        server._login_failures.update({f"ip-{i}": [now] for i in range(3)})
        client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": "errada"})
        assert len(server._login_failures) <= 3

    def test_login_com_sucesso_zera_falhas(self, client):
        for _ in range(3):
            client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": "errada"})
        ok = client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert ok.status_code == 200
        # Contador zerado: novas falhas recomeçam do zero
        for _ in range(4):
            resp = client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": "errada"})
            assert resp.status_code == 401


class TestAdminAuth:
    def test_verify_com_bearer(self, client, auth_headers):
        resp = client.get("/api/admin/verify", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == ADMIN_EMAIL

    def test_verify_com_cookie(self, client):
        client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        resp = client.get("/api/admin/verify")
        assert resp.status_code == 200

    def test_endpoints_admin_sem_auth_401(self, client):
        for path in ("/api/admin/verify", "/api/admin/stats", "/api/admin/products",
                     "/api/admin/orders", "/api/admin/newsletter", "/api/admin/contacts"):
            assert client.get(path).status_code == 401, path

    def test_token_invalido_401(self, client):
        resp = client.get("/api/admin/verify", headers={"Authorization": "Bearer token-invalido"})
        assert resp.status_code == 401

    def test_logout_limpa_cookie(self, client):
        client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert client.post("/api/admin/logout").status_code == 200
        assert client.get("/api/admin/verify").status_code == 401


NEW_PRODUCT = {
    "id": "peca-teste", "slug": "peca-teste", "name": "Peça Teste",
    "category": "Organização", "category_slug": "organizacao",
    "price": 99.0, "description": "Produto de teste",
}


class TestAdminProducts:
    def test_crud_completo(self, client, auth_headers):
        created = client.post("/api/admin/products", json=NEW_PRODUCT, headers=auth_headers)
        assert created.status_code == 200

        dup = client.post("/api/admin/products", json=NEW_PRODUCT, headers=auth_headers)
        assert dup.status_code == 400

        patched = client.patch("/api/admin/products/peca-teste", json={"price": 129.0}, headers=auth_headers)
        assert patched.status_code == 200
        assert patched.json()["price"] == 129.0

        deleted = client.delete("/api/admin/products/peca-teste", headers=auth_headers)
        assert deleted.status_code == 200
        assert client.get("/api/products/peca-teste").status_code == 404

    def test_patch_produto_inexistente_404(self, client, auth_headers):
        resp = client.patch("/api/admin/products/nao-existe", json={"price": 1}, headers=auth_headers)
        assert resp.status_code == 404


class TestAdminOrders:
    def _create_order(self, client):
        from .test_public_api import ORDER_PAYLOAD
        return client.post("/api/orders", json=ORDER_PAYLOAD).json()

    def test_atualizar_status_dispara_whitelist(self, client, auth_headers):
        order = self._create_order(client)
        ok = client.patch(f"/api/orders/{order['id']}", json={"status": "Enviado", "tracking_code": "BR123"},
                          headers=auth_headers)
        assert ok.status_code == 200
        assert ok.json()["status"] == "Enviado"

        # Campo fora da whitelist é ignorado; só campos inválidos → 400
        bad = client.patch(f"/api/orders/{order['id']}", json={"total": 0}, headers=auth_headers)
        assert bad.status_code == 400

    def test_lista_admin_de_pedidos(self, client, auth_headers):
        self._create_order(client)
        resp = client.get("/api/admin/orders", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1


class TestAdminStatsUpload:
    def test_stats(self, client, auth_headers):
        resp = client.get("/api/admin/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_products"] == 8
        assert "total_revenue" in data

    def test_upload_recusa_tipo_invalido(self, client, auth_headers):
        resp = client.post("/api/admin/upload", headers=auth_headers,
                           files={"file": ("nota.txt", io.BytesIO(b"texto"), "text/plain")})
        assert resp.status_code == 400

    def test_upload_recusa_arquivo_grande(self, client, auth_headers, tmp_path, monkeypatch):
        monkeypatch.setattr(server, "UPLOAD_DIR", tmp_path)
        big = io.BytesIO(b"\x00" * (6 * 1024 * 1024))  # 6 MB > limite de 5 MB
        resp = client.post("/api/admin/upload", headers=auth_headers,
                           files={"file": ("foto.png", big, "image/png")})
        assert resp.status_code == 413
        assert list(tmp_path.iterdir()) == []  # arquivo parcial removido

    def test_upload_aceita_png(self, client, auth_headers, tmp_path, monkeypatch):
        monkeypatch.setattr(server, "UPLOAD_DIR", tmp_path)
        resp = client.post("/api/admin/upload", headers=auth_headers,
                           files={"file": ("foto.png", io.BytesIO(b"\x89PNG fake"), "image/png")})
        assert resp.status_code == 200
        assert resp.json()["url"].startswith("/api/static/uploads/")
