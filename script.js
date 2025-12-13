// Variáveis de Machine Learning e UI
let model, video, canvas, ctx; // Referências globais para elementos do DOM e Modelo
let lastSpoken = ""; // Armazena a última frase dita para evitar repetição contínua
let lastTime = 0; // Timestamp da última fala

// Controle de frequência de fala (Throttle)
// Impede que o app fale "Cadeira" 60 vezes por segundo.
const SPEECH_INTERVAL = 2000; // 2 segundos entre falas

// Limiares de Confiança (0.0 a 1.0)
const CONFIDENCE_DRAW = 0.6; // Só desenha o quadrado se tiver 60% de certeza
const CONFIDENCE_SPEAK = 0.6; // Só fala se tiver 60% de certeza (Equilíbrio entre sensibilidade e falsos positivos)

// Semáforo para controle de concorrência
// Impede que uma nova detecção comece se a anterior ainda estiver sendo processada (evita travamento da UI)
let isDetecting = false; 

// CONTROLE DE HARDWARE (CÂMERA)

let usandoCameraFrontal = false; // Estado para alternar câmeras em mobile
let streamAtual = null; // Referência para poder parar a câmera adequadamente

async function iniciarCamera() {
    // 1. Limpeza de Recursos:
    // É crucial parar as tracks da stream anterior antes de abrir uma nova,
    // caso contrário, o navegador pode negar acesso ou manter a luz da câmera acesa.
    if (streamAtual) {
        streamAtual.getTracks().forEach(t => t.stop());
    }

    try {
        // Configurações da API MediaDevices
        const constraints = {
            video: {
                // "user" = Frontal (Selfie), "environment" = Traseira (Principal)
                facingMode: usandoCameraFrontal ? "user" : "environment",
                // Preferência por HD (melhor para detecção de objetos pequenos)
                width: { ideal: 1280 }, 
                height: { ideal: 720 }
            }
        };

        // Solicita acesso ao hardware
        streamAtual = await navigator.mediaDevices.getUserMedia(constraints);

        video = document.getElementById("webcam");
        video.srcObject = streamAtual;

        // Evento 'loadeddata': Disparado quando o primeiro frame de vídeo chega.
        // Essencial: Evita tentar rodar a IA em um elemento <video> vazio (que causaria erro no Tensor).
        video.addEventListener('loadeddata', () => {
            // Sincroniza o tamanho do canvas de desenho com a resolução real entregue pela câmera
            canvas.width = video.videoWidth; 
            canvas.height = video.videoHeight;
            
            // Inicia o loop de inferência apenas se o modelo já estiver carregado
            if (model) {
                detectFrame();
            }
        }, { once: true }); // Executa apenas uma vez por inicialização de câmera

    } catch (err) {
        // Tratamento de erro robusto (ex: usuário negou permissão ou sem câmera)
        document.getElementById('status').innerText = 'Error accessing the camera: ' + err.name;
        console.error("Error accessing the camera:", err);
    }
}

// INICIALIZAÇÃO DA IA

async function init() {
    // Carrega o modelo COCO-SSD (TensorFlow.js)
    // Este modelo é "lightweight", otimizado para rodar no browser/mobile.
    model = await cocoSsd.load();
    document.getElementById('status').innerText = 'Model loaded ✅. Starting detection...';

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // Só inicia a câmera após o modelo pesado estar na memória
    iniciarCamera();
}

// LOOP DE DETECÇÃO EM TEMPO REAL

async function detectFrame() {
    // Verificações de Segurança:
    // 1. video.readyState < 2: O vídeo ainda não tem dados suficientes.
    // 2. !model: Modelo caiu ou não carregou.
    // 3. isDetecting: O loop anterior ainda está processando (backpressure).
    if (video.readyState < 2 || !model || isDetecting) {
        requestAnimationFrame(detectFrame); // Tenta novamente no próximo repaint
        return;
    }
    
    isDetecting = true; // Bloqueia novas chamadas (Lock)
    
    try {
        // Inferência assíncrona (Onde a mágica do ML acontece)
        const predictions = await model.detect(video);
        
        // Renderiza visualmente
        drawPredictions(predictions);
        
        // Processa áudio (Acessibilidade)
        speakObjects(predictions);
    } catch (error) {
        console.error("Detection failed:", error);
    } finally {
        isDetecting = false; // Libera o Lock para o próximo frame
    }
    
    // Agenda o próximo frame (Loop infinito otimizado pelo browser)
    requestAnimationFrame(detectFrame);
}

// LÓGICA DE RENDERIZAÇÃO (CANVAS)

function drawPredictions(predictions) {
    // Limpa o canvas e desenha o frame atual do vídeo (fundo)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Estilização do bounding box (alto contraste para baixa visão)
    ctx.font = '16px sans-serif';
    ctx.strokeStyle = '#00FF00'; // Verde Limão
    ctx.lineWidth = 2;

    const detectedNames = [];

    predictions.forEach(pred => {
        // Filtra objetos com baixa confiança visual
        if (pred.score < CONFIDENCE_DRAW) return;

        const [x, y, w, h] = pred.bbox;
        
        // Desenha o retângulo
        ctx.strokeRect(x, y, w, h);
        
        // Desenha o rótulo (texto)
        ctx.fillStyle = '#00FF00';
        const label = `${pred.class} ${(pred.score * 100).toFixed(1)}%`;
        // Ajuste ternário para o texto não ficar fora da tela se o objeto estiver no topo
        ctx.fillText(label, x, y > 10 ? y - 5 : 10);
        
        detectedNames.push(pred.class);
    });

    // Atualiza a barra de status com lista única de objetos
    const uniqueNames = [...new Set(detectedNames)];
    const text = uniqueNames.length
        ? "Objects detected: " + uniqueNames.join(", ")
        : "No objects detected.";
    document.getElementById('status').innerText = text;
}

// LÓGICA DE SÍNTESE DE VOZ (TTS)

function speakObjects(predictions) {
    // Filtra duplicatas e confianças baixas
    const names = [...new Set(predictions.filter(p => p.score >= CONFIDENCE_SPEAK).map(p => p.class))];
    if (names.length === 0) return;

    const sentence = "Detected " + names.join(" and ");
    const now = Date.now();
    
    // Lógica de Controle de Fluxo de Fala:
    // 1. sentence !== lastSpoken: Evita repetir a mesma coisa se a cena não mudou.
    // 2. now - lastTime > SPEECH_INTERVAL: Respeita o intervalo de 2 segundos.
    // 3. !speechSynthesis.speaking: Não encavala falas se o navegador ainda estiver falando.
    if (sentence !== lastSpoken && now - lastTime > SPEECH_INTERVAL && !speechSynthesis.speaking) {
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-US'; // Pode ser alterado para 'pt-BR' se o modelo suportar tradução
        
        try {
             speechSynthesis.speak(utterance);
             lastSpoken = sentence; // Atualiza o cache da última fala
             lastTime = now;
        } catch (e) {
             console.warn("Speech synthesis failed or was interrupted.", e);
        }
    }
}

// MODO ANÁLISE DE IMAGEM ESTÁTICA

async function analyzeStaticImage(imgElement, statusElement) {
    if (!model) {
        statusElement.innerText = "Model not loaded. Please wait.";
        return;
    }
    
    // Pequeno hack de async: Pausa o script por 100ms para permitir que o navegador
    // renderize a imagem carregada antes de travar a thread com a detecção pesada.
    await new Promise(resolve => setTimeout(resolve, 100)); 

    // Roda a detecção UMA VEZ na imagem (não usa loop requestAnimationFrame)
    const predictions = await model.detect(imgElement);

    const names = [...new Set(predictions.filter(p => p.score >= CONFIDENCE_SPEAK).map(p => p.class))];
    
    let resultText;
    if (names.length > 0) {
        resultText = "Detected: " + names.join(", ");
        
        // Feedback sonoro imediato para imagem estática
        const sentence = "I see " + names.join(" and ");
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-US'; 
        
        try {
             speechSynthesis.speak(utterance);
        } catch (e) {
             console.warn("Speech synthesis failed or was interrupted.", e);
        }

    } else {
        resultText = "No objects detected with high confidence.";
    }

    statusElement.innerText = resultText;
}

function exitStaticView() {
    // Esconde a UI de imagem estática
    document.getElementById("static-image-display").style.display = 'none';
    // Reinicia a câmera e o loop de detecção ao vivo
    init(); 
}

// GERENCIAMENTO DE EVENTOS DO DOM

document.addEventListener("DOMContentLoaded", () => {
    
    // Captura referências de UI
    const galleryBtn = document.getElementById("gallery-btn");
    const imageUpload = document.getElementById("image-upload");
    const staticDisplay = document.getElementById("static-image-display");
    const analyzedImage = document.getElementById("analyzed-image");
    const staticStatus = document.getElementById("static-status");
    const closeBtn = document.getElementById("close-static-view");
    
    const menuBtn = document.getElementById("menu-btn");
    const menuDropdown = document.getElementById("menu-dropdown");

    // Botão de alternar câmera
    document.getElementById("toggleCamera").addEventListener("click", () => {
        usandoCameraFrontal = !usandoCameraFrontal;
        init(); // Reinicia todo o fluxo (stop tracks -> start new tracks)
    });

    // Lógica do Menu Dropdown
    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            menuDropdown.classList.toggle("open");
        });

        // Fecha o menu se clicar fora dele
        document.addEventListener("click", (e) => {
            if (menuDropdown.classList.contains("open") && !menuDropdown.contains(e.target) && e.target !== menuBtn) {
                menuDropdown.classList.remove("open");
            }
        });
    }

    // Botão da Galeria dispara o input file oculto
    if (galleryBtn && imageUpload) {
        galleryBtn.addEventListener("click", () => {
            imageUpload.click();
        });
    }

    // Processamento do Upload de Imagem
    if (imageUpload) {
        imageUpload.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {

                // Pausa a câmera atual para economizar recursos enquanto analisa a foto
                if (streamAtual) {
                    streamAtual.getTracks().forEach(t => t.stop());
                }
                
                // Alterna visibilidade da UI (Live -> Estático)
                document.getElementById("canvas").style.display = 'none';
                document.getElementById("webcam").style.display = 'none';

                staticDisplay.style.display = 'flex';
                staticStatus.innerText = 'Analyzing image...';

                // FileReader para converter o arquivo em Base64 para exibir no <img>
                const reader = new FileReader();
                reader.onload = (e) => {
                    analyzedImage.src = e.target.result;

                    // Chama a função de análise estática
                    analyzeStaticImage(analyzedImage, staticStatus);
                };
                reader.readAsDataURL(file);
                
                // Reseta o value para permitir selecionar a mesma imagem 2x seguidas se necessário
                event.target.value = null; 
            }
        });
    }

    // Botão de fechar a visualização estática
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
             staticDisplay.style.display = 'none';

             // Restaura UI da câmera
             document.getElementById("canvas").style.display = 'block';
             document.getElementById("webcam").style.display = 'block';

             // Reinicia o fluxo da câmera
             init();
        });
    }
});


// Ponto de entrada da aplicação
init();