from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router

app = FastAPI(
    title="Element Maker API",
    description="Backend Server Mandiri untuk Pembuat Elemen Poster & Desain Grafis AI",
    version="0.1.0",
)

# Pengaturan Akses Peramban (CORS) agar aplikasi React lancar terhubung
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8009, reload=True)
