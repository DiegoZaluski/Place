# Estágio de construção
FROM node:lts AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos
COPY . .

# Comando para iniciar o aplicativo em desenvolvimento
CMD ["npm", "run", "dev"]
