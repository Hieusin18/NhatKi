# Agent Instructions & Skills: GitHub Spec-Kit (Specification-Driven Development)

This agent operates under **GitHub Spec-Kit's Specification-Driven Development (SDD)** methodology. Every software task, feature addition, or architectural change follows the Spec-Kit framework and skills detailed below.

---

## 🛠️ GitHub Spec-Kit Core Skills & Methodology

### 1. Specification Phase (`specify`)
- **Spec-First Rule**: Define clear specifications before implementing non-trivial features.
- **Specification Structure**:
  - **User Stories**: Format: *"As a [role], I want [capability] so that [benefit]"*.
  - **Functional Requirements**: Unambiguous, ID-tracked statements (`REQ-01`, `REQ-02`) with priority tags (`high`, `medium`, `low`).
  - **Domain Constraints**: Explicit operational boundaries (e.g. 2.0s duration lock, max 12 members per room).
  - **Edge Case Mapping**: Proactively detail handling for network drops, camera permission refusals, and invalid user inputs.

### 2. Architectural Planning (`plan`)
- **Tech Stack Alignment**: Map requirements to clean architecture (React 19, TypeScript, Tailwind CSS, Express).
- **Contract & Type Safety**: Define strict TypeScript interfaces (`/src/types.ts`) before writing business logic.
- **Data Flow Separation**: Separate client UI, state persistence (LocalStorage/API), and server proxy endpoints.

### 3. Execution & Task Decomposition (`tasks`)
- Break feature requirements down into modular, testable increments.
- Define measurable Acceptance Criteria (`AC-01`, `AC-02`) with boolean pass/fail conditions.

### 4. Continuous Verification & Compliance (`verify`)
- **Read-Modify-Write**: Inspect existing context before applying code changes.
- **Build Verification**: Continuously run `lint_applet` and `compile_applet` to verify zero type or build errors.
- **Scope Discipline**: Respect existing application functionality, avoiding unsolicited clutter or regressions.

---

## 📱 Project Guidelines: SetLog (2-Second Daily Vlog App)

- **2-Second Video Lock**: All clip recording logic enforces an exact 2.0-second limit with Web Audio API sound feedback.
- **Group Log Rooms**: Maximum 12 members per room, secured with custom PIN codes.
- **UX & Aesthetic**: Mobile-first smartphone notch canvas, dark theme (`#0c0c0e`), neon accents (`#ff2a7a`, `#c8ff00`), and smooth Motion transitions.
