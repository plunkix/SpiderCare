<!-- App.svelte -->
<script>
  import { Router, Route } from "svelte-routing";

  // Import your page components
  import LandingPage from "./LandingPage.svelte";
  import LoginPage from "./LoginPage.svelte";
  import ChatPage from "./ChatPage.svelte";
  import ProfilePage from "./ProfilePage.svelte";
  import SettingsPage from "./SettingsPage.svelte"; // Add this
</script>

<Router>
  <!-- Landing page at the root path -->
  <Route path="/" component={LandingPage} />

  <!-- Login page -->
  <Route path="/login" component={LoginPage} />

  <!-- Chat page (accessible after login) -->
  <Route path="/chat" component={ChatPage} />

  <!-- Profile page -->
  <Route path="/profile" component={ProfilePage} />

  <!-- Settings page -->
  <Route path="/settings" component={SettingsPage} /> <!-- Add this -->
</Router>