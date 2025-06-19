// Growth Chat Application
class GrowthChat {
    constructor() {
        this.currentChatId = null;
        this.chats = this.loadChats();
        this.isDarkMode = this.loadTheme();
        this.isMobile = window.innerWidth <= 768;
        this.sidebarOpen = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.applyTheme();
        this.renderChatHistory();
        this.handleResize();
        this.initializeSidebar();
        
        // Create initial chat if none exists
        if (Object.keys(this.chats).length === 0) {
            this.createNewChat();
        } else {
            // Load the most recent chat
            const chatIds = Object.keys(this.chats).sort((a, b) => 
                new Date(this.chats[b].updatedAt) - new Date(this.chats[a].updatedAt)
            );
            this.loadChat(chatIds[0]);
        }
    }

    initializeElements() {
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.chatHistoryList = document.getElementById('chatHistoryList');
        this.themeToggle = document.getElementById('themeToggle');
        this.mobileOverlay = document.getElementById('mobileOverlay');
        
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.characterCount = document.getElementById('characterCount');
    }

    attachEventListeners() {
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.mobileOverlay.addEventListener('click', () => this.closeSidebar());
        
        // New chat
        this.newChatBtn.addEventListener('click', () => this.createNewChat());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Chat input
        this.chatInput.addEventListener('input', () => this.handleInputChange());
        this.chatInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Escape key to close sidebar on mobile
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobile) {
                this.closeSidebar();
            }
        });
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            if (!this.isMobile) {
                this.sidebar.classList.remove('active');
                this.mobileOverlay.classList.remove('active');
                if (!this.sidebarOpen) {
                    this.sidebar.classList.add('collapsed');
                }
            } else {
                // On mobile, always start collapsed
                if (!this.sidebarOpen) {
                    this.sidebar.classList.add('collapsed');
                    this.sidebar.classList.remove('active');
                }
            }
        }
    }

    initializeSidebar() {
        // Start with sidebar closed on all screen sizes
        this.sidebar.classList.add('collapsed');
        this.sidebarOpen = false;
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        
        if (this.isMobile) {
            if (this.sidebarOpen) {
                this.sidebar.classList.remove('collapsed');
                this.sidebar.classList.add('active');
                this.mobileOverlay.classList.add('active');
            } else {
                this.sidebar.classList.remove('active');
                this.sidebar.classList.add('collapsed');
                this.mobileOverlay.classList.remove('active');
            }
        } else {
            if (this.sidebarOpen) {
                this.sidebar.classList.remove('collapsed');
            } else {
                this.sidebar.classList.add('collapsed');
            }
        }
    }

    closeSidebar() {
        this.sidebarOpen = false;
        
        if (this.isMobile) {
            this.sidebar.classList.remove('active');
            this.sidebar.classList.add('collapsed');
            this.mobileOverlay.classList.remove('active');
        } else {
            this.sidebar.classList.add('collapsed');
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        this.saveTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        const themeIcon = this.themeToggle.querySelector('i');
        const themeText = this.themeToggle.querySelector('span');
        
        if (this.isDarkMode) {
            themeIcon.className = 'fas fa-sun';
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.className = 'fas fa-moon';
            themeText.textContent = 'Dark Mode';
        }
    }

    handleInputChange() {
        const text = this.chatInput.value;
        const length = text.length;
        
        // Update character count
        this.characterCount.textContent = `${length}/4000`;
        
        // Enable/disable send button
        this.sendButton.disabled = text.trim().length === 0;
        
        // Auto-resize textarea to fit content
        this.chatInput.style.height = '20px';
        const scrollHeight = this.chatInput.scrollHeight;
        const newHeight = Math.min(scrollHeight, 120);
        this.chatInput.style.height = newHeight + 'px';
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || !this.currentChatId) return;

        // Add user message
        this.addMessage('user', message);
        
        // Clear input
        this.chatInput.value = '';
        this.handleInputChange();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Simulate AI response
        await this.simulateAIResponse(message);
        
        // Update chat in storage
        this.saveChats();
        this.renderChatHistory();
    }

    addMessage(role, content) {
        if (!this.currentChatId) return;
        
        const messageId = Date.now().toString();
        const message = {
            id: messageId,
            role,
            content,
            timestamp: new Date().toISOString()
        };
        
        // Add to current chat
        this.chats[this.currentChatId].messages.push(message);
        this.chats[this.currentChatId].updatedAt = new Date().toISOString();
        
        // Update title if it's the first user message
        if (role === 'user' && this.chats[this.currentChatId].messages.filter(m => m.role === 'user').length === 1) {
            this.chats[this.currentChatId].title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        }
        
        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        messageDiv.setAttribute('data-message-id', message.id);
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'user' ? 'U' : 'G';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message.content;
        
        content.appendChild(text);
        
        if (message.role === 'user') {
            messageDiv.appendChild(content);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
        }
        
        // Remove welcome message if it exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-indicator-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">G</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = this.chatMessages.querySelector('.typing-indicator-message');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

   async simulateAIResponse(userMessage) {
    try {
        console.log("Sending message to backend:", userMessage);

        const response = await fetch("http://localhost:5000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ message: userMessage })
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received response:", data);

        this.removeTypingIndicator();
        this.addMessage('assistant', data.reply || "No response from AI");

    } catch (error) {
        console.error("Backend error:", error);
        this.removeTypingIndicator();

        let errorMessage = "Unable to reach AI backend.";
        if (error.message.includes("Failed to fetch")) {
            errorMessage = "Cannot connect to backend server. Make sure Flask is running on port 5000.";
        } else if (error.message.includes("HTTP error")) {
            errorMessage = `Backend server error: ${error.message}`;
        }

        this.addMessage('assistant', errorMessage);
    }
}


    generateContextualResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return [
                "Hello! I'm Growth, your AI assistant. How can I help you today?",
                "Hi there! Welcome to Growth. What would you like to discuss?",
                "Hey! I'm here to help. What's on your mind?"
            ];
        }
        
        if (message.includes('help') || message.includes('support')) {
            return [
                "I'm here to help! You can ask me questions about various topics, get explanations, brainstorm ideas, or just have a conversation. What specific area would you like assistance with?",
                "Of course! I can help with answering questions, explaining concepts, creative writing, problem-solving, and much more. What would you like to work on?"
            ];
        }
        
        if (message.includes('weather')) {
            return [
                "I don't have access to real-time weather data, but I'd recommend checking a reliable weather service like Weather.com or your local meteorological service for current conditions.",
                "For accurate weather information, I'd suggest using a dedicated weather app or website that provides real-time data for your location."
            ];
        }
        
        if (message.includes('growth') || message.includes('improve') || message.includes('better')) {
            return [
                "Growth is all about continuous improvement! Whether it's personal development, learning new skills, or overcoming challenges, I'm here to help you on your journey. What area would you like to focus on?",
                "That's what I'm here for! Growth comes from stepping out of our comfort zones and embracing new challenges. What specific area of growth are you interested in exploring?"
            ];
        }
        
        // Default responses
        return [
            "That's an interesting point! Could you tell me more about what you're thinking?",
            "I appreciate you sharing that with me. How can I help you explore this topic further?",
            "Thank you for your message! I'm here to assist you. What specific aspect would you like to dive deeper into?",
            "I understand. Could you provide more context so I can give you a more helpful response?",
            "That's a great question! Let me think about how I can best help you with this."
        ];
    }

    createNewChat() {
        const chatId = Date.now().toString();
        const newChat = {
            id: chatId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.chats[chatId] = newChat;
        this.currentChatId = chatId;
        
        this.clearChatMessages();
        this.renderChatHistory();
        this.saveChats();
        
        // Close sidebar after creating new chat
        this.closeSidebar();
        
        // Focus on input
        this.chatInput.focus();
    }

    loadChat(chatId) {
        if (!this.chats[chatId]) return;
        
        this.currentChatId = chatId;
        this.clearChatMessages();
        
        const chat = this.chats[chatId];
        if (chat.messages.length === 0) {
            this.showWelcomeMessage();
        } else {
            chat.messages.forEach(message => this.renderMessage(message));
        }
        
        this.renderChatHistory();
        
        // Close sidebar after loading chat
        this.closeSidebar();
    }

    deleteChat(chatId) {
        if (!this.chats[chatId]) return;
        
        delete this.chats[chatId];
        
        // If we deleted the current chat, create a new one or load another
        if (this.currentChatId === chatId) {
            const remainingChats = Object.keys(this.chats);
            if (remainingChats.length > 0) {
                this.loadChat(remainingChats[0]);
            } else {
                this.createNewChat();
            }
        }
        
        this.saveChats();
        this.renderChatHistory();
    }

    clearChatMessages() {
        this.chatMessages.innerHTML = '';
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        this.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-content">
                    <h2>Welcome to Growth</h2>
                    <p>Your AI-powered chat assistant. Start a conversation by typing a message below.</p>
                </div>
            </div>
        `;
    }

    renderChatHistory() {
        const chatIds = Object.keys(this.chats).sort((a, b) => 
            new Date(this.chats[b].updatedAt) - new Date(this.chats[a].updatedAt)
        );
        
        this.chatHistoryList.innerHTML = '';
        
        if (chatIds.length === 0) {
            this.chatHistoryList.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); font-size: 14px; padding: 20px;">No chats yet</div>';
            return;
        }
        
        chatIds.forEach(chatId => {
            const chat = this.chats[chatId];
            const historyItem = document.createElement('div');
            historyItem.className = `chat-history-item ${chatId === this.currentChatId ? 'active' : ''}`;
            
            historyItem.innerHTML = `
                <div class="chat-history-item-title">${chat.title}</div>
                <button class="chat-history-item-delete" data-chat-id="${chatId}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Click to load chat
            historyItem.addEventListener('click', (e) => {
                if (!e.target.closest('.chat-history-item-delete')) {
                    this.loadChat(chatId);
                }
            });
            
            // Delete chat
            const deleteBtn = historyItem.querySelector('.chat-history-item-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this chat?')) {
                    this.deleteChat(chatId);
                }
            });
            
            this.chatHistoryList.appendChild(historyItem);
        });
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });
    }

    // Storage methods
    loadChats() {
        try {
            const stored = localStorage.getItem('growth-chats');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading chats:', error);
            return {};
        }
    }

    saveChats() {
        try {
            localStorage.setItem('growth-chats', JSON.stringify(this.chats));
        } catch (error) {
            console.error('Error saving chats:', error);
        }
    }

    loadTheme() {
        try {
            const stored = localStorage.getItem('growth-theme');
            return stored === 'dark';
        } catch (error) {
            console.error('Error loading theme:', error);
            return false;
        }
    }

    saveTheme() {
        try {
            localStorage.setItem('growth-theme', this.isDarkMode ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GrowthChat();
});