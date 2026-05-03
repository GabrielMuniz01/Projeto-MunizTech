CREATE DATABASE IF NOT EXISTS db_muniztech;
USE db_muniztech;

-- 2. Tabela de Usuários (Entidade Principal)
-- Armazena Admin e Clientes
CREATE TABLE IF NOT EXISTS tbl_usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('admin', 'cliente') DEFAULT 'cliente',
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB;

-- 3. Tabela de Categorias de Serviços
-- Ex: Reparo, Manutenção, Upgrade
CREATE TABLE IF NOT EXISTS tbl_categorias_servicos (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    titulo_servico VARCHAR(50) NOT NULL,
    descricao_breve VARCHAR(255)
) ENGINE=InnoDB;

-- 4. Tabela de Ordens de Serviço (Relacionamentos)
-- Relaciona o Cliente ao Serviço e ao seu Equipamento
CREATE TABLE IF NOT EXISTS tbl_ordens_servico (
    id_os INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_categoria INT NOT NULL,
    equipamento_modelo VARCHAR(100) NOT NULL,
    descricao_problema TEXT,
    status_servico ENUM('Analise', 'Manutencao', 'Aguardando Pecas', 'Pronto', 'Entregue') DEFAULT 'Analise',
    valor_total DECIMAL(10, 2) DEFAULT 0.00,
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_conclusao DATE,
    CONSTRAINT fk_os_cliente FOREIGN KEY (id_cliente) REFERENCES tbl_usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_os_categoria FOREIGN KEY (id_categoria) REFERENCES tbl_categorias_servicos(id_categoria)
) ENGINE=InnoDB;

-- 5. Tabela de Contatos (Mensagens do Site)
CREATE TABLE IF NOT EXISTS tbl_contatos (
    id_contato INT AUTO_INCREMENT PRIMARY KEY,
    nome_visitante VARCHAR(100) NOT NULL,
    email_visitante VARCHAR(100) NOT NULL,
    mensagem_texto TEXT NOT NULL,
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    situacao ENUM('pendente', 'respondido') DEFAULT 'pendente'
) ENGINE=InnoDB;

-- ==========================================================
-- INSERÇÃO DE DADOS INICIAIS (DML)
-- ==========================================================

-- Serviços padrão do site
/* INSERT INTO tbl_categorias_servicos (titulo_servico, descricao_breve) VALUES 
('Reparo ', 'Reparos em hardware e placa-mãe'),
('Manutenção Preventiva', 'Limpeza e troca de pasta térmica'),
('Upgrade', 'Instalação de SSD e Memória RAM'); 
*/

SELECT * FROM tbl_categorias_servicos;

-- Administrador padrão (Você)
INSERT INTO tbl_usuarios (nome_completo, email, username, senha, perfil) 
VALUES ('Gabriel Muniz', 'muniztech01@outlook.com', 'admin', 'admin123', 'admin');

-- Cliente de exemplo para testes
INSERT INTO tbl_usuarios (nome_completo, email, username, senha, perfil) 
VALUES ('João Silva', 'joao@cliente.com', 'joaosilva', 'cliente123', 'cliente');

SELECT * FROM tbl_usuarios;

-- Ordem de Serviço inicial para teste
INSERT INTO tbl_ordens_servico (id_cliente, id_categoria, equipamento_modelo, descricao_problema, status_servico)
VALUES (2, 1, 'Notebook Dell Vostro', 'Não liga após queda de energia', 'Analise');

SELECT * FROM tbl_ordens_servico;
