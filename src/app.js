import express from 'express';
import routes from './routes/index.js';
import cors from 'cors';
import { encryptedDividends } from './models/EncryptedDividends.js';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware para garantir conexão com o banco em cada request (serverless friendly)
import { dbConnection, connection } from './config/dbConnect.js';
app.use(async (req, res, next) => {
  if (!connection || connection.readyState !== 1) {
    try {
      await dbConnection();
      console.log('Conexão com o banco restabelecida');
    } catch (err) {
      console.error('Erro ao conectar com o banco:', err);
      return res.status(500).json({ aviso: 'Erro ao conectar com o banco de dados.' });
    }
  }
  next();
});

// Configuração de CORS
// app.use(cors({
//     origin: (origin, callback) => {
//         // Permitir apenas origens específicas ou todas as origens
//         const allowedOrigins = ['http://localhost:3001', 'https://react-yield.vercel.app'];
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true, // Permite envio de cookies e credenciais
//     methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     maxAge: 300
// }));

const allowedOrigins = ['http://localhost:3001', 'https://react-yield.vercel.app'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 300
}));

// Opcional: responder manualmente a OPTIONS para garantir CORS em serverless
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// Middleware para parsing de JSON e URL-encoded
app.use(express.json({ limit: '10000mb' })); // Aumenta o limite de tamanho do JSON
app.use(express.urlencoded({ extended: true }));
// Middleware para parsing de cookies
app.use(cookieParser());

// Middleware para timeout de requisição
app.use((req, res, next) => {
    req.setTimeout(20000, () => {
        if (!res.headersSent) {
            res.status(504).send('app.js error: Request has timed out.');
        }
    });
    next();
});

// Sincronização dos índices do modelo 'dividend' e exibição dos índices atuais
(async () => {
    try {
        await encryptedDividends.syncIndexes(); // Sincroniza os índices com o banco de dados
        const indexes = await encryptedDividends.collection.getIndexes();
        console.log("Índices sincronizados com sucesso! Índices atuais:", indexes);
    } catch (error) {
        console.error("Erro ao sincronizar os índices:", error);
    }
})();

// Rotas
routes(app);

// Middleware para capturar erros de CORS
app.use((err, req, res, next) => {
    if (err instanceof Error && err.message === 'Not allowed by CORS') {
        if (!res.headersSent) {
            res.status(403).json({ error: 'CORS error: Origin not allowed' });
        }
    } else {
        next(err);
    }
});

// Middleware de fallback para erros não tratados
app.use((err, req, res, next) => {
    console.error("Erro não tratado:", err);
    if (!res.headersSent) {
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

export default app;