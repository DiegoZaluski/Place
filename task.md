1. criar sistema de troca para interface de modelos ja intalados 
2. salvar estados de ja instalado em banco de dados sqlLite 
3. estruturar o backend 
4. criar interface de modelos ja intalados 
5. criar arquivo de manager de comunicação com o servidor 
6. criar controle de temperatura do modelos e memoria.
7. criar api de facil acesso e conexão com o app. 
8. criar integração como o projeto como um guia. 
9. começar a planejar o workflow do projeto parecido com n8n. 
10. adicionar um ide a base de vs code. 
11. corrigir bug do troca de theme 
12. corrigir erro de cincronização e bugs do dowload estudar a fundo o codigo para enteder como pode resolver isso (bug não é critico apenas causa um empressão errado e confusa para o usuario )

# taks simples add o site a documentações do app
# add models h1 para definir models a baixo 


# provavelmente caminho não esta escrevendo no json 


ARQUIVOS MODIFICADOS:

    /home/zaluski/Documentos/Place/backend/python/HTTP/http_server.py

Corrigido caminho dos modelos: /home/zaluski/Documentos/Place/transformers/llama.cpp/models

Função model_exists() funcionando corretamente

JSON configuration salvando sem erros

Endpoint /switch-model respondendo 200 OK

    /home/zaluski/Documentos/Place/src/modelLookout.js

Debounce aumentado para 5 segundos

Timeout aumentado para 60 segundos

Verificação de porta WebSocket sem interferência

Sistema de retry implementado

PROBLEMA ATUAL:

WebSocket Client não reconecta automaticamente após restart do servidor
SITUAÇÃO:

HTTP Server reinicia e fica pronto

WebSocket Server reinicia e porta 8765 fica ouvindo

Model Lookout detecta mudança e executa restart corretamente

WebSocket Client principal do Electron permanece desconectado

ARQUIVOS A AJUSTAR:

/home/zaluski/Documentos/Place/backend/node/managerWebSocket.cjs

    Adicionar lógica de reconexão automática

    Implementar scheduleReconnect() method

    Configurar retry com backoff exponential

    Notificar frontend sobre mudanças de conexão

AÇÕES NECESSÁRIAS:

No managerWebSocket.cjs:

Implementar callback onConnectionChange

Adicionar scheduleReconnect() no event onClose

Configurar máximo de tentativas de reconexão
Usar delay progressivo entre tentativas

Garantir que:
 WebSocket client tenta reconectar automaticamente

Frontend é notificado sobre status da conexão

Reconexão para após máximo de tentativas

Estado "connecting" é mostrado para usuário

POSSÍVEL CAUSA RAIZ:

O WebSocket client foi projetado para conexão inicial, mas não tem mecanismo de recuperação quando o servidor reinicia. Quando o Python server é killed e restarted, a conexão WebSocket é perdida permanentemente.
SOLUÇÃO:

Implementar pattern de "reconnection manager" no WebSocket client que monitora a conexão e automaticamente reconecta quando detecta que o servidor está disponível novamente.