# Contributing to AI-Powered eLearning Platform

Thank you for your interest in contributing to the AI-Powered eLearning Platform! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read and follow our Code of Conduct:

### Our Pledge
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior
- Harassment, discrimination, or offensive language
- Trolling, insulting, or derogatory comments
- Public or private harassment
- Publishing others' private information without permission

## 🚀 Getting Started

### Prerequisites
Before contributing, ensure you have:
- **Git** installed and configured
- **Docker** and Docker Compose
- **Node.js** 18+ and npm
- **Python** 3.11+ and pip
- **AWS CLI** configured (for infrastructure work)

### Development Environment Setup

1. **Fork and Clone**
```bash
git clone https://github.com/YOUR_USERNAME/ai-elearning-platform.git
cd ai-elearning-platform
```

2. **Set Up Development Environment**
```bash
# Copy environment template
cp .env.example .env

# Start development services
docker-compose up -d

# Install dependencies
cd frontend/web-app && npm install
cd ../../ai-services/speech-recognition && pip install -r requirements.txt -r requirements-dev.txt
```

3. **Verify Setup**
```bash
# Run tests to ensure everything works
npm run test:unit
pytest ai-services/speech-recognition/tests/
```

## 📝 How to Contribute

### 1. Issue Reporting

Before creating a new issue, please:
- Search existing issues to avoid duplicates
- Use our issue templates when available
- Provide clear, detailed descriptions
- Include steps to reproduce for bugs
- Add relevant labels and assignees

**Bug Report Template:**
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Ubuntu 20.04]
- Browser: [e.g., Chrome 96]
- Version: [e.g., v1.2.3]

## Additional Context
Screenshots, logs, or other relevant information
```

### 2. Feature Requests

For new features:
- Check the roadmap to see if it's already planned
- Describe the use case and business value
- Consider backward compatibility
- Propose implementation approach if possible

### 3. Pull Requests

#### Process Overview
1. **Create an Issue** (if one doesn't exist)
2. **Fork the Repository**
3. **Create a Feature Branch**
4. **Make Your Changes**
5. **Add Tests**
6. **Update Documentation**
7. **Submit Pull Request**

#### Branch Naming Convention
```
feature/issue-number-short-description
bugfix/issue-number-short-description
hotfix/issue-number-short-description
docs/issue-number-short-description
```

Examples:
- `feature/123-add-speech-recognition`
- `bugfix/456-fix-translation-timeout`
- `docs/789-update-api-documentation`

#### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(speech): add pronunciation scoring for Urdu language
fix(api): resolve timeout issues in translation service
docs(readme): update installation instructions
test(nlp): add unit tests for grammar checking
```

#### Pull Request Template

```markdown
## Description
Brief description of changes

## Related Issue
Closes #issue_number

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Before/after screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added and passing
- [ ] No breaking changes (or properly documented)
```

## 🧪 Testing Guidelines

### Test Categories

1. **Unit Tests**
   - Test individual functions/components
   - Fast execution (< 1s per test)
   - No external dependencies
   - 95%+ coverage requirement

2. **Integration Tests**
   - Test service interactions
   - Database and API integration
   - Moderate execution time (< 30s)

3. **End-to-End Tests**
   - Test complete user workflows
   - Real browser automation
   - Slower execution (< 5min)

### Running Tests

```bash
# Unit tests
npm run test:unit              # All unit tests
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage

# Integration tests
npm run test:integration       # All integration tests

# E2E tests
npm run test:e2e              # Full E2E suite
npm run test:e2e:headed       # With browser UI

# AI services tests
cd ai-services/speech-recognition
pytest tests/unit/ -v --cov=src
pytest tests/integration/ -v
```

### Test Requirements

- **Coverage**: Maintain 95%+ test coverage
- **Performance**: Unit tests must complete in < 1s
- **Isolation**: Tests should not depend on external services
- **Documentation**: Complex test scenarios need comments

## 📚 Documentation Standards

### Code Documentation

1. **Python** - Use Google-style docstrings:
```python
def translate_text(text: str, source_lang: str, target_lang: str) -> TranslationResult:
    """Translate text between languages.
    
    Args:
        text: The text to translate
        source_lang: Source language code (e.g., 'en')
        target_lang: Target language code (e.g., 'ur')
        
    Returns:
        TranslationResult containing translated text and metadata
        
    Raises:
        TranslationError: If translation fails
    """
```

2. **TypeScript/JavaScript** - Use JSDoc:
```typescript
/**
 * Analyze speech audio for pronunciation scoring
 * @param audioBuffer - The audio data to analyze
 * @param language - Target language for analysis
 * @param referenceText - Expected text content
 * @returns Promise resolving to pronunciation analysis
 */
async function analyzePronunciation(
  audioBuffer: ArrayBuffer,
  language: string,
  referenceText: string
): Promise<PronunciationAnalysis>
```

### API Documentation

- Use OpenAPI 3.0 specifications
- Include request/response examples
- Document error codes and messages
- Provide usage examples

### User Documentation

- Keep README.md up to date
- Add inline code comments for complex logic
- Create tutorials for new features
- Update troubleshooting guides

## 🎨 Code Style Guidelines

### Python Style

We use:
- **Black** for code formatting
- **isort** for import sorting
- **flake8** for linting
- **mypy** for type checking

```bash
# Format code
black .
isort .

# Lint code
flake8 .
mypy .
```

Configuration in `pyproject.toml`:
```toml
[tool.black]
line-length = 100
target-version = ['py311']

[tool.isort]
profile = "black"
line_length = 100

[tool.mypy]
python_version = "3.11"
strict = true
```

### JavaScript/TypeScript Style

We use:
- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** for type safety

```bash
# Lint and format
npm run lint
npm run format

# Type check
npm run type-check
```

### General Guidelines

1. **Naming Conventions**
   - Use descriptive, meaningful names
   - PascalCase for classes and types
   - camelCase for functions and variables
   - UPPER_SNAKE_CASE for constants
   - kebab-case for file names

2. **File Organization**
   - Group related functionality
   - Keep files focused and small (< 300 lines)
   - Use index files for clean imports

3. **Error Handling**
   - Use typed exceptions in Python
   - Proper error boundaries in React
   - Meaningful error messages
   - Log errors with context

## 🏗️ Architecture Guidelines

### Component Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Dependency Injection**: Use DI for testability
3. **Interface Segregation**: Define minimal, focused interfaces
4. **Open/Closed**: Open for extension, closed for modification

### AI Service Guidelines

1. **Model Management**
   - Use model versioning
   - Implement graceful fallbacks
   - Cache models appropriately
   - Monitor model performance

2. **API Design**
   - RESTful endpoints where possible
   - Consistent response formats
   - Proper HTTP status codes
   - Rate limiting and throttling

3. **Performance**
   - Async processing for heavy operations
   - Batch processing where beneficial
   - Proper resource cleanup
   - Memory management for large models

## 🔒 Security Guidelines

### Code Security

1. **Input Validation**
   - Validate all user inputs
   - Sanitize data before processing
   - Use parameterized queries
   - Implement rate limiting

2. **Authentication & Authorization**
   - Use secure session management
   - Implement proper RBAC
   - Follow OAuth 2.0 best practices
   - Regular security audits

3. **Data Protection**
   - Encrypt sensitive data
   - Use HTTPS everywhere
   - Follow GDPR/CCPA requirements
   - Implement audit logging

### Infrastructure Security

1. **Network Security**
   - Use VPCs and security groups
   - Implement least privilege access
   - Regular security scanning
   - Network segmentation

2. **Secrets Management**
   - Use AWS Secrets Manager
   - No secrets in code
   - Regular secret rotation
   - Audit secret access

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. **Pre-Release**
   - [ ] All tests passing
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated
   - [ ] Security scan completed
   - [ ] Performance testing done

2. **Release**
   - [ ] Create release branch
   - [ ] Update version numbers
   - [ ] Create GitHub release
   - [ ] Deploy to staging
   - [ ] Deploy to production

3. **Post-Release**
   - [ ] Monitor deployment
   - [ ] Update documentation
   - [ ] Notify stakeholders
   - [ ] Plan next iteration

## 🤔 Need Help?

### Getting Support

1. **Documentation**: Check README.md and docs/
2. **Search Issues**: Look for existing solutions
3. **Ask Questions**: Create a GitHub issue with the "question" label
4. **Join Discussions**: Participate in GitHub Discussions

### Contact Information

- **Technical Questions**: Create an issue with the "question" label
- **Security Issues**: Email security@quartermasters.me
- **General Inquiries**: Email opensource@quartermasters.me

### Community Resources

- **GitHub Discussions**: For general questions and ideas
- **Issue Tracker**: For bugs and feature requests
- **Wiki**: For additional documentation and guides

## 🎯 Recognition

We value all contributions and maintain a contributors list. Contributors may be recognized through:

- **GitHub Contributors Graph**
- **CONTRIBUTORS.md** file (coming soon)
- **Annual Contributor Recognition**
- **Speaking Opportunities** at conferences

## 📜 Legal Considerations

### Contributor License Agreement (CLA)

By contributing to this project, you agree that:

1. You have the right to submit your contributions
2. Your contributions are licensed under the MIT License
3. You grant Quartermasters FZC rights to use your contributions
4. You will not submit copyrighted material without permission

### Export Control

This project may be subject to export control laws. Contributors should:
- Ensure compliance with applicable export regulations
- Not contribute technology restricted by export controls
- Understand their responsibilities under export laws

---

Thank you for contributing to the AI-Powered eLearning Platform! Your contributions help make language learning more accessible and effective for learners worldwide.

**Happy Coding! 🚀**