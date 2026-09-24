import sqlite3
import hashlib
import getpass

# Função para encriptar a palavra-passe (igual à da API)
def hash_senha(senha):
    return hashlib.sha256(senha.encode()).hexdigest()

def criar_admin():
    print("\n🍔 === Criar Conta de Administrador (Dono) ===")
    nome = input("Nome do Dono: ")
    email = input("E-mail de Acesso: ")
    
    # getpass esconde a senha enquanto você digita no terminal
    senha = getpass.getpass("Palavra-passe (ficará invisível ao digitar): ")

    conn = sqlite3.connect('hamburgueria.db')
    cursor = conn.cursor()

    try:
        # Inserimos forçando o tipo_conta como 'dono'
        cursor.execute(
            "INSERT INTO utilizadores (nome, email, palavra_passe, tipo_conta) VALUES (?, ?, ?, 'dono')",
            (nome, email, hash_senha(senha))
        )
        conn.commit()
        print(f"\n✅ Sucesso! A conta de dono para '{email}' foi criada.")
    except sqlite3.IntegrityError:
        print("\n❌ Erro: Este e-mail já está registado na base de dados.")
    finally:
        conn.close()

if __name__ == "__main__":
    criar_admin()