<script>
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';

  let token = '';
  let oldEmail = '';
  let profile = {
    username: '',
    email: '',
    location: '',
    profile_pic_url: ''
  };

  // For file upload
  let selectedFile = null;

  // Load the user's profile from your backend
  async function loadProfile() {
    token = localStorage.getItem('access_token') || '';
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch('http://127.0.0.1:8000/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to load profile');
        return;
      }
      const data = await res.json();
      profile.username = data.username || '';
      profile.email = data.email || '';
      profile.location = data.location || '';
      profile.profile_pic_url = data.profile_pic_url || '';
      oldEmail = profile.email;
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Save changes to the profile
  async function saveProfile() {
    if (!token) {
      navigate('/login');
      return;
    }
    // Check if email changed; if so, confirm
    if (profile.email !== oldEmail) {
      const confirmed = confirm('Are you sure you want to change your email?');
      if (!confirmed) {
        profile.email = oldEmail; // revert the email
        return;
      }
    }
    try {
      const res = await fetch('http://127.0.0.1:8000/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: profile.email,
          location: profile.location,
          profile_pic_url: profile.profile_pic_url
        })
      });
      if (!res.ok) {
        alert('Failed to save profile');
        return;
      }
      alert('Profile updated successfully!');
      oldEmail = profile.email;
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }

  // Handle user clicking on the profile picture (open file dialog)
  function handleProfilePicClick() {
    // We trigger a hidden file input
    const fileInput = document.getElementById('profilePicInput');
    if (fileInput) {
      fileInput.click();
    }
  }

  // Handle file selection
  async function handleFileChange(e) {
    selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Upload file to backend
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('http://127.0.0.1:8000/profile/picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        alert('Failed to upload picture');
        return;
      }
      const data = await res.json();
      // The backend returns updated profile_pic_url
      profile.profile_pic_url = data.profile_pic_url;
      alert('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  }

  function goBack() {
    navigate('/chat');
  }

  onMount(() => {
    loadProfile();
  });
</script>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Roboto', sans-serif;
    background: #f2f6fa;
  }
  .profile-container {
    max-width: 1000px;
    margin: 2rem auto;
    display: flex;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  /* Left card */
  .left-card {
    width: 30%;
    background: #f8fafc;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1.5rem;
    position: relative;
  }
  .profile-pic {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ccc;
    margin-bottom: 1rem;
    cursor: pointer;
  }
  .user-name {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  .user-email {
    font-size: 0.95rem;
    color: #777;
  }
  .back-button {
    margin-top: 1.5rem;
    padding: 0.5rem 1rem;
    background: #ccc;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .back-button:hover {
    background: #bbb;
  }

  /* Right form */
  .right-form {
    flex: 1;
    padding: 2rem;
  }
  .right-form h2 {
    margin-top: 0;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  .form-group {
    margin-bottom: 1.5rem;
  }
  label {
    display: block;
    margin-bottom: 0.3rem;
    font-weight: 600;
  }
  input {
    width: 100%;
    padding: 0.6rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
  .save-button {
    background: #2575fc;
    color: #fff;
    border: none;
    padding: 0.7rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  .save-button:hover {
    background: #1a5bb8;
  }
  /* Hidden file input for uploading profile pic */
  #profilePicInput {
    display: none;
  }
</style>

<div class="profile-container">
  <!-- Left Card -->
  <div class="left-card">
    <!-- Clicking the image opens file dialog -->
    <img
      class="profile-pic"
      src={profile.profile_pic_url || 'https://via.placeholder.com/120?text=Me'}
      alt="Profile Picture"
      on:click={handleProfilePicClick}
    />
    <div class="user-name">{profile.username || 'Your Name'}</div>
    <div class="user-email">{profile.email || 'dummy1@gmail.com'}</div>
    <button class="back-button" on:click={goBack}>Back to Chat</button>

    <!-- Hidden file input for image upload -->
    <input
      id="profilePicInput"
      type="file"
      accept="image/*"
      on:change={handleFileChange}
    />
  </div>

  <!-- Right Form -->
  <div class="right-form">
    <h2>My Profile</h2>
    <div class="form-group">
      <label for="username">Name</label>
      <input id="username" type="text" bind:value={profile.username} />
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={profile.email} />
    </div>
    <div class="form-group">
      <label for="location">Location</label>
      <input id="location" type="text" bind:value={profile.location} />
    </div>
    <div class="form-group">
      <label for="profile_pic_url">Profile Picture URL</label>
      <input id="profile_pic_url" type="text" bind:value={profile.profile_pic_url} />
    </div>
    <button class="save-button" on:click={saveProfile}>Save Changes</button>
  </div>
</div>
