# AI Investigation Assistant — Backend

An AI-powered legal support and investigation platform built with FastAPI, MongoDB, FAISS, LangChain, and Grok API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI + Python 3.12+ |
| Database | MongoDB (Motor async driver) |
| Vector DB | FAISS (Facebook AI Similarity Search) |
| AI/LLM | Grok API (xAI) |
| RAG Framework | LangChain |
| Embeddings | Sentence Transformers (all-MiniLM-L6-v2) |
| Auth | JWT (python-jose) + bcrypt |
| Validation | Pydantic v2 |

---

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── auth/           # JWT dependency injection & RBAC
│   │   └── routes/         # All API routers
│   ├── config/             # Settings & environment config
│   ├── core/               # Security, exceptions, logging
│   ├── database/           # MongoDB connection & indexes
│   ├── graph/              # Evidence graph module
│   ├── middleware/         # Request logging middleware
│   ├── models/             # MongoDB document models
│   ├── rag/                # RAG pipeline & Grok client
│   ├── schemas/            # Pydantic request/response schemas
│   ├── services/           # Business logic layer
│   ├── utils/              # File handling, chunking, helpers
│   ├── vector_store/       # FAISS vector store manager
│   └── main.py             # FastAPI app entry point
├── uploads/                # Uploaded documents
├── reports/                # Generated reports
├── logs/                   # Application logs
├── run.py                  # Server entry point
├── requirements.txt
├── .env.example
└── README.md
```

---

## Quick Start

### 1. Prerequisites

- Python 3.12+
- MongoDB running locally or MongoDB Atlas URI
- Grok API key from [https://console.x.ai/](https://console.x.ai/)

### 2. Setup

```bash
# Clone and navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example env
copy .env.example .env   # Windows
cp .env.example .env     # Linux/Mac

# Edit .env and set:
# - GROK_API_KEY=your-actual-grok-api-key
# - JWT_SECRET_KEY=your-random-secret-key
# - MONGODB_URL=your-mongodb-connection-string
```

### 4. Run the Server

```bash
python run.py
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access API Documentation

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Default Admin Account

On first startup, a default admin is created:

| Field | Value |
|---|---|
| Email | admin@investigation.gov |
| Password | Admin@123456 |

**Change these immediately in production via `.env`.**

---

## User Roles & Permissions

| Role | Chatbot | Cases | Evidence | Documents | Graph | Reports | Admin |
|---|---|---|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Police Officer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Investigation Officer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Lawyer | ✅ | Read | Read | ✅ | Read | ✅ | ❌ |
| Public | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## API Endpoints

### Authentication — `/api/v1/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/login` | Login & get JWT tokens |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout & revoke token |
| POST | `/change-password` | Change password |

### Users — `/api/v1/users`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Get own profile |
| PUT | `/me` | Update own profile |
| GET | `/` | List all users (Admin) |
| GET | `/{id}` | Get user by ID (Admin) |
| PUT | `/{id}` | Update user (Admin) |
| DELETE | `/{id}` | Delete user (Admin) |

### Chatbot — `/api/v1/chat`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Send message (with RAG) |
| GET | `/sessions` | List chat sessions |
| GET | `/sessions/{id}` | Get session history |
| DELETE | `/sessions/{id}` | Delete session |

### Legal Recommendation — `/api/v1/legal`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/recommend` | Get legal section recommendations |
| POST | `/search` | Semantic search in legal documents |

### Cases — `/api/v1/cases`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create case |
| GET | `/` | List cases |
| GET | `/stats` | Case statistics |
| GET | `/{id}` | Get case |
| PUT | `/{id}` | Update case |
| DELETE | `/{id}` | Delete case |
| POST | `/{id}/evidence` | Add evidence |
| GET | `/{id}/evidence` | Get case evidence |

### Evidence Graph — `/api/v1/graph`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/cases/{id}` | Get full graph (nodes + edges) |
| POST | `/nodes` | Add graph node |
| POST | `/relationships` | Add relationship |
| DELETE | `/nodes/{id}` | Delete node |
| DELETE | `/relationships/{id}` | Delete relationship |

### Documents — `/api/v1/documents`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload & index document |
| GET | `/` | List documents |
| GET | `/stats` | FAISS index stats |
| GET | `/{id}` | Get document |
| DELETE | `/{id}` | Delete & deindex (Admin) |

### Reports — `/api/v1/reports`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create manual report |
| POST | `/generate` | Generate AI report |
| GET | `/` | List reports |
| GET | `/{id}` | Get report |
| POST | `/{id}/finalize` | Finalize report |
| DELETE | `/{id}` | Delete report |

### Admin — `/api/v1/admin`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | System dashboard stats |
| GET | `/health` | System health check |

---

## RAG Pipeline

1. Upload legal PDF/DOCX/TXT via `/api/v1/documents/upload`
2. Text is extracted and split into chunks (1000 chars, 200 overlap)
3. Chunks are embedded using `all-MiniLM-L6-v2`
4. Embeddings stored in FAISS with metadata
5. On chat/legal query → top-K similar chunks retrieved
6. Context + query sent to Grok API for response generation

---

## Evidence Graph

The graph API returns nodes and edges in a format ready for frontend visualization libraries like:
- **React Flow**
- **D3.js**
- **Cytoscape.js**
- **vis.js**

Node types: `suspect`, `victim`, `witness`, `evidence`, `case`, `location`, `organization`

Relationship types: `connected_to`, `witnessed`, `victim_of`, `suspect_in`, `linked_to`, `located_at`, `part_of`, `associated_with`

---

## Multilingual Support

All chat and legal recommendation endpoints accept a `language` parameter. The system instructs Grok to respond in the specified language. Supported values follow BCP-47 language codes (e.g., `en`, `hi`, `ta`, `te`, `bn`, `mr`, `gu`).

---

## Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `GROK_API_KEY` | xAI Grok API key | ✅ |
| `JWT_SECRET_KEY` | JWT signing secret (min 32 chars) | ✅ |
| `MONGODB_URL` | MongoDB connection string | ✅ |
| `MONGODB_DB_NAME` | Database name | ✅ |
| `EMBEDDING_MODEL` | Sentence transformer model name | ✅ |
| `FAISS_INDEX_PATH` | Path to store FAISS index files | ✅ |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | ✅ |
| `DEBUG` | Enable debug mode & hot reload | ❌ |

---

## Production Deployment

```bash
# Set environment
DEBUG=False
ENVIRONMENT=production

# Run with gunicorn
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## Frontend Integration

All APIs follow REST standards with consistent response shapes:

- Success: `{ "success": true, "message": "...", "data": {...} }`
- Error: `{ "success": false, "message": "..." }`
- Paginated: `{ "items": [...], "total": N, "page": N, "page_size": N, "total_pages": N }`

The React frontend should:
1. Store `access_token` in memory (not localStorage)
2. Store `refresh_token` in httpOnly cookie
3. Use `/api/v1/auth/refresh` to silently refresh tokens
4. Include `Authorization: Bearer <token>` header on all protected requests
