#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "Auré Casa — e-commerce premium BR. Sessão atual: auditoria E2E real de todos os fluxos (admin auth, CRUD produtos com upload, catálogo, carrinho, checkout demo, pedidos/status/tracking, newsletter, contato, sessão inválida), corrigir apenas bugs encontrados sem alterar visual, e criar documentação."

backend:
  - task: "Admin login JWT (/api/admin/login, /api/admin/verify)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Credenciais em /app/memory/test_credentials.md. Corrigido .env malformado (linha CORS_ORIGINS+EMERGENT_LLM_KEY coladas) e bloco duplicado no fim do server.py (router/CORS/startup 2x). Precisa testar login válido, inválido, token expirado/inválido."
      - working: true
        agent: "testing"
        comment: "✅ PASS (5/5 tests): Login válido retorna token JWT correto. Login inválido retorna 401. Token válido verificado com sucesso. Sem token retorna 401. Token inválido/adulterado retorna 401. Autenticação admin funcionando perfeitamente."
  - task: "Admin products CRUD + upload (/api/admin/products, /api/admin/upload)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST/PATCH/DELETE produtos com Bearer token. Upload aceita jpg/png/webp, salva em static/uploads, retorna /api/static/uploads/<file>. Testar sem token (401), formato inválido (400), e servir arquivo estático."
      - working: true
        agent: "testing"
        comment: "✅ PASS (8/8 tests): GET /api/admin/products retorna 8 produtos seed com token, 401 sem token. POST cria produto completo com todos campos do modelo Product. PATCH edita nome/preço/imagens (testado reordenação de imagens para mudar imagem principal). DELETE remove produto e verifica 404 após deleção. Upload PNG válido funciona e arquivo é servido corretamente em /api/static/uploads/. Upload com content-type inválido retorna 400. Upload sem token retorna 401. CRUD completo funcionando."
  - task: "Catálogo público (/api/products, /api/products/{slug}, /api/categories)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Seed de 8 produtos. Testar filtros (categoria, cor, preço, sort), slug inexistente (404)."
      - working: true
        agent: "testing"
        comment: "✅ PASS (5/5 tests): GET /api/products retorna 8 produtos seed. Filtros funcionando: category (2 produtos em bancada-lavabo), sort=price_asc (ordenação correta), min_price/max_price (4 produtos entre R$100-150), color=Areia (5 produtos). GET /api/products/bandeja-ritual retorna produto correto. Slug inexistente retorna 404. GET /api/categories retorna 5 categorias. Catálogo público totalmente funcional."
  - task: "Pedidos (/api/orders POST/GET, PATCH status+tracking admin)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST público (checkout demo), PATCH requer admin (status, tracking_code). Email de status via Resend só se RESEND_API_KEY setada (vazia — não deve quebrar)."
      - working: true
        agent: "testing"
        comment: "✅ PASS (7/7 tests): POST /api/orders cria pedido com order_number e id. GET /api/orders/{id} e /api/orders/{order_number} retornam pedido correto. PATCH com admin token atualiza status e tracking_code (testado 'Enviado' + 'BR123456789'). PATCH sem token retorna 401. PATCH com campo não permitido (total) retorna 400. PATCH com id inexistente retorna 404. RESEND_API_KEY vazia não quebra fluxo (email_sent: false). Sistema de pedidos completo e funcional."
  - task: "Cupons e CEP (/api/coupons/validate, /api/shipping/cep)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Cupons: BEMVINDO10, FRETEGRATIS (min R$200). CEP mock por prefixo."
      - working: true
        agent: "testing"
        comment: "✅ PASS (6/6 tests): BEMVINDO10 valida corretamente (10% de R$200 = R$20 desconto). FRETEGRATIS válido com subtotal >= R$200 (free_shipping: true). FRETEGRATIS com subtotal < R$200 retorna 400 com mensagem de pedido mínimo. Cupom inexistente retorna 404. CEP 01310-100 retorna São Paulo/SP com frete R$24.90. CEP 99999-999 retorna dados mock com frete R$34.90. Sistema de cupons e CEP funcionando."
  - task: "Newsletter e Contato (/api/newsletter, /api/contact)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Salvam no Mongo; Resend opcional (chave vazia). Testar duplicidade de email na newsletter e validação de payload."
      - working: true
        agent: "testing"
        comment: "✅ PASS (7/7 tests): POST /api/newsletter com email novo retorna status ok. Email duplicado tratado graciosamente (sem erro, retorna 200). Email inválido retorna 422 com validação Pydantic. POST /api/contact com payload válido retorna status ok. Payload inválido (campos faltando) retorna 422. GET /api/admin/newsletter retorna lista de inscritos (2 encontrados). GET /api/admin/contacts retorna lista de mensagens (1 encontrada). RESEND_API_KEY vazia não quebra (email_sent: false). Newsletter e contato funcionando."

frontend:
  - task: "Fluxo admin UI (login, produtos, upload, reordenação, imagem principal, pedidos, logout, sessão inválida)"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/AdminLogin.jsx, Admin.jsx, AdminProducts.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Aguardando auditoria E2E autorizada pelo usuário."
  - task: "Fluxo loja (home, catálogo, produto, hover desktop, carrinho, checkout demo, confirmação, newsletter, contato)"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Aguardando auditoria E2E autorizada pelo usuário."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: true

test_plan:
  current_focus:
    - "Admin login JWT (/api/admin/login, /api/admin/verify)"
    - "Admin products CRUD + upload (/api/admin/products, /api/admin/upload)"
    - "Catálogo público (/api/products, /api/products/{slug}, /api/categories)"
    - "Pedidos (/api/orders POST/GET, PATCH status+tracking admin)"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Auditoria E2E solicitada pelo usuário. Backend primeiro. Correções já feitas antes do teste: (1) .env linha 3 malformada corrigida, (2) bloco duplicado removido do fim de server.py. Credenciais admin em /app/memory/test_credentials.md. RESEND_API_KEY vazia — emails não devem quebrar fluxos."
  - agent: "testing"
    message: "✅ BACKEND E2E COMPLETO: Executados 38 testes cobrindo todos os fluxos solicitados. 100% de sucesso (38/38 passed, 0 failed). Todos os endpoints funcionando corretamente: (1) Admin auth com JWT, (2) CRUD produtos + upload de imagens, (3) Catálogo público com filtros, (4) Sistema de pedidos com atualização de status/tracking, (5) Cupons e CEP, (6) Newsletter e contato. Validações de erro (401, 400, 404, 422) funcionando. RESEND_API_KEY vazia não quebra fluxos (graceful degradation). Backend está production-ready. Arquivo de teste: /app/backend_test.py. Frontend aguardando autorização do usuário para teste."

