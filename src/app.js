// import express from 'express'
// import routes from './routes/index.js'
// import cors from 'cors'

// const app = express()

// app.use(cors({
//     origin: '*', // Allow all origins
//     credentials: true,
//     methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     maxAge: 300
// }))

// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))

// app.use((req, res, next) => {
//     req.setTimeout(20000, () => { 
//         res.status(504).send('app.js error: Request has timed out.')
//     })
//     next()
// })

// routes(app)

// export default app

import express from 'express';
import routes from './routes/index.js';
import cors from 'cors';

const app = express();

// Configuração de CORS
app.use(cors({
    origin: (origin, callback) => {
        // Permitir apenas origens específicas ou todas as origens
        const allowedOrigins = ['http://localhost:3001', 'https://react-yield.vercel.app'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Permite envio de cookies e credenciais
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 300
}));

// Middleware para parsing de JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para timeout de requisição
app.use((req, res, next) => {
    req.setTimeout(20000, () => {
        res.status(504).send('app.js error: Request has timed out.');
    });
    next();
});

// Rotas
routes(app);

// Middleware para capturar erros de CORS
app.use((err, req, res, next) => {
    if (err instanceof Error && err.message === 'Not allowed by CORS') {
        res.status(403).json({ error: 'CORS error: Origin not allowed' });
    } else {
        next(err);
    }
});

export default app;