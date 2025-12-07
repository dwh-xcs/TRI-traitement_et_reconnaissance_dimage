// Variáveis de Machine Learning e UI
let model, video, canvas, ctx;
let lastSpoken = "";
let lastTime = 0;
const SPEECH_INTERVAL = 2000;
const CONFIDENCE_DRAW = 0.6; // Limiar para desenhar (visível na tela)
const CONFIDENCE_SPEAK = 0.6; // Limiar para falar/análise estática (Ajustado de 0.7 para 0.65 para maior sensibilidade)
let isDetecting = false; // Flag para prevenir chamadas de detecção concorrentes

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

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

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
    const names = [...new Set(predictions.filter(p => p.score >= CONFIDENCE_SPEAK).map(p => p.class))];
    if (names.length === 0) return;

    const sentence = "Detected " + names.join(" and ");
    const now = Date.now();
    
    // Verifica se o tempo passou E se o motor de fala não está atualmente ocupado
    if (sentence !== lastSpoken && now - lastTime > SPEECH_INTERVAL) {
        
        // 🚨 NOVO: CANCELA QUALQUER FALA ATIVA OU PENDENTE
        speechSynthesis.cancel(); 
        
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-US'; 
        
        try {
             speechSynthesis.speak(utterance);
             lastSpoken = sentence;
             lastTime = now;
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

    // Usa CONFIDENCE_SPEAK (agora 0.6)
    const names = [...new Set(predictions.filter(p => p.score >= CONFIDENCE_SPEAK).map(p => p.class))];
    
    // ... (restante da lógica de áudio e atualização de status, que pode permanecer a mesma)
    
    let resultText;
    if (names.length > 0) {
        resultText = "Detected: " + names.join(", ");
        
        const sentence = "I see " + names.join(" and ");
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'en-US'; 

        speechSynthesis.cancel();
        
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


// FUNÇÃO PARA SAIR DO MODO ESTÁTICO (Chamada pelo botão X)
function exitStaticView() {
    document.getElementById("static-image-display").style.display = 'none';
    // Reinicia a câmera
    init(); 
}


// 6. EVENTOS PRINCIPAIS
document.addEventListener("DOMContentLoaded", () => {
    
    const galleryBtn = document.getElementById("gallery-btn");
    const imageUpload = document.getElementById("image-upload");
    const staticDisplay = document.getElementById("static-image-display");
    const analyzedImage = document.getElementById("analyzed-image");
    const staticStatus = document.getElementById("static-status");
    const closeBtn = document.getElementById("close-static-view");
    
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
});


// Iniciar a aplicação
init();