class AuthManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.refreshToken = localStorage.getItem('refreshToken');

    try {
      this.user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
      console.warn('Dados de sessao corrompidos no localStorage, a limpar:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      this.token = null;
      this.refreshToken = null;
      this.user = null;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer login');
      }

      const data = await response.json();
      this.setTokens(data.token, data.refreshToken);
      this.user = data.user;
      localStorage.setItem('user', JSON.stringify(this.user));
      return data;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    window.location.href = '/login.html';
  }

  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  isAdmin() {
    return this.user && this.user.role === 'admin';
  }

  isTrainer() {
    return this.user && this.user.role === 'trainer';
  }

  getDashboardUrl() {
    if (!this.user) return '/login.html';
    return this.user.role === 'admin' 
      ? '/dashboard/admin.html' 
      : '/dashboard/trainer.html';
  }
}

const auth = new AuthManager();

// Redirect se já está autenticado
if (auth.isAuthenticated() && window.location.pathname === '/login.html') {
  window.location.href = auth.getDashboardUrl();
}

// Proteger rotas
if (!auth.isAuthenticated() && 
    window.location.pathname.includes('/dashboard/') &&
    window.location.pathname !== '/login.html') {
  window.location.href = '/login.html';
}

// Handle login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');

    errorEl.classList.remove('show');
    submitBtn.disabled = true;
    loading.style.display = 'block';

    try {
      const result = await auth.login(email, password);
      window.location.href = auth.getDashboardUrl();
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.add('show');
      submitBtn.disabled = false;
      loading.style.display = 'none';
    }
  });
}

// Adicionar token a todas as requisições
function addAuthHeader(config = {}) {
  const token = auth.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

// Wrapper para fetch com autenticação
async function authenticatedFetch(url, options = {}) {
  const config = addAuthHeader(options);
  const response = await fetch(url, config);
  
  if (response.status === 401) {
    auth.logout();
    throw new Error('Sessão expirada');
  }
  
  return response;
}