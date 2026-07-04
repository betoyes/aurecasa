from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, UploadFile, File, Header, Request, Response
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import html
import os
import logging
import asyncio
import jwt
import re
import secrets
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
db = client[os.environ.get('DB_NAME', 'aurecasa')]

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "onboarding@resend.dev")
EMAIL_OWNER = os.environ.get("EMAIL_OWNER", "")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@aurecasa.com.br")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "")
if not JWT_SECRET:
    # Sem segredo configurado: gera um efêmero por processo. Sessões admin não
    # sobrevivem a restarts — configure JWT_SECRET em produção.
    JWT_SECRET = secrets.token_hex(32)
    logger.warning("JWT_SECRET não configurado — usando segredo efêmero (sessões admin expiram a cada restart)")
JWT_ALG = "HS256"
CORS_ORIGINS = [o.strip() for o in os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',') if o.strip()]
UPLOAD_DIR = Path(__file__).parent / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB

try:
    import resend
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
except Exception:
    resend = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await seed_database()
    except Exception as e:
        # MongoDB indisponível não deve impedir o boot — endpoints que dependem
        # do banco retornarão erro até a conexão voltar.
        logger.warning(f"Seed pulado — MongoDB indisponível? ({e})")
    yield
    client.close()

app = FastAPI(title="Auré Casa API", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# Serve generated product images
STATIC_DIR = ROOT_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/api/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ============ MODELS ============
def now_iso():
    return datetime.now(timezone.utc).isoformat()

class Product(BaseModel):
    id: str
    slug: str
    name: str
    category: str
    category_slug: str
    price: float
    description: str
    long_description: Optional[str] = ""
    colors: List[str] = []
    dimensions: str = ""
    materials: str = ""
    care: str = ""
    shipping_info: str = ""
    use_cases: List[str] = []
    variants: List[str] = []
    images: List[str] = []
    stock_status: str = "Produzido sob demanda"
    production_time: str = "Produção em até 5 dias úteis"
    important_note: Optional[str] = ""
    featured: bool = False
    new: bool = False
    bestseller: bool = False
    combines_with: List[str] = []
    reviews: List[Dict[str, Any]] = []

class NewsletterSignup(BaseModel):
    email: EmailStr
    name: Optional[str] = ""

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: Optional[str] = "Contato Auré Casa"
    message: str

class OrderItem(BaseModel):
    product_id: str
    name: str
    color: Optional[str] = ""
    variant: Optional[str] = ""
    quantity: int = 1
    price: float

class OrderCreate(BaseModel):
    customer: Dict[str, Any]
    address: Dict[str, Any]
    items: List[OrderItem]
    subtotal: float
    shipping: float = 0.0
    discount: float = 0.0
    total: float
    payment_method: str  # pix | credit_card | boleto
    coupon: Optional[str] = ""
    installments: Optional[int] = 1

class Order(OrderCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=lambda: f"AC{datetime.now().strftime('%y%m%d')}{uuid.uuid4().hex[:6].upper()}")
    status: str = "Pedido recebido"
    created_at: str = Field(default_factory=now_iso)
    tracking_code: Optional[str] = ""

class CouponCheck(BaseModel):
    code: str
    subtotal: float

class CEPCheck(BaseModel):
    cep: str

# ============ SEED DATA ============
# Using curated Unsplash editorial imagery. Can be replaced with AI-generated via scripts/generate_product_images.py

PRODUCTS_SEED = [
    {
        "id": "organizador-nodulo", "slug": "organizador-nodulo",
        "name": "Organizador Nódulo", "category": "Organização", "category_slug": "organizacao",
        "price": 89.00,
        "description": "Organizador de divisórias suaves para reunir os pequenos itens que normalmente se espalham pela bancada. Ideal para mesa de trabalho, penteadeira, cozinha ou lavabo.",
        "long_description": "Uma peça pensada para o cotidiano. As divisórias com curvas suaves acomodam objetos de diferentes tamanhos sem criar visuais rígidos. Perfeito para reunir chaves, canetas, joias e pequenos utensílios.",
        "colors": ["Areia", "Verde Sálvia", "Terracota Clara", "Off-white"],
        "dimensions": "18 x 12 x 10 cm",
        "materials": "Produzido sob demanda em material de origem vegetal. As sutis camadas fazem parte da textura e da identidade de cada peça.",
        "care": "Limpeza com pano macio levemente úmido. Evitar detergentes abrasivos e exposição prolongada ao sol.",
        "shipping_info": "Enviamos para todo o Brasil. Produção em até 5 dias úteis, mais o prazo de transporte.",
        "use_cases": ["Home office", "Banheiro", "Penteadeira", "Cozinha"],
        "images": [
            "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1400&q=85&auto=format&fit=crop&crop=entropy",
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1400&q=85&auto=format&fit=crop&sat=-10",
        ],
        "featured": True, "new": True, "bestseller": True,
        "combines_with": ["porta-utensilios-canto", "bandeja-ritual"],
    },
    {
        "id": "bandeja-ritual", "slug": "bandeja-ritual",
        "name": "Bandeja Ritual", "category": "Bancada & Lavabo", "category_slug": "bancada-lavabo",
        "price": 119.00,
        "description": "Uma bandeja de linhas baixas e textura delicada para reunir perfumes, sabonetes, velas e objetos que fazem parte da rotina.",
        "long_description": "Pensada para trazer ordem visual e uma pausa contemplativa à bancada. As linhas baixas e o volume compacto tornam a Bandeja Ritual versátil para lavabos, mesas laterais e criados-mudos.",
        "colors": ["Areia", "Café com Leite", "Off-white"],
        "dimensions": "26 x 16 x 3 cm",
        "materials": "Produzido sob demanda em material de origem vegetal. As sutis camadas fazem parte da textura e da identidade de cada peça.",
        "care": "Limpeza com pano macio levemente úmido. Não indicado para contato prolongado com água.",
        "shipping_info": "Enviamos para todo o Brasil. Produção em até 5 dias úteis.",
        "use_cases": ["Lavabo", "Criado-mudo", "Aparador"],
        "images": [
            "https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=1400&q=85&auto=format&fit=crop&crop=entropy",
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=1400&q=85&auto=format&fit=crop&sat=-15",
        ],
        "featured": True, "new": True, "bestseller": False,
        "combines_with": ["saboneteira-onda", "vaso-almada"],
    },
    {
        "id": "saboneteira-onda", "slug": "saboneteira-onda",
        "name": "Saboneteira Onda", "category": "Bancada & Lavabo", "category_slug": "bancada-lavabo",
        "price": 49.00,
        "description": "Saboneteira escultural com ondulações que elevam o sabonete e ajudam a manter a bancada mais seca e organizada.",
        "long_description": "As ondulações desenham um relevo sutil que permite a drenagem natural, mantendo o sabonete seco por mais tempo. Um objeto pequeno com presença notável.",
        "colors": ["Verde Sálvia", "Areia", "Terracota Clara"],
        "dimensions": "13 x 9 x 3 cm",
        "materials": "Produzido sob demanda em material de origem vegetal. As sutis camadas fazem parte da textura e da identidade de cada peça.",
        "care": "Enxaguar e secar após o uso. Limpar com pano macio.",
        "shipping_info": "Enviamos para todo o Brasil. Produção em até 5 dias úteis.",
        "use_cases": ["Lavabo", "Banheiro", "Cozinha"],
        "images": [
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1400&q=85&auto=format&fit=crop&crop=entropy",
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1400&q=85&auto=format&fit=crop&sat=-10",
            "https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=1400&q=85&auto=format&fit=crop",
        ],
        "featured": True, "new": False, "bestseller": True,
        "combines_with": ["bandeja-ritual"],
    },
    {
        "id": "cachepo-trama", "slug": "cachepo-trama",
        "name": "Cachepô Trama", "category": "Objetos Decorativos", "category_slug": "objetos-decorativos",
        "price": 109.00,
        "description": "Cachepô de textura contínua e presença discreta para plantas, flores secas e composições de estante.",
        "long_description": "A trama contínua da superfície cria um jogo delicado de luz e sombra. Uma peça que ganha vida em estantes, aparadores e mesas laterais.",
        "colors": ["Off-white", "Argila", "Verde Sálvia"],
        "dimensions": "14 x 14 x 15 cm",
        "materials": "Produzido sob demanda em material de origem vegetal. As sutis camadas fazem parte da textura e da identidade de cada peça.",
        "care": "Utilizar com vaso interno para plantas com regas. Limpar com pano macio.",
        "shipping_info": "Enviamos para todo o Brasil. Produção em até 5 dias úteis.",
        "important_note": "Indicado para uso com vaso interno de plástico ou vidro.",
        "use_cases": ["Sala", "Home office", "Aparador"],
        "images": [
            "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=1400&q=85&auto=format&fit=crop&crop=entropy",
            "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=1400&q=85&auto=format&fit=crop&sat=-10",
            "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=1400&q=85&auto=format&fit=crop",
        ],
        "featured": False, "new": True, "bestseller": False,
        "combines_with": ["vaso-almada"],
    },
    {
        "id": "vaso-almada", "slug": "vaso-almada",
        "name": "Vaso Almada", "category": "Objetos Decorativos", "category_slug": "objetos-decorativos",
        "price": 139.00,
        "description": "Um vaso de volume macio e geometria acolhedora. Uma peça de presença para aparadores, estantes e mesas laterais.",
        "long_description": "O Vaso Almada nasceu de um estudo de volumes suaves. Sua base larga e boca contida convidam a composições com galhos secos, flores singulares ou apenas o próprio silêncio.",
        "colors": ["Lavanda Suave", "Areia", "Rosa Queimado"],
        "dimensions": "16 x 16 x 18 cm",
        "materials": "Produzido sob demanda em material de origem vegetal. As sutis camadas fazem parte da textura e da identidade de cada peça.",
        "care": "Utilizar com recipiente interno de vidro para arranjos com água.",
        "shipping_info": "Enviamos para todo o Brasil. Produção em até 5 dias úteis.",
        "important_note": "Ideal com galhos secos ou recipiente interno de vidro.",
        "use_cases": ["Sala", "Aparador", "Home office"],
        "images": [
            "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=1400&q=85&auto=format&fit=crop&crop=entropy",
            "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=1400&q=85&auto=format&fit=crop&sat=-10",
            "https://images.unsplash.com/photo-1667239321923-c9f75a7c68f2?w=1400&q=85&auto=format&fit=crop",
        ],
        "featured": True, "new": True, "bestseller": True,
        "combines_with": ["cachepo-trama", "bandeja-ritual"],
    },
    {
        "id": "porta-utensilios-canto", "slug": "porta-utensilios-canto",
        "name": "Porta-utensílios Canto", "category": "Organização", "category_slug": "organizacao",
        "price": 79.00,
        "description": "Organizador compacto de cantos arredondados para canetas, pincéis, escovas ou utensílios de uso diário.",
        "long_description": "Compacto e discreto, funciona tanto na mesa de trabalho quanto na bancada do banheiro. Uma peça neutra que se integra a qualquer paleta.",
        "colors": ["Off-white", "Verde Sálvia", "Argila"],
        "dimensions": "14 x 9 x 11 cm",
        "materials": "Produzido sob demanda em material de origem vegetal. As sutis camadas fazem parte da textura e da identidade de cada peça.",
        "care": "Limpeza com pano macio levemente úmido.",
        "shipping_info": "Enviamos para todo o Brasil. Produção em até 5 dias úteis.",
        "use_cases": ["Home office", "Banheiro", "Cozinha"],
        "images": [
            "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1400&q=85&auto=format&fit=crop&crop=entropy",
            "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1400&q=85&auto=format&fit=crop&sat=-10",
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&q=85&auto=format&fit=crop",
        ],
        "featured": False, "new": False, "bestseller": True,
        "combines_with": ["organizador-nodulo"],
    },
    {
        "id": "bowl-casca", "slug": "bowl-casca",
        "name": "Bowl Casca", "category": "Mesa & Receber", "category_slug": "mesa-receber",
        "price": 129.00,
        "description": "Um bowl de duas partes pensado para servir pistaches e acomodar as cascas com elegância. Feito para encontros despretensiosos e bons detalhes à mesa.",
        "long_description": "O Bowl Casca traz uma solução gentil para servir aperitivos com cascas. A peça interna acomoda pistaches, azeitonas ou nozes, enquanto a borda externa recebe os descartes sem quebrar o ritmo da conversa.",
        "colors": ["Mostarda Suave", "Verde Oliva", "Terracota"],
        "dimensions": "20 cm de diâmetro x 9 cm de altura",
        "materials": "Produzido sob demanda em material de origem vegetal. As sutis camadas fazem parte da textura e da identidade de cada peça.",
        "care": "Limpar com pano macio. Para alimentos, utilizar recipiente interno adequado.",
        "shipping_info": "Enviamos para todo o Brasil. Produção em até 5 dias úteis.",
        "important_note": "Peça decorativa e de servir. Para alimentos, utilizar recipiente interno adequado.",
        "use_cases": ["Mesa posta", "Aperitivos", "Encontros"],
        "images": [
            "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1400&q=85&auto=format&fit=crop&crop=entropy",
            "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1400&q=85&auto=format&fit=crop&sat=-10",
            "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1400&q=85&auto=format&fit=crop",
        ],
        "featured": True, "new": True, "bestseller": False,
        "combines_with": ["porta-copos-laco", "bandeja-ritual"],
    },
    {
        "id": "porta-copos-laco", "slug": "porta-copos-laco",
        "name": "Porta-copos Laço", "category": "Mesa & Receber", "category_slug": "mesa-receber",
        "price": 69.00,
        "description": "Conjunto de porta-copos com desenho contínuo e leveza gráfica. Um detalhe simples para cafés, encontros e mesas do dia a dia.",
        "long_description": "O desenho contínuo do Laço se apresenta como uma linha delicada em torno do copo. Um pequeno gesto gráfico que compõe mesas discretas e sofisticadas.",
        "colors": ["Areia", "Café com Leite", "Off-white"],
        "dimensions": "10 x 10 cm cada",
        "variants": ["Kit com 2", "Kit com 4"],
        "materials": "Produzido sob demanda em material de origem vegetal.",
        "care": "Limpar com pano macio levemente úmido.",
        "shipping_info": "Enviamos para todo o Brasil. Produção em até 5 dias úteis.",
        "use_cases": ["Mesa posta", "Café", "Encontros"],
        "images": [
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&q=85&auto=format&fit=crop&crop=entropy",
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&q=85&auto=format&fit=crop&sat=-10",
            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1400&q=85&auto=format&fit=crop",
        ],
        "featured": False, "new": False, "bestseller": True,
        "combines_with": ["bowl-casca"],
    },
]

MOCK_REVIEWS = [
    {"author": "Marina S.", "rating": 5, "date": "2026-01-10", "title": "Detalhes que fazem diferença", "text": "Peça linda, textura sutil e cor exatamente como na foto. A embalagem também é caprichada."},
    {"author": "Ana Paula L.", "rating": 5, "date": "2025-12-18", "title": "Perfeito para o meu lavabo", "text": "Combinou com tudo e ficou lindo. Recomendo demais."},
    {"author": "Rafael C.", "rating": 4, "date": "2025-12-02", "title": "Presente muito bem recebido", "text": "Dei de presente para a minha irmã que ama design. Amou. Chegou dentro do prazo."},
    {"author": "Clara M.", "rating": 5, "date": "2026-01-22", "title": "Sofisticado e discreto", "text": "É daquelas peças que a gente olha e sente bem. Muito bem acabada."},
]

DEMO_COUPONS = {
    "BEMVINDO10": {"type": "percent", "value": 10, "min": 0, "desc": "10% off no primeiro pedido"},
    "FRETEGRATIS": {"type": "shipping", "value": 0, "min": 200, "desc": "Frete grátis acima de R$ 200"},
}

# ============ SEED FUNCTION ============
async def seed_database():
    count = await db.products.count_documents({})
    if count == 0:
        docs = []
        for p in PRODUCTS_SEED:
            # len() é estável entre execuções (hash() varia com PYTHONHASHSEED)
            p_full = {**p, "reviews": MOCK_REVIEWS[: (len(p["id"]) % 3) + 2]}
            docs.append(p_full)
        await db.products.insert_many(docs)
        logger.info(f"Seeded {len(docs)} products")

# ============ PRODUCT ROUTES ============
def _build_products_query(
    category: Optional[str], featured: Optional[bool], new: Optional[bool],
    bestseller: Optional[bool], min_price: Optional[float], max_price: Optional[float],
    color: Optional[str], q: Optional[str],
) -> Dict[str, Any]:
    query: Dict[str, Any] = {}
    if category:
        query["category_slug"] = category
    for field, value in (("featured", featured), ("new", new), ("bestseller", bestseller)):
        if value is not None:
            query[field] = value
    price_q: Dict[str, float] = {}
    if min_price is not None:
        price_q["$gte"] = min_price
    if max_price is not None:
        price_q["$lte"] = max_price
    if price_q:
        query["price"] = price_q
    if color:
        query["colors"] = {"$regex": re.escape(color), "$options": "i"}
    if q:
        q_safe = re.escape(q)
        query["$or"] = [
            {"name": {"$regex": q_safe, "$options": "i"}},
            {"description": {"$regex": q_safe, "$options": "i"}},
            {"category": {"$regex": q_safe, "$options": "i"}},
        ]
    return query


_PRODUCT_SORTS: Dict[str, List[tuple]] = {
    "price_asc": [("price", 1)],
    "price_desc": [("price", -1)],
    "new": [("new", -1), ("name", 1)],
    "bestseller": [("bestseller", -1), ("name", 1)],
}


@api_router.get("/products")
async def list_products(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    new: Optional[bool] = None,
    bestseller: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    color: Optional[str] = None,
    q: Optional[str] = None,
    sort: Optional[str] = None,
):
    query = _build_products_query(category, featured, new, bestseller, min_price, max_price, color, q)
    sort_arg = _PRODUCT_SORTS.get(sort or "", [("name", 1)])
    cursor = db.products.find(query, {"_id": 0}).sort(sort_arg)
    return await cursor.to_list(500)

@api_router.get("/products/{slug}")
async def get_product(slug: str):
    p = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return p

@api_router.get("/categories")
async def list_categories():
    return [
        {"slug": "bancada-lavabo", "name": "Bancada & Lavabo", "description": "Objetos para o cuidado diário e composições de bancada."},
        {"slug": "organizacao", "name": "Organização", "description": "Peças para reunir os pequenos itens do dia a dia."},
        {"slug": "mesa-receber", "name": "Mesa & Receber", "description": "Detalhes para servir e receber com intenção."},
        {"slug": "presentes", "name": "Presentes", "description": "Peças selecionadas para presentear com sensibilidade."},
        {"slug": "objetos-decorativos", "name": "Objetos Decorativos", "description": "Vasos, cachepôs e peças de presença para os espaços."},
    ]

# ============ ORDER ROUTES ============
@api_router.post("/orders")
async def create_order(order_in: OrderCreate):
    order = Order(**order_in.model_dump())
    doc = order.model_dump()
    await db.orders.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


# ============ ADMIN AUTH + UPLOAD ============
SESSION_COOKIE = "aure_admin_session"
SESSION_MAX_AGE = 7 * 24 * 3600  # 7 dias

def require_admin(request: Request, authorization: Optional[str] = Header(None)):
    # Aceita Bearer token (clientes de API/testes) ou cookie httpOnly (navegador)
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif request.cookies.get(SESSION_COOKIE):
        token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("email") != ADMIN_EMAIL:
            raise HTTPException(status_code=403, detail="Sem permissão")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

@api_router.post("/admin/login")
async def admin_login(payload: AdminLogin, response: Response):
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Admin não configurado")
    email_ok = secrets.compare_digest(payload.email.encode(), ADMIN_EMAIL.encode())
    password_ok = secrets.compare_digest(payload.password.encode(), ADMIN_PASSWORD.encode())
    if not (email_ok and password_ok):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = jwt.encode(
        {"email": payload.email, "exp": datetime.now(timezone.utc) + timedelta(days=7)},
        JWT_SECRET, algorithm=JWT_ALG,
    )
    # Sessão via cookie httpOnly (inacessível a JS/XSS). Token também retornado p/ clientes de API.
    response.set_cookie(
        SESSION_COOKIE, token,
        max_age=SESSION_MAX_AGE, httponly=True, secure=True, samesite="lax", path="/api",
    )
    return {"token": token, "email": payload.email}

@api_router.post("/admin/logout")
async def admin_logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/api")
    return {"ok": True}

@api_router.get("/admin/verify")
async def admin_verify(admin=Depends(require_admin)):
    return {"ok": True, "email": admin["email"]}

@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), admin=Depends(require_admin)):
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Formato inválido. Use JPG, PNG ou WebP.")
    ext = {"image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[file.content_type]
    fname = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / fname
    size = 0
    with dest.open("wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                out.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Arquivo muito grande. Máximo de 5 MB.")
            out.write(chunk)
    return {"url": f"/api/static/uploads/{fname}", "filename": fname}

async def _send_order_status_email(order: Dict[str, Any]):
    if not (resend and RESEND_API_KEY):
        return False
    try:
        cust = order.get("customer", {})
        to_email = cust.get("email")
        if not to_email:
            return False
        tr = html.escape(order.get("tracking_code") or "")
        nome = html.escape(cust.get("nome", ""))
        order_number = html.escape(str(order.get("order_number", "")))
        status = html.escape(str(order.get("status", "")))
        body = f"""<div style='font-family:Georgia,serif;background:#F9F8F6;padding:32px;color:#2C2825;'>
<div style='max-width:560px;margin:0 auto;background:#fff;padding:40px;border-radius:12px;'>
<h1 style='font-size:24px;font-weight:400;'>Atualização do seu pedido</h1>
<p>Olá {nome},</p>
<p>Seu pedido <b>{order_number}</b> agora está: <b>{status}</b></p>
{f"<p>Código de rastreio: <b>{tr}</b></p>" if tr else ""}
<p style='color:#8A7D72;font-size:13px;'>Auré Casa</p></div></div>"""
        await asyncio.to_thread(resend.Emails.send, {
            "from": EMAIL_FROM, "to": [to_email],
            "subject": f"[Auré Casa] Pedido {order.get('order_number')} · {order.get('status')}",
            "html": body,
        })
        return True
    except Exception as e:
        logger.warning(f"Order status email failed: {e}")
        return False


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    o = await db.orders.find_one({"$or": [{"id": order_id}, {"order_number": order_id}]}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return o

@api_router.patch("/orders/{order_id}")
async def update_order(order_id: str, patch: Dict[str, Any], admin=Depends(require_admin)):
    allowed = {"status", "tracking_code"}
    update = {k: v for k, v in patch.items() if k in allowed}
    if not update:
        raise HTTPException(status_code=400, detail="Nenhum campo válido")
    r = await db.orders.update_one({"id": order_id}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if "status" in update:
        await _send_order_status_email(updated)
    return updated

@api_router.get("/admin/orders")
async def admin_list_orders(admin=Depends(require_admin)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

# ============ COUPONS ============
@api_router.post("/coupons/validate")
async def validate_coupon(payload: CouponCheck):
    code = payload.code.strip().upper()
    if code not in DEMO_COUPONS:
        raise HTTPException(status_code=404, detail="Cupom inválido")
    coupon = DEMO_COUPONS[code]
    if payload.subtotal < coupon.get("min", 0):
        raise HTTPException(status_code=400, detail=f"Pedido mínimo de R$ {coupon['min']:.2f}")
    discount = 0.0
    free_shipping = False
    if coupon["type"] == "percent":
        discount = round(payload.subtotal * (coupon["value"] / 100), 2)
    elif coupon["type"] == "shipping":
        free_shipping = True
    return {"code": code, "discount": discount, "free_shipping": free_shipping, "description": coupon["desc"]}

# ============ CEP LOOKUP (mock) ============
@api_router.post("/shipping/cep")
async def check_cep(payload: CEPCheck):
    cep = "".join(c for c in payload.cep if c.isdigit())
    if len(cep) != 8:
        raise HTTPException(status_code=400, detail="CEP inválido")
    # Mock address by CEP prefix
    prefix = cep[:2]
    regions = {
        "01": {"cidade": "São Paulo", "estado": "SP", "bairro": "Centro", "endereco": "Rua Exemplo"},
        "20": {"cidade": "Rio de Janeiro", "estado": "RJ", "bairro": "Centro", "endereco": "Rua Exemplo"},
        "30": {"cidade": "Belo Horizonte", "estado": "MG", "bairro": "Centro", "endereco": "Rua Exemplo"},
        "40": {"cidade": "Salvador", "estado": "BA", "bairro": "Centro", "endereco": "Rua Exemplo"},
        "80": {"cidade": "Curitiba", "estado": "PR", "bairro": "Centro", "endereco": "Rua Exemplo"},
        "90": {"cidade": "Porto Alegre", "estado": "RS", "bairro": "Centro", "endereco": "Rua Exemplo"},
    }
    addr = regions.get(prefix, {"cidade": "Cidade", "estado": "UF", "bairro": "Bairro", "endereco": "Rua"})
    shipping_cost = 24.90 if prefix in {"01", "20", "30"} else 34.90
    delivery_days = "3 a 7 dias úteis" if prefix in {"01", "20", "30"} else "5 a 12 dias úteis"
    return {"cep": cep, **addr, "shipping_cost": shipping_cost, "delivery_estimate": delivery_days}

# ============ NEWSLETTER ============
@api_router.post("/newsletter")
async def newsletter_subscribe(payload: NewsletterSignup):
    doc = {
        "id": str(uuid.uuid4()),
        "email": payload.email,
        "name": payload.name or "",
        "created_at": now_iso(),
    }
    existing = await db.newsletter.find_one({"email": payload.email})
    if not existing:
        await db.newsletter.insert_one(doc)
    # Send confirmation email if resend configured
    sent = False
    if resend and RESEND_API_KEY:
        try:
            html = """
            <div style="font-family: Georgia, serif; background:#F9F8F6; padding: 32px; color:#2C2825;">
              <div style="max-width: 560px; margin:0 auto; background:#FFFFFF; padding:40px; border-radius: 12px;">
                <h1 style="font-size:28px; font-weight:400; margin:0 0 16px;">Auré Casa</h1>
                <p style="font-size:16px; line-height:1.6;">Bem-vindo à nossa lista.</p>
                <p style="font-size:15px; line-height:1.7; color:#5C5449;">
                  Você receberá lançamentos, cores novas e coleções em primeira mão.
                  Obrigado por se conectar à Auré.
                </p>
                <p style="font-size:13px; color:#8A7D72; margin-top: 32px;">Objetos para os detalhes que transformam a casa.</p>
              </div>
            </div>
            """
            await asyncio.to_thread(resend.Emails.send, {
                "from": EMAIL_FROM,
                "to": [payload.email],
                "subject": "Bem-vindo à Auré Casa",
                "html": html,
            })
            sent = True
        except Exception as e:
            logger.warning(f"Newsletter email failed: {e}")
    return {"status": "ok", "email_sent": sent}

# ============ CONTACT FORM ============
@api_router.post("/contact")
async def contact_form(payload: ContactMessage):
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_at": now_iso(),
    }
    await db.contacts.insert_one(doc)
    sent = False
    if resend and RESEND_API_KEY and EMAIL_OWNER:
        try:
            safe_name = html.escape(payload.name)
            safe_subject = html.escape(payload.subject or "")
            safe_message = html.escape(payload.message).replace("\n", "<br>")
            html_admin = f"""
            <div style="font-family: Arial, sans-serif; color:#2C2825;">
              <h2>Novo contato — Auré Casa</h2>
              <p><b>Nome:</b> {safe_name}</p>
              <p><b>Email:</b> {html.escape(payload.email)}</p>
              <p><b>Assunto:</b> {safe_subject}</p>
              <p><b>Mensagem:</b><br>{safe_message}</p>
            </div>
            """
            await asyncio.to_thread(resend.Emails.send, {
                "from": EMAIL_FROM,
                "to": [EMAIL_OWNER],
                "subject": f"[Auré Casa] {payload.subject}",
                "html": html_admin,
            })
            html_user = f"""
            <div style="font-family: Georgia, serif; background:#F9F8F6; padding: 32px; color:#2C2825;">
              <div style="max-width: 560px; margin:0 auto; background:#FFFFFF; padding:40px; border-radius: 12px;">
                <h1 style="font-size:24px; font-weight:400;">Recebemos sua mensagem</h1>
                <p>Olá {safe_name},</p>
                <p>Obrigado por escrever à Auré Casa. Nossa equipe responderá em breve.</p>
                <p style="color:#8A7D72; font-size:13px;">Auré Casa · Objetos para os detalhes que transformam a casa.</p>
              </div>
            </div>
            """
            await asyncio.to_thread(resend.Emails.send, {
                "from": EMAIL_FROM,
                "to": [payload.email],
                "subject": "Recebemos sua mensagem — Auré Casa",
                "html": html_user,
            })
            sent = True
        except Exception as e:
            logger.warning(f"Contact email failed: {e}")
    return {"status": "ok", "email_sent": sent}

# ============ ADMIN STATS ============
@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({})
    newsletter_count = await db.newsletter.count_documents({})
    contacts_count = await db.contacts.count_documents({})
    # Mock revenue chart (last 7 days)
    import random
    random.seed(42)
    chart = []
    for i in range(7):
        chart.append({"day": f"Dia {i+1}", "revenue": random.randint(600, 2400)})
    orders = await db.orders.find({}, {"_id": 0}).to_list(500)
    total_revenue = sum(o.get("total", 0) for o in orders)
    return {
        "total_orders": total_orders,
        "total_products": total_products,
        "newsletter_count": newsletter_count,
        "contacts_count": contacts_count,
        "total_revenue": total_revenue,
        "chart": chart,
    }

@api_router.get("/admin/products")
async def admin_list_products(admin=Depends(require_admin)):
    return await db.products.find({}, {"_id": 0}).to_list(500)

@api_router.patch("/admin/products/{product_id}")
async def admin_update_product(product_id: str, patch: Dict[str, Any], admin=Depends(require_admin)):
    patch.pop("_id", None)
    r = await db.products.update_one({"id": product_id}, {"$set": patch})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return await db.products.find_one({"id": product_id}, {"_id": 0})

@api_router.post("/admin/products")
async def admin_create_product(product: Product, admin=Depends(require_admin)):
    doc = product.model_dump()
    if await db.products.find_one({"id": doc["id"]}):
        raise HTTPException(status_code=400, detail="ID duplicado")
    await db.products.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin=Depends(require_admin)):
    r = await db.products.delete_one({"id": product_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {"status": "ok"}

@api_router.get("/admin/newsletter")
async def admin_list_newsletter(admin=Depends(require_admin)):
    return await db.newsletter.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.get("/admin/contacts")
async def admin_list_contacts(admin=Depends(require_admin)):
    return await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api_router.get("/")
async def root():
    return {"brand": "Auré Casa", "status": "ok"}

app.include_router(api_router)

# Origens explícitas (nunca "*"): allow_credentials exige origem específica
# para o cookie de sessão admin funcionar.
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
