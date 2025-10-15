// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // DOM元素获取
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const conversationSettingsBtn = document.getElementById('conversationSettingsBtn');
    const conversationSettingsModal = document.getElementById('conversationSettingsModal');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModal');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const deleteConversationBtn = document.getElementById('deleteConversationBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const authModal = document.getElementById('authModal');
    const redactionToggles = document.querySelectorAll('.toggle-redaction');
    const copyLinkBtn = document.querySelector('.fa-copy').parentElement;

    // 状态管理
    let currentConversationId = null;
    let user = null;
    const redactedFields = {
        '[REDACTED_NAME_1]': 'Alex Johnson',
        '[REDACTED_EMAIL_1]': 'alex.j@example.com',
        '[REDACTED_LOCATION_1]': 'San Francisco, CA',
        '[REDACTED_NAME_2]': 'Maria Garcia',
        '[REDACTED_EMAIL_2]': 'maria.g@example.com',
        '[REDACTED_LOCATION_2]': 'Austin, TX'
    };

    // 初始化应用
    function initApp() {
        setupEventListeners();
        // 模拟已登录状态（实际项目中应通过Supabase验证）
        user = { id: 'user123', email: 'sarah@example.com' };
        loadMockConversations();
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 发送消息相关
        sendMessageBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        messageInput.addEventListener('input', adjustTextareaHeight);

        // 侧边栏控制
        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
        });
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
        });

        // 模态框控制
        conversationSettingsBtn.addEventListener('click', () => {
            conversationSettingsModal.classList.remove('hidden');
        });
        closeSettingsModalBtn.addEventListener('click', () => {
            conversationSettingsModal.classList.add('hidden');
        });
        saveSettingsBtn.addEventListener('click', () => {
            conversationSettingsModal.classList.add('hidden');
            showSystemMessage('Settings saved successfully');
        });
        deleteConversationBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this conversation?')) {
                conversationSettingsModal.classList.add('hidden');
                chatMessages.innerHTML = '';
                addSystemMessage('Conversation deleted. Start a new one!');
            }
        });

        // PII脱敏切换
        redactionToggles.forEach(toggle => {
            toggle.addEventListener('click', handleRedactionToggle);
        });

        // 登出功能
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                authModal.classList.remove('hidden');
                user = null;
            }
        });

        // 复制链接功能
        copyLinkBtn.addEventListener('click', () => {
            const linkInput = copyLinkBtn.previousElementSibling;
            linkInput.select();
            document.execCommand('copy');
            alert('Link copied to clipboard!');
        });

        // 模拟登录按钮（实际项目中应连接Supabase OAuth）
        document.querySelector('.fa-google').parentElement.addEventListener('click', () => {
            authModal.classList.add('hidden');
            user = { id: 'user123', email: 'user@google.com' };
            loadMockConversations();
        });
        document.querySelector('.fa-windows').parentElement.addEventListener('click', () => {
            authModal.classList.add('hidden');
            user = { id: 'user456', email: 'user@microsoft.com' };
            loadMockConversations();
        });
    }

    // 加载模拟对话
    function loadMockConversations() {
        currentConversationId = 'conv_123';
        // 清空现有消息
        chatMessages.innerHTML = '';
        // 添加系统消息
        addSystemMessage('I\'m your ATS/CRM assistant. I can help you find candidates, review job postings, and answer questions about your recruiting data. All PII is automatically redacted before being sent to the AI.');
        // 添加示例消息
        addUserMessage('Can you show me the top 5 candidates for the Senior Engineer position who have experience with TypeScript?');
        addAIMessage(`Here are the top 5 candidates for the Senior Engineer position with TypeScript experience:
        
        <div class="space-y-3 mb-4">
            <div class="p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-medium text-gray-800">
                            [REDACTED_NAME_1]
                            <span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">94% match</span>
                        </h4>
                        <p class="text-sm text-gray-600 mt-1">
                            [REDACTED_LOCATION_1] • 5 years TypeScript • Applied 2 weeks ago
                        </p>
                    </div>
                    <button class="text-primary hover:text-primary/80 text-sm font-medium">View</button>
                </div>
            </div>
            
            <div class="p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-medium text-gray-800">
                            [REDACTED_NAME_2]
                            <span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">91% match</span>
                        </h4>
                        <p class="text-sm text-gray-600 mt-1">
                            [REDACTED_LOCATION_2] • 4 years TypeScript • Applied 1 month ago
                        </p>
                    </div>
                    <button class="text-primary hover:text-primary/80 text-sm font-medium">View</button>
                </div>
            </div>
        </div>
        
        Would you like me to share more details about any of these candidates or schedule interviews?`);
    }

    // 发送消息
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || !user) return;

        // 清空输入框并调整高度
        messageInput.value = '';
        adjustTextareaHeight();

        // 添加用户消息到界面
        addUserMessage(message);

        // 显示打字指示器
        const typingIndicator = addTypingIndicator();

        // 模拟AI回复延迟
        setTimeout(() => {
            typingIndicator.remove();
            
            // 简单的回复逻辑
            let aiResponse = '';
            if (message.toLowerCase().includes('candidate') || message.toLowerCase().includes('applicant')) {
                aiResponse = 'I can provide detailed information about candidates. Would you like to see their resumes, interview feedback, or application status?';
            } else if (message.toLowerCase().includes('job') || message.toLowerCase().includes('position')) {
                aiResponse = 'We currently have 12 open positions, including 3 Senior Engineer roles. Would you like details about any specific job opening?';
            } else if (message.toLowerCase().includes('interview')) {
                aiResponse = 'There are 8 interviews scheduled for this week. Would you like me to show you the schedule or help reschedule any?';
            } else {
                aiResponse = `Thank you for your message: "${message}". How can I assist you further with your recruiting needs?`;
            }
            
            addAIMessage(aiResponse);
        }, 1500);
    }

    // 添加用户消息到聊天界面
    function addUserMessage(content) {
        const userMessageHTML = `
            <div class="flex items-start justify-end">
                <div class="bg-primary text-white rounded-lg rounded-tr-none p-4 shadow-chat max-w-3xl">
                    <p class="text-sm">${content}</p>
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', userMessageHTML);
        scrollToBottom();
    }

    // 添加AI消息到聊天界面
    function addAIMessage(content) {
        const aiMessageHTML = `
            <div class="flex items-start">
                <div class="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white mr-3 mt-1">
                    <i class="fa fa-robot"></i>
                </div>
                <div class="bg-white rounded-lg rounded-tl-none p-4 shadow-chat max-w-3xl">
                    <p class="text-sm text-gray-700">${content}</p>
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', aiMessageHTML);
        scrollToBottom();
    }

    // 添加系统消息
    function addSystemMessage(content) {
        const systemMessageHTML = `
            <div class="flex items-start">
                <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3 mt-1">
                    <i class="fa fa-info"></i>
                </div>
                <div class="bg-white rounded-lg rounded-tl-none p-4 shadow-chat max-w-3xl">
                    <p class="text-sm text-gray-700">${content}</p>
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', systemMessageHTML);
        scrollToBottom();
    }

    // 显示打字指示器
    function addTypingIndicator() {
        const typingHTML = `
            <div class="flex items-start typing-indicator">
                <div class="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white mr-3 mt-1">
                    <i class="fa fa-robot"></i>
                </div>
                <div class="bg-white rounded-lg rounded-tl-none p-4 shadow-chat">
                    <div class="flex space-x-1">
                        <div class="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div class="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.2s"></div>
                        <div class="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.4s"></div>
                    </div>
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', typingHTML);
        scrollToBottom();
        return document.querySelector('.typing-indicator');
    }

    // 处理PII脱敏切换
    function handleRedactionToggle(e) {
        const toggleBtn = e.currentTarget;
        const redactedKey = toggleBtn.closest('div').querySelector('p').textContent;
        const realValue = redactedFields[redactedKey];
        const isShowing = toggleBtn.textContent === 'Hide';

        if (isShowing) {
            // 隐藏真实信息，显示脱敏标识
            toggleBtn.closest('div').querySelector('p').textContent = redactedKey;
            toggleBtn.textContent = 'Show';
            // 更新聊天记录中的对应内容
            updateChatRedactions(realValue, redactedKey);
        } else {
            // 显示真实信息
            toggleBtn.closest('div').querySelector('p').textContent = realValue;
            toggleBtn.textContent = 'Hide';
            // 更新聊天记录中的对应内容
            updateChatRedactions(redactedKey, realValue);
        }
    }

    // 更新聊天记录中的脱敏内容
    function updateChatRedactions(oldValue, newValue) {
        const chatParagraphs = chatMessages.querySelectorAll('p');
        chatParagraphs.forEach(paragraph => {
            if (paragraph.textContent.includes(oldValue)) {
                paragraph.textContent = paragraph.textContent.replace(oldValue, newValue);
            }
        });
    }

    // 调整文本框高度
    function adjustTextareaHeight() {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight > 100 ? 100 : messageInput.scrollHeight) + 'px';
    }

    // 滚动到聊天底部
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 显示系统消息
    function showSystemMessage(text) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg z-50';
        notification.textContent = text;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 初始化应用
    initApp();
});
