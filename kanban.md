# kanban
## PRE-LANÇAMENTO BETA
! usar bibliotecas ou frameworks para ler comentarios e tranformar em documentação evitando trabalho manual - (baixa quando o projeto lançar)
! add jsons n8n 

## PADRONIZAR 
! organizar cores dos componente react como se fossem root css 
! organizar classNames dos componentes em colunas para facilitar leitura - (baixa - prioridade)

# FUNCIONANALIDADES FUTURAS 
! RESUMIR - pesquisas do sites de forma eficiente sem sobre carregar o modelo
! criar caixa de pesquisa na lateral esquerda indicando nome do site e mostrar um de cada vez um pesquisa por ve e nome do site - add:(integrar com resumidor de pesquisa provavelmente tera que ser um modelo rodando separado em outro thread para conseguir) 

## Tasks Simples 
! add um ancora, para quando o usuario clicar no elemento do contador do github ser levado para o respositorio 
! add, loggings de mundanças para o class de pesquisa do modelo 
! mudar o sistema de busca na net para algo simples e direto usando fetch sem dependencia
## Tasks Media dificuldade
! debugar e testar as fallbacks do servidores
! organizar arquivos em pasta em (shared) 
! AJUSTAR PESQUISA
    ! não mandar contexto de pesquisa apos voltar para modo comum para o modelo isso vai sobrecarregalo
    ! organizar recebimento de pesquisa no front - end  

## DIFICIL 
! criar api de facil acesso e conexão com o app, para empresas subam o app para nuvem (Uma api que oferece todos os serviços do app funcionalidade paga) - (baixa prioriadade no momento)  
### tasks pre lançamento - (quando todas forem cumpridas a versão beta é lançada)### 
    ! cria raciocicionio em loop 
    ! add raciocionio a ao switch  ou ifs depnede de qual logica sera usada 
    ! add ui para config de api de modelos esterno - mudano o menu lateral esquerdo do chat para este nova interface de configuração 
    ! add button de de troca de modelo local cloud ou local sem filtro button inteligent so aparece se houver modelo cloud codastrado
    ! criar controle de temperatura do modelos e memoria. 
    ! memoria vetorial de rapido acesso para o modelo - (vector store) 
    ! ferramenta de coleta e compactação de memoria, para mandar para vector store - sanlvar de forma inteligente guaradando o minimo de garbagem 
    ! revisar qualidade, compactação de tokens, garantir que não esta sendo enviado garbagem para modelos pros, garantir economia de tokens para modelos pros 
    ! add o maximo de modelo para baixar, reforçar fallback de dowload
    ! tela de carregamente inicial do app  
    ! criar espera de carrgamento do modelo para evitar mensagem de erro no chat
    ! criar os arquivos de tradução json na reta final da primeira versão - (prioridade baixa) - iniciar com apenas 2 idiomas 
    ! criar documentação 
    ! dockernizar aplicação e subir pra dowload
    ! criar pagina simples para dowload 

## DIFICIL - EXTREMA 
! cria capitura de tela resposta do modelo BASEADO NO PRINT RECEM TIRANDO - (prioriadade alta)
! comunicação por voz com o modelo de forma natural e bem feita - (prioriadade baixa)
! sistema de costumização de modelos com ate 5 LoRa (MONTE SUA IA) - (prioridade media)
! indentificação de pessoa como base em suas facial ou nome busca profuda na intertet mapeamento de gostos e interação para indentifica o que a pessoa gosta - (prioridade media modelo de negocio pago)
! pacote de social_bots intgração com qualquer rede social 


# BUGS 
! lupa aparecendo quando o modelo esta repondendo
! resetar estado quando sair do chat para não bugar, ou add um estado global para o button de pesquisa 
! pesquisa mal filtrada, esta cortando palavras, o regex 
! FALLBACKS Inuteis no servidores 


# RACIOCINIO DO MODELO - ideia atual para isso: 
para não quebrar e ter um qualidaded boa para o modelo minha ideia é 
1. quebra texto de pesquisa em partes menores que caibam na janela de contexto do modelo 
2. fazer um chamada para o modelo e pedir para ele resumir partes e resumir após guardar em um buffer de contexto 
3. mandar a pesquisa do buffer que foi resuminda novamente para o modelo refinar e melhoras 
4. indicar fontes na ui 
***processo lento, mas com qualidade boa***


