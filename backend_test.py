#!/usr/bin/env python3
"""
Auré Casa Backend E2E Test Suite
Tests all backend API endpoints with real data
"""
import requests
import json
import io
from pathlib import Path

# Backend URL from frontend/.env
BASE_URL = "https://aure-product-demo.preview.emergentagent.com/api"

# Admin credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "admin@aurecasa.com.br"
ADMIN_PASSWORD = "Aure@2026!"

# Test state
admin_token = None
test_product_id = None
test_order_id = None
test_order_number = None

def print_test(name):
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print('='*80)

def print_pass(msg):
    print(f"✅ PASS: {msg}")

def print_fail(msg, details=None):
    print(f"❌ FAIL: {msg}")
    if details:
        print(f"   Details: {details}")

def print_response(resp):
    print(f"   Status: {resp.status_code}")
    try:
        print(f"   Response: {json.dumps(resp.json(), indent=2, ensure_ascii=False)[:500]}")
    except:
        print(f"   Response: {resp.text[:500]}")

# ============ 1. ADMIN AUTH ============
def test_admin_login_valid():
    print_test("Admin Login - Valid Credentials")
    global admin_token
    resp = requests.post(f"{BASE_URL}/admin/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if "token" in data and "email" in data:
            admin_token = data["token"]
            print_pass(f"Login successful, token received: {admin_token[:20]}...")
            return True
        else:
            print_fail("Response missing token or email", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_admin_login_invalid():
    print_test("Admin Login - Invalid Credentials")
    resp = requests.post(f"{BASE_URL}/admin/login", json={
        "email": ADMIN_EMAIL,
        "password": "WrongPassword123!"
    })
    print_response(resp)
    if resp.status_code == 401:
        print_pass("Correctly rejected invalid credentials with 401")
        return True
    else:
        print_fail(f"Expected 401, got {resp.status_code}")
        return False

def test_admin_verify_valid():
    print_test("Admin Verify - Valid Token")
    if not admin_token:
        print_fail("No admin token available")
        return False
    resp = requests.get(f"{BASE_URL}/admin/verify", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("ok") and data.get("email") == ADMIN_EMAIL:
            print_pass("Token verified successfully")
            return True
        else:
            print_fail("Unexpected response structure", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_admin_verify_no_token():
    print_test("Admin Verify - No Token")
    resp = requests.get(f"{BASE_URL}/admin/verify")
    print_response(resp)
    if resp.status_code == 401:
        print_pass("Correctly rejected request without token")
        return True
    else:
        print_fail(f"Expected 401, got {resp.status_code}")
        return False

def test_admin_verify_invalid_token():
    print_test("Admin Verify - Invalid Token")
    resp = requests.get(f"{BASE_URL}/admin/verify", headers={
        "Authorization": "Bearer invalid.token.here"
    })
    print_response(resp)
    if resp.status_code == 401:
        print_pass("Correctly rejected invalid token")
        return True
    else:
        print_fail(f"Expected 401, got {resp.status_code}")
        return False

# ============ 2. ADMIN PRODUCTS CRUD ============
def test_admin_get_products():
    print_test("Admin Get Products - With Token")
    if not admin_token:
        print_fail("No admin token available")
        return False
    resp = requests.get(f"{BASE_URL}/admin/products", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    print_response(resp)
    if resp.status_code == 200:
        products = resp.json()
        if isinstance(products, list) and len(products) >= 8:
            print_pass(f"Retrieved {len(products)} products (expected 8 seed products)")
            return True
        else:
            print_fail(f"Expected list with >= 8 products, got {len(products) if isinstance(products, list) else 'not a list'}")
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_admin_get_products_no_token():
    print_test("Admin Get Products - No Token")
    resp = requests.get(f"{BASE_URL}/admin/products")
    print_response(resp)
    if resp.status_code == 401:
        print_pass("Correctly rejected request without token")
        return True
    else:
        print_fail(f"Expected 401, got {resp.status_code}")
        return False

def test_admin_create_product():
    print_test("Admin Create Product - Complete Product")
    global test_product_id
    if not admin_token:
        print_fail("No admin token available")
        return False
    
    # Create a complete test product matching the Product model
    import uuid
    test_product_id = f"test-produto-{uuid.uuid4().hex[:8]}"
    test_product = {
        "id": test_product_id,
        "slug": test_product_id,
        "name": "Produto de Teste E2E",
        "category": "Teste",
        "category_slug": "teste",
        "price": 99.90,
        "description": "Produto criado durante auditoria E2E para validação do CRUD completo.",
        "long_description": "Descrição longa do produto de teste com detalhes adicionais.",
        "colors": ["Branco", "Preto"],
        "dimensions": "10 x 10 x 10 cm",
        "materials": "Material de teste",
        "care": "Cuidados de teste",
        "shipping_info": "Envio de teste",
        "use_cases": ["Teste", "Validação"],
        "variants": ["Pequeno", "Grande"],
        "images": [
            "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=85",
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=85"
        ],
        "stock_status": "Em estoque",
        "production_time": "Imediato",
        "important_note": "Produto de teste - será deletado",
        "featured": False,
        "new": True,
        "bestseller": False,
        "combines_with": [],
        "reviews": []
    }
    
    resp = requests.post(f"{BASE_URL}/admin/products", 
                        json=test_product,
                        headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("id") == test_product_id:
            print_pass(f"Product created successfully with id: {test_product_id}")
            return True
        else:
            print_fail("Product created but ID mismatch", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_admin_update_product():
    print_test("Admin Update Product - Edit Name, Price, Images")
    if not admin_token or not test_product_id:
        print_fail("No admin token or test product available")
        return False
    
    # Update name, price, and reorder images (simulate changing main image)
    update_data = {
        "name": "Produto de Teste E2E - EDITADO",
        "price": 149.90,
        "images": [
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=85",  # New main image
            "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=85"
        ]
    }
    
    resp = requests.patch(f"{BASE_URL}/admin/products/{test_product_id}",
                         json=update_data,
                         headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if (data.get("name") == update_data["name"] and 
            data.get("price") == update_data["price"] and
            data.get("images")[0] == update_data["images"][0]):
            print_pass("Product updated successfully (name, price, images reordered)")
            return True
        else:
            print_fail("Product updated but data mismatch", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_admin_delete_product():
    print_test("Admin Delete Product - Test Product")
    if not admin_token or not test_product_id:
        print_fail("No admin token or test product available")
        return False
    
    resp = requests.delete(f"{BASE_URL}/admin/products/{test_product_id}",
                          headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 200:
        # Verify deletion
        verify = requests.get(f"{BASE_URL}/products/{test_product_id}")
        if verify.status_code == 404:
            print_pass("Product deleted successfully and verified")
            return True
        else:
            print_fail("Product deletion returned 200 but product still exists")
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

# ============ 3. UPLOAD ============
def test_admin_upload_valid():
    print_test("Admin Upload - Valid PNG Image")
    if not admin_token:
        print_fail("No admin token available")
        return False
    
    # Create a minimal valid PNG (1x1 pixel)
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
    resp = requests.post(f"{BASE_URL}/admin/upload",
                        files=files,
                        headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if "url" in data and data["url"].startswith("/api/static/uploads/"):
            # Try to access the uploaded file
            file_url = f"{BASE_URL.replace('/api', '')}{data['url']}"
            verify = requests.get(file_url)
            if verify.status_code == 200 and 'image' in verify.headers.get('content-type', ''):
                print_pass(f"File uploaded and accessible at {data['url']}")
                return True
            else:
                print_fail(f"File uploaded but not accessible (status: {verify.status_code})")
                return False
        else:
            print_fail("Response missing url or incorrect format", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_admin_upload_invalid_type():
    print_test("Admin Upload - Invalid Content Type")
    if not admin_token:
        print_fail("No admin token available")
        return False
    
    files = {'file': ('test.txt', io.BytesIO(b'not an image'), 'text/plain')}
    resp = requests.post(f"{BASE_URL}/admin/upload",
                        files=files,
                        headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 400:
        print_pass("Correctly rejected invalid content type with 400")
        return True
    else:
        print_fail(f"Expected 400, got {resp.status_code}")
        return False

def test_admin_upload_no_token():
    print_test("Admin Upload - No Token")
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
    resp = requests.post(f"{BASE_URL}/admin/upload", files=files)
    print_response(resp)
    if resp.status_code == 401:
        print_pass("Correctly rejected upload without token")
        return True
    else:
        print_fail(f"Expected 401, got {resp.status_code}")
        return False

# ============ 4. PUBLIC CATALOG ============
def test_get_products():
    print_test("Public Catalog - Get All Products")
    resp = requests.get(f"{BASE_URL}/products")
    print_response(resp)
    if resp.status_code == 200:
        products = resp.json()
        if isinstance(products, list) and len(products) >= 8:
            print_pass(f"Retrieved {len(products)} products (8 seed products expected)")
            return True
        else:
            print_fail(f"Expected list with >= 8 products, got {len(products) if isinstance(products, list) else 'not a list'}")
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_get_products_filters():
    print_test("Public Catalog - Filters (category, sort, price, color)")
    
    # Test category filter
    resp = requests.get(f"{BASE_URL}/products?category=bancada-lavabo")
    if resp.status_code != 200:
        print_fail(f"Category filter failed: {resp.status_code}")
        return False
    products = resp.json()
    if not all(p.get("category_slug") == "bancada-lavabo" for p in products):
        print_fail("Category filter returned wrong products")
        return False
    print_pass(f"Category filter works ({len(products)} products in bancada-lavabo)")
    
    # Test sort
    resp = requests.get(f"{BASE_URL}/products?sort=price_asc")
    if resp.status_code != 200:
        print_fail(f"Sort failed: {resp.status_code}")
        return False
    products = resp.json()
    prices = [p.get("price", 0) for p in products]
    if prices != sorted(prices):
        print_fail("Sort by price_asc not working correctly")
        return False
    print_pass("Sort by price_asc works")
    
    # Test price range
    resp = requests.get(f"{BASE_URL}/products?min_price=100&max_price=150")
    if resp.status_code != 200:
        print_fail(f"Price filter failed: {resp.status_code}")
        return False
    products = resp.json()
    if not all(100 <= p.get("price", 0) <= 150 for p in products):
        print_fail("Price filter returned products outside range")
        return False
    print_pass(f"Price filter works ({len(products)} products between R$100-150)")
    
    # Test color filter
    resp = requests.get(f"{BASE_URL}/products?color=Areia")
    if resp.status_code != 200:
        print_fail(f"Color filter failed: {resp.status_code}")
        return False
    products = resp.json()
    print_pass(f"Color filter works ({len(products)} products with 'Areia')")
    
    return True

def test_get_product_by_slug_valid():
    print_test("Public Catalog - Get Product by Valid Slug")
    resp = requests.get(f"{BASE_URL}/products/bandeja-ritual")
    print_response(resp)
    if resp.status_code == 200:
        product = resp.json()
        if product.get("slug") == "bandeja-ritual" and product.get("name"):
            print_pass(f"Retrieved product: {product.get('name')}")
            return True
        else:
            print_fail("Product data incomplete or incorrect", product)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_get_product_by_slug_invalid():
    print_test("Public Catalog - Get Product by Invalid Slug")
    resp = requests.get(f"{BASE_URL}/products/produto-inexistente-xyz")
    print_response(resp)
    if resp.status_code == 404:
        print_pass("Correctly returned 404 for non-existent slug")
        return True
    else:
        print_fail(f"Expected 404, got {resp.status_code}")
        return False

def test_get_categories():
    print_test("Public Catalog - Get Categories")
    resp = requests.get(f"{BASE_URL}/categories")
    print_response(resp)
    if resp.status_code == 200:
        categories = resp.json()
        if isinstance(categories, list) and len(categories) >= 5:
            print_pass(f"Retrieved {len(categories)} categories")
            return True
        else:
            print_fail(f"Expected list with >= 5 categories, got {len(categories) if isinstance(categories, list) else 'not a list'}")
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

# ============ 5. ORDERS ============
def test_create_order():
    print_test("Orders - Create Order (Checkout Demo)")
    global test_order_id, test_order_number
    
    order_data = {
        "customer": {
            "nome": "Maria Silva",
            "email": "maria.silva@example.com",
            "telefone": "(11) 98765-4321",
            "cpf": "123.456.789-00"
        },
        "address": {
            "cep": "01310-100",
            "endereco": "Av. Paulista, 1000",
            "numero": "1000",
            "complemento": "Apto 101",
            "bairro": "Bela Vista",
            "cidade": "São Paulo",
            "estado": "SP"
        },
        "items": [
            {
                "product_id": "bandeja-ritual",
                "name": "Bandeja Ritual",
                "color": "Areia",
                "variant": "",
                "quantity": 2,
                "price": 119.00
            }
        ],
        "subtotal": 238.00,
        "shipping": 24.90,
        "discount": 0.0,
        "total": 262.90,
        "payment_method": "pix",
        "coupon": "",
        "installments": 1
    }
    
    resp = requests.post(f"{BASE_URL}/orders", json=order_data)
    print_response(resp)
    if resp.status_code == 200:
        order = resp.json()
        if "id" in order and "order_number" in order:
            test_order_id = order["id"]
            test_order_number = order["order_number"]
            print_pass(f"Order created: {test_order_number} (id: {test_order_id})")
            return True
        else:
            print_fail("Order created but missing id or order_number", order)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_get_order_by_id():
    print_test("Orders - Get Order by ID")
    if not test_order_id:
        print_fail("No test order available")
        return False
    
    resp = requests.get(f"{BASE_URL}/orders/{test_order_id}")
    print_response(resp)
    if resp.status_code == 200:
        order = resp.json()
        if order.get("id") == test_order_id:
            print_pass(f"Retrieved order by ID: {test_order_id}")
            return True
        else:
            print_fail("Order ID mismatch", order)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_get_order_by_number():
    print_test("Orders - Get Order by Order Number")
    if not test_order_number:
        print_fail("No test order available")
        return False
    
    resp = requests.get(f"{BASE_URL}/orders/{test_order_number}")
    print_response(resp)
    if resp.status_code == 200:
        order = resp.json()
        if order.get("order_number") == test_order_number:
            print_pass(f"Retrieved order by number: {test_order_number}")
            return True
        else:
            print_fail("Order number mismatch", order)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_update_order_status_admin():
    print_test("Orders - Update Status and Tracking (Admin)")
    if not admin_token or not test_order_id:
        print_fail("No admin token or test order available")
        return False
    
    update_data = {
        "status": "Enviado",
        "tracking_code": "BR123456789"
    }
    
    resp = requests.patch(f"{BASE_URL}/orders/{test_order_id}",
                         json=update_data,
                         headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 200:
        order = resp.json()
        if order.get("status") == "Enviado" and order.get("tracking_code") == "BR123456789":
            print_pass("Order status and tracking updated successfully")
            return True
        else:
            print_fail("Order updated but data mismatch", order)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_update_order_no_token():
    print_test("Orders - Update Status Without Token")
    if not test_order_id:
        print_fail("No test order available")
        return False
    
    resp = requests.patch(f"{BASE_URL}/orders/{test_order_id}",
                         json={"status": "Entregue"})
    print_response(resp)
    if resp.status_code == 401:
        print_pass("Correctly rejected update without token")
        return True
    else:
        print_fail(f"Expected 401, got {resp.status_code}")
        return False

def test_update_order_invalid_field():
    print_test("Orders - Update with Invalid Field")
    if not admin_token or not test_order_id:
        print_fail("No admin token or test order available")
        return False
    
    resp = requests.patch(f"{BASE_URL}/orders/{test_order_id}",
                         json={"total": 999.99},  # Not allowed field
                         headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 400:
        print_pass("Correctly rejected invalid field with 400")
        return True
    else:
        print_fail(f"Expected 400, got {resp.status_code}")
        return False

def test_update_order_nonexistent():
    print_test("Orders - Update Non-existent Order")
    if not admin_token:
        print_fail("No admin token available")
        return False
    
    resp = requests.patch(f"{BASE_URL}/orders/nonexistent-order-id",
                         json={"status": "Enviado"},
                         headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 404:
        print_pass("Correctly returned 404 for non-existent order")
        return True
    else:
        print_fail(f"Expected 404, got {resp.status_code}")
        return False

# ============ 6. COUPONS & CEP ============
def test_coupon_bemvindo10():
    print_test("Coupons - BEMVINDO10 Valid")
    resp = requests.post(f"{BASE_URL}/coupons/validate", json={
        "code": "BEMVINDO10",
        "subtotal": 200.00
    })
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("code") == "BEMVINDO10" and data.get("discount") == 20.0:
            print_pass("BEMVINDO10 validated correctly (10% of R$200 = R$20)")
            return True
        else:
            print_fail("Coupon validated but discount incorrect", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_coupon_fretegratis_valid():
    print_test("Coupons - FRETEGRATIS Valid (subtotal >= R$200)")
    resp = requests.post(f"{BASE_URL}/coupons/validate", json={
        "code": "FRETEGRATIS",
        "subtotal": 250.00
    })
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("code") == "FRETEGRATIS" and data.get("free_shipping") is True:
            print_pass("FRETEGRATIS validated correctly for subtotal >= R$200")
            return True
        else:
            print_fail("Coupon validated but free_shipping not set", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_coupon_fretegratis_invalid():
    print_test("Coupons - FRETEGRATIS Invalid (subtotal < R$200)")
    resp = requests.post(f"{BASE_URL}/coupons/validate", json={
        "code": "FRETEGRATIS",
        "subtotal": 150.00
    })
    print_response(resp)
    if resp.status_code == 400:
        print_pass("Correctly rejected FRETEGRATIS for subtotal < R$200")
        return True
    else:
        print_fail(f"Expected 400, got {resp.status_code}")
        return False

def test_coupon_invalid():
    print_test("Coupons - Invalid Coupon Code")
    resp = requests.post(f"{BASE_URL}/coupons/validate", json={
        "code": "INVALIDCODE",
        "subtotal": 200.00
    })
    print_response(resp)
    if resp.status_code == 404:
        print_pass("Correctly rejected invalid coupon with 404")
        return True
    else:
        print_fail(f"Expected 404, got {resp.status_code}")
        return False

def test_cep_valid():
    print_test("CEP - Valid CEP (01310-100)")
    resp = requests.post(f"{BASE_URL}/shipping/cep", json={
        "cep": "01310-100"
    })
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if "cidade" in data and "estado" in data and "shipping_cost" in data:
            print_pass(f"CEP validated: {data.get('cidade')}/{data.get('estado')}, shipping: R${data.get('shipping_cost')}")
            return True
        else:
            print_fail("CEP response incomplete", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_cep_edge_case():
    print_test("CEP - Edge Case (99999-999)")
    resp = requests.post(f"{BASE_URL}/shipping/cep", json={
        "cep": "99999-999"
    })
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if "cidade" in data and "shipping_cost" in data:
            print_pass(f"CEP handled: {data.get('cidade')}, shipping: R${data.get('shipping_cost')}")
            return True
        else:
            print_fail("CEP response incomplete", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

# ============ 7. NEWSLETTER & CONTACT ============
def test_newsletter_new_email():
    print_test("Newsletter - New Email Subscription")
    import uuid
    test_email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    resp = requests.post(f"{BASE_URL}/newsletter", json={
        "email": test_email,
        "name": "Test User"
    })
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("status") == "ok":
            print_pass(f"Newsletter subscription successful for {test_email}")
            return True
        else:
            print_fail("Unexpected response", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_newsletter_duplicate_email():
    print_test("Newsletter - Duplicate Email")
    # Use a fixed email to test duplicate behavior
    test_email = "duplicate-test@example.com"
    
    # First subscription
    resp1 = requests.post(f"{BASE_URL}/newsletter", json={"email": test_email})
    # Second subscription (duplicate)
    resp2 = requests.post(f"{BASE_URL}/newsletter", json={"email": test_email})
    print_response(resp2)
    
    # According to code, duplicate emails are handled gracefully (no error)
    if resp2.status_code == 200:
        print_pass("Duplicate email handled gracefully (no error)")
        return True
    else:
        print_fail(f"Expected 200, got {resp2.status_code}")
        return False

def test_newsletter_invalid_email():
    print_test("Newsletter - Invalid Email Format")
    resp = requests.post(f"{BASE_URL}/newsletter", json={
        "email": "not-an-email"
    })
    print_response(resp)
    if resp.status_code == 422:
        print_pass("Correctly rejected invalid email with 422")
        return True
    else:
        print_fail(f"Expected 422, got {resp.status_code}")
        return False

def test_contact_valid():
    print_test("Contact - Valid Contact Form")
    resp = requests.post(f"{BASE_URL}/contact", json={
        "name": "João Silva",
        "email": "joao.silva@example.com",
        "subject": "Dúvida sobre produto",
        "message": "Gostaria de saber mais sobre os materiais utilizados."
    })
    print_response(resp)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("status") == "ok":
            print_pass("Contact form submitted successfully")
            return True
        else:
            print_fail("Unexpected response", data)
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_contact_invalid():
    print_test("Contact - Invalid Contact Form (missing required fields)")
    resp = requests.post(f"{BASE_URL}/contact", json={
        "name": "João Silva"
        # Missing email and message
    })
    print_response(resp)
    if resp.status_code == 422:
        print_pass("Correctly rejected invalid payload with 422")
        return True
    else:
        print_fail(f"Expected 422, got {resp.status_code}")
        return False

def test_admin_get_newsletter():
    print_test("Admin - Get Newsletter Subscribers")
    if not admin_token:
        print_fail("No admin token available")
        return False
    
    resp = requests.get(f"{BASE_URL}/admin/newsletter",
                       headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 200:
        subscribers = resp.json()
        if isinstance(subscribers, list):
            print_pass(f"Retrieved {len(subscribers)} newsletter subscribers")
            return True
        else:
            print_fail("Expected list of subscribers")
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

def test_admin_get_contacts():
    print_test("Admin - Get Contact Messages")
    if not admin_token:
        print_fail("No admin token available")
        return False
    
    resp = requests.get(f"{BASE_URL}/admin/contacts",
                       headers={"Authorization": f"Bearer {admin_token}"})
    print_response(resp)
    if resp.status_code == 200:
        contacts = resp.json()
        if isinstance(contacts, list):
            print_pass(f"Retrieved {len(contacts)} contact messages")
            return True
        else:
            print_fail("Expected list of contacts")
            return False
    else:
        print_fail(f"Expected 200, got {resp.status_code}")
        return False

# ============ MAIN TEST RUNNER ============
def main():
    print("\n" + "="*80)
    print("AURÉ CASA BACKEND E2E TEST SUITE")
    print("="*80)
    
    results = []
    
    # 1. Admin Auth
    print("\n\n### 1. ADMIN AUTHENTICATION ###")
    results.append(("Admin Login Valid", test_admin_login_valid()))
    results.append(("Admin Login Invalid", test_admin_login_invalid()))
    results.append(("Admin Verify Valid Token", test_admin_verify_valid()))
    results.append(("Admin Verify No Token", test_admin_verify_no_token()))
    results.append(("Admin Verify Invalid Token", test_admin_verify_invalid_token()))
    
    # 2. Admin Products CRUD
    print("\n\n### 2. ADMIN PRODUCTS CRUD ###")
    results.append(("Admin Get Products", test_admin_get_products()))
    results.append(("Admin Get Products No Token", test_admin_get_products_no_token()))
    results.append(("Admin Create Product", test_admin_create_product()))
    results.append(("Admin Update Product", test_admin_update_product()))
    results.append(("Admin Delete Product", test_admin_delete_product()))
    
    # 3. Upload
    print("\n\n### 3. ADMIN UPLOAD ###")
    results.append(("Admin Upload Valid", test_admin_upload_valid()))
    results.append(("Admin Upload Invalid Type", test_admin_upload_invalid_type()))
    results.append(("Admin Upload No Token", test_admin_upload_no_token()))
    
    # 4. Public Catalog
    print("\n\n### 4. PUBLIC CATALOG ###")
    results.append(("Get Products", test_get_products()))
    results.append(("Get Products Filters", test_get_products_filters()))
    results.append(("Get Product Valid Slug", test_get_product_by_slug_valid()))
    results.append(("Get Product Invalid Slug", test_get_product_by_slug_invalid()))
    results.append(("Get Categories", test_get_categories()))
    
    # 5. Orders
    print("\n\n### 5. ORDERS ###")
    results.append(("Create Order", test_create_order()))
    results.append(("Get Order by ID", test_get_order_by_id()))
    results.append(("Get Order by Number", test_get_order_by_number()))
    results.append(("Update Order Status Admin", test_update_order_status_admin()))
    results.append(("Update Order No Token", test_update_order_no_token()))
    results.append(("Update Order Invalid Field", test_update_order_invalid_field()))
    results.append(("Update Order Nonexistent", test_update_order_nonexistent()))
    
    # 6. Coupons & CEP
    print("\n\n### 6. COUPONS & CEP ###")
    results.append(("Coupon BEMVINDO10", test_coupon_bemvindo10()))
    results.append(("Coupon FRETEGRATIS Valid", test_coupon_fretegratis_valid()))
    results.append(("Coupon FRETEGRATIS Invalid", test_coupon_fretegratis_invalid()))
    results.append(("Coupon Invalid Code", test_coupon_invalid()))
    results.append(("CEP Valid", test_cep_valid()))
    results.append(("CEP Edge Case", test_cep_edge_case()))
    
    # 7. Newsletter & Contact
    print("\n\n### 7. NEWSLETTER & CONTACT ###")
    results.append(("Newsletter New Email", test_newsletter_new_email()))
    results.append(("Newsletter Duplicate Email", test_newsletter_duplicate_email()))
    results.append(("Newsletter Invalid Email", test_newsletter_invalid_email()))
    results.append(("Contact Valid", test_contact_valid()))
    results.append(("Contact Invalid", test_contact_invalid()))
    results.append(("Admin Get Newsletter", test_admin_get_newsletter()))
    results.append(("Admin Get Contacts", test_admin_get_contacts()))
    
    # Summary
    print("\n\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    failed = sum(1 for _, result in results if not result)
    total = len(results)
    
    print(f"\nTotal: {total} tests")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    print("\n### FAILED TESTS ###")
    for name, result in results:
        if not result:
            print(f"❌ {name}")
    
    print("\n### PASSED TESTS ###")
    for name, result in results:
        if result:
            print(f"✅ {name}")
    
    return passed, failed, total

if __name__ == "__main__":
    main()
