<script>
  import { onMount } from 'svelte';
  import LoginOrRegisterModal from './LoginPage.svelte';
  import { navigate } from 'svelte-routing';
  
  let showAuthModal = false;

  function openAuthModal() {
    showAuthModal = true;
  }

  function closeAuthModal() {
    showAuthModal = false;
  }

  onMount(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate('/chat');
    }
  });
</script>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0b1e;
    overflow-x: hidden;
  }

  :global(html) {
    margin:0;
    padding: 0;
    overflow-x: hidden;
    box-sizing: border-box;
  }
  
  *, *:before, *:after {
    box-sizing: inherit;
  }

  .hero {
    background: linear-gradient(135deg, #0a0b1e 0%, #1e3c72 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    overflow: hidden;
    position: relative;
    padding: 2rem 1rem;
  }

  /* Enhanced web pattern overlay */
  .hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.04) 49%, rgba(255,255,255,0.04) 51%, transparent 52%),
      linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.04) 49%, rgba(255,255,255,0.04) 51%, transparent 52%);
    background-size: 50px 50px;
    opacity: 0.4;
    animation: backgroundMove 60s linear infinite;
  }

  .content-wrapper {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: center;
    width: 100%;
    max-width: 1200px; /* Adjusted to a reasonable maximum width */
    margin: 0 auto;
    padding: 0 1rem; /* Add padding for smaller screens */
    box-sizing: border-box;
  }

  .left-section {
    text-align: left;
  }

  .logo-section {
    text-align: left;
    margin-bottom: 2rem;
    position: relative;
  }

  .main-title {
    font-size: clamp(1.8rem, 5vw, 3rem);
    color: #ff0000;
    margin: 0;
    font-weight: 800;
    letter-spacing: -1px;
    text-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .main-title::before {
    content: '🕷️';
    font-size: 0.6em;
    margin-right: 0.5rem;
    animation: swingSpider 4s ease-in-out infinite;
    transform-origin: top;
    display: inline-block;
  }

  .spider-text {
    background: linear-gradient(45deg, #ff0000, #ff4444);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    position: relative;
    display: inline-block;
  }

  .care-text {
    background: linear-gradient(45deg, #ffffff, #cccccc);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    position: relative;
    display: inline-block;
  }

  /* Web line effect */
  .main-title::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent 0%,
      rgba(255, 0, 0, 0.5) 20%,
      rgba(255, 0, 0, 0.8) 50%,
      rgba(255, 0, 0, 0.5) 80%,
      transparent 100%
    );
    animation: webGlow 3s ease-in-out infinite;
  }

  @keyframes swingSpider {
    0%, 100% { transform: rotate(-10deg); }
    50% { transform: rotate(10deg); }
  }

  @keyframes webGlow {
    0%, 100% { opacity: 0.5; transform: scaleX(0.8); }
    50% { opacity: 1; transform: scaleX(1); }
  }

  /* Enhanced glow effect */
  .logo-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 120%;
    height: 120%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      rgba(255, 0, 0, 0.2) 0%,
      rgba(255, 0, 0, 0.1) 30%,
      transparent 70%
    );
    filter: blur(20px);
    z-index: -1;
    animation: logoGlow 4s ease-in-out infinite;
  }

  @keyframes logoGlow {
    0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.95); }
    50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.05); }
  }

  .mission-section {
    text-align: left;
    padding: 0;
  }

  .mission-text {
    font-size: clamp(1rem, 2.5vw, 1.2rem);
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.5;
    margin: 0 auto 2.5rem;
  }

  .cta-button {
    padding: 1rem 2rem;
    font-size: clamp(0.9rem, 2.5vw, 1.2rem);
    border: none;
    border-radius: 50px;
    background: linear-gradient(45deg, #ff0000, #cc0000);
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    box-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 40px rgba(255, 0, 0, 0.4);
    background: linear-gradient(45deg, #ff1a1a, #e60000);
  }

  @keyframes glowPulse {
    0% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.95); }
    50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.05); }
    100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.95); }
  }

  @keyframes backgroundMove {
    from { background-position: 0 0; }
    to { background-position: 50px 50px; }
  }

  /* Add a subtle fade out at the bottom */
  .hero::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 80px;
    background: linear-gradient(to bottom, transparent, #0a0b1e);
    pointer-events: none;
  }

  /* Chat Demo Styles */
  .chat-demo {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 20px;
    padding: 1.5rem;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  .chat-message {
    margin-bottom: 1rem;
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.5s forwards;
  }

  .user-message {
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem 1.5rem;
    border-radius: 15px;
    color: #fff;
    margin-left: auto;
    max-width: 90%;
    text-align: left;
  }

  .bot-message {
    background: rgba(255, 0, 0, 0.1);
    padding: 1rem 1.5rem;
    border-radius: 15px;
    color: #fff;
    margin-right: auto;
    max-width: 90%;
    text-align: left;
    border: 1px solid rgba(255, 0, 0, 0.2);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .content-wrapper {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .left-section,
    .logo-section,
    .mission-section {
      text-align: center;
    }

    .chat-demo {
      padding: 1.5rem;
    }

    .cta-button {
      padding: 1rem 2rem;
      font-size: 1rem;
      width: 100%;
    }
  }

  @media (min-width: 968px) and (max-width: 1200px) {
    .content-wrapper {
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .chat-demo {
      padding: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .hero {
      padding: 1rem;
    }

    .chat-demo {
      padding: 1rem;
    }

    .cta-button {
      padding: 1rem 2rem;
      font-size: 1rem;
      width: 100%;
    }
  }
</style>

<div class="hero">
  <div class="content-wrapper">
    <div class="left-section">
      <div class="logo-section">
        <div class="logo-glow"></div>
        <h1 class="main-title">
          <span class="spider-text">Spider</span><span class="care-text">Care</span>
        </h1>
      </div>

      <div class="mission-section">
        <p class="mission-text">
          When life's web gets tangled, we're here to help you find your way. 
          Experience the future of mental health support with our AI companion – 
          available 24/7, judgment-free, and as reliable as your friendly neighborhood hero.
        </p>
        <button class="cta-button" on:click={openAuthModal}>
          Begin Your Journey
        </button>
      </div>
    </div>

    <div class="chat-demo">
      <div class="chat-message user-message" style="animation-delay: 0.5s">
        I'm feeling overwhelmed with everything going on...
      </div>
      
      <div class="chat-message bot-message" style="animation-delay: 1.5s">
        I understand how challenging that can feel. Like untangling a complex web, we can work through this together. What's weighing on your mind the most right now?
      </div>
      
      <div class="chat-message user-message" style="animation-delay: 2.5s">
        It's just hard to keep up with everything...
      </div>
      
      <div class="chat-message bot-message" style="animation-delay: 3.5s">
        Just as Spider-Man takes things one step at a time, we can break this down together. Let's start with what feels most pressing to you.
      </div>
    </div>
  </div>
</div>

{#if showAuthModal}
  <LoginOrRegisterModal on:close={closeAuthModal} />
{/if}