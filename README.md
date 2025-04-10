# Livraria Online (Interface Frontend)

Interface web desenvolvida com HTML, CSS e JavaScript puro para interagir com a API da Livraria Online. Permite visualizar o catálogo de livros em formato de cards, adicionar livros ao estoque (informando Título, Quantidade e Preço), editar quantidade/preço, remover livros e gerenciar um carrinho de compras (salvo no LocalStorage).

## Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript (Vanilla JS)
* Fetch API (para comunicação com o backend)
* Docker (para containerização)

## Pré-requisitos

* Um navegador web moderno (Chrome, Firefox, Edge, etc.).
* O [Backend da API Livraria Online](https://github.com/lphillipe/api_livraria_sprint2.git) deve estar em execução.
* (Opcional) Docker para execução em container.

## Instalação

Nenhuma etapa de instalação específica é necessária para o frontend, pois ele é servido diretamente pelo backend Flask na configuração atual de desenvolvimento. Basta ter os arquivos desta pasta (`front_livraria_sprint2`) na localização correta esperada pelo backend (`../front_livraria_sprint2` relativo a `api_livraria_sprint2/app.py`).

## Execução (Desenvolvimento Local - Via Backend Flask)

1.  **Inicie o servidor Backend:** Siga as instruções no README do backend para iniciar o servidor Flask (geralmente `flask run --host 0.0.0.0 --port 5000` dentro da pasta `api_livraria_sprint2` com o ambiente virtual ativado).
2.  **Acesse a Aplicação:** Abra seu navegador e acesse a URL do servidor backend:
    ```
    http://127.0.0.1:5000
    ```
    O backend servirá o `index.html` e os arquivos estáticos (`style.css`, `script.js`) desta pasta.

## Execução (Docker)

1.  **Construa a imagem Docker:** (Execute no diretório `front_livraria_sprint2`, onde está o Dockerfile)
    ```bash
    docker build -t nome-da-sua-imagem-frontend .
    ```
    (Ex: `docker build -t front-livraria .`)

2.  **Execute o container Docker:**
    ```bash
    docker run -p 8080:80 --name nome-do-seu-container-frontend nome-da-sua-imagem-frontend
    ```
    (Ex: `docker run -p 8080:80 --name meu-front-livraria front-livraria`)
    * `-p 8080:80`: Mapeia a porta 8080 do seu computador para a porta 80 do container Nginx.
    * **Importante:** Para que o frontend no container funcione, o container do **backend** também precisa estar rodando e acessível pela rede do Docker. Usar Docker Compose é a forma recomendada de gerenciar ambos juntos. A URL da API no `script.js` talvez precise ser ajustada para apontar para o nome do serviço do backend no Docker Compose (ex: `http://backend:5000`) em vez de `http://127.0.0.1:5000`.

3.  Acesse a interface em `http://127.0.0.1:8080`
