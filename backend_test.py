#!/usr/bin/env python3
"""
Backend Regression Test Suite - Auré Casa
Tests security changes: httpOnly cookies, logout endpoint, dual auth modes, and refactored list_products
"""
import os
import requests
import sys
from typing import Dict, Any, Optional
from urllib.parse import urlparse

# Configuráveis por env var; defaults apontam para o backend local
BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:8001").rstrip("/") + "/api"
COOKIE_DOMAIN = urlparse(BASE_URL).hostname

# Credenciais do admin (as mesmas do backend/.env)
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@aurecasa.com.br")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

# Test counters
tests_passed = 0
tests_failed = 0
test_results = []

def log_test(name: str, passed: bool, details: str = ""):
    global tests_passed, tests_failed
    if passed:
        tests_passed += 1
        status = "✅ PASS"
    else:
        tests_failed += 1
        status = "❌ FAIL"
    msg = f"{status}: {name}"
    if details:
        msg += f" - {details}"
    print(msg)
    test_results.append({"name": name, "passed": passed, "details": details})

def test_admin_login_with_cookie():
    """Test 1: POST /api/admin/login returns token + sets httpOnly cookie"""
    print("\n=== Test 1: Admin Login with Cookie ===")
    
    # Test valid login
    resp = requests.post(f"{BASE_URL}/admin/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if resp.status_code != 200:
        log_test("Admin login returns 200", False, f"Got {resp.status_code}")
        return None, None
    
    log_test("Admin login returns 200", True)
    
    data = resp.json()
    if "token" not in data or "email" not in data:
        log_test("Login response contains token and email", False, f"Got: {data}")
        return None, None
    
    log_test("Login response contains token and email", True)
    
    # Check Set-Cookie header
    set_cookie = resp.headers.get("Set-Cookie", "")
    if "aure_admin_session" not in set_cookie:
        log_test("Set-Cookie contains aure_admin_session", False, f"Got: {set_cookie}")
        return data["token"], None
    
    log_test("Set-Cookie contains aure_admin_session", True)
    
    # Verify cookie attributes
    cookie_checks = [
        ("HttpOnly", "httponly" in set_cookie.lower()),
        ("Secure", "secure" in set_cookie.lower() or "Secure" in set_cookie),
        ("SameSite=lax", "samesite=lax" in set_cookie.lower()),
        ("Path=/api", "path=/api" in set_cookie.lower()),
        ("Max-Age", "max-age" in set_cookie.lower()),
    ]
    
    for attr_name, present in cookie_checks:
        log_test(f"Cookie has {attr_name}", present, "" if present else f"Cookie: {set_cookie}")
    
    # Extract cookie value for later tests
    cookies = resp.cookies
    session_cookie = cookies.get("aure_admin_session")
    
    return data["token"], session_cookie

def test_admin_logout(session_cookie: Optional[str]):
    """Test 2: POST /api/admin/logout clears cookie"""
    print("\n=== Test 2: Admin Logout ===")
    
    if not session_cookie:
        log_test("Logout test (skipped - no cookie)", False, "No session cookie from login")
        return
    
    # Create session with cookie
    session = requests.Session()
    session.cookies.set("aure_admin_session", session_cookie, domain=COOKIE_DOMAIN, path="/api")
    
    # Call logout
    resp = session.post(f"{BASE_URL}/admin/logout")
    
    if resp.status_code != 200:
        log_test("Logout returns 200", False, f"Got {resp.status_code}")
        return
    
    log_test("Logout returns 200", True)
    
    # Check if cookie is cleared (Set-Cookie with Max-Age=0 or expires in past)
    set_cookie = resp.headers.get("Set-Cookie", "")
    cookie_cleared = "max-age=0" in set_cookie.lower() or "expires=" in set_cookie.lower()
    log_test("Logout clears cookie", cookie_cleared, f"Set-Cookie: {set_cookie}")
    
    # Verify that after logout, using cookie gives 401
    verify_resp = session.get(f"{BASE_URL}/admin/verify")
    log_test("After logout, cookie auth returns 401", verify_resp.status_code == 401, 
             f"Got {verify_resp.status_code}")

def test_require_admin_bearer_mode(token: str):
    """Test 3: require_admin with Bearer token (existing mode)"""
    print("\n=== Test 3: require_admin with Bearer Token ===")
    
    if not token:
        log_test("Bearer auth tests (skipped)", False, "No token from login")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test /api/admin/verify
    resp = requests.get(f"{BASE_URL}/admin/verify", headers=headers)
    log_test("GET /api/admin/verify with Bearer token", resp.status_code == 200,
             f"Status: {resp.status_code}")
    
    # Test /api/admin/products
    resp = requests.get(f"{BASE_URL}/admin/products", headers=headers)
    log_test("GET /api/admin/products with Bearer token", resp.status_code == 200,
             f"Status: {resp.status_code}, Products: {len(resp.json()) if resp.status_code == 200 else 0}")
    
    # Test /api/admin/stats
    resp = requests.get(f"{BASE_URL}/admin/stats", headers=headers)
    log_test("GET /api/admin/stats with Bearer token", resp.status_code == 200,
             f"Status: {resp.status_code}")

def test_require_admin_cookie_mode(session_cookie: Optional[str]):
    """Test 4: require_admin with cookie (new mode)"""
    print("\n=== Test 4: require_admin with Cookie ===")
    
    if not session_cookie:
        log_test("Cookie auth tests (skipped)", False, "No session cookie from login")
        return
    
    # Create session with cookie
    session = requests.Session()
    session.cookies.set("aure_admin_session", session_cookie, domain=COOKIE_DOMAIN, path="/api")
    
    # Test /api/admin/verify
    resp = session.get(f"{BASE_URL}/admin/verify")
    log_test("GET /api/admin/verify with cookie", resp.status_code == 200,
             f"Status: {resp.status_code}")
    
    # Test /api/admin/products
    resp = session.get(f"{BASE_URL}/admin/products")
    log_test("GET /api/admin/products with cookie", resp.status_code == 200,
             f"Status: {resp.status_code}, Products: {len(resp.json()) if resp.status_code == 200 else 0}")
    
    # Test /api/admin/stats
    resp = session.get(f"{BASE_URL}/admin/stats")
    log_test("GET /api/admin/stats with cookie", resp.status_code == 200,
             f"Status: {resp.status_code}")

def test_require_admin_no_auth():
    """Test 5: require_admin without auth returns 401"""
    print("\n=== Test 5: require_admin without Auth ===")
    
    endpoints = [
        "/admin/verify",
        "/admin/products",
        "/admin/stats"
    ]
    
    for endpoint in endpoints:
        resp = requests.get(f"{BASE_URL}{endpoint}")
        log_test(f"GET {endpoint} without auth returns 401", resp.status_code == 401,
                 f"Status: {resp.status_code}")

def test_require_admin_invalid_cookie():
    """Test 6: require_admin with invalid cookie returns 401"""
    print("\n=== Test 6: require_admin with Invalid Cookie ===")
    
    session = requests.Session()
    session.cookies.set("aure_admin_session", "invalid_token_12345", 
                       domain=COOKIE_DOMAIN, path="/api")
    
    resp = session.get(f"{BASE_URL}/admin/verify")
    log_test("GET /api/admin/verify with invalid cookie returns 401", resp.status_code == 401,
             f"Status: {resp.status_code}")

def test_list_products_refactored():
    """Test 7: list_products refactored - behavior should be identical"""
    print("\n=== Test 7: list_products Refactored (Regression) ===")
    
    # Test 1: GET /api/products (should return 8 products)
    resp = requests.get(f"{BASE_URL}/products")
    if resp.status_code == 200:
        products = resp.json()
        log_test("GET /api/products returns 8 products", len(products) == 8,
                 f"Got {len(products)} products")
    else:
        log_test("GET /api/products returns 200", False, f"Status: {resp.status_code}")
    
    # Test 2: Filter by category
    resp = requests.get(f"{BASE_URL}/products", params={"category": "bancada-lavabo"})
    if resp.status_code == 200:
        products = resp.json()
        log_test("GET /api/products?category=bancada-lavabo", len(products) >= 1,
                 f"Got {len(products)} products")
    else:
        log_test("GET /api/products?category=bancada-lavabo", False, f"Status: {resp.status_code}")
    
    # Test 3: Filter by color
    resp = requests.get(f"{BASE_URL}/products", params={"color": "Areia"})
    if resp.status_code == 200:
        products = resp.json()
        log_test("GET /api/products?color=Areia", len(products) >= 1,
                 f"Got {len(products)} products")
    else:
        log_test("GET /api/products?color=Areia", False, f"Status: {resp.status_code}")
    
    # Test 4: Filter by price range
    resp = requests.get(f"{BASE_URL}/products", params={"min_price": 100, "max_price": 150})
    if resp.status_code == 200:
        products = resp.json()
        # Verify all products are in range
        in_range = all(100 <= p.get("price", 0) <= 150 for p in products)
        log_test("GET /api/products?min_price=100&max_price=150", in_range,
                 f"Got {len(products)} products, all in range: {in_range}")
    else:
        log_test("GET /api/products?min_price=100&max_price=150", False, f"Status: {resp.status_code}")
    
    # Test 5: Search query
    resp = requests.get(f"{BASE_URL}/products", params={"q": "bandeja"})
    if resp.status_code == 200:
        products = resp.json()
        log_test("GET /api/products?q=bandeja", len(products) >= 1,
                 f"Got {len(products)} products")
    else:
        log_test("GET /api/products?q=bandeja", False, f"Status: {resp.status_code}")
    
    # Test 6: Sort by price ascending
    resp = requests.get(f"{BASE_URL}/products", params={"sort": "price_asc"})
    if resp.status_code == 200:
        products = resp.json()
        prices = [p.get("price", 0) for p in products]
        sorted_correctly = prices == sorted(prices)
        log_test("GET /api/products?sort=price_asc", sorted_correctly,
                 f"Prices: {prices[:3]}... sorted: {sorted_correctly}")
    else:
        log_test("GET /api/products?sort=price_asc", False, f"Status: {resp.status_code}")
    
    # Test 7: Sort by price descending
    resp = requests.get(f"{BASE_URL}/products", params={"sort": "price_desc"})
    if resp.status_code == 200:
        products = resp.json()
        prices = [p.get("price", 0) for p in products]
        sorted_correctly = prices == sorted(prices, reverse=True)
        log_test("GET /api/products?sort=price_desc", sorted_correctly,
                 f"Prices: {prices[:3]}... sorted: {sorted_correctly}")
    else:
        log_test("GET /api/products?sort=price_desc", False, f"Status: {resp.status_code}")
    
    # Test 8: Sort by new
    resp = requests.get(f"{BASE_URL}/products", params={"sort": "new"})
    log_test("GET /api/products?sort=new", resp.status_code == 200,
             f"Status: {resp.status_code}")
    
    # Test 9: Sort by bestseller
    resp = requests.get(f"{BASE_URL}/products", params={"sort": "bestseller"})
    log_test("GET /api/products?sort=bestseller", resp.status_code == 200,
             f"Status: {resp.status_code}")
    
    # Test 10: Invalid sort (should use default without error)
    resp = requests.get(f"{BASE_URL}/products", params={"sort": "invalid_sort"})
    log_test("GET /api/products?sort=invalid_sort (uses default)", resp.status_code == 200,
             f"Status: {resp.status_code}")
    
    # Test 11: GET product by slug (existing)
    resp = requests.get(f"{BASE_URL}/products/bandeja-ritual")
    log_test("GET /api/products/bandeja-ritual returns 200", resp.status_code == 200,
             f"Status: {resp.status_code}")
    
    # Test 12: GET product by slug (non-existent)
    resp = requests.get(f"{BASE_URL}/products/aure-product-demo")
    log_test("GET /api/products/aure-product-demo returns 404", resp.status_code == 404,
             f"Status: {resp.status_code}")

def test_smoke_orders(token: str):
    """Test 8: Quick smoke test - Orders"""
    print("\n=== Test 8: Smoke Test - Orders ===")
    
    # Create order
    order_data = {
        "customer": {
            "nome": "Test Regression",
            "email": "test@regression.com",
            "cpf": "111.444.777-35",
            "telefone": "(11) 98765-4321"
        },
        "address": {
            "cep": "01310-100",
            "endereco": "Av Paulista",
            "numero": "1000",
            "complemento": "",
            "bairro": "Bela Vista",
            "cidade": "São Paulo",
            "estado": "SP"
        },
        "items": [
            {
                "product_id": "bandeja-ritual",
                "name": "Bandeja Ritual",
                "color": "Areia",
                "quantity": 1,
                "price": 119.00
            }
        ],
        "subtotal": 119.00,
        "shipping": 24.90,
        "discount": 0.0,
        "total": 143.90,
        "payment_method": "pix"
    }
    
    resp = requests.post(f"{BASE_URL}/orders", json=order_data)
    if resp.status_code == 200:
        order = resp.json()
        order_id = order.get("id")
        log_test("POST /api/orders creates order", True, f"Order ID: {order_id}")
        
        # Update order status with admin token
        if token and order_id:
            headers = {"Authorization": f"Bearer {token}"}
            patch_data = {
                "status": "Enviado",
                "tracking_code": "BR123456789TEST"
            }
            resp = requests.patch(f"{BASE_URL}/orders/{order_id}", json=patch_data, headers=headers)
            log_test("PATCH /api/orders/{id} with Bearer token", resp.status_code == 200,
                     f"Status: {resp.status_code}")
            
            # Clean up - delete the test order (not in API, so just note it)
            # We'll leave it for manual cleanup or it will be in the DB
    else:
        log_test("POST /api/orders creates order", False, f"Status: {resp.status_code}")

def test_smoke_coupons():
    """Test 9: Quick smoke test - Coupons"""
    print("\n=== Test 9: Smoke Test - Coupons ===")
    
    resp = requests.post(f"{BASE_URL}/coupons/validate", json={
        "code": "BEMVINDO10",
        "subtotal": 200.00
    })
    
    if resp.status_code == 200:
        data = resp.json()
        discount = data.get("discount", 0)
        expected_discount = 20.00  # 10% of 200
        log_test("POST /api/coupons/validate BEMVINDO10", abs(discount - expected_discount) < 0.01,
                 f"Discount: R${discount} (expected R${expected_discount})")
    else:
        log_test("POST /api/coupons/validate BEMVINDO10", False, f"Status: {resp.status_code}")

def test_smoke_newsletter():
    """Test 10: Quick smoke test - Newsletter"""
    print("\n=== Test 10: Smoke Test - Newsletter ===")
    
    import random
    email = f"regression{random.randint(1000, 9999)}@test.com"
    
    resp = requests.post(f"{BASE_URL}/newsletter", json={
        "email": email,
        "name": "Test Regression"
    })
    
    log_test("POST /api/newsletter", resp.status_code == 200,
             f"Status: {resp.status_code}")

def test_smoke_contact():
    """Test 11: Quick smoke test - Contact"""
    print("\n=== Test 11: Smoke Test - Contact ===")
    
    resp = requests.post(f"{BASE_URL}/contact", json={
        "name": "Test Regression",
        "email": "regression@test.com",
        "subject": "Teste de Regressão",
        "message": "Esta é uma mensagem de teste de regressão."
    })
    
    log_test("POST /api/contact", resp.status_code == 200,
             f"Status: {resp.status_code}")

def main():
    print("=" * 80)
    print("BACKEND REGRESSION TEST SUITE - Auré Casa")
    print("Testing: httpOnly cookies, logout, dual auth modes, refactored list_products")
    print("=" * 80)
    
    # Test 1: Login and get token + cookie
    token, session_cookie = test_admin_login_with_cookie()
    
    # Test 2: Logout
    test_admin_logout(session_cookie)
    
    # Get fresh token and cookie for remaining tests
    print("\n=== Getting fresh session for remaining tests ===")
    token, session_cookie = test_admin_login_with_cookie()
    
    # Test 3-6: Auth modes
    test_require_admin_bearer_mode(token)
    test_require_admin_cookie_mode(session_cookie)
    test_require_admin_no_auth()
    test_require_admin_invalid_cookie()
    
    # Test 7: list_products refactored
    test_list_products_refactored()
    
    # Test 8-11: Smoke tests
    test_smoke_orders(token)
    test_smoke_coupons()
    test_smoke_newsletter()
    test_smoke_contact()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Total tests: {tests_passed + tests_failed}")
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print("=" * 80)
    
    if tests_failed > 0:
        print("\nFailed tests:")
        for result in test_results:
            if not result["passed"]:
                print(f"  - {result['name']}: {result['details']}")
        sys.exit(1)
    else:
        print("\n🎉 All tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()
