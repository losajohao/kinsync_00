const socket = io(); // Conexión automática al servidor NestJS que sirve la página

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatBox = document.getElementById('chat-box');
const userBadge = document.getElementById('user-badge');
const summaryBox = document.getElementById('summary-box');
const btnResumen = document.getElementById('btn-resumen');

const tabBtnChat = document.getElementById('tab-btn-chat');
const tabBtnHub = document.getElementById('tab-btn-hub');
const tabChat = document.getElementById('tab-chat');
const tabHub = document.getElementById('tab-hub');

let username = '';

// --- Lógica de Login ---
function joinChat() {
    const name = usernameInput.value.trim();
    if (name) {
        username = name;
        userBadge.textContent = username;

        // Cambiar pantalla
        loginScreen.classList.remove('active');
        mainScreen.classList.add('active');

        // Cargar historial
        socket.emit('findAllChat', (messages) => {
            if (Array.isArray(messages)) {
                chatBox.innerHTML = '';
                messages.forEach(renderMessage);
            }
        });

        setTimeout(() => messageInput.focus(), 100);
    }
}

joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

// --- Lógica de Pestañas ---
function switchTab(showChat) {
    if (showChat) {
        tabBtnChat.classList.add('active');
        tabBtnHub.classList.remove('active');
        tabChat.classList.add('active');
        tabHub.classList.remove('active');
    } else {
        tabBtnHub.classList.add('active');
        tabBtnChat.classList.remove('active');
        tabHub.classList.add('active');
        tabChat.classList.remove('active');
    }
}

tabBtnChat.addEventListener('click', () => switchTab(true));
tabBtnHub.addEventListener('click', () => switchTab(false));

// --- Evento del Botón de IA ---
btnResumen.addEventListener('click', () => {
    // Ponemos estado de carga visual en el panel derecho
    summaryBox.innerHTML = '<p class="empty-state">⏳ Analizando conversación...</p>';
    // Enviamos el comando secreto por detrás
    socket.emit('createChat', { sender: username, content: '/resumen' });
});

// --- Lógica del Chat Actualizada ---
function renderMessage(msg) {
    // 1. INTERCEPTAR MENSAJES DE LA IA
    if (msg.sender === 'KinSync AI' || msg.sender === 'kinSync AI') {
        // Reemplazamos los saltos de línea de texto por etiquetas <br> de HTML
        const formattedContent = msg.content.replace(/\n/g, '<br>');

        // Inyectamos la tarjeta en el panel derecho
        summaryBox.innerHTML = `
            <div class="ai-summary-card">
                <strong>Resumen Inteligente</strong><br><br>
                ${formattedContent}
            </div>
        `;
        // Saltar a la pestaña automáticamente
        switchTab(false);
        return; // Salimos de la función para que NO se dibuje en el chat izquierdo
    }

    // 2. FLUJO NORMAL PARA MENSAJES DE HUMANOS
    const isMe = msg.sender === username;
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isMe ? 'me' : 'other');
    if (!isMe) {
        const senderSpan = document.createElement('span');
        senderSpan.classList.add('message-sender');
        senderSpan.textContent = msg.sender;
        msgDiv.appendChild(senderSpan);
    }
    const contentText = document.createTextNode(msg.content);
    msgDiv.appendChild(contentText);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}


function sendMessage() {
    const content = messageInput.value.trim();
    if (content && username) {
        socket.emit('createChat', { sender: username, content });
        messageInput.value = ''; // Limpiar input
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- Eventos del Socket ---
socket.on('received_message', (msg) => {
    renderMessage(msg);
});
