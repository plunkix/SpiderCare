<!-- LoginOrRegisterModal.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { navigate } from 'svelte-routing';
  const dispatch = createEventDispatcher();

  let username = '';
  let password = '';
  let email = '';
  let verificationCode = '';
  let isRegister = false;
  let isVerifying = false;
  let sentEmail = false;
  let errorMessage = '';
  let isLoading = false;

  function closeModal() {
    dispatch('close');
  }

  function toggleMode() {
    isRegister = !isRegister;
    isVerifying = false;
    sentEmail = false;
  }

  async function handleSendVerification() {
    try {
      isLoading = true;
      // First, validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const response = await fetch('http://127.0.0.1:8000/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        // The backend will return "Email already registered" if it exists
        if (data.detail === "Email already registered") {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw new Error(data.detail || 'Failed to send verification code');
      }

      sentEmail = true;
      isVerifying = true;
      errorMessage = '';
    } catch (error) {
      errorMessage = error.message;
      // If email is already registered, automatically switch to login mode
      if (error.message.includes('already registered')) {
        setTimeout(() => {
          isRegister = false; // Switch to login mode
          errorMessage = ''; // Clear error message
        }, 2000); // Wait 2 seconds so user can read the message
      }
    } finally {
      isLoading = false;
    }
  }

  async function handleVerifyCode() {
    try {
      isLoading = true;
      const response = await fetch('http://127.0.0.1:8000/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verification_code: verificationCode })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Invalid verification code');
      }

      // After successful verification, show the account creation form
      isVerifying = false;
      sentEmail = true; // Keep this true to show the account creation form
      errorMessage = '';
    } catch (error) {
      errorMessage = error.message;
    } finally {
      isLoading = false;
    }
  }

  async function handleRegister() {
    try {
      isLoading = true;
      const response = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // Handle successful registration (e.g., redirect to chat)
      window.location.href = '/chat';
    } catch (error) {
      errorMessage = error.message;
    } finally {
      isLoading = false;
    }
  }

  async function handleSubmit() {
    if (isRegister) {
      if (!isVerifying) {
        await handleSendVerification();
      } else {
        await handleVerifyCode();
      }
    } else {
      try {
        const BASE_URL = "http://127.0.0.1:8000";
        const params = new URLSearchParams();
        params.append("username", username);
        params.append("password", password);
        const response = await fetch(`${BASE_URL}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });
        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.detail || response.statusText);
          return;
        }
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        navigate('/chat');
        closeModal();
      } catch (error) {
        console.error("Error:", error);
        alert("Login failed.");
      }
    }
  }
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Arial', sans-serif;
  }

  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 11, 30, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
    z-index: 10;
    backdrop-filter: blur(8px);
  }

  .modal {
    background: linear-gradient(135deg, #0a0b1e 0%, #1e3c72 100%);
    border: 1px solid rgba(255, 0, 0, 0.2);
    border-radius: 20px;
    padding: 2.5rem;
    width: 400px;
    max-width: 95%;
    box-shadow: 0 0 50px rgba(255, 0, 0, 0.15);
    position: relative;
    overflow: hidden;
    animation: webSwing 0.6s ease-out;
  }

  /* Web pattern background */
  .modal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.03) 51%, transparent 52%),
      linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.03) 51%, transparent 52%);
    background-size: 30px 30px;
    opacity: 0.3;
    pointer-events: none;
  }

  h2 {
    margin-bottom: 2rem;
    font-size: 2.2rem;
    background: linear-gradient(45deg, #ff0000, #ff4444);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 800;
    letter-spacing: -0.5px;
    text-align: center;
  }

  label {
    display: block;
    text-align: left;
    font-size: 0.9rem;
    margin-top: 1.2rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 1rem;
    margin-top: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: rgba(255, 0, 0, 0.5);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.1);
  }

  input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .button-group {
    display: flex;
    justify-content: space-between;
    margin-top: 2.5rem;
    gap: 1rem;
  }

  button {
    flex: 1;
    padding: 1rem;
    border: none;
    border-radius: 50px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  button.primary {
    background: linear-gradient(45deg, #ff0000, #cc0000);
    color: #fff;
    box-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
  }

  button.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 40px rgba(255, 0, 0, 0.4);
    background: linear-gradient(45deg, #ff1a1a, #e60000);
  }

  button.secondary {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  button.secondary:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .toggle {
    margin-top: 1.5rem;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    text-align: center;
    transition: color 0.3s ease;
  }

  .toggle:hover {
    color: #ff0000;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes webSwing {
    0% { transform: translateY(-20px); opacity: 0; }
    50% { transform: translateY(10px); }
    100% { transform: translateY(0); opacity: 1; }
  }

  .verification-message {
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
    margin: 1rem 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .verification-code {
    text-align: center;
    font-size: 1.5rem;
    letter-spacing: 0.5rem;
  }

  .resend-button {
    background: none;
    border: none;
    color: #ff0000;
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 1rem;
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }

  .resend-button:hover {
    opacity: 1;
  }

  .error-message {
    background: rgba(255, 0, 0, 0.1);
    color: #ff4444;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    text-align: center;
  }
</style>

<div class="modal-backdrop">
  <div class="modal">
    <h2>
      {#if isRegister}
        {#if isVerifying}
          Verify Your Email
        {:else if !sentEmail}
          Join the Web
        {:else}
          Create Account
        {/if}
      {:else}
        Welcome Back
      {/if}
    </h2>

    {#if errorMessage}
      <div class="error-message">
        {errorMessage}
      </div>
    {/if}

    {#if isRegister}
      {#if !isVerifying && !sentEmail}
        <!-- Step 1: Email Input -->
        <div class="form-group">
          <label>Email</label>
          <input
            type="email"
            bind:value={email}
            placeholder="Your email address"
            disabled={isLoading}
          />
        </div>

        <div class="button-group">
          <button
            class="primary"
            on:click={handleSendVerification}
            disabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'Send Verification'}
          </button>
          <button class="secondary" on:click={closeModal}>
            Cancel
          </button>
        </div>
      {:else if isVerifying}
        <!-- Step 2: Verification Code -->
        <div class="verification-message">
          We've sent a verification code to {email}
        </div>
        <div class="form-group">
          <input
            type="text"
            class="verification-code"
            bind:value={verificationCode}
            placeholder="Enter verification code"
            maxlength="6"
            disabled={isLoading}
          />
        </div>

        <div class="button-group">
          <button
            class="primary"
            on:click={handleVerifyCode}
            disabled={isLoading || !verificationCode}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
          <button
            class="secondary"
            on:click={() => {
              isVerifying = false;
              sentEmail = false;
            }}
          >
            Back
          </button>
        </div>
      {:else}
        <!-- Step 3: Username and Password -->
        <div class="form-group">
          <label>Username</label>
          <input
            type="text"
            bind:value={username}
            placeholder="Choose a username"
            disabled={isLoading}
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input
            type="password"
            bind:value={password}
            placeholder="Create a strong password"
            disabled={isLoading}
          />
        </div>

        <div class="button-group">
          <button
            class="primary"
            on:click={handleRegister}
            disabled={isLoading || !username || !password}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          <button
            class="secondary"
            on:click={() => {
              isVerifying = true;
              sentEmail = true;
            }}
          >
            Back
          </button>
        </div>
      {/if}
    {:else}
      <!-- Login Form -->
      <div class="form-group">
        <label>Username</label>
        <input
          type="text"
          bind:value={username}
          placeholder="Your username"
          disabled={isLoading}
        />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input
          type="password"
          bind:value={password}
          placeholder="Your password"
          disabled={isLoading}
        />
      </div>

      <div class="button-group">
        <button
          class="primary"
          on:click={handleSubmit}
          disabled={isLoading || !username || !password}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
        <button class="secondary" on:click={closeModal}>
          Cancel
        </button>
      </div>
    {/if}

    <div class="toggle" on:click={toggleMode}>
      {#if isRegister}
        Already have an account? <span class="toggle-link">Sign in</span>
      {:else}
        Don't have an account? <span class="toggle-link">Join now</span>
      {/if}
    </div>
  </div>
</div>