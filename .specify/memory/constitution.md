<!--
Sync Impact Report (temporary review material; remove before committing)
Version change: unratified scaffold -> 1.0.0 (initial adoption)
Modified principles: five unnamed scaffold slots replaced by:
  I. Specification-Guided Implementation
  II. Readable and Maintainable Code
  III. Tested Core Functionality
  IV. Minimal Dependencies
  V. End-to-End Traceability
Added sections: Technology and Scope; Development Workflow and Review;
  populated Governance.
Removed sections: none.
Deferred TODOs: none.
-->
# Browser Flappy Bird Constitution

## Core Principles

### I. Specification-Guided Implementation

Every feature and behavior change MUST begin with a written specification defining
requirements, observable behavior, and verifiable acceptance scenarios. Plans and tasks MUST
be derived from that specification. Changes to intended behavior MUST be specified before
implementation proceeds. Conflicts between specification and code MUST be resolved explicitly;
code alone MUST NOT redefine requirements. This keeps development grounded in agreed behavior.

### II. Readable and Maintainable Code

HTML, CSS, and JavaScript MUST use meaningful names, consistent formatting, and focused
functions or sections with clear responsibilities. Gameplay rules, rendering, input handling,
and storage MUST have identifiable boundaries. Gameplay constants MUST be named, and comments
MUST explain non-obvious intent or constraints. Changes MUST avoid duplicated rules and
abstractions without a current requirement. Code MUST remain understandable enough for a
reviewer to explain its behavior and safely identify where a requirement is implemented.

### III. Tested Core Functionality

Core gameplay MUST have repeatable automated tests for starting a game, flap input and
movement, obstacle generation and movement, collision and game-over behavior, scoring, and
restart/reset behavior. High-score persistence and unavailable-storage fallback MUST be tested
when specified. Tests MUST verify observable outcomes, including relevant boundary and failure
cases. Changes to core behavior MUST include corresponding tests; bug fixes MUST include a
regression test. Browser checks MUST verify rendering, supported inputs, and the complete
play-to-restart flow, with steps and results recorded when performed manually. Relevant core
tests MUST pass before affected work is considered complete.

### IV. Minimal Dependencies

The game MUST use HTML, CSS, JavaScript, and native browser APIs as its default stack.
Frameworks, libraries, build tools, and other dependencies MUST be added only for a specified
need that cannot reasonably be met with the existing stack. Each addition MUST document that
need, simpler alternatives considered, and maintenance cost in the implementation plan.
Test tooling MUST follow the same necessity rule. Dependencies made unused by a change MUST
be removed in that change. This keeps a small browser game easy to run and maintain.

### V. End-to-End Traceability

Each requirement MUST have a stable identifier in its feature specification. Plans and tasks
MUST reference the requirements they address. Completed tasks MUST identify the implementation
files or functions and the tests or recorded browser checks that verify them. Test names,
descriptions, or a feature-local mapping MUST reference requirement identifiers. Reviewers MUST
be able to trace each requirement through implementation to verification and each behavior
change back to its requirement. References MUST be updated in the same change when the
associated requirements, implementation, or tests move or change.

## Technology and Scope

The product is a browser-based Flappy Bird game using HTML for structure, CSS for presentation,
and JavaScript for gameplay and interaction. Native APIs such as Canvas and local storage are
part of the baseline stack where specified. Feature specifications MUST define supported
browsers and input methods before introducing behavior that depends on them.

Constitution adoption and amendments MUST remain documentation-only and MUST NOT modify the
existing game implementation or tests. Existing coverage and traceability gaps MUST be
captured in subsequent specifications and tasks; adoption does not assert that those gaps
have already been closed. Future implementation changes MUST follow these principles.

## Development Workflow and Review

1. Specify requirements, stable identifiers, acceptance scenarios, and scope using Spec Kit.
2. Create an implementation plan that checks constitutional compliance and records necessary
   dependency decisions; derive tasks with requirement references.
3. Implement scoped tasks and their verification, updating the specification first when
   intended behavior changes.
4. Record requirement-to-code-to-test references and relevant automated and browser-check
   results before marking tasks complete.
5. Review each change for specification alignment, readability, core test coverage, dependency
   necessity, and traceability. Unresolved violations MUST block completion.

## Governance

This constitution governs project specifications, plans, tasks, implementation, and reviews.
Conflicting project guidance MUST be brought into alignment before affected work proceeds.
Every implementation plan and change review MUST explicitly check the five principles.

Amendments MUST document proposed wording, rationale, impact on existing artifacts, and any
migration tasks. A project maintainer MUST approve amendments through the project's review
process before they take effect. Each adopted amendment MUST update the constitution version
and last-amended date while preserving the original ratification date.

Versioning MUST use MAJOR.MINOR.PATCH: MAJOR for incompatible principle removals or
redefinitions, MINOR for new principles or materially expanded guidance, and PATCH for
clarifications or corrections that do not change obligations. Exceptions MUST NOT be implicit:
a proposal conflicting with a principle requires an approved constitutional amendment before
implementation.

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
