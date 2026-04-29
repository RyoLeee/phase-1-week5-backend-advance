// Global App JS - auth state management & navbar

(function () {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const navLogin = document.getElementById('navLogin');
  const navLogout = document.getElementById('navLogout');
  const navUser = document.getElementById('navUser');

  if (user && token) {
    // Logged in state
    if (navLogin) navLogin.classList.add('hidden');
    if (navLogout) navLogout.classList.remove('hidden');
    if (navUser) {
      navUser.textContent = '👤 ' + user.username;
      navUser.classList.remove('hidden');
    }
  } else {
    // Guest state
    if (navLogin) navLogin.classList.remove('hidden');
    if (navLogout) navLogout.classList.add('hidden');
  }
})();

function logout() {
  const token = localStorage.getItem('token');

  fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).finally(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  });
}
