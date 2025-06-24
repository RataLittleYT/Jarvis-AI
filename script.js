// script.js adaptado para el nuevo index.html con soporte de OpenRouter y bloques de código

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatMessages = document.getElementById("chatMessages");
const startChatBtn = document.getElementById("startChatBtn");
const newChatBtn = document.getElementById("newChatBtn");
const sidebarNewChatBtn = document.getElementById("sidebarNewChatBtn");

const API_KEY = "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"; // Tu API Key aquí

let isTyping = false;

[sendBtn, messageInput].forEach(el => el?.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}));

sendBtn?.addEventListener("click", sendMessage);
startChatBtn?.addEventListener("click", clearChat);
newChatBtn?.addEventListener("click", clearChat);
sidebarNewChatBtn?.addEventListener("click", clearChat);

function clearChat() {
    chatMessages.innerHTML = "";
    document.getElementById("welcomeScreen").style.display = "none";
    messageInput.focus();
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;

    appendMessage("Tú", message, "user-message", false);
    messageInput.value = "";
    toggleSendButton();
    showTyping();
    await getJarvisResponse(message);
    hideTyping();
}

function appendMessage(sender, text, className, allowCopy = true) {
    const msg = document.createElement("div");
    msg.className = `message ${className}`;
    const content = document.createElement("div");
    content.innerHTML = formatContent(text);

    if (allowCopy) {
        const copyBtn = document.createElement("button");
        copyBtn.textContent = "Copiar";
        copyBtn.className = "btn btn-outline";
        copyBtn.style.marginTop = "10px";
        copyBtn.onclick = () => navigator.clipboard.writeText(content.innerText);
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

function formatContent(text) {
    let formatted = text
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    return formatted;
}

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

function hideTyping() {
    isTyping = false;
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
}

function toggleSendButton() {
    sendBtn.disabled = messageInput.value.trim() === "";
}

async function getJarvisResponse(userMessage) {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://tusitio.com",
                "X-Title": "Jarvis Chat"
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct",
                messages: [
                    { role: "system", content: "Eres Jarvis, creado por RataLife. Un asistente amigable, sabio y útil. Siempre responde en el idioma del usuario." },
                    { role: "user", content: userMessage }
                ]
            })
        });

        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content || "Lo siento, algo salió mal.";
        appendMessage("Jarvis", aiText, "ai-message", true);
    } catch (err) {
        appendMessage("Jarvis", "⚠️ Error al conectar con el servidor.", "ai-message", true);
    }
}
