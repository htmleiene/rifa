require('dotenv').config();
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DB_FILE = path.join(__dirname, 'db.json');
const PIX_DB_FILE = path.join(__dirname, 'pixDB.json');

// 🔧 Funções para manipular banco de dados
function readDB() {
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function readPixDB() {
    const data = fs.readFileSync(PIX_DB_FILE);
    return JSON.parse(data);
}

// 🔢 Listar números
app.get('/api/numeros', (req, res) => {
    const db = readDB();
    res.json(db.numeros);
});

// ✅ Vender números
app.post('/api/vender', (req, res) => {
    const { numeros } = req.body;

    if (!Array.isArray(numeros) || numeros.length === 0) {
        return res.status(400).json({ error: 'Nenhum número enviado' });
    }

    const db = readDB();
    numeros.forEach(numero => {
        const item = db.numeros.find(n => n.numero === numero);
        if (item) item.status = 'vendido';
    });

    saveDB(db);
    res.json({ message: 'Números reservados com sucesso!' });
});

// 💰 Buscar PIX já salvo
app.post('/api/gerar-pix', (req, res) => {
    const { valor } = req.body;

    if (!valor) {
        return res.status(400).json({ error: 'Valor não informado' });
    }

    const pixDB = readPixDB();
    const chave = pixDB[valor];

    if (!chave) {
        return res.status(404).json({ error: 'Valor não cadastrado no PIX DB' });
    }

    res.json({
        copiaCola: chave.copiaCola,
        qrCodeUrl: chave.qrCode,
        valor
    });
});

// 🚀 Start server
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
