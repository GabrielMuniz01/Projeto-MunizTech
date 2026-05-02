// server.js - Arquivo principal do servidor Node.js usando Express
// Este arquivo configura um servidor Express que se conecta a um banco de dados MySQL e define rotas para listar serviços e cadastrar usuários.
// Importações necessárias para o servidor
// Importa o framework Express para criar o servidor
const express = require('express'); // Importa o framework Express para criar o servidor
const mysql = require('mysql2'); // Importa o módulo mysql2 para conectar ao banco de dados MySQL
const cors = require('cors'); // Importa o módulo cors para permitir requisições de diferentes origens (útil para desenvolvimento local);

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

// Rota para cadastrar um novo usuário
app.post('/usuario', (req, res) => { // Rota para cadastrar um novo usuário
    const { nome, email, username, password } = req.body; // Extrai os dados do corpo da requisição
    const sql = 'INSERT INTO tbl_usuarios (nome_completo, email, username, senha) VALUES (?, ?, ?, ?)';
    console.log(req.body);

    db.query(sql, [nome, email, username, password], (err, result) => {

        if (err) {
            console.error('Erro ao salvar no banco de dados:', err);
            return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
        }

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    });
});

// Fazendo o servidor "Rodar" na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
