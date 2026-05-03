// server.js - Arquivo principal do servidor Node.js usando Express
// Este arquivo configura um servidor Express que se conecta a um banco de dados MySQL e define rotas para listar serviços e cadastrar usuários.
// Importações necessárias para o servidor
// Importa o framework Express para criar o servidor
const express = require('express'); // Importa o framework Express para criar o servidor
const mysql = require('mysql2'); // Importa o módulo mysql2 para conectar ao banco de dados MySQL
const cors = require('cors'); // Importa o módulo cors para permitir requisições de diferentes origens (útil para desenvolvimento local);
const { body, validationResult } = require('express-validator'); // Importa ferramentas de validação

const app = express();

// Configurações básicas
app.use(cors()); // Libera o acesso para seu site
app.use(express.json()); // Permite que API entenda dados em formato JSON

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
                    username: usuario.username
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

// Fazendo o servidor "Rodar" na porta 3000
const PORT = 3000; // Define a porta em que o servidor irá escutar (neste caso, 3000)
app.listen(PORT, () => { // Inicia o servidor e começa a escutar as requisições na porta definida
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`); // Exibe uma mensagem no console indicando que o servidor está rodando
});
