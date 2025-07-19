# Product Overview

## Product Name
Claude Code Spec-Driven Development System

## Product Description
A Kiro-style specification-driven development system for Claude Code that provides structured workflows, automated progress tracking, and phase-based approval processes for software development projects.

## Core Features
1. **Spec-Driven Development Workflow**
   - Three-phase approval process (Requirements → Design → Tasks)
   - Manual approval gates between phases
   - Structured document generation

2. **Steering System**
   - Project context management through markdown files
   - Core steering documents (product, tech, structure)
   - Custom steering for specialized contexts

3. **Slash Commands**
   - `/steering-init` - Initialize steering documents
   - `/steering-update` - Update steering after changes
   - `/steering-custom` - Create custom steering
   - `/spec-init` - Initialize spec structure
   - `/spec-requirements` - Generate requirements
   - `/spec-design` - Generate technical design
   - `/spec-tasks` - Generate implementation tasks
   - `/spec-status` - Check progress and phases

4. **Automation & Hooks**
   - Automatic task progress tracking
   - Spec compliance checking
   - Context preservation during compaction
   - Steering drift detection

## Use Cases
- **New Feature Development**: Start with steering, create specs, implement with confidence
- **Project Documentation**: Maintain living documentation through steering files
- **Team Collaboration**: Clear approval workflow ensures alignment
- **Quality Assurance**: Phase-based approvals prevent premature implementation

## Value Proposition
- **Reduced Development Risk**: Structured approach catches issues early
- **Improved Communication**: Clear specifications and approval process
- **Better Documentation**: Living steering documents stay current
- **Faster Iteration**: Well-defined tasks and clear progress tracking
- **Context Preservation**: Automated hooks maintain project knowledge

## Target Users
- Software development teams using Claude Code
- Projects requiring structured development workflows
- Teams needing clear documentation and approval processes
- Developers seeking better spec-driven development tools