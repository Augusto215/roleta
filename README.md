TLucky Roulette Course Platform
Este é um aplicativo Node.js para o TLucky Roulette Course Platform, configurado para execução com Docker em um ambiente VPS.

Requisitos
Docker
Docker Compose
Como executar
1. Preparação do ambiente
Certifique-se de que Docker e Docker Compose estão instalados na sua VPS:

bash
# Instalar Docker (se ainda não estiver instalado)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose (se ainda não estiver instalado)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
2. Configuração
Clone este repositório na sua VPS
Modifique o arquivo server.js para utilizar as variáveis de ambiente conforme indicado no arquivo de configuração
Verifique se o diretório public contém todos os arquivos HTML necessários
3. Iniciar a aplicação
bash
# Construir e iniciar os contêineres
docker-compose up -d

# Verificar logs
docker-compose logs -f
4. Acessar a aplicação
A aplicação estará disponível em http://seu-ip-da-vps:3000

Estrutura de arquivos
docker-compose.yml - Configuração do Docker Compose
Dockerfile - Configuração para construir a imagem Docker do app Node.js
server.js - Servidor Express.js
public/ - Arquivos estáticos (HTML, CSS, JS)
Segurança
Para um ambiente de produção, considere:

Alterar as senhas nos arquivos de configuração
Configurar um proxy reverso como Nginx ou Traefik
Adicionar certificado SSL/TLS
Implementar limitação de taxa (rate limiting)
Backup
Para fazer backup do banco de dados:

bash
docker-compose exec db mysqldump -u root -p tlucky_roulette > backup.sql
