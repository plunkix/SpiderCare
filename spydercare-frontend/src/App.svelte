<!-- App.svelte -->
<script>
  import { Router, Route, navigate } from "svelte-routing";
  import { writable } from 'svelte/store'; // For reactive state

  // Import your page components
  import LandingPage from "./LandingPage.svelte";
  import LoginPage from "./LoginPage.svelte";
  import ChatPage from "./ChatPage.svelte";
  import ProfilePage from "./ProfilePage.svelte";
  import SettingsPage from "./SettingsPage.svelte";

  // Reactive user store to track login state
  export const user = writable(null); // null = logged out, { username } = logged in

  // Backend URL (replace with your actual Vercel backend URL)
  const backendUrl = 'https://spydercare-backend-ana1m38xv-srushti6226s-projects.vercel.app/';

  // Check if user is logged in on mount (e.g., from localStorage or a token in a real app)
  onMount(() => {
    // For now, this is a placeholder. In a real app, check a token or session.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user.set(JSON.parse(storedUser));
    }
  });

  // Login handler (to be called from LoginPage)
  async function handleLogin(username, password) {
    const response = await fetch(`${backendUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
      $user = { username }; // Update user store
      localStorage.setItem('user', JSON.stringify({ username })); // Persist locally
      navigate('/chat'); // Redirect to chat after login
    }
    return data; // Return response for LoginPage to display message
  }

  // Logout handler
  function handleLogout() {
    $user = null; // Clear user store
    localStorage.removeItem('user'); // Clear local storage
    navigate('/'); // Redirect to landing page
  }

  // Guard for protected routes
  function requireAuth(component) {
    return $user ? component : LoginPage;
  }
</script>

<Router>
  <!-- Landing page at the root path -->
  <Route path="/" component={LandingPage} />

  <!-- Login page with login handler -->
  <Route path="/login">
    <LoginPage onLogin={handleLogin} />
  </Route>

  <!-- Protected routes (require login) -->
  <Route path="/chat" component={requireAuth(ChatPage)} />
  <Route path="/profile" component={requireAuth(ProfilePage)} />
  <Route path="/settings" component={requireAuth(SettingsPage)} />

  <!-- Fallback route (optional) -->
  <Route path="/*" component={LandingPage} />
</Router>