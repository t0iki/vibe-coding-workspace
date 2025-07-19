# Technology Stack

## Architecture Overview
A Claude Code extension system that uses hooks and slash commands to implement Kiro-style spec-driven development workflows.

## Core Technologies
- **Platform**: Claude Code CLI (darwin)
- **Language**: Markdown-based specifications and documentation
- **Automation**: Claude Code hooks system
- **Version Control**: Git

## Development Environment

### System Requirements
- Claude Code CLI
- Git repository
- macOS (darwin platform)

### Project Dependencies
- Claude Code hooks system
- Slash command support
- File system access for steering/spec management

## Key Commands

### Steering Commands
```bash
/steering-init          # Generate initial steering documents
/steering-update        # Update steering after changes  
/steering-custom        # Create custom steering for specialized contexts
```

### Specification Commands
```bash
/spec-init [feature-name]           # Initialize spec structure only
/spec-requirements [feature-name]   # Generate requirements
/spec-design [feature-name]         # Generate technical design
/spec-tasks [feature-name]          # Generate implementation tasks
/spec-status [feature-name]         # Check current progress and phases
```

## File Structure
```
.kiro/
├── steering/           # Project steering documents
│   ├── product.md     # Product overview
│   ├── tech.md        # Technology stack
│   └── structure.md   # Code organization
├── specs/             # Feature specifications
│   └── [feature]/
│       ├── spec.json      # Spec metadata and approval status
│       ├── requirements.md # Feature requirements
│       ├── design.md      # Technical design
│       └── tasks.md       # Implementation tasks
└── hooks/             # Claude Code automation hooks

docs/
├── claude-code/       # Claude Code documentation
└── kiro/             # Kiro methodology docs
```

## Integration Points
- **Claude Code CLI**: Primary interface for all commands
- **Git**: Version control for specs and steering
- **File System**: Markdown file management
- **Hooks System**: Automated tracking and compliance

## Development Workflow
1. Initialize project steering
2. Create feature specifications
3. Follow 3-phase approval process
4. Implement with task tracking
5. Update steering as needed

## Security & Access
- Local file system based
- No external dependencies
- Git-based version control
- Manual approval gates for phase transitions