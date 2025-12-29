# Architecture Microservices - Plateforme de Gestion des Commandes

## Vue d'ensemble

Cette application implémente une architecture microservices pour une plateforme de gestion de commandes en ligne. Le système est divisé en plusieurs services indépendants qui communiquent entre eux pour assurer le fonctionnement global.

## Architecture Proposée

### 1. Services Microservices

L'application est conçue autour de trois microservices principaux:

#### **Customer Service (Service Client)**
- **Responsabilité**: Gestion des profils clients
- **Base de données**: Table `customers` (isolée)
- **Opérations**:
  - Création de profil client
  - Lecture des informations client
  - Mise à jour du profil
  - Validation de l'existence d'un client

#### **Product Service (Service Produit)**
- **Responsabilité**: Gestion du catalogue produits
- **Base de données**: Table `products` (isolée)
- **Opérations**:
  - Listing des produits disponibles
  - Vérification du stock
  - Mise à jour des quantités
  - Gestion des catégories

#### **Order Service (Service Commande)**
- **Responsabilité**: Orchestration des commandes
- **Base de données**: Tables `orders` et `order_items` (isolées)
- **Opérations**:
  - Création de commande
  - Validation du client (via Customer Service)
  - Validation des produits (via Product Service)
  - Gestion du statut des commandes
  - Historique des commandes

### 2. Communication Inter-Services

#### **Communication Synchrone (REST API)**
- Utilisée pour les opérations critiques nécessitant une réponse immédiate
- Exemples:
  - Order Service → Customer Service: Vérifier l'existence du client
  - Order Service → Product Service: Vérifier la disponibilité des produits

#### **Gestion des Erreurs**
- Timeouts configurés pour chaque appel
- Circuit breaker pattern pour éviter les cascades de pannes
- Fallback strategies pour les services non critiques

### 3. Base de Données

Chaque microservice possède sa propre base de données (principe de séparation):

```
┌─────────────────────┐
│  Customer Service   │
│  ┌───────────────┐  │
│  │  customers    │  │
│  └───────────────┘  │
└─────────────────────┘

┌─────────────────────┐
│  Product Service    │
│  ┌───────────────┐  │
│  │  products     │  │
│  └───────────────┘  │
└─────────────────────┘

┌─────────────────────┐
│  Order Service      │
│  ┌───────────────┐  │
│  │  orders       │  │
│  │  order_items  │  │
│  └───────────────┘  │
└─────────────────────┘
```

### 4. Authentification

- Système d'authentification centralisé via Supabase Auth
- JWT tokens pour sécuriser les APIs
- Row Level Security (RLS) sur toutes les tables

## Implémentation Technique

### Stack Technologique

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Base de données**: PostgreSQL (Supabase)
- **Authentification**: Supabase Auth

### Structure Frontend

```
src/
├── components/
│   ├── auth/           # Composants d'authentification
│   ├── customer/       # Interface de gestion client
│   ├── products/       # Catalogue et gestion produits
│   └── orders/         # Gestion des commandes
├── contexts/           # Contextes React (Auth, etc.)
├── types/              # Définitions TypeScript
└── data/               # Données mock pour développement
```

### Schéma de Base de Données

#### Table: customers
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- email (text)
- full_name (text)
- phone (text)
- address (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### Table: products
```sql
- id (uuid, PK)
- name (text)
- description (text)
- price (decimal)
- stock_quantity (integer)
- category (text)
- image_url (text)
- is_active (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### Table: orders
```sql
- id (uuid, PK)
- customer_id (uuid, FK → customers)
- order_number (text)
- status (text: pending|confirmed|shipped|delivered|cancelled)
- total_amount (decimal)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### Table: order_items
```sql
- id (uuid, PK)
- order_id (uuid, FK → orders)
- product_id (uuid, FK → products)
- quantity (integer)
- unit_price (decimal)
- subtotal (decimal)
```

## Flux de Création de Commande

```
1. Client ajoute des produits au panier (Frontend)
   ↓
2. Client valide la commande
   ↓
3. Order Service reçoit la requête
   ↓
4. Order Service → Customer Service: Vérifie l'existence du client
   ↓
5. Order Service → Product Service: Vérifie la disponibilité des produits
   ↓
6. Si validation OK: Création de la commande
   ↓
7. Product Service: Mise à jour des stocks
   ↓
8. Réponse au client avec confirmation
```

## Sécurité

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec les politiques suivantes:

- **Customers**: Les utilisateurs ne peuvent accéder qu'à leur propre profil
- **Products**: Lecture publique pour les produits actifs
- **Orders**: Les utilisateurs ne voient que leurs propres commandes
- **Order Items**: Accès contrôlé via la propriété des commandes

### Authentification

- JWT tokens émis par Supabase Auth
- Tokens validés sur chaque requête API
- Session management avec refresh tokens

## Extension Future

### Service Registry (Optionnel)
- Enregistrement dynamique des services
- Découverte de services
- Health checks

### API Gateway (Optionnel)
- Point d'entrée unique
- Routage dynamique
- Rate limiting
- Load balancing

### Configuration Centralisée (Optionnel)
- Serveur de configuration avec Git
- Modification sans redéploiement
- Gestion des environnements

### Message Broker (Optionnel)
- Communication asynchrone
- Event-driven architecture
- RabbitMQ ou Apache Kafka

## Fonctionnalités Implémentées

### Frontend

1. **Authentification**
   - Connexion/Inscription
   - Gestion de session
   - Protection des routes

2. **Gestion Client**
   - Profil utilisateur
   - Modification des informations

3. **Catalogue Produits**
   - Affichage des produits
   - Recherche et filtres
   - Gestion du stock

4. **Gestion Commandes**
   - Panier d'achat
   - Validation de commande
   - Historique des commandes
   - Statuts de commande

## Mode de Déploiement

### Développement Local
```bash
npm install
npm run dev
```

### Production
```bash
npm run build
```

### Avec Docker Compose (Optionnel)
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "5173:5173"

  customer-service:
    build: ./services/customer-service
    environment:
      - DATABASE_URL=${DATABASE_URL}

  product-service:
    build: ./services/product-service
    environment:
      - DATABASE_URL=${DATABASE_URL}

  order-service:
    build: ./services/order-service
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CUSTOMER_SERVICE_URL=${CUSTOMER_SERVICE_URL}
      - PRODUCT_SERVICE_URL=${PRODUCT_SERVICE_URL}
```

## Principes Respectés

1. **Single Responsibility**: Chaque service a une responsabilité unique
2. **Database per Service**: Chaque service a sa propre base de données
3. **Independent Deployment**: Les services peuvent être déployés indépendamment
4. **Resilience**: Gestion des erreurs et fallback strategies
5. **Security**: Authentication, authorization, et RLS
6. **Scalability**: Architecture permettant la montée en charge

## Compte de Démonstration

Pour tester l'application:
- **Email**: demo@example.com
- **Mot de passe**: demo123
