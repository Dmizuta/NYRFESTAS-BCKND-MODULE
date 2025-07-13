


const express = require('express');
require('dotenv').config();
const cors = require('cors');



const { Pool } = require('pg'); // PostgreSQL client for database connection


const app = express();
app.use(express.json());
//app.use(cors()); // Allows any origin to access the API



app.use(cors({
  origin: ['https://dmizuta.github.io'], // <- your GitHub frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));



  


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


app.get('/data', async (req, res) => {
  const result = await pool.query('SELECT * FROM "Data"');
  res.json(result.rows);
});

//////////////////////////////////////////////////////////////////////////////////////////////

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
