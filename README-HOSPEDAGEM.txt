HOSPEDAGEM
==========

Projeto FULLSTACK (Vite/React + Node/Express).
Em produção, o server.js serve o frontend (dist) e as rotas /api.

Requisito: hospedagem com suporte a Node.js (cPanel Node App, VPS, Render, etc.).

PASSOS (padrão):
1) Configure variáveis de ambiente na hospedagem (veja .env.example).
2) Rode "npm install" na hospedagem (ou local e envie node_modules se a host exigir).
3) Rode "npm run build" (gera /dist).
4) Inicie com "npm run server" ou "node server.js".

Health-check: /health
