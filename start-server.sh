#!/bin/bash

# Carregar variáveis de ambiente
export $(cat .env | grep -v '^#' | xargs)

# Iniciar servidor
echo "🚀 Iniciando servidor backend na porta 3001..."
node server.js
