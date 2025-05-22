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

// Funções de manipulação do banco de dados
function readDB() {
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 🔢 Rota para listar os números
app.get('/api/numeros', (req, res) => {
    const db = readDB();
    res.json(db.numeros);
});

// ✅ Rota para reservar/vender números
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

// 💰 Rota para gerar o código PIX
app.get('/api/gerar-pix', (req, res) => {
    const { valor, descricao } = req.query;

    if (!valor || !descricao) {
        return res.status(400).json({ error: 'Valor e descrição são obrigatórios.' });
    }

    const chave = process.env.CHAVE_PIX;
    const nome = process.env.NOME_RECEBEDOR;
    const cidade = process.env.CIDADE_RECEBEDOR;

    const copiaCola = gerarPixCopiaCola(chave, nome, cidade, parseFloat(valor), descricao);

    res.json({ 
        copiaCola, 
        chave, 
        nome, 
        cidade, 
        valor: parseFloat(valor) 
    });
});

// 🚀 Inicializa o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// 🔧 Funções auxiliares para gerar PIX Copia e Cola
function gerarPixCopiaCola(chave, nome, cidade, valor, descricao) {
    function limpa(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    }

    const payload = [];
    payload.push('000201');
    payload.push('26360014BR.GOV.BCB.PIX0114' + chave);
    payload.push('52040000');
    payload.push('5303986');
    payload.push('540' + (valor.toFixed(2).replace('.', '')));
    payload.push('5802BR');
    payload.push('5913' + limpa(nome).substring(0, 25));
    payload.push('6013' + limpa(cidade).substring(0, 15));
    payload.push('62070503' + descricao.length.toString().padStart(2, '0') + descricao);
    payload.push('6304');

    const semCRC = payload.join('');
    const crc = crc16(semCRC);
    return semCRC + crc;
}

function crc16(str) {
    let crc = 0xFFFF;
    for (let c of str) {
        crc ^= c.charCodeAt(0) << 8;
        for (let i = 0; i < 8; i++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
        crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}
