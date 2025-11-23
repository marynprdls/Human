# Human - P2P Scholarship Platform on Stellar Blockchain

<div align="center">

**Empowering artisans through blockchain-verified P2P donations**

[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-09B3AF?style=for-the-badge&logo=stellar)](https://stellar.org)
[![Soroban Smart Contracts](https://img.shields.io/badge/Soroban-Smart%20Contracts-7B61FF?style=for-the-badge)](https://soroban.stellar.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

[Features](#-features) • [Demo](#-demo) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Architecture](#-architecture) • [Roadmap](#-roadmap)

</div>

---

## 📖 Overview

**Human** is a decentralized peer-to-peer scholarship platform built on the Stellar blockchain that connects donors (clients) directly with verified artisans who need financial support for their education and development. By leveraging Soroban smart contracts, we ensure transparent, secure, and immutable transactions without intermediaries.

### The Problem

Traditional scholarship and donation platforms suffer from:
- High intermediary fees (15-30% in processing costs)
- Lack of transparency in fund distribution
- Difficulty verifying legitimate beneficiaries
- Slow payment processing (3-7 days)
- Geographic restrictions and banking barriers

### Our Solution

Human eliminates these barriers by:
- **Zero intermediaries**: Direct P2P transactions via Stellar blockchain
- **Blockchain verification**: Admin-verified artisan registry on-chain
- **Instant payments**: Real-time settlements with minimal fees (~$0.00001)
- **Complete transparency**: All transactions recorded immutably
- **Global accessibility**: Anyone with internet can participate
- **Social authentication**: Google OAuth integration via Accesly SDK

---

## ✨ Features

### For Artisans (Recipients)

- 🎨 **Registration & Verification**
  - Self-registration with profile creation
  - Admin verification process via blockchain
  - On-chain reputation tracking
  - QR code generation for receiving donations

- 💰 **Payment Management**
  - Real-time payment notifications
  - Transaction history with blockchain explorer links
  - First sale modal for initial donations
  - Automatic payment counter on smart contract

- 📊 **Dashboard**
  - Total earnings tracking
  - Payment statistics
  - Transaction history
  - Verification status monitoring

### For Clients (Donors)

- 🔍 **Artisan Discovery**
  - Browse verified artisans on interactive map
  - View artisan profiles and verification status
  - QR code scanning for quick donations
  - Search and filter capabilities

- 💳 **Donation Flow**
  - Scan artisan QR code or select from map
  - Choose donation amount
  - Instant blockchain confirmation
  - Payment success tracking

- 📱 **Transaction Management**
  - Complete donation history
  - Blockchain transaction verification
  - Receipt generation
  - Multiple payment methods support

### For Administrators

- ✅ **Artisan Verification System**
  - Review pending artisan applications
  - On-chain verification with admin signatures
  - Real-time status updates
  - Comprehensive logging and debugging

- 🛡️ **Platform Management**
  - Monitor all transactions
  - Verify smart contract interactions
  - Access to admin-only verification UI
  - Transaction timeout handling (60 seconds)

### Technical Features

- 🔐 **Security**
  - Google OAuth social authentication
  - Stellar wallet integration
  - Admin-only contract functions
  - Secure API endpoints with authentication

- 📲 **Mobile-First Design**
  - Fully responsive UI with shadcn/ui components
  - Mobile-optimized layouts
  - Touch-friendly interfaces
  - Progressive Web App capabilities

- 🔗 **Blockchain Integration**
  - Soroban smart contracts (Rust)
  - Auto-generated TypeScript contract clients
  - Real-time transaction polling
  - Network status monitoring

---

## 🎥 Demo

### Live Application
- **Frontend**: [Coming Soon]
- **Admin Panel**: `/admin-verifier.html`
- **Blockchain Explorer**: [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet)

### Screenshots

```
📱 Client Flow:
Login → Role Selection → Scan QR → Payment → Success

🎨 Artisan Flow:
Login → Registration → Verification → Dashboard → Receive Payments

👨‍💼 Admin Flow:
Login → Admin Panel → Verify Artisan → Blockchain Confirmation
```

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19.1 + TypeScript 5.9
- **Build Tool**: Vite 7.1
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM 7.9
- **Maps**: Leaflet + React Leaflet
- **QR Codes**: html5-qrcode
- **Notifications**: Sonner + React Toastify
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express 5.1
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth (Accesly SDK)
- **Security**: Helmet, CORS, Compression
- **QR Generation**: qrcode library

### Blockchain
- **Network**: Stellar Testnet (production: Mainnet)
- **Smart Contracts**: Soroban (Rust)
- **SDK**: Stellar SDK 14.2
- **Wallet Integration**: Creit.tech Stellar Wallets Kit

### DevOps & Tools
- **Version Control**: Git + GitHub
- **Code Quality**: ESLint, Prettier, Husky
- **Package Manager**: npm workspaces
- **Environment**: dotenv
- **Testing**: [Coming Soon]

---

## 🚀 Getting Started

### Prerequisites

Before getting started, ensure you have:

- **Node.js** v22 or higher
- **npm** v10 or higher
- **Rust** (latest stable) + Cargo
- **Stellar CLI** with Soroban support
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/marynprdls/Human.git
cd Human
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Environment setup**

Create `.env` file in the root directory:
```env
# Google OAuth (from Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Stellar Network
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Contract IDs (after deployment)
VITE_ARTISAN_REGISTRY_CONTRACT_ID=your_contract_id
```

Create `backend/.env`:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Stellar Admin
ADMIN_SECRET_KEY=your_admin_secret_key

# Server
PORT=3000
NODE_ENV=development
```

4. **Deploy Smart Contracts**

```bash
# Build contracts
stellar contract build

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/artisan_registry.wasm \
  --source admin-keypair \
  --network testnet

# Initialize contract
stellar contract invoke \
  --id CONTRACT_ID \
  --source admin-keypair \
  --network testnet \
  -- \
  initialize \
  --admin ADMIN_PUBLIC_KEY
```

5. **Start development servers**

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Admin Panel: http://localhost:5173/admin-verifier.html

### Quick Test Flow

1. **Fund admin account** (testnet only):
```bash
curl "https://friendbot.stellar.org?addr=ADMIN_PUBLIC_KEY"
```

2. **Register as artisan**:
   - Navigate to `/login`
   - Select "Artisan" role
   - Complete registration form
   - Wait for admin verification

3. **Verify artisan** (admin):
   - Open `admin-verifier.html`
   - Enter admin password: `stellar2024`
   - Paste artisan address
   - Click "Verify Artisan"

4. **Make donation** (client):
   - Login and select "Client" role
   - Scan artisan QR code or select from map
   - Enter donation amount
   - Confirm transaction

---

## 🏗 Architecture

### System Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React App     │◄───────►│   Express API    │◄───────►│    Supabase     │
│  (Frontend)     │         │   (Backend)      │         │   (Database)    │
└────────┬────────┘         └────────┬─────────┘         └─────────────────┘
         │                           │
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Stellar Blockchain   │
         │  Soroban Contracts    │
         └───────────────────────┘
```

### Smart Contract: Artisan Registry

**Location**: `contracts/artisan_registry/src/lib.rs`

**Data Structures**:
```rust
pub struct Artisan {
    pub stellar_address: Address,
    pub name: String,
    pub verified: bool,
    pub registered_at: u64,
    pub total_payments: u32,
}
```

**Core Functions**:
- `initialize(admin: Address)` - Set contract admin
- `register_artisan(artisan_address: Address, name: String)` - Self-registration
- `verify_artisan(admin: Address, artisan_address: Address)` - Admin verification
- `get_artisan(artisan_address: Address) -> Artisan` - Fetch artisan data
- `increment_payment(artisan_address: Address)` - Track payment count

### API Endpoints

**Artisan Routes** (`/api/artisan`):
- `POST /register` - Register new artisan
- `GET /:address` - Get artisan details
- `POST /:address/increment` - Increment payment counter

**Admin Routes** (`/api/admin`):
- `POST /verify-artisan` - Verify artisan on-chain (60s timeout)

**User Routes** (`/api/user`):
- `POST /register` - Register user in database
- `GET /:walletAddress` - Get user data

**Transaction Routes** (`/api/transactions`):
- `POST /` - Record new transaction
- `GET /artisan/:address` - Get artisan's transactions
- `GET /client/:address` - Get client's transactions

### Database Schema (Supabase)

**users** table:
```sql
- wallet_address (primary key)
- email
- name
- role (artisan | client | admin)
- created_at
- updated_at
```

**orders** table:
```sql
- id (uuid, primary key)
- client_address
- artisan_address
- amount
- tx_hash
- status
- created_at
```

---

## 📁 Project Structure

```
Human/
├── contracts/                      # Soroban smart contracts
│   └── artisan_registry/
│       └── src/lib.rs             # Main contract logic
├── backend/                        # Express API server
│   ├── src/
│   │   ├── controllers/           # Route controllers
│   │   │   ├── admin.controller.ts      # Admin verification (60s timeout)
│   │   │   ├── artisan.controller.ts    # Artisan operations
│   │   │   ├── user.controller.ts       # User management
│   │   │   └── transaction.controller.ts # Transaction history
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic
│   │   │   ├── stellar.service.ts       # Stellar SDK wrapper
│   │   │   └── artisanRegistry.service.ts # Contract client
│   │   ├── config/                # Configuration
│   │   │   └── supabase.ts        # Supabase client
│   │   ├── types/                 # TypeScript types
│   │   ├── app.ts                 # Express app setup
│   │   └── server.ts              # Server entry point
│   ├── migrations/                # Database migrations
│   └── package.json
├── src/                           # React frontend
│   ├── components/                # Reusable components
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── FirstSaleModal.tsx     # First donation modal
│   │   ├── TransactionHistory.tsx # Transaction list
│   │   └── mobile-*.tsx           # Mobile components
│   ├── pages/                     # Route pages
│   │   ├── Login.tsx              # Auth page
│   │   ├── RoleSelect.tsx         # Role selection
│   │   ├── ArtisanRegister.tsx    # Artisan registration
│   │   ├── ClientRegister.tsx     # Client registration
│   │   ├── ArtisanDashboard.tsx   # Artisan dashboard
│   │   ├── ClientDashboard.tsx    # Client dashboard
│   │   ├── Scan.tsx               # QR scanner
│   │   ├── Payment.tsx            # Payment page
│   │   ├── PaymentSuccess.tsx     # Success page
│   │   ├── AdminPanel.tsx         # Admin dashboard
│   │   ├── Map.tsx                # Artisan map
│   │   └── Profile.tsx            # User profile
│   ├── services/                  # API clients
│   │   └── artisanRegistry.service.ts
│   ├── providers/                 # Context providers
│   │   ├── SocialAuthProvider.tsx # Google OAuth
│   │   └── NotificationProvider.tsx
│   ├── sdk/accesly/              # Accesly SDK integration
│   ├── hooks/                     # Custom React hooks
│   ├── utils/                     # Utility functions
│   ├── App.tsx                    # Main app component
│   └── main.tsx                   # Entry point
├── packages/                      # Auto-generated contract clients
│   └── artisan-registry-client/
├── admin-verifier.html           # Standalone admin UI
├── tailwind.config.js            # Tailwind configuration
├── vite.config.ts                # Vite configuration
└── package.json                  # Dependencies
```

---

## 🔐 Security

### Authentication
- Google OAuth 2.0 via Accesly SDK
- Stellar wallet signature verification
- Admin password protection (`stellar2024` - **change in production!**)

### Smart Contract Security
- Admin-only verification function
- Address authentication requirements
- Duplicate registration prevention
- Immutable transaction records

### API Security
- Helmet.js HTTP headers
- CORS configuration
- Request validation
- Environment variable protection

### Best Practices
- Never commit `.env` files
- Use hardware wallets for mainnet admin keys
- Implement rate limiting (roadmap)
- Add 2FA for admin accounts (roadmap)

---

## 🧪 Testing

### Manual Testing

1. **Contract testing** (local):
```bash
stellar contract invoke --id CONTRACT_ID -- register_artisan \
  --artisan_address GXXX... \
  --name "Test Artisan"
```

2. **API testing** (Postman/curl):
```bash
# Register artisan
curl -X POST http://localhost:3000/api/artisan/register \
  -H "Content-Type: application/json" \
  -d '{"address": "GXXX...", "name": "Test"}'

# Verify artisan
curl -X POST http://localhost:3000/api/admin/verify-artisan \
  -H "Content-Type: application/json" \
  -d '{"artisan_address": "GXXX...", "password": "stellar2024"}'
```

### Automated Testing (Coming Soon)
- Unit tests for contracts (Rust)
- API endpoint tests (Jest)
- Frontend component tests (React Testing Library)
- E2E tests (Playwright)

---

## 📊 Scope & Current Status

### ✅ Completed (MVP - Hackathon)

- [x] Smart contract development (register, verify, increment)
- [x] Admin verification system with 60s timeout
- [x] Google OAuth social authentication
- [x] QR code generation and scanning
- [x] Payment flow (client → artisan)
- [x] Transaction history tracking
- [x] Artisan dashboard with earnings
- [x] Client dashboard with map view
- [x] Supabase database integration
- [x] Mobile-responsive UI
- [x] Real-time blockchain confirmation
- [x] Admin panel standalone UI
- [x] Comprehensive logging and debugging

### 🚧 In Progress

- [ ] Multi-language support (i18n)
- [ ] Enhanced search and filtering
- [ ] Push notifications
- [ ] Email notifications

### 🔜 Planned (Next Sprint)

- [ ] Automated testing suite
- [ ] CI/CD pipeline
- [ ] Production deployment
- [ ] Mainnet migration
- [ ] Advanced analytics dashboard
- [ ] Rating and review system

---

## 🗺 Roadmap

### Phase 1: MVP Enhancement (Q1 2025)
- [ ] Comprehensive testing coverage (unit, integration, E2E)
- [ ] Security audit of smart contracts
- [ ] Performance optimization (lazy loading, caching)
- [ ] Enhanced error handling and user feedback
- [ ] Documentation improvements
- [ ] Bug fixes from user feedback

### Phase 2: Feature Expansion (Q2 2025)
- [ ] **Multi-token support** (USDC, native assets)
- [ ] **Recurring donations** with scheduled payments
- [ ] **Artisan profiles** with portfolios and stories
- [ ] **Impact tracking** - show how donations are used
- [ ] **Milestone-based funding** - conditional releases
- [ ] **Social features** - comments, likes, shares
- [ ] **Mobile apps** (React Native)

### Phase 3: Platform Growth (Q3 2025)
- [ ] **Advanced verification** - KYC integration for artisans
- [ ] **Batch donations** - donate to multiple artisans
- [ ] **Matching donations** - corporate sponsorships
- [ ] **NFT certificates** - proof of donation as NFTs
- [ ] **Governance token** - community-driven decisions
- [ ] **Analytics dashboard** - insights for donors
- [ ] **API for third-party integrations**

### Phase 4: Ecosystem Building (Q4 2025)
- [ ] **Partner integrations** (educational platforms, NGOs)
- [ ] **Artisan marketplace** - sell crafts and services
- [ ] **Skill verification** - on-chain credentials
- [ ] **Mentorship programs** - connect artisans with experts
- [ ] **DAO formation** - decentralized governance
- [ ] **Cross-chain support** - expand beyond Stellar
- [ ] **Global expansion** - localization for 10+ countries

### Long-term Vision
- Become the leading blockchain-based scholarship platform
- Facilitate $10M+ in direct artisan support annually
- Expand to 50+ countries with localized experiences
- Partner with major educational institutions
- Launch Human Foundation for grants and research
- Build an ecosystem of tools for the informal economy

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute
- 🐛 **Report bugs** via GitHub Issues
- 💡 **Suggest features** through Discussions
- 📖 **Improve documentation**
- 🧪 **Write tests**
- 🎨 **Design improvements**
- 💻 **Code contributions**

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Commit Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Human Team**
- Project maintained by [@marynprdls](https://github.com/marynprdls)
- Built with ❤️ for the Stellar community

---

## 🙏 Acknowledgments

- **Stellar Development Foundation** - For the amazing Soroban platform
- **Scaffold Stellar** - For the excellent development toolkit
- **Accesly SDK** - For seamless social authentication
- **shadcn/ui** - For beautiful, accessible components
- **Supabase** - For reliable backend infrastructure

---

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs](https://github.com/marynprdls/Human/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/marynprdls/Human/discussions)
- **Email**: [Coming Soon]
- **Twitter**: [Coming Soon]
- **Discord**: [Coming Soon]

---

## 📚 Additional Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Stellar SDK Reference](https://stellar.github.io/js-stellar-sdk/)
- [Scaffold Stellar Guide](https://github.com/theahaco/scaffold-stellar)
- [Project Wiki](https://github.com/marynprdls/Human/wiki) _(Coming Soon)_

---

<div align="center">

**Built on Stellar Blockchain** 🌟

*Empowering artisans, one transaction at a time.*

[⬆ Back to Top](#human---p2p-scholarship-platform-on-stellar-blockchain)

</div>
