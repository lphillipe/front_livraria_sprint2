/* -------------------------------------------
  Variáveis Globais para Controle de Edição 
  --------------------------------------------
*/
let editMode = false;
let currentEditingBookName = null;
let selectedBookForAddition = null; 
let currentEditingBookAuthor = null;

/*-------------------------------------------------------
  Exibe uma notificação não bloqueante (toast) na tela.
  -------------------------------------------------------
*/
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return; // Sai se o container não existir

  // Cria o elemento do toast
  const toastElement = document.createElement('div');
  toastElement.classList.add('toast', type); 
  toastElement.textContent = message;

  // Adiciona o toast ao container
  container.appendChild(toastElement);

  // Força um reflow para garantir que a animação de entrada funcione
  // Adiciona a classe 'show' um instante depois de adicionar ao DOM
  requestAnimationFrame(() => {
       setTimeout(() => {
          toastElement.classList.add('show');
      }, 10); 
  });


  // Define um timer para remover o toast
  const fadeOutTime = 400; // Duração da animação de saída (igual à transição CSS)
  setTimeout(() => {
      // Inicia a animação de saída
      toastElement.classList.remove('show');
      // Remove o elemento do DOM após a animação de saída terminar
      setTimeout(() => {
          if (toastElement.parentNode === container) { // Verifica se ainda existe antes de remover
               container.removeChild(toastElement);
          }
      }, fadeOutTime);
  }, duration); // Tempo que o toast fica visível antes de começar a sumir
}

/* -------------------------------------------
  LÓGICA DO CARRINHO DE COMPRAS (LocalStorage)
  ---------------------------------------------                      
*/

let carrinho = []; // Array global para armazenar os itens do carrinho

/*--------------------------------------------------------------
  Carrega o carrinho do localStorage quando a página é carregada.
  --------------------------------------------------------------
*/
const loadCart = () => {
    const cartData = localStorage.getItem('carrinho');
    if (cartData) {
        try {
            carrinho = JSON.parse(cartData);
            if (!Array.isArray(carrinho)) { // Validação extra
                console.warn("Dado do carrinho no localStorage não é um array. Resetando.");
                carrinho = [];
                localStorage.removeItem('carrinho');
            }
        } catch (e) {
            console.error("Erro ao parsear carrinho do localStorage:", e);
            carrinho = []; // Reseta se houver erro de parse
            localStorage.removeItem('carrinho'); // Limpa local storage inválido
        }
    } else {
        carrinho = []; // Carrinho começa vazio se não houver nada salvo
    }
    console.log("Carrinho carregado:", carrinho);
    updateCartIndicator(); // Atualiza o contador visual no header
};

/*---------------------------------------------------------
  Salva o estado atual do array 'carrinho' no localStorage.
  ---------------------------------------------------------
*/
const saveCart = () => {
    try {
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        console.log("Carrinho salvo:", carrinho);
    } catch (e) {
        console.error("Erro ao salvar carrinho no localStorage:", e);
        alert("Não foi possível salvar seu carrinho. O armazenamento pode estar cheio.");
    }
    updateCartIndicator(); // Atualiza o contador visual sempre que salvar
};

/**
 * Atualiza o número de itens exibido no indicador do carrinho (no header).
 */
const updateCartIndicator = () => {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        // Soma as quantidades de todos os itens diferentes no carrinho
        const totalItems = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        cartCountElement.textContent = totalItems;
    }
};

/*-------------------------------------------------------------------------
  Adiciona um livro ao carrinho ou incrementa sua quantidade se já existir.
  -------------------------------------------------------------------------
*/
const addToCart = (bookId, nome, valor, capa_url) => {
    // Converte ID para string para garantir consistência na comparação e no localStorage
    const idStr = String(bookId);
    const precoNumerico = parseFloat(valor); // Garante que o valor é número

    if (isNaN(precoNumerico)) {
         console.error("Tentativa de adicionar item ao carrinho com valor inválido:", valor);
         showToast("Erro: Preço inválido para este livro.",'error',3000);
         return;
    }

    const existingItemIndex = carrinho.findIndex(item => String(item.id) === idStr);

    if (existingItemIndex > -1) {
        // Item já existe, incrementa quantidade
        carrinho[existingItemIndex].quantidade += 1;
        console.log(`Quantidade incrementada para ${nome} (ID: ${idStr})`);
    } else {
        // Item não existe, adiciona novo objeto ao array
        const newItem = {
            id: idStr,
            nome: nome,
            valor: precoNumerico, // Armazena como número
            quantidade: 1,
            capa_url: capa_url
        };
        carrinho.push(newItem);
        console.log(`${nome} (ID: ${idStr}) adicionado ao carrinho`);
    }
    saveCart(); // Salva o carrinho no localStorage e atualiza indicador
    showToast(`${nome} foi adicionado ao carrinho!`,'success');
};

/*---------------------------------------------------------------------------
  Altera a quantidade de um item no carrinho. Remove se a quantidade for <= 0.
  ---------------------------------------------------------------------------
*/
const updateQuantity = (bookId, change) => {
     const idStr = String(bookId);
     const itemIndex = carrinho.findIndex(item => String(item.id) === idStr);

     if (itemIndex > -1) {
         carrinho[itemIndex].quantidade += change;
         console.log(`Quantidade atualizada para ${carrinho[itemIndex].nome}: ${carrinho[itemIndex].quantidade}`);

         if (carrinho[itemIndex].quantidade <= 0) {
             // Remove o item se a quantidade for zerada ou negativa
             removeFromCart(bookId); // Chama a função de remover (que salva e atualiza UI)
         } else {
             saveCart(); // Salva o carrinho com a nova quantidade
             displayCart(); // Atualiza a exibição do modal (IMPORTANTE!)
         }
     } else {
          console.warn(`Tentativa de atualizar quantidade para item não encontrado no carrinho: ID ${bookId}`);
     }
};

/*-----------------------------------------------------
  Remove um item completamente do carrinho pelo seu ID.
  -----------------------------------------------------
*/
const removeFromCart = (bookId) => {
     const idStr = String(bookId);
     const initialLength = carrinho.length;
     // Filtra o array, mantendo apenas os itens com ID diferente
     carrinho = carrinho.filter(item => String(item.id) !== idStr);

     if (carrinho.length < initialLength) {
         console.log(`Item com ID ${bookId} removido do carrinho.`);
         saveCart(); // Salva o carrinho sem o item
         displayCart(); // Atualiza a exibição do modal (IMPORTANTE!)
     } else {
          console.warn(`Tentativa de remover item não encontrado no carrinho: ID ${bookId}`);
     }
};

/*----------------------------------------------------
  Calcula o valor total de todos os itens no carrinho.
  ----------------------------------------------------
*/
const calculateTotal = () => {
    const total = carrinho.reduce((sum, item) => {
        // Garante que valor e quantidade são números antes de multiplicar
        const itemValor = parseFloat(item.valor) || 0;
        const itemQuantidade = parseInt(item.quantidade, 10) || 0;
        return sum + (itemValor * itemQuantidade);
    }, 0);
    
    return total.toFixed(2).replace('.', ',');
};

/*-----------------------------------------------
  Renderiza os itens do carrinho dentro do modal.
  -----------------------------------------------
*/
const displayCart = () => {
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartTotalElement = document.getElementById('cartTotal');

  // Verifica se os elementos do DOM foram encontrados
  if (!cartItemsContainer || !cartTotalElement) {
       console.error("Elementos do modal do carrinho (#cartItemsContainer ou #cartTotal) não encontrados no DOM.");
       return; // Sai da função se não encontrar os elementos
  }

  // Limpa o conteúdo atual do container de itens
  cartItemsContainer.innerHTML = '';

  // Verifica se o carrinho está vazio
  if (carrinho.length === 0) {
      cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>'; // Mostra mensagem de carrinho vazio
  } else {
      // Se não estiver vazio, itera sobre cada item no array 'carrinho'
      carrinho.forEach(item => {
          // Cria um novo elemento div para este item
          const itemElement = document.createElement('div');
          itemElement.classList.add('cart-item'); // Adiciona classe para estilização CSS

          // Define a imagem da capa ou um placeholder
          let imgHtml = item.capa_url
              ? `<img src="${item.capa_url}" alt="Capa de ${item.nome}" style="width:40px; height:auto; margin-right: 15px;">`
              : '<div style="width:40px; height:60px; background:#eee; display:flex; align-items:center; justify-content:center; font-size:0.7em; color:#888; text-align:center; margin-right: 15px;">Sem Capa</div>';

          // Formata o valor unitário do item para exibição
          const valorFormatado = (parseFloat(item.valor) || 0).toFixed(2).replace('.', ',');

          
          // Cria o HTML interno para o elemento do item
          itemElement.innerHTML = `
              ${imgHtml}
              <div class="item-details" style="flex-grow: 1; margin-right: 10px;">
                  <strong style="font-size: 0.9em;">${item.nome}</strong><br>
                  <span style="font-size: 0.8em;">Preço Unit.: R$ ${valorFormatado}</span>
              </div>
              <div class="item-quantity" style="display: flex; align-items: center; margin-right: 10px;">
                  <button onclick="updateQuantity('${item.id}', -1)" title="Diminuir quantidade">-</button>
                  <span style="margin: 0 8px; min-width: 20px; text-align: center;">${item.quantidade}</span>
                  <button onclick="updateQuantity('${item.id}', 1)" title="Aumentar quantidade">+</button>
              </div>
              <div class="item-remove">
                  <button onclick="removeFromCart('${item.id}')" title="Remover item do carrinho">Remover</button>
              </div>
          `;
          

          // Adiciona o elemento HTML do item criado ao container no modal
          cartItemsContainer.appendChild(itemElement);
      }); 
  } 

  // Atualiza o valor total exibido no modal
  cartTotalElement.textContent = calculateTotal();
}; 

/*--------------------------------------
  Mostra ou esconde o modal do carrinho.
  --------------------------------------
*/
const toggleCartModal = () => {
  const modal = document.getElementById('cartModal');
  if (!modal) return;

  if (modal.style.display === 'block') {
      modal.style.display = 'none'; // Esconde o modal
      console.log("Modal do carrinho fechado.");
  } else {
      console.log("Abrindo modal do carrinho...");
      displayCart(); // Atualiza o conteúdo ANTES de mostrar
      modal.style.display = 'block'; // Mostra o modal
  }
};

/*----------------------------------------------------------
  Função de placeholder para finalizar a compra (Simulação).
  ----------------------------------------------------------
*/
const checkout = () => {
  if (carrinho.length === 0) {
      showToast("Seu carrinho está vazio para finalizar a compra!",'error',3000);
      return;
  }
  const totalFinal = calculateTotal();
  showToast(`Compra finalizada!\nTotal: R$ ${totalFinal}\nSeu carrinho será esvaziado.`,'success');

  carrinho = []; // Esvazia o array do carrinho
  saveCart(); // Salva o carrinho vazio no localStorage
  displayCart(); // Atualiza a exibição (mostrará vazio)
};

/*-----------------------------------------------------------------------------------
  Garante que o carrinho seja carregado e a lista buscada quando o DOM estiver pronto.
  -----------------------------------------------------------------------------------
*/
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  getList();

  // Adiciona listener para o botão de busca
  const searchButton = document.getElementById('searchButton');
  const searchQueryInput = document.getElementById('searchQuery');

  if (searchButton) {
      searchButton.onclick = () => {
          const query = searchQueryInput.value.trim();
          if (query) {
              searchExternalBooks(query);
          } else {
              alert("Por favor, digite um termo para buscar.");
          }
      };
  }
   // Opcional: buscar ao pressionar Enter no campo de busca
  if(searchQueryInput){
       searchQueryInput.addEventListener('keypress', function (e) {
          if (e.key === 'Enter') {
              searchButton.onclick(); // Simula o clique no botão
          }
       });
  }
});

                

/*
  --------------------------------------------------------------------------------------
  Função para obter a lista existente do servidor via requisição GET
  --------------------------------------------------------------------------------------
*/
const getList = async () => {
  let url = 'http://127.0.0.1:5000/livros_list';
  fetch(url, {
    method: 'get',
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("[getList] Dados recebidos:", data); // Log para verificar
            const bookContainer = document.getElementById('book-list-container');
            if (!bookContainer) {
                console.error("Elemento #book-list-container não encontrado!");
                return;
            }
            // Limpa o container antes de adicionar os novos cards
            bookContainer.innerHTML = '';
      // Adiciona os livros da resposta, passando os novos campos
      data.livros.forEach(livro =>{
        
    console.log("[getList] Processando livro:", livro);
    // O restante da chamada para insertList continua igual:
       insertList(
          livro.id,
          livro.nome,
          livro.autor,
          livro.quantidade,
          livro.valor,
          livro.capa_url,
          livro.descricao
      )})
    })
    .catch((error) => {
      console.error('Error fetching list:', error);
      alert("Erro ao carregar a lista de livros do servidor.");
    });
}


/*
  --------------------------------------------------------------------------------------
  Função para criar um botão close para cada item da lista
  --------------------------------------------------------------------------------------
*/
const insertButton = (parent) => {
  let span = document.createElement("span");
  let txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  parent.appendChild(span);
}


/*
  --------------------------------------------------------------------------------------
  Função para remover um livro da lista de acordo com o click no botão close
  --------------------------------------------------------------------------------------
*/
const removeElement = (buttonElement) => {
  // Encontra a linha (div.book-card) pai mais próxima do botão clicado
  console.log("[removeElement] Botão clicado:", buttonElement); // Log 1
  let card = buttonElement.closest('.book-card');
  console.log("[removeElement] Card encontrado:", card); // Log 2
  if (!card) return; // Sai se não encontrar a linha por algum motivo

  // Pega o ID do livro do dataset do card
  const bookId = card.dataset.bookId;
  // Pega o nome do livro do título dentro do card
  const nomeLivro = card.querySelector('.book-title')?.textContent || `ID ${bookId}`;
  console.log(`[removeElement] Tentando remover Livro ID: ${bookId}, Nome: ${nomeLivro}`); // Log 3

  if (confirm(`Você tem certeza que deseja remover o livro "${nomeLivro}"?`)) {
    console.log("[removeElement] Confirmação OK. Removendo card e chamando deleteItem..."); // Log 4
      card.remove(); // Remove o card da tela
      deleteItem(nomeLivro); // Chama a função para deletar no backend
      showToast("Livro Removido!",'success');
    } else {
      console.log("[removeElement] Remoção cancelada pelo usuário."); // Log 5

  }
}

/*
  --------------------------------------------------------------------------------------
  Função para deletar um livro da lista do servidor via requisição DELETE
  --------------------------------------------------------------------------------------
*/
const deleteItem = (item) => {
  console.log("Deletando:", item) 
  let url = `http://127.0.0.1:5000/livro_del?nome=${encodeURIComponent(item)}`; 
    fetch(url, {
    method: 'delete'
  })
    .then((response) => {
        if (!response.ok) {
             // Lança erro se a deleção falhar no backend
             return response.json().then(err => { throw new Error(err.mesage || `HTTP error! status: ${response.status}`) });
        }
        return response.json();
    })
    .then(data => {
         console.log("Resposta delete:", data); // Log da resposta
         
    })
    .catch((error) => {
      console.error('Error:', error);
      showToast(`Erro ao deletar livro: ${error.message}`,'error',3000);
    });
}

/*
  --------------------------------------------------------------------------------------
  Função para tratamento de erros no nome do livro.
  --------------------------------------------------------------------------------------
*/
const isValidName = (name) => {
  const trimmedName = name.trim();

  // Regra 1: Comprimento mínimo e máximo
  if (trimmedName.length < 3 || trimmedName.length > 100) {
    return false;
  }

  // Regra 2: Permitir apenas letras, espaços, e alguns caracteres comuns
  const validNameRegex = /^[a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ\s\-'\.]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return false;
  }

  // Regra 3: Não permitir nomes compostos apenas por espaços ou caracteres repetitivos
  const uniqueChars = new Set(trimmedName);
  if (uniqueChars.size <= 1) {
    return false;
  }

  // Regra 4: Nomes não podem conter números
  if (/\d/.test(trimmedName)) {
    return false;
  }

  return true;
};

/*
  -----------------------------------------------------------------------------
  Função para adicionar um novo livro
  -----------------------------------------------------------------------------
*/
const newItem = () => {
  let inputBook = document.getElementById("newBook").value;
  //let inputAuthor = document.getElementById("newAuthor").value;
  let inputQuantity = document.getElementById("newQuantity").value;
  let inputPrice = document.getElementById("newPrice").value;

  // Validações
  if (!isValidName(inputBook)) {
      showToast("Nome do livro inválido! Certifique-se de que ele é válido.",'error',3000);
      return;
  }
  if (isNaN(inputQuantity) || isNaN(inputPrice) || inputQuantity === '' || inputPrice === '') {
      showToast("Quantidade e valor são obrigatórios e precisam ser números!",'error',3000);
      return;
  }
  // Checagem de duplicata (baseada nos cards existentes)
  let isDuplicate = false;
  const existingCards = document.querySelectorAll('.book-card');
  existingCards.forEach(card => {
      const titleElement = card.querySelector('.book-title');
      if (titleElement && titleElement.textContent.trim().toLowerCase() === inputBook.trim().toLowerCase()) {
          isDuplicate = true;
      }
  });
  if (isDuplicate) {
      showToast("Este livro já está cadastrado no estoque!",'error',3000);
      return;
  }

  // Chama postItem SÓ com os 3 campos
  console.log(`Chamando postItem para: ${inputBook}`);
  postItem(inputBook, inputQuantity, inputPrice);
};

/*
--------------------------------------------------------------------------------------
Função para colocar um item na lista do servidor via requisição POST
--------------------------------------------------------------------------------------
*/
const postItem = async (inputBook, inputQuantity, inputPrice) => {
  const formData = new FormData();
  formData.append('nome', inputBook);
  formData.append('quantidade', inputQuantity);
  formData.append('valor', String(inputPrice).replace(',', '.'))
  
  let url = 'http://127.0.0.1:5000/livro_adiciona';
    fetch(url, {
      method: 'post',
      body: formData
  })
  .then(response => {
       if (!response.ok) {
           // Se backend retornar erro (ex: 409 Duplicado, 400 Bad Request)
           return response.json().then(err => { throw new Error(err.mesage || `HTTP error! status: ${response.status}`) });
       }
       return response.json(); // Processa a resposta JSON do livro adicionado
  })
  .then(addedBook => {
      // SUCESSO! Insere o livro na lista DO FRONTEND usando os dados retornados pelo backend
      insertList(
          addedBook.id,
          addedBook.nome,
          addedBook.autor,
          addedBook.quantidade,
          addedBook.valor,
          addedBook.capa_url, 
          addedBook.descricao 
      );
      showToast("Livro adicionado com sucesso!",'success');
      // Limpa o formulário AQUI, após o sucesso
      document.getElementById("newBook").value = "";
      document.getElementById("newQuantity").value = "";
      document.getElementById("newPrice").value = "";
  })
  .catch((error) => {
      console.error('Error posting item:', error);
      showToast(`Erro ao adicionar livro: ${error.message}`,'error',3000);
  });
}
/*
  --------------------------------------------------------------------------------------
  Função para inserir um LIVRO como um CARD na lista apresentada
  --------------------------------------------------------------------------------------
*/
const insertList = (bookId, nameBook, author, quantity, price, capa_url, descricao) => {
  // Encontra o container onde os cards serão adicionados
  const bookContainer = document.getElementById('book-list-container');
  // Sai da função se o container não for encontrado no HTML
  if (!bookContainer) {
      console.error("Container #book-list-container não encontrado no DOM.");
      return;
  }

  // Cria o elemento principal do card (um div)
  const card = document.createElement('div');
  card.classList.add('book-card'); // Adiciona a classe CSS para estilização
  card.dataset.bookId = bookId;   // Armazena o ID do livro no atributo data-book-id do card

  // --- Preparação da Imagem da Capa (ou Placeholder) ---
  let imgHtml = ''; // Variável para guardar o HTML da imagem ou do placeholder
  if (capa_url) {
      // Se tem URL da capa, cria a tag img
      imgHtml = `<img src="${capa_url}" alt="Capa de ${nameBook}" class="book-cover">`;
  } else {
      // Se não tem URL, cria um div como placeholder
      imgHtml = '<div class="book-cover-placeholder">Sem Capa</div>';
  }

  // --- Formatação do Preço ---
  // Garante que o preço seja um número e formata como moeda brasileira
  const valorFormatado = (parseFloat(price) || 0).toFixed(2).replace('.', ',');

  // --- Criação CONDICIONAL do HTML do Botão Adicionar ao Carrinho ---
    // Garante que a quantidade seja tratada como número
    const stockQuantity = parseInt(quantity, 10) || 0;
    let addCartButtonHtml = ''; // Variável para guardar o HTML do botão

    // Verifica o estoque para decidir como criar o botão do carrinho
    if (stockQuantity <= 0) {
        // Se estoque for 0 ou menos, cria o botão JÁ DESABILITADO na string HTML
        console.log(`[insertList] Gerando botão Carrinho DESABILITADO para ${nameBook} (Estoque: ${stockQuantity})`);
        addCartButtonHtml = `
            <button class="addCartBtn disabled" title="Fora de estoque" disabled>🛒</button>
            `;
            // Adiciona a classe 'disabled' (para CSS) e o atributo 'disabled' (para funcionalidade)
    } else {
        // Se tiver estoque, cria o botão normal, habilitado e com o onclick
        console.log(`[insertList] Gerando botão Carrinho HABILITADO para ${nameBook} (Estoque: ${stockQuantity})`);
        addCartButtonHtml = `
            <button class="addCartBtn" title="Adicionar ao Carrinho" onclick="handleAddToCartClick(this)">🛒</button>
            `;
            // Chama handleAddToCartClick ao ser clicado
    }
  const actionsHtml = `
      <div class="card-actions">
          <button class="editBtn" title="Editar Livro" onclick="prepareEdit(this)">✏️</button>
          <button class="deleteBtn" title="Remover Livro" onclick="removeElement(this)">❌</button>
          ${addCartButtonHtml} </div>
  `;

  // Montagem do HTML Interno Completo do Card 
  card.innerHTML = `
      ${imgHtml}  <div class="book-info"> <h4 class="book-title" title="${descricao || ''}">${nameBook}</h4> <p class="book-author">${author}</p> <p class="book-price">R$ ${valorFormatado}</p> <p class="book-quantity">Estoque: ${quantity}</p> </div>

      ${actionsHtml} `;

  // Adiciona o Card ao Container
  bookContainer.appendChild(card);
};

/*
  --------------------------------------------------------------------------------------
  Função para preparar o formulário para edição de um item
  --------------------------------------------------------------------------------------
*/
const prepareEdit = (buttonElement) => {
  console.log("[prepareEdit] Botão clicado:", buttonElement); // Log 1
  let card = buttonElement.closest('.book-card');
  console.log("[prepareEdit] Card encontrado:", card); // Log 2
  if (!card) return;

  // Pega os dados dos elementos dentro do card
  const bookId = card.dataset.bookId; // <<< Pega o ID
  const nameBook = card.querySelector('.book-title')?.textContent || '';
  const author = card.querySelector('.book-author')?.textContent || '';
  const quantity = card.querySelector('.book-quantity')?.textContent.replace('Estoque: ','') || '0';
  const priceText = card.querySelector('.book-price')?.textContent || '0';
  const price = priceText.replace('R$', '').replace(',', '.').trim(); // Pega só o número
  console.log(`[prepareEdit] Dados extraídos - ID: ${bookId}, Nome: ${nameBook}, Autor: ${author}, Qtd: ${quantity}, Preço: ${price}`); // Log 3


  // Preenche o formulário com os dados do livro
  document.getElementById("newBook").value = nameBook;
  //document.getElementById("newAuthor").value = author;
  document.getElementById("newQuantity").value = quantity;
  document.getElementById("newPrice").value = price;
  console.log("[prepareEdit] Formulário preenchido."); // Log 4

  // Desabilita o campo do nome do livro (não permitiremos editar o nome por aqui)
  document.getElementById("newBook").disabled = true;

  // Armazena o nome original e ativa o modo de edição
  currentEditingBookName = nameBook;
  currentEditingBookAuthor = author;
  editMode = true;
  console.log("[prepareEdit] Modo Edição Ativado. Nome para PUT:", currentEditingBookName); // Log 5


  // Modifica o botão principal do formulário para "Salvar Alterações"
  const mainButton = document.querySelector('.addBtn'); // Assume que o botão tem a classe 'addBtn'
  mainButton.textContent = "Salvar Alterações";
  mainButton.onclick = function() { updateItem(); }; // Agora o botão chama updateItem
  console.log("[prepareEdit] Botão principal atualizado para 'Salvar Alterações' e chama updateItem."); // Log 6
  document.querySelector('.newItem').scrollIntoView({ behavior: 'smooth' });

}

/*
  --------------------------------------------------------------------------------------
  Função para enviar a requisição PUT de atualização para o servidor
  --------------------------------------------------------------------------------------
*/
const updateItem = () => {
  // Verifica se estamos realmente em modo de edição e temos um nome de livro
  if (!editMode || !currentEditingBookName) {
      resetForm(); // Reseta o formulário se algo estiver errado
      return;
  }

  // Pega os dados (editados) do formulário
  //let inputAuthor = document.getElementById("newAuthor").value;
  let inputQuantity = document.getElementById("newQuantity").value;
  let inputPrice = document.getElementById("newPrice").value;

  // Validação básica

  if (isNaN(inputQuantity) || isNaN(inputPrice) || inputQuantity === '' || inputPrice === '') {
      showToast("Quantidade e valor são obrigatórios e precisam ser números!",'error',3000);
      return;
  }

  // Monta o objeto com os dados a serem enviados no corpo da requisição
  const updatedData = {
      autor: currentEditingBookAuthor,
      quantidade: parseInt(inputQuantity), // Garante que seja número inteiro
      valor: parseFloat(inputPrice) // Garante que seja número (pode ter decimais)
  };

  // Cria a URL para a requisição PUT, incluindo o nome original na query string
  let url = `http://127.0.0.1:5000/livro_update?nome=${encodeURIComponent(currentEditingBookName)}`;
    
  fetch(url, {
      method: 'put',
      headers: {
          'Content-Type': 'application/json', 
      },
      body: JSON.stringify(updatedData) 
  })
  .then(response => {
      if (!response.ok) {
          // Se a resposta não for OK (ex: 404, 400, 500), lança um erro
          return response.json().then(err => { throw new Error(err.mesage || `HTTP error! status: ${response.status}`) });
      }
      return response.json(); // Converte a resposta OK para JSON
  })
  .then(updatedBook => {
      // Sucesso! Atualiza a tabela no frontend
      showToast(`Livro "${currentEditingBookName}" atualizado com sucesso!`,'success');

      // Encontra o CARD correspondente ao livro editado
        // Usando o nome original por enquanto, pois é o identificador do PUT
        const cards = document.querySelectorAll('.book-card');
        let cardToUpdate = null;
        cards.forEach(card => {
            // Compara pelo título dentro do card
            if (card.querySelector('.book-title')?.textContent === currentEditingBookName) {
                cardToUpdate = card;
            }
        });

        if (cardToUpdate) {
            console.log("Atualizando card no DOM:", cardToUpdate);
            // Atualiza os dados visuais DENTRO do card encontrado
            cardToUpdate.querySelector('.book-author').textContent = updatedBook.autor;
            cardToUpdate.querySelector('.book-quantity').textContent = `Estoque: ${updatedBook.quantidade}`;
            const valorFormatado = (parseFloat(updatedBook.valor) || 0).toFixed(2).replace('.', ',');
            cardToUpdate.querySelector('.book-price').textContent = `R$ ${valorFormatado}`;
            // Atualiza o tooltip do título se a descrição for retornada (não fizemos isso no PUT ainda)
             if(updatedBook.descricao) cardToUpdate.querySelector('.book-title').title = updatedBook.descricao;
             // Atualiza ID no dataset se o PUT o retornasse (útil se nome pudesse mudar)
        } else {
             console.warn("Não foi possível encontrar o card para atualizar visualmente após a edição.");
        }
        resetForm();
    })
  .catch((error) => {
      console.error('Error during update:', error);
      showToast(`Erro ao atualizar livro: ${error.message}`,'error',3000);
      resetForm();
  });
}

/*
  --------------------------------------------------------------------------------------
  Função para limpar o formulário e resetar o estado de edição
  --------------------------------------------------------------------------------------
*/
const resetForm = () => {
  // Limpa os campos do formulário
  document.getElementById("newBook").value = "";
  document.getElementById("newQuantity").value = "";
  document.getElementById("newPrice").value = "";

  // Habilita o campo do nome do livro novamente
  document.getElementById("newBook").disabled = false;

  // Reseta as variáveis de controle de edição
  editMode = false;
  currentEditingBookName = null;
  currentEditingBookAuthor = null;

  // Restaura o botão principal do formulário para "Adicionar Livro"
  const mainButton = document.querySelector('.addBtn');
  mainButton.textContent = "Adicionar Livro";
  mainButton.onclick = function() { newItem(); }; // Botão volta a chamar newItem
}

/*----------------------------------------------------------
  Pega os dados do livro a partir do card e chama addToCart.
  ----------------------------------------------------------
*/
const handleAddToCartClick = (buttonElement) => {
  const card = buttonElement.closest('.book-card');
  if (!card) return;

  const bookId = card.dataset.bookId;
  // Pega os dados dos elementos dentro do card
  const name = card.querySelector('.book-title')?.textContent || 'Nome não encontrado';
  const priceText = card.querySelector('.book-price')?.textContent || '0';
  const price = parseFloat(priceText.replace('R$', '').replace(',', '.')) || 0;
  const capa_url = card.querySelector('.book-cover')?.src || card.querySelector('.book-cover-placeholder') ? (card.querySelector('.book-cover')?.src || null) : null; // Tenta pegar a URL da capa

  if (!bookId) {
      console.error("Não foi possível encontrar o ID do livro no card.");
      return;
  }

  addToCart(bookId, name, price, capa_url); // Chama a função do carrinho existente
}
