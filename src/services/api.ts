// services/api.ts
const API_BASE = 'http://localhost:8080'; // API Gateway

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // UTILISEZ 'username' ICI pour correspondre au backend Spring
    body: JSON.stringify({ username: email, password: password }), 
  });

  const data = await response.json();

  if (!response.ok) {
    // Si Keycloak renvoie "Account is not fully set up", cela sera capturé ici
    const errorMsg = data.error_detail ? JSON.parse(data.error_detail).error_description : 'Erreur de connexion';
    throw new Error(errorMsg);
  }

  localStorage.setItem('token', data.access_token);
  return data;
};

// services/api.ts
// services/api.ts

export const getProducts = async () => {
  // On récupère le token stocké lors du login
  const token = localStorage.getItem('token'); 

  const response = await fetch(`${API_BASE}/products`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // INDISPENSABLE
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Session expirée ou non autorisée");
    throw new Error("Impossible de récupérer les produits");
  }

  return response.json();
};
export const addProduct = async (productData: any) => {
  // 1. Récupérer le token (vérifiez bien le nom de la clé utilisée dans AuthContext)
  const token = localStorage.getItem('token'); 

  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Le token doit être envoyé ici
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    // Si la réponse n'est pas 200/201, on jette une erreur
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erreur serveur");
  }

  return response.json();
};

export async function fetchOrders() {
  const token = localStorage.getItem('token'); // Récupère le token stocké au login
  
  // Note: On utilise /my-orders car le backend filtre par le token
  const res = await fetch(`${API_BASE}/orders/my-orders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Session expirée');
    throw new Error('Impossible de récupérer les commandes');
  }
  
  return res.json();
}


// services/api.ts
export const createOrder = async (orderData: any) => {
  // Récupérer le token stocké (souvent dans localStorage après login)
  const token = localStorage.getItem('token'); 

  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // TRÈS IMPORTANT
    },
    body: JSON.stringify(orderData)
  });
  
  if (!response.ok) throw new Error('Erreur API');
  return response.json();
};

export async function fetchMyProfile() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/clients/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Erreur profil');
  return res.json();
}
// 1. Vérifier si l'utilisateur est admin (basé sur ta colonne 0/1)
export const checkAdminStatus = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/clients/status`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) return { isAdmin: false };
  return response.json();
};

// 2. Récupérer les statistiques du Dashboard
export const fetchDashboardStats = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/clients/admin/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json(); 
  // La réponse sera maintenant : { totalClients: 10, totalProducts: 50, totalOrders: 120 }
};

// 3. Récupérer TOUTES les commandes (Vue Admin)
export const fetchAllOrders = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/orders/all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Erreur chargement commandes globales");
  return response.json();
};
export const getAllClients = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer la liste des clients");
  }

  return response.json();
};

// Récupérer le token (ajuste la clé selon ton projet, souvent 'token')
const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); 
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const updateProduct = async (id: number | string, data: any) => {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(), // Ajout des headers sécurisés
    body: JSON.stringify(data),
  });
  if (response.status === 401) throw new Error('Session expirée ou non autorisée');
  if (!response.ok) throw new Error('Erreur lors de la modification');
  return response.json();
};

export const deleteProduct = async (id: number | string) => {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  if (response.status === 401) throw new Error('Action non autorisée');
  if (!response.ok) throw new Error('Erreur lors de la suppression');
};