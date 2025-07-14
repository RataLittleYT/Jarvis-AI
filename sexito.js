
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatMessages = document.getElementById("chatMessages");
const startChatBtn = document.getElementById("startChatBtn");
const newChatBtn = document.getElementById("newChatBtn");
const sidebarNewChatBtn = document.getElementById("sidebarNewChatBtn");
const welcomeScreen = document.getElementById("welcomeScreen");

const API_KEY = "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";

let isTyping = false;
let conversationHistory = [];

// Inicialización mejorada
function init() {
    // Configurar event listeners
    messageInput.addEventListener("input", handleInputChange);
    messageInput.addEventListener("keydown", handleKeyDown);
    sendBtn.addEventListener("click", sendMessage);
    startChatBtn.addEventListener("click", clearChat);
    newChatBtn.addEventListener("click", clearChat);
    sidebarNewChatBtn.addEventListener("click", clearChat);
    
    // Establecer estado inicial
    toggleSendButton();
    messageInput.focus();
}

// Manejar cambios en el input
function handleInputChange() {
    toggleSendButton();
    
    // Autoajustar altura del textarea
    if (messageInput.scrollHeight > messageInput.clientHeight) {
        messageInput.style.height = "auto";
        messageInput.style.height = messageInput.scrollHeight + "px";
    }
}

// Manejar teclas para permitir saltos de línea
function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
}

// Limpiar chat
function clearChat() {
    chatMessages.innerHTML = "";
    conversationHistory = [];
    welcomeScreen.style.display = "none";
    messageInput.value = "";
    toggleSendButton();
    messageInput.focus();
    messageInput.style.height = "auto"; // Resetear altura
}

// Enviar mensaje
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;

    // Determinar idioma del mensaje (inglés o español)
    const isEnglish = /[a-zA-Z]/.test(message) && !/[áéíóúñÁÉÍÓÚÑ]/.test(message);
    const userLanguage = isEnglish ? "english" : "spanish";
    
    appendMessage("Tú", message, "user-message", false);
    conversationHistory.push({ role: "user", content: message });
    
    messageInput.value = "";
    messageInput.style.height = "auto"; // Resetear altura
    toggleSendButton();
    
    showTyping();
    await getJarvisResponse(userLanguage);
    hideTyping();
}

// Mostrar mensaje en el chat
function appendMessage(sender, text, className, allowCopy = true) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    
    const content = document.createElement("div");
    content.innerHTML = formatContent(text);

    if (allowCopy) {
        const copyBtn = document.createElement("button");
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar';
        copyBtn.className = "btn btn-outline copy-btn";
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar';
            }, 2000);
        };
        content.appendChild(copyBtn);
    }

    const time = document.createElement("div");
    time.className = "message-time";
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msg.appendChild(content);
    msg.appendChild(time);
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Formatear contenido (markdown básico)
function formatContent(text) {
    // Manejar bloques de código
    const withCodeBlocks = text.replace(/```(\w*)\n([\s\S]*?)```/g, 
        '<pre><code class="$1">$2</code></pre>');
    
    return withCodeBlocks
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

// Mostrar indicador de "escribiendo"
function showTyping() {
    isTyping = true;
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.id = "typingIndicator";
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.className = "typing-dot";
        typing.appendChild(dot);
    }
    
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Ocultar indicador de "escribiendo"
function hideTyping() {
    isTyping = false;
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
}

// Habilitar/deshabilitar botón de enviar
function toggleSendButton() {
    sendBtn.disabled = messageInput.value.trim() === "";
    
    // Feedback visual
    if (sendBtn.disabled) {
        sendBtn.style.opacity = "0.7";
        sendBtn.style.cursor = "not-allowed";
    } else {
        sendBtn.style.opacity = "1";
        sendBtn.style.cursor = "pointer";
    }
}

// Obtener respuesta de la IA
async function getJarvisResponse(userLanguage) {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://twentyfox.lat",
                "X-Title": "RataLife Chat"
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct",
                messages: [
                    { 
                        role: "system", 
                        content: `Eres RataLife. Un asistente amigable, sabio y útil además de poetico en ocasiones. 
                                  Responde en ${userLanguage === "english" ? "english" : "español"} según el idioma del usuario.`
                    },
                    ...conversationHistory
                ]
            })
        });

        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content || 
                      (userLanguage === "english" ? "Sorry, something went wrong." : "Lo siento, algo salió mal.");
        
        appendMessage("RataLife", aiText, "ai-message", true);
        conversationHistory.push({ role: "assistant", content: aiText });
    } catch (err) {
        console.error("Error:", err);
        const errorMsg = conversationHistory[conversationHistory.length - 1]?.content?.includes("english") ?
            "⚠️ Error connecting to the server. Please try again." :
            "⚠️ Error al conectar con el servidor. Por favor, intenta nuevamente.";
        
        appendMessage("RataLife", errorMsg, "ai-message", true);
    }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", init);