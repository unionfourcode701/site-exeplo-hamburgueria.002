from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sqlite3
import hashlib

app = FastAPI(title="Lanchonete Express API")

# Configuração CORS para permitir que o front-end (HTML/JS) faça requisições à API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, substitua "*" pelo domínio do site
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicialização da Base de Dados
def init_db():
    conn = sqlite3.connect('hamburgueria.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS utilizadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT,
            endereco TEXT,
            email TEXT UNIQUE NOT NULL,
            palavra_passe TEXT NOT NULL,
            tipo_conta TEXT DEFAULT 'cliente'
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria TEXT NOT NULL,
            nome TEXT NOT NULL,
            preco REAL NOT NULL,
            descricao TEXT,
            imagem TEXT
        )
    ''')
    
    # Criar a conta de administrador por defeito (se não existir)
    senha_admin_hash = hashlib.sha256("admin123".encode()).hexdigest()
    cursor.execute('''
        INSERT OR IGNORE INTO utilizadores (nome, email, palavra_passe, tipo_conta) 
        VALUES ('Administrador', 'admin@lanchonete.com', ?, 'dono')
    ''', (senha_admin_hash,))
    
    conn.commit()
    conn.close()

init_db()

# Modelos de Dados (Pydantic) para validação das requisições
class RegistoUtilizador(BaseModel):
    nome: str
    telefone: str
    endereco: str
    email: str
    senha: str

class LoginUtilizador(BaseModel):
    email: str
    senha: str

# Função auxiliar para encriptar palavras-passe
def hash_senha(senha: str) -> str:
    return hashlib.sha256(senha.encode()).hexdigest()

# Endpoint: Registar novo cliente
@app.post("/api/registar", status_code=status.HTTP_201_CREATED)
def registar_cliente(utilizador: RegistoUtilizador):
    conn = sqlite3.connect('hamburgueria.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO utilizadores (nome, telefone, endereco, email, palavra_passe) VALUES (?, ?, ?, ?, ?)",
            (utilizador.nome, utilizador.telefone, utilizador.endereco, utilizador.email, hash_senha(utilizador.senha))
        )
        conn.commit()
        return {"mensagem": "Conta criada com sucesso!"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Este e-mail já está registado.")
    finally:
        conn.close()

# Endpoint: Iniciar Sessão (Login)
@app.post("/api/login")
def iniciar_sessao(credenciais: LoginUtilizador):
    conn = sqlite3.connect('hamburgueria.db')
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, nome, endereco, tipo_conta FROM utilizadores WHERE email = ? AND palavra_passe = ?",
        (credenciais.email, hash_senha(credenciais.senha))
    )
    resultado = cursor.fetchone()
    conn.close()
    
    if resultado:
        return {
            "id": resultado[0],
            "nome": resultado[1],
            "endereco": resultado[2],
            "tipo_conta": resultado[3]
        }
    else:
        raise HTTPException(status_code=401, detail="E-mail ou palavra-passe incorretos.")
    
@app.get("/")
def ler_raiz():
    return {"mensagem": "API da Lanchonete Express está online!"}

# --- Gestão do Cardápio ---

class NovoProduto(BaseModel):
    categoria: str
    nome: str
    preco: float
    descricao: str
    imagem: str

@app.get("/api/produtos")
def listar_produtos():
    conn = sqlite3.connect('hamburgueria.db')
    cursor = conn.cursor()
    # Retorna todos os produtos
    cursor.execute("SELECT id, categoria, nome, preco, descricao, imagem FROM produtos")
    linhas = cursor.fetchall()
    conn.close()
    
    produtos = []
    for linha in linhas:
        produtos.append({
            "id": linha[0],
            "category": linha[1],
            "name": linha[2],
            "price": linha[3],
            "desc": linha[4],
            "img": linha[5]
        })
    return produtos

@app.post("/api/produtos", status_code=status.HTTP_201_CREATED)
def adicionar_produto(produto: NovoProduto):
    conn = sqlite3.connect('hamburgueria.db')
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO produtos (categoria, nome, preco, descricao, imagem) VALUES (?, ?, ?, ?, ?)",
        (produto.categoria, produto.nome, produto.preco, produto.descricao, produto.imagem)
    )
    conn.commit()
    conn.close()
    return {"mensagem": "Produto adicionado ao cardápio com sucesso!"}