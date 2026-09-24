import sqlite3

# Os seus dados originais de volta
menu_antigo = [
  {"categoria": "burgers", "nome": "X-Burguer Artesanal", "preco": 25.00, "descricao": "Pão brioche, carne 180g, queijo cheddar e molho especial.", "imagem": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"},
  {"categoria": "burgers", "nome": "X-Salada Especial", "preco": 22.00, "descricao": "Hamburguer 150g, queijo, alface, tomate e maionese da casa.", "imagem": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400"},
  {"categoria": "acompanhamentos", "nome": "Batata Frita Grande", "preco": 16.00, "descricao": "Porção de batata frita crocante com bacon e cheddar.", "imagem": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400"},
  {"categoria": "bebidas", "nome": "Refrigerante Lata 350ml", "preco": 6.00, "descricao": "Coca-Cola, Guaraná ou Soda.", "imagem": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400"},
  {"categoria": "bebidas", "nome": "Suco Natural 500ml", "preco": 8.50, "descricao": "Sabores: Laranja, Limão ou Maracujá.", "imagem": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400"}
]

conn = sqlite3.connect('hamburgueria.db')
cursor = conn.cursor()

try:
    for item in menu_antigo:
        cursor.execute(
            "INSERT INTO produtos (categoria, nome, preco, descricao, imagem) VALUES (?, ?, ?, ?, ?)",
            (item['categoria'], item['nome'], item['preco'], item['descricao'], item['imagem'])
        )
    conn.commit()
    print("✅ Os 5 produtos originais foram restaurados no banco de dados com sucesso!")
except sqlite3.Error as e:
    print(f"❌ Erro ao inserir dados: {e}")
finally:
    conn.close()