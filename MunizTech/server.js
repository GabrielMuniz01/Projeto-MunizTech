// server.js - Arquivo principal do servidor Node.js usando Express
// Este arquivo configura um servidor Express que se conecta a um banco de dados MySQL e define rotas para listar serviços e cadastrar usuários.
// Importações necessárias para o servidor
// Importa o framework Express para criar o servidor
const express = require('express'); // Importa o framework Express para criar o servidor
const mysql = require('mysql2'); // Importa o módulo mysql2 para conectar ao banco de dados MySQL
const cors = require('cors'); // Importa o módulo cors para permitir requisições de diferentes origens (útil para desenvolvimento local);
const { body, validationResult } = require('express-validator'); // Importa ferramentas de validação
const path = require('path'); // Importa o módulo path para lidar com caminhos de arquivos

const app = express();

// Configurações básicas
app.use(cors()); // Libera o acesso para seu site
app.use(express.json()); // Permite que API entenda dados em formato JSON

// Configura o Express para servir os arquivos estáticos (HTML, CSS, Imagens, JS do navegador)
// Isso permite que você acesse http://localhost:3000 e veja o seu Index.html
app.use(express.static(__dirname));

// Rota para garantir que a página inicial seja o Index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Index.html'));
});

// conexao com o banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Geralmente o padão é 'root', mas pode variar dependendo da configuração do seu MySQL
    password: '34102730',
    database: 'db_muniztech'
});

// Testa a conexão com o banco de dados
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conexão com o banco de dados estabelecida com sucesso!');

    // Garantir que o enum status_servico aceite o valor 'Pendente' em bancos já existentes
    const alterEnum = `ALTER TABLE tbl_ordens_servico MODIFY status_servico ENUM('Pendente','Analise','Manutencao','Aguardando Pecas','Pronto','Entregue') DEFAULT 'Pendente'`;
    db.query(alterEnum, (alterErr) => {
        if (alterErr) {
            console.error('Erro ao ajustar enum status_servico:', alterErr.message || alterErr);
        } else {
            console.log('Enum status_servico ajustado com sucesso.');
        }
    });
});

// 2. Criando a nossa primeira ROTA (O caminho que o site vai chamar)
//  Vamos criar uma rota que lista os serviços do banco de dados

app.get('/servicos', (req, res) => {
    const sql = 'SELECT * FROM tbl_categorias_servicos'; // A consulta SQL para selecionar todos os serviços
    db.query(sql, (err, results) => { // Executa a consulta
        if (err) {
            console.error('Erro ao buscar os serviços:', err);
            res.status(500).json({ error: 'Erro ao buscar os serviços' }); // Retorna um erro para o cliente
            return;
        }
        res.status(200).json(results); // Retorna os resultados para o cliente
    });
});

// Rota para o Formulário de Contato
app.post('/contato', [
    body('nome').isLength({ min: 3 }).withMessage('O nome deve ter pelo menos 3 caracteres'),
    body('email').isEmail().withMessage('Informe um e-mail válido'),
    body('mensagem').isLength({ min: 10 }).withMessage('A mensagem deve ter pelo menos 10 caracteres')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nome, email, mensagem } = req.body;
    // Usando os nomes das colunas da sua tabela tbl_contatos
    const sql = 'INSERT INTO tbl_contatos (nome_visitante, email_visitante, mensagem_texto) VALUES (?, ?, ?)';

    db.query(sql, [nome, email, mensagem], (err, result) => {
        if (err) {
            console.error('Erro ao salvar mensagem no banco:', err);
            return res.status(500).json({ error: 'Erro ao enviar mensagem para o banco de dados.' });
        }
        res.status(201).json({ message: 'Mensagem enviada com sucesso!' });
    });
});

// Rota para validar o login do usuário
app.post('/login', [
    body('username').notEmpty().withMessage('O usuário é obrigatório'),
    body('password').notEmpty().withMessage('A senha é obrigatória')
], (req, res) => {
    // Verifica se houve erros na validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;
    const sql = 'SELECT * FROM tbl_usuarios WHERE (username = ? OR email = ?) AND senha =?';

    db.query(sql, [username, username, password], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }

        if (results.length > 0) {
            const usuario = results[0];
            res.status(200).json({
                message: 'Login realizado com sucesso!',
                user: {
                    id: usuario.id_usuario,
                    nome: usuario.nome_completo,
                    email: usuario.email,
                    username: usuario.username,
                    perfil: usuario.perfil
                }
            });
            console.log('Login realizado com sucesso!', usuario);
        } else {
            res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }
    });
});



// Rota para cadastrar um novo usuário
app.post('/usuario', [
    body('nome').notEmpty().withMessage('O nome é obrigatório'),
    body('email').isEmail().withMessage('Informe um e-mail válido'),
    body('username').notEmpty().withMessage('O nome de usuário é obrigatório'),
    body('password').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nome, email, username, password } = req.body;
    // O banco espera 'nome_completo', então mapeamos 'nome' para ele
    const sql = 'INSERT INTO tbl_usuarios (nome_completo, email, username, senha) VALUES (?, ?, ?, ?)';

    db.query(sql, [nome, email, username, password], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar usuário:', err);
            // Verifica se o erro é de duplicidade (e-mail ou username já existem)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'E-mail ou nome de usuário já cadastrados' });
            }
            return res.status(500).json({ error: 'Erro ao cadastrar usuário no banco de dados.' });
        }
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    });
});

// Rota para buscar ordens de serviço de um cliente específico
app.get('/ordens-servico/:clienteId', (req, res) => {
    const { clienteId } = req.params;

    // Consulta SQL que junta a tabela de OS com a de Categorias para pegar o nome do serviço
    const sql = `
        SELECT 
            os.id_os,
            os.equipamento_modelo,
            os.status_servico,
            cat.titulo_servico
        FROM tbl_ordens_servico os
        JOIN tbl_categorias_servicos cat ON os.id_categoria = cat.id_categoria
        WHERE os.id_cliente = ?
        ORDER BY os.data_abertura DESC
    `;

    db.query(sql, [clienteId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar ordens de serviço:', err);
            return res.status(500).json({ error: 'Erro ao buscar ordens de serviço' });
        }
        res.status(200).json(results);
    });
});

// --- ROTAS ADMINISTRATIVAS ---

// Rota para o resumo de estatísticas (KPIs)
app.get('/admin/resumo', (req, res) => {
    const sqlStats = `
    SELECT 
            (SELECT COUNT(*) FROM tbl_usuarios WHERE perfil = 'cliente') as totalClientes,
            (SELECT COUNT(*) FROM tbl_ordens_servico) as totalOrdens,
            (SELECT COUNT(*) FROM tbl_ordens_servico WHERE status_servico = 'Analise' OR status_servico = 'Manutencao') as ordensAtivas,
            (SELECT SUM(valor_total) FROM tbl_ordens_servico WHERE status_servico = 'Entregue') as faturamento
        FROM DUAL;
    `;

    db.query(sqlStats, (err, results) => {
        if (err) {
            console.error('Erro ao buscar resumo admin:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        res.status(200).json(results[0]);
    });
});

// Rota para listar TODAS as ordens de serviço (com nome do cliente)
app.get('/admin/ordens', (req, res) => {
    // Retorna ordens com nome do cliente, do admin que criou e do admin que aceitou (quando houver)
    const sql = `
        SELECT 
            os.*, 
            u.nome_completo as nome_cliente,
            cat.titulo_servico,
            ca.nome_completo as criado_por,
            aa.nome_completo as aceito_por
        FROM tbl_ordens_servico os
        JOIN tbl_usuarios u ON os.id_cliente = u.id_usuario
        JOIN tbl_categorias_servicos cat ON os.id_categoria = cat.id_categoria
        LEFT JOIN tbl_usuarios ca ON os.creating_admin_id = ca.id_usuario
        LEFT JOIN tbl_usuarios aa ON os.accepted_by_admin_id = aa.id_usuario
        ORDER BY os.data_abertura DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar todas as ordens:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        res.status(200).json(results);
    });
});

// Rota para atualizar uma ordem de serviço (Status e Valor)
app.patch('/admin/ordens/:id', (req, res) => {
    const { id } = req.params;
    const { status_servico, valor_total, accepted_by_admin_id } = req.body;

    // Monta dinamicamente a query dependendo se accepted_by_admin_id foi enviado
    let sql = 'UPDATE tbl_ordens_servico SET status_servico = ?, valor_total = ?';
    const params = [status_servico, valor_total];
    if (accepted_by_admin_id) {
        sql += ', accepted_by_admin_id = ?';
        params.push(accepted_by_admin_id);
    }
    sql += ' WHERE id_os = ?';
    params.push(id);

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar ordem:', err);
            return res.status(500).json({ error: 'Erro ao atualizar ordem' });
        }
        res.status(200).json({ message: 'Ordem atualizada com sucesso!' });
    });
});

// Rota para listar todos os usuários com perfil de cliente (para o select de nova O.S.)
app.get('/admin/clientes', (req, res) => {
    const sql = "SELECT id_usuario, nome_completo FROM tbl_usuarios WHERE perfil = 'cliente' ORDER BY nome_completo ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar clientes' });
        res.status(200).json(results);
    });
});

// Rota para listar todas as categorias de serviço (para o select de nova O.S.)
app.get('/admin/categorias', (req, res) => {
    const sql = "SELECT id_categoria, titulo_servico FROM tbl_categorias_servicos ORDER BY titulo_servico ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar categorias' });
        res.status(200).json(results);
    });
});

// Rota para criar uma nova Ordem de Serviço
// Rota para criar uma nova Ordem de Serviço (guarda também qual admin criou)
app.post('/admin/ordens', (req, res) => {
    const { id_cliente, id_categoria, equipamento_modelo, descricao_problema, valor_total, status_servico, creating_admin_id } = req.body;
    const initialStatus = status_servico || (creating_admin_id ? 'Analise' : 'Pendente');
    const sql = `
        INSERT INTO tbl_ordens_servico 
        (id_cliente, id_categoria, equipamento_modelo, descricao_problema, valor_total, status_servico, creating_admin_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [id_cliente, id_categoria, equipamento_modelo, descricao_problema, valor_total || 0, initialStatus, creating_admin_id || null], (err, result) => {
        if (err) {
            console.error('Erro ao criar O.S:', err);
            return res.status(500).json({ error: 'Erro ao criar ordem de serviço' });
        }
        res.status(201).json({ message: 'Ordem de serviço criada com sucesso!', id: result.insertId });
    });
});

// Rota para deletar uma Ordem de Serviço
app.delete('/admin/ordens/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tbl_ordens_servico WHERE id_os = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar O.S:', err);
            return res.status(500).json({ error: 'Erro ao deletar ordem de serviço' });
        }
        res.status(200).json({ message: 'Ordem de serviço excluída com sucesso!' });
    });
});

// Rota para listar todos os usuários
app.get('/admin/usuarios', (req, res) => {
    console.log('--- Buscando lista completa de usuários ---');
    const sql = 'SELECT id_usuario, nome_completo, email, username, perfil, data_cadastro FROM tbl_usuarios ORDER BY data_cadastro DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar usuários:', err);
            return res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
        console.log(`✅ ${results.length} usuários listados.`);
        res.status(200).json(results);
    });
});

// Rota para atualizar um usuário
app.put('/admin/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nome_completo, email, username, perfil } = req.body;

    const sql = 'UPDATE tbl_usuarios SET nome_completo = ?, email = ?, username = ?, perfil = ? WHERE id_usuario = ?';
    db.query(sql, [nome_completo, email, username, perfil, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar usuário:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'E-mail ou nome de usuário já existem' });
            }
            return res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
        res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
    });
});

// Rota para deletar um usuário
app.delete('/admin/usuarios/:id', (req, res) => {
    const { id } = req.params;

    // Primeiro, vamos verificar se o usuário não está tentando se deletar (opcional, mas seguro)
    const sql = 'DELETE FROM tbl_usuarios WHERE id_usuario = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar usuário:', err);
            return res.status(500).json({ error: 'Erro ao deletar usuário. Verifique se ele possui ordens de serviço vinculadas.' });
        }
        res.status(200).json({ message: 'Usuário deletado com sucesso!' });
    });
});

// Rota para listar mensagens de contato (para o administrador)
app.get('/admin/contatos', (req, res) => {
    const sql = 'SELECT * FROM tbl_contatos ORDER BY data_recebimento DESC LIMIT 10';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar contatos:', err);
            return res.status(500).json({ error: 'Erro ao buscar mensagens' });
        }
        res.status(200).json(results);
    });
});

// --- ESTATÍSTICAS PARA GRÁFICOS (ADMIN) ---

// 1. Faturamento Mensal (Últimos 6 meses)
app.get('/admin/stats/faturamento', (req, res) => {
    const sql = `
        SELECT 
            DATE_FORMAT(data_abertura, '%m/%Y') as mes, 
            SUM(valor_total) as total 
        FROM tbl_ordens_servico 
        WHERE status_servico = 'Entregue' 
        GROUP BY mes 
        ORDER BY MIN(data_abertura) ASC 
        LIMIT 6
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Erro no SQL de faturamento:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// 2. Serviços por Categoria (Visão Geral)
app.get('/admin/stats/servicos', (req, res) => {
    const sql = `
        SELECT 
            cat.titulo_servico as label, 
            COUNT(os.id_os) as total 
        FROM tbl_ordens_servico os 
        JOIN tbl_categorias_servicos cat ON os.id_categoria = cat.id_categoria 
        GROUP BY cat.id_categoria, cat.titulo_servico
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Erro no SQL de serviços:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// 3. Fluxo de Novos Clientes (Mensal)
app.get('/admin/stats/clientes', (req, res) => {
    const sql = `
        SELECT 
            DATE_FORMAT(data_cadastro, '%m/%Y') as mes, 
            COUNT(id_usuario) as total 
        FROM tbl_usuarios 
        WHERE perfil = 'cliente' 
        GROUP BY mes 
        ORDER BY MIN(data_cadastro) ASC 
        LIMIT 6
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Erro no SQL de clientes:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// 4. Fluxo de Contatos Recebidos
app.get('/admin/stats/contatos', (req, res) => {
    const sql = `
        SELECT 
            DATE_FORMAT(data_recebimento, '%m/%Y') as mes, 
            COUNT(id_contato) as total 
        FROM tbl_contatos 
        GROUP BY mes 
        ORDER BY MIN(data_recebimento) ASC 
        LIMIT 6
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Erro no SQL de contatos:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// Fazendo o servidor "Rodar" na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`
    ===========================================================================
     __  __ _    _ _   _ _____ ______   _______ ______ _____ _    _ 
    |  \\/  | |  | | \\ | |_   _|___  /  |__   __|  ____/ ____| |  | |
    | \\  / | |  | |  \\| | | |    / /      | |  | |__ | |    | |__| |
    | |\\/| | |  | | . \` | | |   / /       | |  |  __|| |    |  __  |
    | |  | | |__| | |\\  |_| |_ / /__      | |  | |___| |____| |  | |
    |_|  |_|\\____/|_| \\_|_____/_____|     |_|  |______\\_____|_|  |_|
    ===========================================================================
    🚀 Servidor MunizTech rodando em:
    http://localhost:${PORT}

    (Segure Ctrl e clique no link acima para abrir no navegador)
    `);
});