


const express = require('express');
require('dotenv').config();
const cors = require('cors');



const { Pool } = require('pg'); // PostgreSQL client for database connection


const app = express();
app.use(express.json());
app.use(cors()); // Allows any origin to access the API



/*app.use(cors({
  origin: ['https://dmizuta.github.io'], // <- your GitHub frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));*/



  


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

/////////////////////////////////////////////////////////////////

app.delete('/delete/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await pool.query('DELETE FROM "Data" WHERE id = $1', [id]);
        res.status(200).json({ message: 'Row deleted successfully' });
    } catch (error) {
        console.error('Error deleting row:', error);
        res.status(500).json({ error: 'Failed to delete row' });
    }
});


/////////////////////////////////////////////////////////////////////////////////////////////
app.post('/create', async (req, res) => {
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

app.patch('/update/:id', async (req, res) => {
    const { id } = req.params;
    const { input1, input2, input3 } = req.body;

    try {
        await pool.query(
            `UPDATE "Data"
             SET input1 = $1, input2 = $2, input3 = $3
             WHERE id = $4`,
            [input1, input2, input3, id]
        );
        res.status(200).json({ message: 'DADOS ATUALIZADOS COM SUCESSO!' });
    } catch (error) {
        console.error('Erro ao atualizar:', error);
        res.status(500).json({ error: 'FALHA AO ATUALIZAR.' });
    }
});
 
///////////////////////////////////////////////////////
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
