<script>
    import { navigate } from "svelte-routing";
    import { onMount } from 'svelte';
    import { userProfile } from './stores.js';
  
    let username = '';
    let email = '';
    let profilePicUrl = '';
    let activeSection = 'account';
    let showManageModal = false;
    let newUsername = '';
    let currentPassword = '';
    let newPassword = '';
    let confirmPassword = '';
    let errorMessage = '';
    let successMessage = '';
    let theme = localStorage.getItem('theme') || 'dark';
    let showProfileModal = false;
    const defaultProfilePic = 'http://127.0.0.1:8000/icons/spider1.jpeg';
    
    const profileIcons = [
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
    
    onMount(async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/");
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch user data');
            const userData = await response.json();
            username = userData.username;
            email = userData.email;
            profilePicUrl = userData.profile_pic_url;
            
            // Initialize the store with the user data
            userProfile.update(profile => ({
                ...profile,
                profilePicUrl: userData.profile_pic_url
            }));
        } catch (error) {
            console.error(error);
        }
    });

    async function handleUpdateUsername() {
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch('http://127.0.0.1:8000/user/profile/username', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: newUsername })
            });
            
            if (!response.ok) throw new Error('Failed to update username');
            username = newUsername;
            successMessage = 'Username updated successfully';
            errorMessage = '';
        } catch (error) {
            errorMessage = 'Failed to update username';
            successMessage = '';
        }
    }

    async function handleUpdatePassword() {
        if (newPassword !== confirmPassword) {
            errorMessage = 'New passwords do not match';
            return;
        }

        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch('http://127.0.0.1:8000/user/profile/password', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            if (!response.ok) throw new Error('Failed to update password');
            currentPassword = '';
            newPassword = '';
            confirmPassword = '';
            successMessage = 'Password updated successfully';
            errorMessage = '';
        } catch (error) {
            errorMessage = 'Failed to update password';
            successMessage = '';
        }
    }

    function setTheme(newTheme) {
        userProfile.update(profile => ({
            ...profile,
            theme: newTheme
        }));
    }

    async function selectProfileIcon(iconPath) {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch('http://127.0.0.1:8000/user/profile/picture', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ profile_pic_url: iconPath })
            });

            if (res.ok) {
                profilePicUrl = iconPath;
                userProfile.update(profile => ({
                    ...profile,
                    profilePicUrl: iconPath
                }));
                showProfileModal = false;
                successMessage = 'Profile picture updated successfully';
            } else {
                throw new Error('Failed to update profile picture');
            }
        } catch (error) {
            errorMessage = 'Failed to update profile picture';
            console.error('Error:', error);
        }
    }

    // Add store subscription at the top of the script
    $: {
        if ($userProfile) {
            profilePicUrl = $userProfile.profilePicUrl;
        }
    }

    // Add delete account functionality
    let showDeleteConfirmModal = false;
    let deleteConfirmPassword = '';
    
    async function handleDeleteAccount() {
        if (!deleteConfirmPassword) {
            errorMessage = 'Please enter your password to confirm account deletion';
            return;
        }
        
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch('http://127.0.0.1:8000/user/delete-account', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: deleteConfirmPassword })
            });
            
            if (!response.ok) throw new Error('Failed to delete account');
            
            // Clear local storage and navigate to login
            localStorage.removeItem("access_token");
            navigate("/");
        } catch (error) {
            errorMessage = 'Failed to delete account. Please check your password.';
            console.error('Error:', error);
        }
    }
    
    // Add email update functionality
    let newEmail = '';
    
    async function handleUpdateEmail() {
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch('http://127.0.0.1:8000/user/profile/email', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: newEmail })
            });
            
            if (!response.ok) throw new Error('Failed to update email');
            email = newEmail;
            successMessage = 'Email updated successfully';
            errorMessage = '';
        } catch (error) {
            errorMessage = 'Failed to update email';
            successMessage = '';
        }
    }
  </script>

<div class="settings-page">
    <div class="settings-container">
        <div class="settings-header">
            <h1>Settings</h1>
            <button class="close-button" on:click={() => navigate("/chat")}>&times;</button>
        </div>

        <div class="settings-content">
            <!-- Sidebar -->
            <div class="settings-sidebar">
                <button 
                    class="sidebar-item {activeSection === 'account' ? 'active' : ''}"
                    on:click={() => activeSection = 'account'}
                >
                    <span class="icon">👤</span>
                    Account
                </button>
                <button 
                    class="sidebar-item {activeSection === 'data' ? 'active' : ''}"
                    on:click={() => activeSection = 'data'}
                >
                    <span class="icon">📊</span>
                    Data
                </button>
            </div>

            <!-- Main Content -->
            <div class="settings-main">
                {#if activeSection === 'account'}
                    <div class="premium-card">
                        <h2>Unlock SpiderCare's Full Potential</h2>
                        <div class="benefits">
                            <div class="benefit">✧ Advanced Mental Health Analytics</div>
                            <div class="benefit">✧ 24/7 Priority Support</div>
                            <div class="benefit">✧ Personalized Wellness Insights</div>
                            <div class="benefit">✧ Extended Chat History</div>
                        </div>
                        <p class="coming-soon">Premium features coming soon to SpiderCare!</p>
                        <button class="go-super-btn">Join Waitlist</button>
                    </div>

                    <div class="account-info">
                        <img src={profilePicUrl} alt="Profile" class="profile-pic"/>
                        <div class="user-info">
                            <h3>{username}</h3>
                            <p>{email}</p>
                        </div>
                        <button class="manage-btn" on:click={() => showManageModal = true}>Manage</button>
                    </div>

                    <div class="danger-zone">
                        <div class="setting-row">
                            <div class="danger-info">
                                <h3>Delete Account</h3>
                                <p>This action cannot be undone. All your data will be permanently deleted.</p>
                            </div>
                            <button class="delete-btn" on:click={() => showDeleteConfirmModal = true}>Delete Account</button>
                        </div>
                    </div>
                {:else if activeSection === 'data'}
                    <div class="section-content">
                        <div class="data-section">
                            <h2>Privacy Policy</h2>
                            <p>At SpiderCare, we take your privacy seriously. Here's how we handle your data:</p>
                            
                            <div class="data-card">
                                <h3>Data Collection</h3>
                                <p>We only collect information that's necessary to provide you with mental health support and improve your experience.</p>
                            </div>
                            
                            <div class="data-card">
                                <h3>Data Security</h3>
                                <p>Your conversations are encrypted and stored securely. We use industry-standard security measures to protect your information.</p>
                            </div>
                            
                            <div class="data-card">
                                <h3>Your Control</h3>
                                <p>You can request a copy of your data or delete your account at any time. Contact our support team for assistance.</p>
                            </div>
                        </div>

                        <div class="data-section">
                            <h2>Chat History</h2>
                            <p>Your chat history is stored securely and is only accessible to you. We retain conversations for 30 days to provide better support and context.</p>
                            
                            <div class="data-card">
                                <h3>Storage Duration</h3>
                                <p>Regular users: 30 days of chat history</p>
                                <p>Premium users: Unlimited chat history storage</p>
                            </div>
                        </div>

                        <div class="data-section">
                            <h2>Data Usage</h2>
                            <p>We use anonymized data to improve our AI model and provide better mental health support. No personal information is ever shared with third parties.</p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Enhanced manage modal with email update -->
{#if showManageModal}
    <div class="modal-overlay" on:click={() => showManageModal = false}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2>Manage Profile</h2>
                <button class="close-button" on:click={() => showManageModal = false}>&times;</button>
            </div>

            {#if errorMessage}
                <div class="error-message">{errorMessage}</div>
            {/if}
            {#if successMessage}
                <div class="success-message">{successMessage}</div>
            {/if}

            <div class="form-section">
                <h3>Change Username</h3>
                <div class="input-group">
                    <input
                        type="text"
                        bind:value={newUsername}
                        placeholder="New username"
                    />
                    <button 
                        class="update-btn"
                        on:click={handleUpdateUsername}
                        disabled={!newUsername}
                    >
                        Update Username
                    </button>
                </div>
            </div>

            <div class="form-section">
                <h3>Change Email</h3>
                <div class="input-group">
                    <input
                        type="email"
                        bind:value={newEmail}
                        placeholder="New email address"
                    />
                    <button 
                        class="update-btn"
                        on:click={handleUpdateEmail}
                        disabled={!newEmail}
                    >
                        Update Email
                    </button>
                </div>
            </div>

            <div class="form-section">
                <h3>Change Password</h3>
                <div class="input-group">
                    <input
                        type="password"
                        bind:value={currentPassword}
                        placeholder="Current password"
                    />
                    <input
                        type="password"
                        bind:value={newPassword}
                        placeholder="New password"
                    />
                    <input
                        type="password"
                        bind:value={confirmPassword}
                        placeholder="Confirm new password"
                    />
                    <button 
                        class="update-btn"
                        on:click={handleUpdatePassword}
                        disabled={!currentPassword || !newPassword || !confirmPassword}
                    >
                        Update Password
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- Add the profile picture modal -->
{#if showProfileModal}
    <div class="modal-overlay" on:click={() => showProfileModal = false}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2>Choose Profile Picture</h2>
                <button class="close-button" on:click={() => showProfileModal = false}>&times;</button>
            </div>
            <div class="profile-grid">
                {#each profileIcons as icon}
                    <img
                        src={icon}
                        alt="Profile option"
                        class="profile-option"
                        class:selected={profilePicUrl === icon}
                        on:click={() => selectProfileIcon(icon)}
                    />
                {/each}
            </div>
        </div>
    </div>
{/if}

<!-- Add delete account confirmation modal -->
{#if showDeleteConfirmModal}
    <div class="modal-overlay" on:click={() => showDeleteConfirmModal = false}>
        <div class="modal-content delete-modal" on:click|stopPropagation>
            <div class="modal-header">
                <h2>Delete Account</h2>
                <button class="close-button" on:click={() => showDeleteConfirmModal = false}>&times;</button>
            </div>
            
            <div class="delete-warning">
                <span class="warning-icon">⚠️</span>
                <p>This action <strong>cannot</strong> be undone. All your data, including chat history and profile information, will be permanently deleted.</p>
            </div>

            {#if errorMessage}
                <div class="error-message">{errorMessage}</div>
            {/if}

            <div class="input-group">
                <input
                    type="password"
                    bind:value={deleteConfirmPassword}
                    placeholder="Enter your password to confirm"
                />
                <div class="delete-actions">
                    <button class="cancel-btn" on:click={() => showDeleteConfirmModal = false}>Cancel</button>
                    <button 
                        class="confirm-delete-btn"
                        on:click={handleDeleteAccount}
                        disabled={!deleteConfirmPassword}
                    >
                        Permanently Delete Account
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
  
  <style>
    /* Professional Grok-like styling for settings page */
    .settings-page {
        background: #0f1117;
        min-height: 100vh;
        padding: 0;
        position: relative;
      color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .settings-container {
        background: #1a1d24;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        overflow: hidden;
        width: 900px; /* Fixed width */
        height: 600px; /* Fixed height */
        display: flex;
        flex-direction: column;
    }

    .settings-header {
        background: #ff0000;
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .settings-header h1 {
        margin: 0;
        color: white;
        font-weight: 600;
        font-size: 1.25rem;
        letter-spacing: 0.5px;
    }

    .close-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 1.25rem;
        cursor: pointer;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .settings-content {
        display: grid;
        grid-template-columns: 220px 1fr;
        flex: 1;
        overflow: hidden; /* Prevent content overflow */
        height: calc(100% - 56px); /* Subtract header height */
    }

    /* Sidebar styling */
    .settings-sidebar {
        padding: 1rem 0.5rem;
        background: #1a1d24;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        overflow-y: auto;
        height: 100%;
    }

    .sidebar-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.6rem 0.75rem;
        border: none;
        background: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        border-radius: 6px;
        margin-bottom: 0.25rem;
        text-align: left;
        transition: all 0.2s ease;
        font-weight: 500;
        font-size: 0.9rem;
    }

    .sidebar-item .icon {
        font-size: 1rem;
        opacity: 0.8;
    }

    .sidebar-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: white;
    }

    .sidebar-item.active {
        background: rgba(255, 0, 0, 0.15);
        color: #ff4400;
    }

    /* Main content styling */
    .settings-main {
        padding: 2rem;
        overflow-y: auto; /* Enable scrolling */
        background: rgba(0, 0, 0, 0.1);
        height: 100%;
        width: 100%;
        box-sizing: border-box;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 0, 0, 0.3) rgba(0, 0, 0, 0.2);
    }

    /* Premium card styling */
    .premium-card {
        background: #242830;
        border: 1px solid rgba(255, 0, 0, 0.2);
        border-radius: 8px;
      padding: 1.5rem;
        margin-bottom: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .premium-card h2 {
        color: white;
        font-size: 1.1rem;
        margin-bottom: 1rem;
        font-weight: 600;
        position: relative;
        display: inline-block;
    }

    .premium-card h2::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 40px;
        height: 2px;
        background: #ff4400;
        border-radius: 2px;
    }

    .benefit {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
    }

    .coming-soon {
        margin: 1rem 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.85rem;
    }

    .go-super-btn {
        background: #ff4400;
        color: white;
        border: none;
        padding: 0.6rem 1.2rem;
        border-radius: 6px;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s ease;
        float: right;
    }

    .go-super-btn:hover {
        background: #ff5c1a;
    }

    /* Account info styling */
    .account-info {
        background: #242830;
        border-radius: 8px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .profile-pic {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid #ff4400;
        object-fit: cover;
    }

    .user-info h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
        color: white;
        font-weight: 500;
    }

    .user-info p {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.85rem;
    }

    .manage-btn {
        background: linear-gradient(45deg, #ff4400, #ff6b00);
        color: white;
        border: none;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 10px rgba(255, 68, 0, 0.3);
    }

    .manage-btn:hover {
        background: linear-gradient(45deg, #ff6b00, #ff4400);
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(255, 68, 0, 0.4);
    }

    /* Danger zone styling */
    .danger-zone {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 1px solid rgba(255, 0, 0, 0.3);
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .danger-zone:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(255, 0, 0, 0.25);
        border-color: rgba(255, 0, 0, 0.5);
    }
    
    .danger-info h3 {
        color: #ff4444;
        margin: 0 0 0.5rem 0;
        font-size: 1.2rem;
        font-weight: 600;
    }
    
    .danger-info p {
        margin: 0;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
    }
    
    .delete-btn {
        background: linear-gradient(45deg, #ff0000, #cc0000);
        color: white;
        border: none;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 10px rgba(255, 0, 0, 0.3);
    }
    
    .delete-btn:hover {
        background: linear-gradient(45deg, #ff3333, #ff0000);
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(255, 0, 0, 0.4);
    }
    
    /* Delete confirmation modal styles */
    .delete-modal {
        border: 1px solid rgba(255, 0, 0, 0.4);
        box-shadow: 0 20px 50px rgba(255, 0, 0, 0.2);
    }
    
    .delete-warning {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        background: rgba(255, 0, 0, 0.1);
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
    }
    
    .warning-icon {
        font-size: 2rem;
    }
    
    .delete-actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .cancel-btn {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        flex: 1;
    }
    
    .cancel-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .confirm-delete-btn {
        background: linear-gradient(45deg, #ff0000, #cc0000);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        flex: 2;
        position: relative;
        overflow: hidden;
    }
    
    .confirm-delete-btn:not(:disabled):hover {
        background: linear-gradient(45deg, #ff3333, #ff0000);
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 0, 0, 0.3);
    }
    
    .confirm-delete-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Data section styling */
    .data-section {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 0, 0, 0.1);
        width: 100%;
        box-sizing: border-box;
    }

    .data-section h2 {
        color: white;
        font-size: 1.1rem;
        margin-bottom: 0.75rem;
        font-weight: 600;
    }

    .data-section p {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }

    .data-card {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
        padding: 1rem;
        margin: 0.75rem 0;
        border-left: 3px solid #ff4400;
    }

    .data-card h3 {
        color: white;
        font-size: 0.95rem;
        margin: 0 0 0.5rem 0;
        font-weight: 500;
    }

    .data-card p {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.85rem;
    }

    /* Modal styling */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    }

    .modal-content {
        background: #1a1d24;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        padding: 1.5rem;
        width: 90%;
        max-width: 450px; /* Standardized width */
        max-height: 80vh; /* Standardized height */
        color: white;
        overflow-y: auto;
        position: relative;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 0.75rem;
    }

    .modal-header h2 {
        color: white;
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .form-section {
      margin-bottom: 1.5rem;
    }

    .form-section h3 {
        color: white;
        margin-bottom: 0.75rem;
        font-size: 1rem;
        font-weight: 500;
    }

    .input-group {
      display: flex;
      flex-direction: column;
        gap: 0.75rem;
        width: 100%;
    }

    .input-group input {
        background: #242830;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.6rem 0.75rem;
        border-radius: 6px;
        color: white;
        font-size: 0.9rem;
    }

    .input-group input:focus {
        border-color: #ff4400;
        outline: none;
    }

    .update-btn {
        background: #ff4400;
        color: white;
      border: none;
        padding: 0.6rem 1rem;
      border-radius: 6px;
      cursor: pointer;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }

    .update-btn:not(:disabled):hover {
        background: #ff5c1a;
    }

    .update-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Error and success messages */
    .error-message, .success-message {
        padding: 0.75rem 1rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .error-message {
        background: rgba(255, 0, 0, 0.1);
        color: #ff4444;
        border-left: 3px solid #ff4444;
    }

    .success-message {
        background: rgba(0, 255, 0, 0.1);
        color: #4caf50;
        border-left: 3px solid #4caf50;
    }

    /* Ensure consistent section content height */
    .section-content {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
    }

    /* Add modal animation */
    @keyframes modalSlideUp {
        from { opacity: 0; transform: translate(-50%, -40%); }
        to { opacity: 1; transform: translate(-50%, -50%); }
    }
  </style>