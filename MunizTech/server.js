const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

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

// Fazendo o servidor "Rodar" na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});