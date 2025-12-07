// Variáveis de Machine Learning e UI
let model, video, canvas, ctx;
let lastSpoken = "";
let lastTime = 0;
const SPEECH_INTERVAL = 2000;
const CONFIDENCE_DRAW = 0.6; // Limiar para desenhar (visível na tela)
const CONFIDENCE_SPEAK = 0.6; // Limiar para falar/análise estática
let isDetecting = false; // Flag para prevenir chamadas de detecção concorrentes
let lastUtterance = null; // Armazena a última utterance para evitar garbage collection em mobile

// Variáveis de Controle de Câmera
let usandoCameraFrontal = false;
let streamAtual = null;


// 1. FUNÇÃO PARA INICIAR CÂMERA (COM CORREÇÃO DE ZOOM)
async function iniciarCamera() {
    // Para a stream anterior, se houver
    if (streamAtual) {
        streamAtual.getTracks().forEach(t => t.stop());
    }

    try {
        const constraints = {
            video: {
                // Alterna entre frontal ("user") e traseira ("environment")
                facingMode: usandoCameraFrontal ? "user" : "environment",
                // Solicita resolução ideal para incentivar o uso de lentes mais amplas/melhores
                width: { ideal: 1280 }, 
                height: { ideal: 720 }
            }
        };

        streamAtual = await navigator.mediaDevices.getUserMedia(constraints);

        video = document.getElementById("webcam");
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        
        video.srcObject = streamAtual;

        // Garante que a detecção comece apenas após o vídeo ser carregado
        video.addEventListener('loadeddata', () => {
            // Garante que o canvas seja redimensionado para a resolução real da câmera
            canvas.width = video.videoWidth; 
            canvas.height = video.videoHeight;
            
            // Inicia o loop de detecção
            if (model) {
                detectFrame();
            }
        }, { once: true });

    } catch (err) {
        document.getElementById('status').innerText = 'Error accessing the camera: ' + err.name;
        console.error("Error accessing the camera:", err);
    }
}


// 2. FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO E CARREGAMENTO DO MODELO
async function init() {
    // Carrega modelo COCO-SSD
    model = await cocoSsd.load();
    document.getElementById('status').innerText = 'Model loaded ✅. Starting detection...';

    // Inicia a câmera
    iniciarCamera();
}


// 3. LOOP DE DETECÇÃO CONTÍNUA (Modo Câmera)
async function detectFrame() {
    // Verifica a flag 'isDetecting' para evitar sobrecarga e travamentos
    if (video.readyState < 2 || !model || isDetecting) {
        requestAnimationFrame(detectFrame);
        return;
    }
    
    // Oculta o vídeo, exibe apenas o canvas com as predições e o feed do vídeo desenhado
    document.getElementById("webcam").style.display = 'none';
    document.getElementById("canvas").style.display = 'block';

    isDetecting = true; // Define como 'ocupado'
    
    try {
        const predictions = await model.detect(video);
        drawPredictions(predictions);
        speakObjects(predictions);
    } catch (error) {
        console.error("Detection failed:", error);
    } finally {
        isDetecting = false; // Libera para o próximo frame
    }
    
    requestAnimationFrame(detectFrame);
}


// 4. DESENHO DAS CAIXAS DELIMITADORAS
function drawPredictions(predictions) {
    // Desenha o frame do vídeo primeiro
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.font = '16px sans-serif';
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    const detectedNames = [];

    predictions.forEach(pred => {
        if (pred.score < CONFIDENCE_DRAW) return;

        const [x, y, w, h] = pred.bbox;
        
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = '#00FF00';
        const label = `${pred.class} ${(pred.score * 100).toFixed(1)}%`;
        ctx.fillText(label, x, y > 10 ? y - 5 : 10);
        
        detectedNames.push(pred.class);
    });

    const uniqueNames = [...new Set(detectedNames)];
    const text = uniqueNames.length
        ? "Objects detected: " + uniqueNames.join(", ")
        : "No objects detected.";
    document.getElementById('status').innerText = text;
}


// 5. FEEDBACK POR ÁUDIO (Speech Synthesis)
function speakObjects(predictions) {
    // Garante que apenas as classes detectadas acima do limiar sejam consideradas
    const names = [...new Set(predictions.filter(p => p.score >= CONFIDENCE_SPEAK).map(p => p.class))];
    if (names.length === 0) return;

    const sentence = "Detected " + names.join(" and ");
    const now = Date.now();
    
    // Verifica se o tempo passou E se o motor de fala NÃO ESTÁ ATIVO
    if (sentence !== lastSpoken && now - lastTime > SPEECH_INTERVAL && !speechSynthesis.speaking) {
        
        // Cancela qualquer fala ativa ou pendente antes de iniciar uma nova
        speechSynthesis.cancel(); 
        
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-US'; 
        
        try {
             speechSynthesis.speak(utterance);
             lastSpoken = sentence;
             lastTime = now;
             
             // CORREÇÃO: Armazena a referência para a utterance, evitando o descarte pelo GC
             lastUtterance = utterance; 
             
        } catch (e) {
             console.warn("Speech synthesis failed or was interrupted.", e);
        }
    }
}


// FUNÇÃO DE ANÁLISE ESTÁTICA
async function analyzeStaticImage(imgElement, statusElement) {
    if (!model) {
        statusElement.innerText = "Model not loaded. Please wait.";
        return;
    }
    
    // Adicionar um pequeno atraso para garantir que a imagem foi processada pelo DOM
    await new Promise(resolve => setTimeout(resolve, 100)); 

    // Roda a detecção UMA VEZ na imagem
    const predictions = await model.detect(imgElement);

    // Usa CONFIDENCE_SPEAK
    const names = [...new Set(predictions.filter(p => p.score >= CONFIDENCE_SPEAK).map(p => p.class))];
    
    let resultText;
    if (names.length > 0) {
        resultText = "Detected: " + names.join(", ");
        
        const sentence = "I see " + names.join(" and ");
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-US'; 
        
        // Cancela antes de falar sobre a imagem estática
        speechSynthesis.cancel();
        
        try {
             speechSynthesis.speak(utterance);
             // CORREÇÃO: Armazena a referência para a utterance.
             lastUtterance = utterance; 
        } catch (e) {
             console.warn("Speech synthesis failed or was interrupted.", e);
        }

    } else {
        resultText = "No objects detected with high confidence.";
    }

    statusElement.innerText = resultText;
}

// NOVO: Função para Capturar a Tela Inteira e Fazer o Download (Requer html2canvas no HTML)
async function captureScreenAndDownload() {
    const element = document.querySelector('.camera-wrapper'); 

    speechSynthesis.cancel(); 
    
    // Nota: O html2canvas precisa estar linkado no seu index.html para esta função operar.
    const canvas = await html2canvas(element, {
        allowTaint: true, 
        useCORS: true,    
        backgroundColor: '#783A92',
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'TRI_screenshot_' + new Date().toISOString().slice(0, 10) + '.png';
    link.href = dataUrl;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    document.getElementById('status').innerText = 'Screenshot captured! Downloading...';
    setTimeout(() => {
        // Isso assume que o detectFrame está rodando e irá atualizar o status logo.
    }, 2000);
}


// FUNÇÃO PARA SAIR DO MODO ESTÁTICO (Chamada pelo botão X)
function exitStaticView() {
    document.getElementById("static-image-display").style.display = 'none';
    // Reinicia a câmera
    init(); 
}

// Função para reativar o motor de fala quando o app volta ao foco (visibilidade)
function reativarAudio() {
    // Verifica se a tela está visível
    if (document.visibilityState === 'visible') {
        // Cancela qualquer fala anterior
        speechSynthesis.cancel();
        
        // Tenta falar uma string vazia ou muito curta para reativar o motor
        const reactivateUtterance = new SpeechSynthesisUtterance(" "); 
        reactivateUtterance.lang = 'en-US';

        try {
            speechSynthesis.speak(reactivateUtterance);
            // Imediatamente cancela para que a string vazia não seja ouvida, mas o motor foi reativado.
            speechSynthesis.cancel();
            console.log("Audio context successfully reactivated.");
        } catch (e) {
            console.warn("Reactivation failed.", e);
        }
        
        // Opcional: Reexecuta a função init() para garantir que a câmera e o loop de detecção estejam ativos
        if (streamAtual && !streamAtual.active) {
            init(); 
        }
    }
}


// 6. EVENTOS PRINCIPAIS
document.addEventListener("DOMContentLoaded", () => {
    
    const galleryBtn = document.getElementById("gallery-btn");
    const imageUpload = document.getElementById("image-upload");
    const staticDisplay = document.getElementById("static-image-display");
    const analyzedImage = document.getElementById("analyzed-image");
    const staticStatus = document.getElementById("static-status");
    const closeBtn = document.getElementById("close-static-view");
    const captureBtn = document.getElementById("captureBtn"); // Pega o botão de captura
    
    const menuBtn = document.getElementById("menu-btn");
    const menuDropdown = document.getElementById("menu-dropdown");

    // 6.1. Alternar entre frontal e traseira
    document.getElementById("toggleCamera").addEventListener("click", () => {
        usandoCameraFrontal = !usandoCameraFrontal;
        init(); // Reinicia o processo para aplicar a nova câmera
    });

    // 6.2. Lógica do Menu
    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            menuDropdown.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (menuDropdown.classList.contains("open") && !menuDropdown.contains(e.target) && e.target !== menuBtn) {
                menuDropdown.classList.remove("open");
            }
        });
    }

    // 6.3. Acionar o input de arquivo (Galeria)
    if (galleryBtn && imageUpload) {
        galleryBtn.addEventListener("click", () => {
            imageUpload.click();
        });
    }

    // 6.4. Processar a seleção da imagem e iniciar análise estática
    if (imageUpload) {
        imageUpload.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                // 1. Parar a câmera
                if (streamAtual) {
                    streamAtual.getTracks().forEach(t => t.stop());
                }
                
                // 2. Ocultar canvas da câmera
                document.getElementById("canvas").style.display = 'none';
                document.getElementById("webcam").style.display = 'none';

                // 3. Mostrar o overlay estático
                staticDisplay.style.display = 'flex';
                staticStatus.innerText = 'Analyzing image...';

                // 4. Carregar o arquivo no elemento <img>
                const reader = new FileReader();
                reader.onload = (e) => {
                    analyzedImage.src = e.target.result;
                    // 5. Iniciar a análise de detecção
                    analyzeStaticImage(analyzedImage, staticStatus);
                };
                reader.readAsDataURL(file);
                
                // Limpa o valor do input para permitir o upload da mesma imagem novamente
                event.target.value = null; 
            }
        });
    }

    // 6.5. Fechar visualização estática e reiniciar a câmera
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            // 1. Oculta overlay
            staticDisplay.style.display = 'none';
            // 2. Mostra elementos da câmera
            document.getElementById("canvas").style.display = 'block';
            document.getElementById("webcam").style.display = 'block';
            // 3. Reinicia a câmera
            init();
        });
    }
    
    // 6.6. Listener para o Botão de Captura (Tirar Print)
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            captureScreenAndDownload(); 
        });
    }

    // 🚨 CORREÇÃO DE ÁUDIO FINAL: Listener para reativar o áudio quando a aba/app volta ao foco
    document.addEventListener('visibilitychange', reativarAudio);
});


// Iniciar a aplicação
init();