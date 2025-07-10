


const express = require('express');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');


const { Pool } = require('pg'); // PostgreSQL client for database connection
const jwt = require('jsonwebtoken'); // JWT for user authentication

const app = express();
app.use(express.json());
app.use(cors()); // Allows any origin to access the API




  

const JWT_SECRET = process.env.JWT_SECRET; // Secret key for JWT
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN; // Expiration time for JWT

// Set up PostgreSQL connection using environment variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Using the environment variable for DB connection
    ssl: {
        rejectUnauthorized: false, // Allows SSL connection with Neon (for secure connection)
    },
});


// Test database connection and fetch data from the 'products' table
app.get('/test-db-connection', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products LIMIT 5');
        res.json({
            status: 'success',
            message: 'CONEXÃO COM DATABASE ESTABELECIDA!',
            data: result.rows,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'FALHA NA COMEXÃO COM A DATABASE.',
            error: error.message,
        });
    }
});

////////////////////////////////////////////////////////////////////////////




const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Starting file upload processing...');
    
    // Read Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log('Rows to process:', data.length);

    // Limit file size to prevent timeouts
    if (data.length > 1000) {
      console.log('File too large:', data.length);
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 1000 linhas.' });
    }

    const inserts = [];
    const updates = [];

    // Process rows
    for (const row of data) {
      const pedidoSistema = row['Pedido']?.toString().split(' ')[0]?.trim();
      const pedidoWeb = row['Seu Pedido']?.toString().trim();
      const status = row['Status']?.toString().trim();

      if (pedidoSistema && pedidoWeb && status) {
        console.log(`Processing row: ${pedidoWeb}`);
        const start = Date.now();
        const existing = await pool.query(
          'SELECT pedidosistema, pedidostatus FROM pedidostatus WHERE pedidoweb = $1',
          [pedidoWeb]
        );
        console.log(`SELECT query took ${Date.now() - start}ms`);

        if (existing.rows.length === 0) {
          inserts.push([pedidoSistema, pedidoWeb, status]);
        } else if (existing.rows[0].pedidostatus !== status) {
          updates.push([pedidoSistema, status, pedidoWeb]);
        }
      }
    }

    // Batch insert
    if (inserts.length > 0) {
      console.log('Inserting', inserts.length, 'rows');
      const start = Date.now();
      await pool.query(
        `INSERT INTO pedidostatus (pedidosistema, pedidoweb, pedidostatus) VALUES ${inserts
          .map((_, i) => `($${3 * i + 1}, $${3 * i + 2}, $${3 * i + 3})`)
          .join(',')}`,
        inserts.flat()
      );
      console.log(`INSERT query took ${Date.now() - start}ms`);
    }

    // Batch update
    if (updates.length > 0) {
      console.log('Updating', updates.length, 'rows');
      const start = Date.now();
      for (const update of updates) {
        await pool.query(
          'UPDATE pedidostatus SET pedidosistema = $1, pedidostatus = $2 WHERE pedidoweb = $3',
          update
        );
      }
      console.log(`UPDATE queries took ${Date.now() - start}ms`);
    }

    console.log('Upload completed successfully');
    res.status(200).json({ message: 'Arquivo processado com sucesso.' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Erro ao processar o arquivo.', details: error.message });
  }
});

// Test endpoint
app.get('/test-upload', async (req, res) => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW()');
    console.log('Test endpoint hit, query took', Date.now() - start, 'ms');
    res.status(200).json({ time: result.rows[0].now, message: 'Backend and DB working' });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

module.exports = app;



/////////////////////////////////////////////////////////////////////////////////////////////
app.post('/update', async (req, res) => {
    const {input1, input2, input3} = req.body;


    console.log('Dado recebido do frontend:', input1, input2, input3);

    try {

    

     
const result = await pool.query(
  'INSERT INTO "Data" (input1, input2, input3) VALUES ($1, $2, $3) RETURNING id',
  [input1, input2, input3]
);
               res.status(200).send({ message: 'OK'
               });
    } catch (error) {
        console.error('Error adding to order:', error);
        res.status(500).send({ error: 'FALHA AO ADICIONAR O PRODUTO.' });
    }
});

//////////////////////////////////////////////////////////////////////////////////////////////


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
