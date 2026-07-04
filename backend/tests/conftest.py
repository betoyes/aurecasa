import os

# Env de teste precisa existir ANTES do import de server (load_dotenv não
# sobrescreve variáveis já definidas).
os.environ["ADMIN_EMAIL"] = "admin@aurecasa.com.br"
os.environ["ADMIN_PASSWORD"] = "senha-de-teste-123"
os.environ["JWT_SECRET"] = "segredo-jwt-de-teste-com-32-bytes-ou-mais"
os.environ["MONGO_URL"] = "mongodb://localhost:27017"
os.environ["DB_NAME"] = "aurecasa_test"
os.environ["RESEND_API_KEY"] = ""

import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

import server

ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


@pytest.fixture()
def client():
    # Banco mock novo por teste: o lifespan roda o seed contra ele
    server.db = AsyncMongoMockClient()["aurecasa_test"]
    server._login_failures.clear()
    # base_url https: o cookie de sessão é Secure e não seria enviado via http
    with TestClient(server.app, base_url="https://testserver") as c:
        yield c


@pytest.fixture()
def admin_token(client):
    resp = client.post(
        "/api/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["token"]


@pytest.fixture()
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
