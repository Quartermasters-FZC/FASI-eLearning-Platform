# FASI eLearning Platform (Foreign Affairs Security Institute)

[![Build Status](https://github.com/Quartermasters-FZC/FASI-eLearning-Platform/workflows/CI/badge.svg)](https://github.com/Quartermasters-FZC/FASI-eLearning-Platform/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FISMA Compliant](https://img.shields.io/badge/FISMA-Compliant-blue.svg)](https://www.nist.gov/cyberframework)

> A comprehensive, AI-powered eLearning platform supporting 70+ FSI languages with advanced speech recognition, natural language processing, and neural machine translation capabilities. Built for government-grade security and scalability.

## 🚀 Features

### 🎯 Core Capabilities
- **Multi-Language Support**: 70+ FSI languages with native script support
- **Advanced Speech Recognition**: Real-time pronunciation analysis and feedback
- **Neural Machine Translation**: High-quality translation between all language pairs
- **Natural Language Processing**: Grammar checking, content analysis, and cultural adaptation
- **Government-Grade Security**: FISMA/FedRAMP compliant infrastructure

### 🏗️ Architecture
- **Microservices**: FastAPI-based AI services with Docker containerization
- **Cloud-Native**: Kubernetes orchestration on AWS EKS
- **Scalable**: Auto-scaling infrastructure with GPU support for AI workloads
- **Observable**: Comprehensive monitoring with Prometheus, Grafana, and Jaeger

## 📋 Prerequisites

### System Requirements
- **Docker**: 20.10+ and Docker Compose
- **Node.js**: 18+ with npm
- **Python**: 3.11+ with pip
- **Terraform**: 1.6+ for infrastructure deployment
- **kubectl**: For Kubernetes management

### AWS Account Requirements
- AWS CLI configured with appropriate permissions
- EKS, RDS, ElastiCache, and S3 access
- Route53 domain for SSL certificate

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Quartermasters-FZC/FASI-eLearning-Platform.git
cd FASI-eLearning-Platform
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env
# Edit environment variables
```

### 3. Local Development
```bash
# Start all services with Docker Compose
docker-compose up -d

# Access services
# Web Application: http://localhost:3100
# API Gateway: http://localhost:3000
# Speech Service: http://localhost:8001
# NLP Service: http://localhost:8002
# Translation Service: http://localhost:8003
```

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# AI services tests
cd ai-services/speech-recognition
pytest tests/ -v --cov=src

# Frontend tests
cd frontend/web-app
npm test -- --coverage
```

## 📁 Project Structure

```
FASI-eLearning-Platform/
├── 📁 backend/                    # Node.js backend services
│   ├── 📁 auth-service/           # Authentication & authorization
│   ├── 📁 user-service/           # User management
│   └── 📁 content-service/        # Content management
├── 📁 ai-services/                # Python AI/ML services
│   ├── 📁 speech-recognition/     # Speech analysis & recognition
│   ├── 📁 nlp-service/           # Natural language processing
│   └── 📁 translation-service/    # Neural machine translation
├── 📁 frontend/                   # React frontend applications
│   └── 📁 web-app/               # Main web application
├── 📁 infrastructure/             # Infrastructure as Code
│   ├── 📁 terraform/             # AWS infrastructure
│   └── 📁 helm/                  # Kubernetes deployments
├── 📁 tests/                      # Test configurations & fixtures
└── 📄 docker-compose.yml         # Local development setup
```

## 🌍 Supported Languages

The platform supports all 70+ Foreign Service Institute categorized languages:

**Category I (24-30 weeks)**: Spanish, French, Italian, Portuguese, Dutch, Swedish, Norwegian, Danish

**Category II (36 weeks)**: German, Indonesian, Malaysian, Swahili

**Category III (44 weeks)**: Russian, Polish, Czech, Slovak, Ukrainian, Croatian, Serbian, Bulgarian

**Category IV (88 weeks)**: Arabic, Chinese (Mandarin), Japanese, Korean

**Category V (88+ weeks)**: Finnish, Hungarian, Estonian, Latvian, Lithuanian

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fasi_elearning
REDIS_URL=redis://localhost:6379

# AI Services
AI_MODELS_BUCKET=fasi-elearning-ai-models
CONTENT_BUCKET=fasi-elearning-content

# Security
JWT_SECRET=your-secure-jwt-secret
ENCRYPTION_KEY=your-32-character-encryption-key
```

## 🚨 Security & Compliance

- **FISMA Compliant**: Federal Information Security Management Act
- **FedRAMP Ready**: Federal Risk and Authorization Management Program
- **SOC 2 Type II**: Service Organization Control 2
- **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: Multi-factor authentication and RBAC

## 📊 Performance

- **API Response Time**: < 200ms for standard operations
- **Speech Recognition**: < 3 seconds for 30-second audio clips
- **Translation**: < 1 second for paragraphs up to 500 words
- **System Availability**: 99.9% uptime SLA
- **Concurrent Users**: Supports 10,000+ simultaneous users

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 Commercial Support

For enterprise support, custom development, or deployment assistance:

**Quartermasters FZC**
- 📧 Email: support@quartermasters.me
- 🌐 Website: https://quartermasters.me

## 🔗 Links

- **Documentation**: [Wiki](https://github.com/Quartermasters-FZC/FASI-eLearning-Platform/wiki)
- **Issues**: [GitHub Issues](https://github.com/Quartermasters-FZC/FASI-eLearning-Platform/issues)
- **Releases**: [GitHub Releases](https://github.com/Quartermasters-FZC/FASI-eLearning-Platform/releases)

---

**Built with ❤️ by Quartermasters FZC for government and educational language training programs.**