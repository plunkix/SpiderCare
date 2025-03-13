<!-- ChatPage.svelte -->
<script>
  import { onMount, tick } from 'svelte';
  import { navigate } from 'svelte-routing';
  import { writable } from 'svelte/store';
  import { userProfile } from './stores.js';

  let prompt = '';
  let chatHistory = [];
  let chatError = '';
  let loadingResponse = false;
  let token = '';
  let conversationLog = [];
  let showHistory = false;
  let showDropdown = false;
  let currentConversationId = null;
  const defaultProfilePic = 'http://127.0.0.1:8000/icons/spider1.jpeg';
  let showSettings = false;
  let showProfileModal = false;
  let profileIcons = [
    'http://127.0.0.1:8000/icons/spider1.jpeg',
    'http://127.0.0.1:8000/icons/spider2.jpeg',
    'http://127.0.0.1:8000/icons/spider3.jpeg',
    'http://127.0.0.1:8000/icons/spider4.jpeg',
    'http://127.0.0.1:8000/icons/spider5.jpeg',
    'http://127.0.0.1:8000/icons/spider6.jpeg',
    'http://127.0.0.1:8000/icons/spider7.jpeg',
    'http://127.0.0.1:8000/icons/spider8.jpeg',
    'http://127.0.0.1:8000/icons/spider9.jpeg',
    'http://127.0.0.1:8000/icons/spider10.jpeg'
  ];

  // Add a store to persist chat history
  const persistentChatHistory = writable([]);

  // Update the store subscription at the top of the script
  let profilePicUrl;
  $: {
    if ($userProfile) {
      profilePicUrl = $userProfile.profilePicUrl || defaultProfilePic;
    }
  }

  // Subscribe to the store
  $: ({ theme } = $userProfile);

  // Add these new variables and functions
  let showScrollButton = false;
  
  function handleScroll(e) {
    const container = e.target;
    const scrollBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
    showScrollButton = scrollBottom > 300; // Show button when not near bottom
  }
  
  function scrollToBottom() {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }
  
  // Update the existing scrollToBottom function
  function autoScrollToBottom() {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  // Update the onMount function to initialize the store if needed
  onMount(async () => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      chatHistory = JSON.parse(savedHistory);
      persistentChatHistory.set(chatHistory);
    }
    
    token = localStorage.getItem("access_token") || "";
    if (!token) {
      console.warn("Token is not set. Please log in.");
      return;
    }

    // Initialize profile picture from API if not in store
    if (!$userProfile.profilePicUrl) {
      try {
        const response = await fetch('http://127.0.0.1:8000/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          userProfile.update(profile => ({
            ...profile,
            profilePicUrl: userData.profile_pic_url
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }

    await loadConversations();
  });

  // Subscribe to changes in chat history and save to localStorage
  persistentChatHistory.subscribe(value => {
    if (value.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(value));
    }
  });

  // Update the sendMessage function
  async function sendMessage(event) {
    if (event.key && event.key !== 'Enter') return;
    chatError = '';
    if (!prompt.trim()) return;
    if (!token) {
      chatError = "You must be logged in to send messages.";
      return;
    }

    const newMessage = {
      sender: 'User',
      text: prompt,
      timestamp: new Date()
    };

    chatHistory = [...chatHistory, newMessage];
    persistentChatHistory.set(chatHistory);
    await tick();
    scrollToBottom();
    prompt = '';
    loadingResponse = true;

    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: newMessage.text,
          conversation_id: currentConversationId,
          timestamp: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      const botResponse = {
        sender: 'SpiderCare',
        text: data.response,
        timestamp: new Date()
      };

      chatHistory = [...chatHistory, botResponse];
      persistentChatHistory.set(chatHistory);
      await tick();
      scrollToBottom();
      
      if (!currentConversationId) {
        currentConversationId = data.conversation_id;
      }
      
      if (showHistory) await loadConversations();
    } catch (error) {
      chatError = 'There was an error sending your message.';
      console.error(error);
    } finally {
      loadingResponse = false;
    }
  }

  async function loadConversations() {
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log('Loaded conversations:', data);
      conversationLog = data.conversations.map(conv => ({
        ...conv,
        isEditing: false,
        title: conv.title || conv.title || 'Untitled Chat'
      }));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  function toggleHistory() {
    showHistory = !showHistory;
    if (showHistory && token) {
      loadConversations();
    }
  }

  function goToProfile() {
    navigate('/profile');
  }

  function goToConversation(conversationId) {
    navigate(`/conversation/${conversationId}`);
    showHistory = false;
  }

  function toggleDropdown() {
    showDropdown = !showDropdown;
  }

  function startNewChat() {
    currentConversationId = null;
    chatHistory = [];
    prompt = '';
    showHistory = false;
  }

  // Update the loadConversation function
  async function loadConversation(id) {
    currentConversationId = id;
    try {
      const res = await fetch(`http://127.0.0.1:8000/conversations/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      chatHistory = data.messages.map(msg => ({
        sender: msg.role === 'user' ? 'User' : 'SpiderCare',
        text: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      
      persistentChatHistory.set(chatHistory);
      showHistory = false;
      await tick();
      scrollToBottom();
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }

  function handleSettings() {
    navigate("/settings");
  }

  function handleHelpFeedback() {
    console.log('Help & Feedback clicked - Add endpoint logic here');
  }

  function handleSignOut() {
    localStorage.removeItem("access_token");
    token = '';
    navigate('/');
  }

  function groupConversationsBySession(conversations) {
    const sessions = {};
    conversations.forEach(conv => {
      const date = new Date(conv.timestamp).toDateString();
      if (!sessions[date]) {
        sessions[date] = {
          id: conv.id,
          timestamp: conv.timestamp,
          title: conv.user_prompt.substring(0, 30) + '...',
          messages: []
        };
      }
      sessions[date].messages.push(conv);
    });
    return Object.values(sessions).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Add these helper functions in your script section
  function isYesterday(timestamp) {
    const date = new Date(timestamp);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  function isLastWeek(timestamp) {
    const date = new Date(timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date > weekAgo && !isYesterday(timestamp);
  }

  function formatTime(timestamp, format = 'full') {
    const date = new Date(timestamp);
    
    // For chat messages, only show time
    if (format === 'time-only') {
      return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // For history and full timestamps
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function startEditing(conv, event) {
    event.stopPropagation();
    conv.isEditing = true;
    conv.originalTitle = conv.title;
  }

  async function saveTitle(conv, event) {
    event?.stopPropagation();
    if (!conv.isEditing) return;
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/conversations/${conv.id}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: conv.title })
      });
      
      if (!res.ok) throw new Error('Failed to update title');
      
      conv.isEditing = false;
      delete conv.originalTitle;
      
      await loadConversations();
    } catch (error) {
      console.error('Error saving title:', error);
      conv.title = conv.originalTitle;
      conv.isEditing = false;
      delete conv.originalTitle;
    }
  }

  function handleTitleKeydown(conv, event) {
    event.stopPropagation();
    if (event.key === 'Enter') {
      saveTitle(conv, event);
    } else if (event.key === 'Escape') {
      conv.title = conv.originalTitle;
      conv.isEditing = false;
      delete conv.originalTitle;
    }
  }

  // Focus directive for the title input
  function focus(node) {
    node.focus();
  }

  async function selectProfileIcon(iconPath) {
    try {
      const res = await fetch('http://127.0.0.1:8000/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile_pic_url: iconPath
        })
      });

      if (res.ok) {
        userProfile.update(profile => ({
          ...profile,
          profilePicUrl: iconPath
        }));
        showProfileModal = false;
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  }
</script>

<style>
  /* Fix scrolling and ensure consistent dark theme throughout */
  :global(body), :global(html) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    height: 100vh;
    background: #0c0d11;
    color: #e80d0d;
    overflow: hidden; /* Prevent double scrollbars */
  }

  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #0f1117;
    color: #ffffff;
    overflow: hidden; /* Contain scrolling to chat container only */
  }

  .nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 0.5rem 1.5rem;
    background: #1a1d24;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1000;
  }

  .title {
    color: var(--accent-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  .nav-buttons {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .chat-container {
    flex: 1;
    overflow-y: auto;
    padding: 80px 0 100px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    background: #0f1117;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 107, 0, 0.5) #1a1d24;
  }

  /* Custom scrollbar for better aesthetics */
  .chat-container::-webkit-scrollbar {
    width: 8px;
  }

  .chat-container::-webkit-scrollbar-track {
    background: #1a1d24;
  }

  .chat-container::-webkit-scrollbar-thumb {
    background-color: rgba(255, 107, 0, 0.5);
    border-radius: 4px;
  }

  .chat-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 107, 0, 0.7);
  }

  /* Improve scroll behavior */
  .chat-container {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  }

  .message-group {
    width: 800px;
    padding: 0.5rem 1.5rem;
    box-sizing: border-box;
  }

  .message-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 1rem 0;
  }

  .avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    border: none;
  }

  .bot .avatar {
    border: 1px solid var(--accent-primary);
  }

  .user .avatar {
    border: 1px solid var(--bg-tertiary);
  }

  .message {
    padding: 12px 16px;
    border-radius: 8px;
    max-width: 85%;
    position: relative;
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    background: #1a1d24;
  }

  .user {
    background: #1a1d24;
    color: #ffffff;
    margin-left: auto;
    box-shadow: none;
  }

  .bot {
    background: #1a1d24;
    color: #ffffff;
    margin-right: auto;
    box-shadow: none;
    border: 1px solid rgba(255, 107, 0, 0.3);
  }

  .user::after, .bot::after {
    display: none;
  }

  .input-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem 0;
    background: #1a1d24;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: center;
  }

  .input-group {
    width: 800px;
    margin: 0 1.5rem;
    display: flex;
    gap: 0.75rem;
    background: #2a2d34;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  input[type="text"] {
    flex: 1;
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 1rem;
    padding: 0 0.5rem;
  }

  input[type="text"]::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .send {
    background: transparent;
    color: #ff6b00;
    border: none;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .send:hover {
    opacity: 0.8;
    transform: none;
  }

  .timestamp {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 4px;
  }

  .timestamp::after {
    display: none;
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 0;
  }

  .loading span {
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
  }

  .loading span:nth-child(1) { animation-delay: -0.32s; }
  .loading span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  .history-button {
    width: 32px;
    height: 32px;
    background: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" viewBox=\"0 0 24 24\"><path fill=\"%23ff0000\" d=\"M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L8 12H5c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z\"/></svg>') no-repeat center;
    background-size: contain;
    border: none;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .history-button:hover {
    transform: scale(1.1);
  }

  .history-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 800px;
    max-height: 80vh;
    background: #1a1d24;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .history-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-button {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .back-button:hover {
    opacity: 1;
  }

  .chat-item {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: background-color 0.2s;
  }

  .chat-item:hover {
    background: rgba(255, 0, 0, 0.1);
  }

  .chat-item.active {
    background: rgba(255, 0, 0, 0.15);
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chat-title-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .chat-title {
    font-size: 1rem;
    color: var(--text-primary);
    margin: 0;
  }

  .edit-button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chat-item:hover .edit-button {
    opacity: 1;
  }

  .chat-time {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .title-input {
    flex: 1;
    background: var(--bg-secondary);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 0.5rem;
    color: var(--text-primary);
    font-size: 1rem;
    width: 100%;
  }

  .title-input:focus {
    outline: none;
    border-color: #ff0000;
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 1999;
  }

  .history-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 107, 0, 0.5) #1a1d24;
  }

  .history-content::-webkit-scrollbar {
    width: 8px;
  }

  .history-content::-webkit-scrollbar-track {
    background: #1a1d24;
  }

  .history-content::-webkit-scrollbar-thumb {
    background-color: rgba(255, 107, 0, 0.5);
    border-radius: 4px;
  }

  .history-content::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 107, 0, 0.7);
  }

  .section {
    padding: 0 1rem;
    margin-bottom: 1.5rem;
  }

  .section-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    letter-spacing: 0.5px;
  }

  .new-chat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--accent-color);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .new-chat:hover {
    background: var(--accent-hover);
  }

  .profile-button img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid #ff0000;
  }

  .dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: #1a1d24;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 150px;
    margin-top: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dropdown-item {
    padding: 0.8rem 1.5rem;
    color: #ffffff;
    cursor: pointer;
  }

  .dropdown-item:hover {
    background: var(--accent-color);
  }

  .new-chat-item {
    padding: 0.8rem;
    margin-bottom: 1rem;
    cursor: pointer;
    border-radius: 0.5rem;
    background: var(--accent-color);
    color: white;
    text-align: center;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .new-chat-item:hover {
    background: var(--accent-hover);
  }

  .conversation-session {
    padding: 1rem;
    margin: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .conversation-session:hover {
    background: rgba(255, 107, 0, 0.1);
    transform: translateY(-1px);
  }

  .session-title {
    font-size: 1rem;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }

  .session-timestamp {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    animation: fadeIn 0.2s ease-out forwards;
  }

  .settings-modal, .modal {
    width: 90%;
    max-width: 400px;
    background: #1a1d24;
    border-radius: 12px;
    overflow: hidden;
    transform: scale(0.95);
    opacity: 0;
    animation: popIn 0.3s ease-out forwards;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes popIn {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .modal-header {
    padding: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-title {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  .close-modal {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    margin: -0.5rem;
    line-height: 1;
    transition: color 0.2s;
  }

  .close-modal:hover {
    color: #fff;
  }

  .modal-content {
    padding: 1rem;
    color: var(--text-primary);
    background: #1a1d24;
  }

  .settings-section {
    margin-bottom: 1.5rem;
  }

  .settings-section h3 {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .profile-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .current-profile {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .change-profile-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .change-profile-btn:hover {
    background: var(--accent-hover);
  }

  .theme-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .theme-option {
    padding: 0.3rem;
    background: #2a2d34;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #ffffff;
    cursor: pointer;
    text-align: center;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .theme-option:hover {
    background: var(--accent-color);
  }

  .theme-option.active {
    background: var(--accent-color);
    border-color: var(--accent-color);
  }

  .icons-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    padding: 1rem;
  }

  .icon-option {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    object-fit: cover;
  }

  .icon-option:hover {
    border-color: var(--accent-color);
    transform: scale(1.05);
  }

  .icon-option.selected {
    border-color: var(--accent-color);
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .loading::after {
    content: '';
    width: 8px;
    height: 8px;
    border: 2px solid var(--text-primary);
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Add smooth transition for theme changes */
  :global(body), .message, .input-group, .dropdown, .history-popup, 
  .settings-modal, .theme-option, input[type="text"] {
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  /* Fix text colors */
  .message {
    color: var(--text-primary);
  }

  .message.bot {
    color: #ebe4e4; /* Always white for bot messages due to gradient background */
  }

  .message.user {
    color: var(--text-primary);
  }

  .message-content {
    color: inherit;
  }

  .timestamp {
    color: var(--text-secondary);
  }

  input[type="text"] {
    color: #ffffff;
  }

  input[type="text"]::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  /* Fix history popup text colors */
  .history-popup {
    background: #1a1d24;
    color: #ffffff;
  }

  .chat-title {
    color: var(--text-primary);
  }

  .chat-time {
    color: var(--text-secondary);
  }

  .title-input {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }

  /* Fix dropdown text */
  .dropdown {
    background: #1a1d24;
  }

  .dropdown-item {
    color: #ffffff;
  }

  /* Fix modal text */
  .modal-content {
    color: var(--text-primary);
    background: #1a1d24;
  }

  .modal-title {
    color: var(--text-primary);
  }

  /* Fix loading text */
  .loading {
    color: var(--text-primary);
  }

  /* Fix section labels */
  .section-label {
    color: var(--text-secondary);
  }

  /* Fix error message */
  .error {
    color: #ff4444;
  }

  /* Add scroll to bottom button */
  .scroll-to-bottom {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: #ff4400;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(255, 68, 0, 0.4);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    z-index: 100;
  }

  .scroll-to-bottom.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .scroll-to-bottom:hover {
    background: #ff6b00;
    transform: translateY(-3px);
    box-shadow: 0 4px 15px rgba(255, 68, 0, 0.6);
  }

  /* Fun student-friendly enhancements */
  main {
    background: #0f1117 url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path fill="rgba(255,68,0,0.03)" d="M30,1.5c-16.6,12.2-33.2,24.5-30,42.5c3.3,18,26.6,20.7,35,40s-1.8,30.7,9,38.5c10.8,7.8,21.6,4.9,33.5-1.5c11.9-6.4,24.7-17.4,30-30c5.3-12.6,2.9-26.6-5-36.5c-7.9-9.9-21.3-15.7-29.5-26.5c-8.2-10.8-11.2-26.7-26.5-26.5C32.2-0.3,46.6,13.7,30,1.5z"/></svg>') no-repeat center center;
    background-size: cover;
  }

  /* Fun message bubbles */
  .message {
    transition: all 0.3s ease;
  }

  .message.bot {
    background: linear-gradient(135deg, #1a1d24 0%, #252a35 100%);
    border: 1px solid rgba(255, 68, 0, 0.3);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }

  .message.user {
    background: linear-gradient(135deg, #252a35 0%, #1a1d24 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }

  .message:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  /* Fun input container */
  .input-container {
    background: rgba(26, 29, 36, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 68, 0, 0.2);
  }

  .input-group {
    background: linear-gradient(to right, #252a35, #2a2d34);
    border: 1px solid rgba(255, 68, 0, 0.2);
    transition: all 0.3s ease;
  }

  .input-group:focus-within {
    border-color: rgba(255, 68, 0, 0.5);
    box-shadow: 0 0 15px rgba(255, 68, 0, 0.2);
  }

  /* Fun loading animation */
  .loading span {
    background: #ff4400;
    animation: bounce 1.4s infinite ease-in-out;
  }

  /* Enhanced avatar styling */
  .avatar {
    border: 2px solid #ff4400;
    transition: all 0.3s ease;
  }

  .avatar:hover {
    transform: scale(1.1);
    box-shadow: 0 0 10px rgba(255, 68, 0, 0.5);
  }

  /* Fun history button */
  .history-button {
    transition: all 0.3s ease;
  }

  .history-button:hover {
    transform: rotate(180deg) scale(1.1);
  }

  /* Add achievement badges for student engagement */
  .achievement-badge {
    position: absolute;
    top: -10px;
    right: -10px;
    background: #ff4400;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  /* Add confetti animation for new achievements */
  @keyframes confetti {
    0% { transform: translateY(0) rotate(0); opacity: 1; }
    100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
  }
</style>

<main>
  <div class="nav-bar">
    <div class="title">SpiderCare</div>
    <div class="nav-buttons">
      <button class="history-button" on:click={toggleHistory} aria-label="History"></button>
      <button class="profile-button" on:click={toggleDropdown} aria-label="Profile">
        <img 
          src={profilePicUrl} 
          alt="Profile" 
          on:error={(e) => e.target.src = defaultProfilePic}
        />
      </button>
      {#if showDropdown}
        <div class="dropdown">
          <div class="dropdown-item" on:click={handleSettings}>Settings</div>
          <div class="dropdown-item" on:click={handleHelpFeedback}>Help & Feedback</div>
          <div class="dropdown-item" on:click={handleSignOut}>Sign Out</div>
        </div>
      {/if}
    </div>
  </div>

  <div class="chat-container" on:scroll={handleScroll}>
    {#each chatHistory as message (message.timestamp)}
      <div class="message-group">
        <div class="message-wrapper {message.sender === 'User' ? 'user-wrapper' : 'bot-wrapper'}">
          {#if message.sender !== 'User'}
            <img 
              class="avatar" 
              src="http://127.0.0.1:8000/static/icons/spidercare.jpeg" 
              alt="SpiderCare"
            />
          {/if}
      <div class="message {message.sender === 'User' ? 'user' : 'bot'}">
            <div class="message-content">
              {message.text}
            </div>
            <div class="timestamp">{formatTime(message.timestamp, 'time-only')}</div>
          </div>
          {#if message.sender === 'User'}
            <img 
              class="avatar" 
              src={profilePicUrl} 
              alt="User"
              on:error={(e) => e.target.src = defaultProfilePic}
            />
          {/if}
        </div>
      </div>
    {/each}
    {#if loadingResponse}
      <div class="message-group">
        <div class="message-wrapper bot-wrapper">
          <img 
            class="avatar" 
            src="http://127.0.0.1:8000/static/icons/spidercare.jpeg" 
            alt="SpiderCare"
          />
          <div class="message bot">
            <div class="loading">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if showScrollButton}
    <div class="scroll-to-bottom visible" on:click={scrollToBottom}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
    </div>
  {/if}

  <div class="input-container">
    <div class="input-group">
      <input
        type="text"
        bind:value={prompt}
        placeholder="Message SpiderCare..."
        on:keypress={sendMessage}
      />
      <button class="send" on:click={sendMessage}>Send</button>
    </div>
    {#if chatError}
      <div class="error">{chatError}</div>
    {/if}
  </div>

  {#if showHistory}
    <div class="overlay" on:click={() => (showHistory = false)}></div>
    <div class="history-popup" on:click|stopPropagation>
      <div class="history-header">
        <button class="back-button" on:click={() => (showHistory = false)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to chat
        </button>
      </div>

      <div class="history-content">
        <div class="section">
          <div class="new-chat" on:click={startNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New chat
          </div>
        </div>

        <div class="section">
        {#each conversationLog as conv}
            <div 
              class="chat-item" 
              class:active={currentConversationId === conv.id}
              on:click={() => loadConversation(conv.id)}
            >
              <div class="chat-header">
                <div class="chat-title-container">
                  {#if conv.isEditing}
                    <input
                      class="title-input"
                      type="text"
                      bind:value={conv.title}
                      on:blur={(e) => saveTitle(conv, e)}
                      on:keydown={(e) => handleTitleKeydown(conv, e)}
                      use:focus
                    />
                  {:else}
                    <h3 class="chat-title">{conv.title}</h3>
                    <button 
                      class="edit-button"
                      on:click={(e) => startEditing(conv, e)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  {/if}
                </div>
                <span class="chat-time">{formatTime(conv.timestamp)}</span>
              </div>
          </div>
        {/each}
        </div>
      </div>
    </div>
      {/if}

  {#if showSettings}
    <div class="modal-overlay" on:click={() => showSettings = false}>
      <div class="modal settings-modal" on:click|stopPropagation>
        <div class="modal-header">
          <h2 class="modal-title">Settings</h2>
          <button class="close-modal" on:click={() => showSettings = false}>&times;</button>
        </div>
        
        <div class="modal-content">
          <div class="settings-section">
            <h3>Profile Picture</h3>
            <div class="profile-section">
              <img 
                class="current-profile"
                src={profilePicUrl || defaultProfilePic}
                alt="Current profile"
              />
              <button class="change-profile-btn" on:click={() => showProfileModal = true}>
                Change Profile Icon
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h3>Theme</h3>
            <div class="theme-options">
              <button 
                class="theme-option"
                class:active={theme === 'light'}
                on:click={() => userProfile.update(profile => ({ ...profile, theme: 'light' }))}
              >
                Light
              </button>
              <button 
                class="theme-option"
                class:active={theme === 'dark'}
                on:click={() => userProfile.update(profile => ({ ...profile, theme: 'dark' }))}
              >
                Dark
              </button>
              <button 
                class="theme-option"
                class:active={theme === 'system'}
                on:click={() => userProfile.update(profile => ({ ...profile, theme: 'system' }))}
              >
                System
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if showProfileModal}
    <div class="modal-overlay" on:click={() => showProfileModal = false}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <span class="modal-title">Choose Profile Icon</span>
          <button class="close-modal" on:click={() => showProfileModal = false}>&times;</button>
        </div>
        <div class="icons-grid">
          {#each profileIcons as icon}
            <img
              class="icon-option"
              class:selected={profilePicUrl === icon}
              src={icon}
              alt="Profile icon option"
              on:click={() => selectProfileIcon(icon)}
            />
          {/each}
        </div>
      </div>
    </div>
  {/if}
</main>