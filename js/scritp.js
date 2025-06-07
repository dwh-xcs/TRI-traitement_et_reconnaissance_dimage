document.addEventListener('DOMContentLoaded', () => {
    // Constantes para elementos frequentemente usados
    const allNavLinks = document.querySelectorAll('nav a');
    const header = document.querySelector('header');
    const headerHeight = header.offsetHeight; // Altura do cabeçalho fixo

    const ctaButton = document.querySelector('.button-cta');
    const sectionFerramenta = document.getElementById('ferramenta'); // Sua seção 3
    
    const uploadBoxes = document.querySelectorAll('.upload-box');
    const clearUploadsButton = document.getElementById('clearUploadsButton');
    const selectElements = document.querySelectorAll('.select-group select');
    const startProcessButton = document.getElementById('startProcessButton');

    // Nova seção 4 e seus botões
    const section4 = document.querySelector('.section-4');
    const reprocessButton = section4.querySelector('.results-buttons .button-clear');
    const implementButton = section4.querySelector('.results-buttons .button-primary');

    // 1. Navegação Suave para as Seções (Scroll Suave)
    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#') && targetId.length > 1) {
                e.preventDefault();
                const targetSection = document.getElementById(targetId.substring(1));
                
                if (targetSection) {
                    const offsetTop = targetSection.getBoundingClientRect().top + window.scrollY - headerHeight;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });

                    allNavLinks.forEach(navLink => navLink.classList.remove('active'));
                    link.classList.add('active');
                }
            } else if (targetId === '#') { // Lida com o link "Início"
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                allNavLinks.forEach(navLink => navLink.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Lógica para o botão "Começar Agora" na seção 1
    if (ctaButton && sectionFerramenta) {
        ctaButton.addEventListener('click', (e) => {
            e.preventDefault();
            const offsetTop = sectionFerramenta.getBoundingClientRect().top + window.scrollY - headerHeight;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            allNavLinks.forEach(navLink => navLink.classList.remove('active'));
            const ferramentaLink = document.querySelector('nav a[href="#ferramenta"]');
            if (ferramentaLink) {
                ferramentaLink.classList.add('active');
            }
        });
    }

    // 2. Funcionalidade de Upload de Arquivos (Clique e Arrastar/Soltar com Pré-visualização)
    uploadBoxes.forEach(box => {
        const fileInputId = box.id === 'uploadBoxTreinamento' ? 'fileInputTreinamento' : 'fileInputTeste';
        const input = document.getElementById(fileInputId);

        if (!input) {
            console.error(`Input file com ID ${fileInputId} não encontrado para a caixa ${box.id}`);
            return;
        }

        box.addEventListener('click', () => {
            input.click();
        });

        input.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                const firstFile = files[0]; 
                if (firstFile.type.startsWith('image/')) {
                    displayImagePreview(box, firstFile);
                } else {
                    box.innerHTML = `<i class="fas fa-file-alt fa-2x"></i><p>Arquivo selecionado:<br>${firstFile.name}</p><p>Arraste outros arquivos aqui</p>`;
                }
            } else {
                resetUploadBox(box, box.id === 'uploadBoxTreinamento' ? 'Treinamento' : 'Teste');
            }
        });

        box.addEventListener('dragover', (e) => {
            e.preventDefault();
            box.style.backgroundColor = '#333';
            box.style.borderColor = '#00e0e0';
        });

        box.addEventListener('dragleave', () => {
            box.style.backgroundColor = 'var(--secondary-color)';
            box.style.borderColor = 'var(--accent-color)';
        });

        box.addEventListener('drop', (e) => {
            e.preventDefault();
            box.style.backgroundColor = 'var(--secondary-color)';
            box.style.borderColor = 'var(--accent-color)';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });

    // Função auxiliar para exibir pré-visualização de imagem
    function displayImagePreview(box, file) {
        box.innerHTML = ''; 

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.alt = 'Pré-visualização da imagem';
            box.appendChild(img);
        };
        reader.readAsDataURL(file);
    }

    // Função auxiliar para resetar o conteúdo da caixa de upload
    function resetUploadBox(box, type) {
        box.innerHTML = `
            <i class="fas fa-upload fa-2x"></i>
            <p>${type}<br>Arraste os arquivos aqui</p>
        `;
        const fileInputId = box.id === 'uploadBoxTreinamento' ? 'fileInputTreinamento' : 'fileInputTeste';
        const input = document.getElementById(fileInputId);
        if (input) {
            input.value = '';
        }
    }

    // 3. Funcionalidade do Botão Limpar Caixas
    if (clearUploadsButton) {
        clearUploadsButton.addEventListener('click', () => {
            uploadBoxes.forEach(box => {
                const type = box.id === 'uploadBoxTreinamento' ? 'Treinamento' : 'Teste';
                resetUploadBox(box, type);
            });

            selectElements.forEach(select => {
                select.selectedIndex = 0;
            });

            console.log('Caixas de upload e listas suspensas limpas.');
            // Opcional: Ocultar seção 4 se ela estiver visível ao limpar
            if (section4.classList.contains('visible')) {
                hideResultsSection();
            }
            alert('Formulário limpo!'); // Feedback simples
        });
    }

    // 4. Funcionalidade do Botão Iniciar Processo
    if (startProcessButton) {
        startProcessButton.addEventListener('click', () => {
            console.log('Botão "Iniciar Processo" clicado!');
            
            const filesToUpload = [];
            const fileInputTreinamento = document.getElementById('fileInputTreinamento');
            const fileInputTeste = document.getElementById('fileInputTeste');

            if (fileInputTreinamento && fileInputTreinamento.files.length > 0) {
                for (let i = 0; i < fileInputTreinamento.files.length; i++) {
                    filesToUpload.push({ type: 'treinamento', file: fileInputTreinamento.files[i] });
                }
            }
            if (fileInputTeste && fileInputTeste.files.length > 0) {
                for (let i = 0; i < fileInputTeste.files.length; i++) {
                    filesToUpload.push({ type: 'teste', file: fileInputTeste.files[i] });
                }
            }

            const tipoArquivo = selectElements[0] ? selectElements[0].value : '';
            const reconhecimentoTipo = selectElements[1] ? selectElements[1].value : '';

            console.log('Arquivos para upload:', filesToUpload);
            console.log('Tipo de Arquivo Selecionado:', tipoArquivo);
            console.log('Tipo de Reconhecimento Selecionado:', reconhecimentoTipo);

            if (filesToUpload.length === 0) {
                alert('Por favor, arraste ou selecione arquivos para iniciar o processo.');
                return;
            }
            
            // --- SIMULAÇÃO DE PROCESSO E EXIBIÇÃO DE RESULTADOS ---
            alert('Processo iniciado! Aguarde os resultados (simulação)...');
            // Normalmente, você chamaria sua API aqui:
            // sendFilesAndOptionsToAPI(filesToUpload, tipoArquivo, reconhecimentoTipo);

            // SIMULAÇÃO: Após um atraso, mostra a seção de resultados
            setTimeout(() => {
                // Aqui você preencheria os dados da seção 4 com os resultados da API
                // Por exemplo:
                // document.querySelector('.processed-image').src = "URL_DA_IMAGEM_PROCESSADA";
                // document.querySelector('.processing-results p:nth-child(2) span').textContent = "92%"; // Acuracidade
                // document.querySelector('.processing-results p:nth-child(3) span').textContent = "1"; // Modelos com falha

                showResultsSection();
                alert('Processo concluído! Verifique os resultados abaixo.');
            }, 3000); // Simula 3 segundos de processamento
        });
    }

    // Funções para mostrar e ocultar a Seção 4 (Resultados)
    function showResultsSection() {
        section4.classList.add('visible');
        // Rolar para a seção 4
        const offsetTop = section4.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }

    function hideResultsSection() {
        section4.classList.remove('visible');
        // Opcional: Rolar para o topo da seção 3 (ferramenta)
        const offsetTop = sectionFerramenta.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }

    // 5. Funcionalidade dos Botões da Seção 4 (Resultados)
    if (reprocessButton) {
        reprocessButton.addEventListener('click', () => {
            alert('Reprocessar clicado! Voltando para a ferramenta de upload...');
            hideResultsSection(); // Oculta a seção de resultados
            // Limpa as caixas e selects da seção 3 também, se necessário
            clearUploadsButton.click(); // Simula o clique no botão de limpar
        });
    }

    if (implementButton) {
        implementButton.addEventListener('click', () => {
            alert('Implementar clicado! (Aqui você pode oferecer download, integração, etc.)');
            // Exemplo: window.open('URL_PARA_DOWNLOAD', '_blank');
        });
    }

    // Exemplo de função para enviar arquivos e opções para a API (descomente e adapte)
    /*
    function sendFilesAndOptionsToAPI(filesInfo, fileType, recognitionType) {
        const formData = new FormData();
        filesInfo.forEach(item => {
            formData.append(`${item.type}_files[]`, item.file);
        });
        formData.append('fileType', fileType);
        formData.append('recognitionType', recognitionType);

        fetch('/api/initiate-process', {
            method: 'POST',
            body: formData,
            // headers: {
            //     'Authorization': 'Bearer SEU_TOKEN_AQUI'
            // }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Processo iniciado com sucesso:', data);
            // Preencher os dados da seção 4 com 'data'
            // Ex: document.querySelector('.processed-image').src = data.processedImageUrl;
            // E então:
            showResultsSection();
        })
        .catch(error => {
            console.error('Erro ao iniciar processo:', error);
            alert('Ocorreu um erro ao iniciar o processo. Tente novamente.');
            // Opcional: Esconder a seção de carregamento ou mostrar mensagem de erro na UI
        });
    }
    */
});