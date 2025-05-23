require('dotenv').config();
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Arquivos de banco
const DB_FILE = path.join(__dirname, 'db.json');
const COMPRADORES_FILE = path.join(__dirname, 'compradores.json');
const PIX_FILE = path.join(__dirname, 'pixDB.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🗂️ Funções utilitárias
function readDB() {
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function readCompradores() {
    if (!fs.existsSync(COMPRADORES_FILE)) return [];
    const data = fs.readFileSync(COMPRADORES_FILE);
    return JSON.parse(data);
}

function saveCompradores(data) {
    fs.writeFileSync(COMPRADORES_FILE, JSON.stringify(data, null, 2));
}

function readPixDB() {
    if (!fs.existsSync(PIX_FILE)) return [];
    const data = fs.readFileSync(PIX_FILE);
    return JSON.parse(data);
}

// 🔢 Rota para listar os números
app.get('/api/numeros', (req, res) => {
    const db = readDB();
    res.json(db.numeros);
});

// ✅ Rota para reservar/vender números
// ✅ Rota para reservar/vender números
app.post('/api/vender', (req, res) => {
    const { numeros, nome } = req.body;
    if (!nome || !Array.isArray(numeros) || numeros.length === 0) {
        return res.status(400).json({ error: 'Nome e números são obrigatórios' });
    }

    const db = readDB();
    const compradores = readCompradores();

    numeros.forEach(numero => {
        const item = db.numeros.find(n => n.numero === numero);
        if (item) item.status = 'vendido';
    });

    compradores.push({
        nome,
        numeros,
        data: new Date().toISOString()
    });

    saveDB(db);
    saveCompradores(compradores);

    res.json({ message: 'Números reservados com sucesso!' });
});

// 💰 Rota para gerar PIX (lendo do pixDB.json)
app.post('/api/gerar-pix', (req, res) => {
    const { valor } = req.body;
    const pixDB = readPixDB();

    const dadosPix = pixDB.find(p => p.valor === Number(valor));

    if (!dadosPix) {
        return res.status(404).json({ error: 'QR Code não cadastrado para esse valor' });
    }

    res.json({
        copiaCola: dadosPix.copiaCola,
        qrCodeUrl: `/qrcode/${dadosPix.qrCodeUrl}`,  // ✅ Caminho correto
        valor: Number(valor)
    });
});

// 📥 Rota para listar compras em JSON
app.get('/api/compras', (req, res) => {
    const compradores = readCompradores();
    res.json(compradores);
});

// 📄 Rota para baixar compras em CSV
app.get('/api/compras-csv', (req, res) => {
    const compradores = readCompradores();

    const header = 'Nome,Números,Data\n';
    const rows = compradores.map(c =>
        `${c.nome},"${c.numeros.join(' ')}",${c.data}`
    ).join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=compras.csv');
    res.send(csv);
});

// 🚀 Inicializa servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
