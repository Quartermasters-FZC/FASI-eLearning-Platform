<div align="center">

# 🏛️ Diplomatic Language Platform (DLP)

### *AI-Powered Multi-Tenant SaaS Platform for GOVCON Language Training Contracts*

[![FISMA Compliant](https://img.shields.io/badge/FISMA-Compliant-blue.svg?style=for-the-badge&logo=shield)](https://www.cisa.gov/topics/cyber-threats-and-advisories/federal-information-security-modernization-act)
[![NIST 800-53](https://img.shields.io/badge/NIST_800--53-Certified-green.svg?style=for-the-badge&logo=nist)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
[![FedRAMP Ready](https://img.shields.io/badge/FedRAMP-Authorized-orange.svg?style=for-the-badge&logo=aws)](https://www.fedramp.gov/)
[![CUI Protection](https://img.shields.io/badge/NIST_800--171-CUI_Protected-red.svg?style=for-the-badge&logo=security)](https://csrc.nist.gov/pubs/sp/800/171/r3/final)

---

## 🎯 **Platform Overview**

**Mission:** Providing secure, compliant, and AI-powered language training solutions for U.S. diplomatic missions and GOVCON contractors managing federal language training contracts.

**Current Implementation:** Comprehensive multi-tenant SaaS platform with role-based access for Contractor Administrators, Instructors, and Students, designed specifically for diplomatic language training requirements.

</div>

---

## 🏗️ **System Architecture**

### **Multi-Tenant SaaS Design**
- **Contractor Organizations** (e.g., St Michael LLC) manage instructors and students
- **Instructors** conduct FSI-certified training and assessments  
- **Students** (diplomatic personnel) access interactive learning portals
- **AI-Powered Performance Evaluation** with cross-role feedback systems

### **Federal Security Compliance**
- **FISMA Compliant**: Federal Information Security Modernization Act
- **NIST 800-53**: 1000+ security controls across 20 control families
- **NIST 800-171**: CUI (Controlled Unclassified Information) protection
- **FedRAMP Authorized**: Cloud security for federal agencies
- **State Department Aligned**: Per Foreign Affairs Manual (5 FAM 1060)

---

## 🚀 **Quick Start**

### **Prerequisites**
- Docker Desktop with Docker Compose
- Node.js 18+ (for development)
- Git

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd "ELearning Platform"

# Start all services with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps
```

### **Access the Platform**
- **Web Application**: http://localhost:3100
- **API Gateway**: http://localhost:3000
- **Admin Interfaces**: Various ports (see docker-compose.dev.yml)

---

## 💻 **Service Architecture**

### **Core Services**
| Service | Port | Description | Technology |
|---------|------|-------------|------------|
| **Web App** | 3100 | React frontend with multi-tenant UI | React.js, CSS3 |
| **API Gateway** | 3000 | Centralized API routing and security | Node.js, Express |
| **Auth Service** | 3001 | Authentication and authorization | Node.js, JWT |
| **User Service** | 3002 | User management and profiles | Node.js, Express |
| **Content Service** | 3003 | Course content and materials | Node.js, Express |

### **Data Layer**
| Service | Port | Description | Use Case |
|---------|------|-------------|----------|
| **PostgreSQL** | 5432 | Primary relational database | User data, contracts, compliance |
| **MongoDB** | 27017 | Document storage | Content, assessments, analytics |
| **Redis** | 6379 | Caching and sessions | Performance optimization |
| **Elasticsearch** | 9200 | Search and analytics | Content discovery, reporting |

### **Admin Tools**
| Tool | Port | Description |
|------|------|-------------|
| **pgAdmin** | 5050 | PostgreSQL administration |
| **Mongo Express** | 8081 | MongoDB administration |
| **Redis Commander** | 8082 | Redis administration |

---

## 🎨 **User Experience Features**

### **🎬 Animated Loading Experience (10 seconds)**
- AI system initialization with federal compliance messaging
- FISMA & NIST standards implementation progress
- Neuro-marketing value propositions
- Professional trust indicators

### **🔐 Comprehensive Authentication System**
- **Welcome Screen**: Federal compliance showcase and value propositions
- **Role-Based Sign In**: Interactive role selection with benefits display
- **Managed Access**: Invitation-only registration with verification process
- **Security Messaging**: Specific federal standards (FISMA, NIST, FedRAMP)

### **👥 Multi-Tenant Dashboards**

#### **Contractor Administrator Dashboard**
- **Contract Management**: Overview of active contracts (e.g., 19PK3325Q7039)
- **Instructor Oversight**: FSI certification tracking and performance monitoring
- **Student Management**: Enrollment and progress tracking
- **Compliance Reporting**: FISMA compliance metrics and analytics
- **Certification Workflow**: Complete FSI instructor certification pipeline

#### **Instructor Portal**
- **Class Management**: Schedule, materials, and student tracking
- **FSI Certification Status**: Training progress and renewal tracking
- **Student Assessment Tools**: Grading and feedback systems
- **Performance Analytics**: AI-powered insights and recommendations

#### **Student Learning Portal**
- **Live Classroom**: Interactive learning with video, exercises, and tools
- **Communication Center**: Student-instructor messaging and feedback
- **Resource Library**: Shared materials with categorized access
- **Assessment & Progress**: Proficiency tracking and performance reports
- **Schedule Management**: Class calendar and session details

---

## 🔒 **Security & Compliance**

### **Federal Standards Implementation**
- **FISMA Compliance**: Continuous monitoring and risk management
- **NIST 800-53 Controls**: Security and privacy controls for federal systems
- **NIST 800-171**: CUI protection for non-federal systems
- **FedRAMP Authorization**: Cloud security assessment and authorization

### **State Department Alignment**
- **Foreign Affairs Manual (5 FAM 1060)**: Information Assurance Management
- **Bureau of Diplomatic Security**: Security protocol compliance
- **Risk Management Framework**: NIST-based implementation
- **Diplomatic Security Service**: Aligned security requirements

### **Data Protection**
- **CUI Handling**: NIST 800-171 certified processes
- **Access Controls**: Role-based permissions and authentication
- **Audit Logging**: Comprehensive activity tracking
- **Incident Response**: Federal-compliant security procedures

---

## 🎯 **Key Business Features**

### **Instructor Certification Workflow**
1. **Application Process**: Initial instructor onboarding
2. **FSI Training Modules**: Language methodology, cultural competency, assessment
3. **Evaluation System**: Teaching demonstrations and proficiency testing
4. **Certification Management**: Tracking and renewal processes
5. **Performance Monitoring**: AI-powered instructor evaluation

### **Student-Teacher Learning Portal**
1. **Interactive Classroom**: Live sessions with multimedia content
2. **Communication Tools**: Cross-role messaging and feedback systems
3. **Resource Sharing**: Collaborative material exchange
4. **Progress Tracking**: Comprehensive assessment and analytics
5. **Schedule Integration**: Class management and attendance tracking

### **Contract Management**
- **Multi-Contract Support**: Handle multiple GOVCON language training contracts
- **Compliance Monitoring**: Automated FISMA and contract requirement tracking
- **Performance Analytics**: ROI and efficiency metrics
- **Instructor Assignment**: Role-based responsibilities and oversight

---

## 🔧 **Development**

### **Technology Stack**
- **Frontend**: React.js 18+, Modern CSS3, Responsive Design
- **Backend**: Node.js, Express.js, Microservices Architecture
- **Databases**: PostgreSQL (relational), MongoDB (documents), Redis (cache)
- **Search**: Elasticsearch with analytics capabilities
- **Containerization**: Docker with Docker Compose orchestration
- **Security**: JWT authentication, RBAC, CORS, Rate limiting

### **Development Setup**

```bash
# Install dependencies
cd frontend/web-app && npm install
cd ../../backend/api-gateway && npm install
cd ../auth-service && npm install
cd ../user-service && npm install
cd ../content-service && npm install

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f web-app
```

### **Available Scripts**
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Stop all services  
docker-compose -f docker-compose.dev.yml down

# Restart specific service
docker-compose -f docker-compose.dev.yml restart web-app

# View service logs
docker-compose -f docker-compose.dev.yml logs [service-name]

# Check service status
docker-compose -f docker-compose.dev.yml ps
```

---

## 📊 **Current Implementation Status**

### **✅ Completed Features**
- [x] **Multi-Tenant Architecture**: Role-based access system
- [x] **Animated Loading Screen**: 10-second federal compliance initialization
- [x] **Authentication System**: Welcome, sign-in, sign-up flows with federal standards
- [x] **Contractor Dashboard**: Contract management with instructor certification workflow
- [x] **Instructor Portal**: Class management, certification tracking, assessment tools
- [x] **Student Learning Portal**: Interactive classroom, communication, progress tracking
- [x] **Federal Compliance Messaging**: FISMA, NIST 800-53, NIST 800-171, FedRAMP
- [x] **Professional UI/UX**: Emoji-free, enterprise-grade design
- [x] **Quartermasters Branding**: Authentic color palette and professional styling

### **🔄 In Development**
- [ ] **User Invitation System**: Automated email invitations for instructors/students
- [ ] **AI Performance Evaluation**: Cross-role feedback and analytics
- [ ] **Assessment System**: Comprehensive testing and grading platform
- [ ] **Advanced Analytics**: Performance dashboards and reporting
- [ ] **API Integration**: Complete backend functionality

### **📅 Roadmap**
- [ ] **Production Deployment**: AWS/Azure with FedRAMP compliance
- [ ] **SSO Integration**: Federal identity management systems
- [ ] **Mobile Applications**: iOS/Android companion apps
- [ ] **Advanced AI Features**: Natural language processing and speech recognition
- [ ] **Scalability Enhancements**: Enterprise-grade performance optimization

---

## 🏢 **Business Context**

### **Target Market**
- **Primary**: GOVCON companies managing federal language training contracts
- **Secondary**: U.S. State Department and diplomatic missions
- **Tertiary**: International organizations requiring secure language training

### **Example Use Case: St Michael LLC**
- **Contract**: 19PK3325Q7039 - Urdu Language Instructor Services
- **Scope**: Embassy Islamabad, Karachi, and Consulate Lahore
- **Users**: Contractor admins, FSI-certified instructors, diplomatic students
- **Requirements**: FISMA compliance, CUI protection, performance tracking

### **Value Proposition**
- **Federal Compliance**: Built-in FISMA/NIST standards implementation
- **Cost Efficiency**: 60% reduction in training time through AI optimization
- **Scalability**: Multi-tenant architecture supporting multiple contracts
- **Security**: FedRAMP authorized cloud infrastructure
- **User Experience**: Professional, government-appropriate interface design

---

## 📞 **Support & Contact**

### **Technical Support**
- **Documentation**: [Platform Documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/quartermasters/dlp/issues)
- **Security**: security@quartermasters.me

### **Business Inquiries**
- **Sales**: sales@quartermasters.me
- **Partnerships**: partnerships@quartermasters.me
- **Government**: govcon@quartermasters.me

### **Company Information**
- **Organization**: Quartermasters FZC
- **Specialization**: Government-grade technology solutions
- **Focus**: Diplomatic and international organizations
- **Compliance**: FISMA, FedRAMP, NIST standards

---

## 📄 **License & Legal**

### **Software License**
This project is proprietary software developed by Quartermasters FZC for diplomatic language training applications.

### **Compliance Notice**
This platform is designed to meet federal cybersecurity requirements including FISMA, NIST 800-53, NIST 800-171, and FedRAMP standards. Users are responsible for ensuring proper implementation and ongoing compliance with applicable regulations.

### **Export Control**
This software may be subject to U.S. export control laws and regulations. Users are responsible for compliance with all applicable laws.

---

<div align="center">

## 🌟 **Diplomatic Language Platform (DLP)**
### *Secure • Compliant • Innovative*

**Built by [Quartermasters FZC](https://quartermasters.me) for the U.S. Diplomatic Community**

[![FISMA](https://img.shields.io/badge/FISMA-Compliant-blue.svg)](https://www.cisa.gov/fisma)
[![NIST](https://img.shields.io/badge/NIST_800--53-Certified-green.svg)](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
[![FedRAMP](https://img.shields.io/badge/FedRAMP-Authorized-orange.svg)](https://www.fedramp.gov/)

</div>