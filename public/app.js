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
        
        // Magia: Al entrar a la pestaña del Hub, pedimos a la IA que lea el historial viejo automáticamente
        // Solo lo pedimos si la caja está vacía o tiene el mensaje por defecto
        if (summaryBox.innerHTML.includes('No hay resumen activo') || summaryBox.innerHTML.trim() === '') {
            summaryBox.innerHTML = '<p class="empty-state">⏳ Analizando todo el historial del chat familiar...</p>';
            socket.emit('createChat', { sender: username, content: '/resumen' });
        }
    }
}

tabBtnChat.addEventListener('click', () => switchTab(true));
tabBtnHub.addEventListener('click', () => switchTab(false));

// --- (Botón manual de IA eliminado por ser 100% automático) ---

// --- Lógica del Chat Actualizada ---
function renderMessage(msg) {
    // 1. INTERCEPTAR MENSAJES DE LA IA Y AUTO-FEED
    if (msg.sender === 'KinSync AI' || msg.sender === 'kinSync AI' || msg.sender === 'KinSync AI AutoFeed 🤖') {
        
        // Si es el mensaje de "Pensando"
        if (msg.content.includes('Pensanding') || msg.content.includes('Generando Feed')) {
            summaryBox.innerHTML = `<p class="empty-state">⏳ ${msg.content}</p>`;
            return;
        }

        // Es el JSON final de los posts
        try {
            const posts = JSON.parse(msg.content);
            let feedHtml = '<h3>Muro de Noticias de la Familia</h3>';
            
            posts.forEach(post => {
                // Pequeños estilos en línea para los posts del feed
                feedHtml += `
                    <div class="ai-summary-card" style="margin-bottom: 15px; border-left: 4px solid #4CAF50;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="font-size: 0.8em; color: #4CAF50;">📌 ${post.post_type}</strong>
                            <span style="font-size: 0.75em; color: #777;">🕒 ${post.date || 'Reciente'}</span>
                        </div>
                        <p style="margin: 8px 0; font-size: 1.1em;">${post.feed_text}</p>
                        <div style="font-size: 0.8em; color: #888;">
                            ${post.tags.map(t => `<span>#${t}</span>`).join(' ')}
                        </div>
                    </div>
                `;
            });
            summaryBox.innerHTML = feedHtml;
        } catch (e) {
            // Fallback de seguridad si Gemini devuelve texto en vez de JSON
            const formattedContent = msg.content.replace(/\n/g, '<br>');
            summaryBox.innerHTML = `
                <div class="ai-summary-card">
                    <strong>Resumen Inteligente</strong><br><br>
                    ${formattedContent}
                </div>
            `;
        }

        // Ya NO saltamos agresivamente a la pestaña de Feed si estás chateando
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
