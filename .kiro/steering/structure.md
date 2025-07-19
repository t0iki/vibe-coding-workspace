# Code Structure & Organization

## Directory Structure

### Root Level
```
/
├── .kiro/              # Kiro spec-driven development system
├── docs/               # Documentation
├── CLAUDE.md           # Claude Code instructions and project overview
├── README.md           # Project readme
└── BLOG.md            # Blog or additional documentation
```

### .kiro Directory
```
.kiro/
├── steering/           # Project steering documents
│   ├── product.md     # Product overview, features, use cases
│   ├── tech.md        # Architecture, tech stack, commands
│   ├── structure.md   # This file - code organization
│   └── *.md           # Custom steering documents
├── specs/             # Feature specifications
│   └── [feature-name]/
│       ├── spec.json      # Metadata and approval status
│       ├── requirements.md # User requirements
│       ├── design.md      # Technical design
│       └── tasks.md       # Implementation tasks
└── hooks/             # Claude Code automation (if implemented)
```

### Documentation Directory
```
docs/
├── claude-code/       # Claude Code specific docs
│   ├── hooks-guide.md
│   ├── hooks.md
│   └── slash-commands.md
└── kiro/             # Kiro methodology docs
    ├── llms.txt
    └── specs/        # Example specifications
```

## Naming Conventions

### Specifications
- **Feature Names**: Kebab-case (e.g., `pdf-diagram-explanation-app`)
- **Spec Files**: Fixed names within feature directories
  - `spec.json` - Metadata file
  - `requirements.md` - Requirements document
  - `design.md` - Technical design
  - `tasks.md` - Implementation tasks

### Steering Documents
- **Core Files**: Lowercase with `.md` extension
  - `product.md`, `tech.md`, `structure.md`
- **Custom Steering**: Descriptive names
  - `api-standards.md`, `testing-approach.md`, etc.

### Commands
- **Format**: Slash prefix with kebab-case
- **Pattern**: `/[action]-[target]`
- Examples: `/steering-init`, `/spec-requirements`

## File Patterns

### Markdown Files
- **Headers**: Use proper hierarchy (# for main, ## for sections)
- **Lists**: Use consistent formatting (- for bullets)
- **Code Blocks**: Triple backticks with language identifier

### JSON Files (spec.json)
```json
{
  "name": "feature-name",
  "created": "ISO-8601 timestamp",
  "phase": "initialized|requirements|design|tasks|implementation",
  "approved": {
    "requirements": false,
    "design": false,
    "tasks": false
  }
}
```

## Code Organization Principles

1. **Separation of Concerns**
   - Steering: Project-wide context
   - Specs: Feature-specific planning
   - Docs: Reference documentation

2. **Progressive Disclosure**
   - Start with high-level steering
   - Drill down to specific specs
   - Implementation follows approval

3. **Version Control**
   - All markdown files tracked in Git
   - Approval status in spec.json
   - Changes tracked through commits

4. **Automation Points**
   - Hooks monitor spec changes
   - Commands enforce workflow
   - Status tracking automated

## Best Practices

1. **File Creation**
   - Always use commands to create specs
   - Manual steering updates allowed
   - Keep files focused and concise

2. **Directory Management**
   - One directory per feature spec
   - Flat structure within directories
   - No nested feature specs

3. **Content Guidelines**
   - Clear, actionable language
   - Consistent formatting
   - Regular updates to steering

4. **Workflow Compliance**
   - Follow 3-phase approval process
   - Update spec.json for approvals
   - Keep status current