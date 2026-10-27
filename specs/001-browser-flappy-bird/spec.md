# Feature Specification: Browser Flappy Bird

**Feature Branch**: `sdd-development` (existing branch; no branch hook configured)

**Created**: 2026-10-27

**Status**: Clarified — ready for planning with documented assumptions

**Input**: Browser-based Flappy Bird with spacebar control, gravity, moving obstacles, collision-based game over, scoring, restart, a title and icon, and responsive, consistent gameplay. Preserve the supplied FR-01–FR-06 and NFR-01–NFR-03 identifiers.

## Clarifications

### Session 2026-10-27

- Q: When the player presses restart, should the game wait for spacebar or immediately begin a new round? → A: Reset to a stationary ready state and wait for spacebar to start.
- Q: What should happen when the player returns after switching tabs or moving focus away from the game? → A: Pause while away; remain paused on return until spacebar resumes the round with one flap.
- Q: How should the 60-frames-per-second goal affect acceptance of the game? → A: Treat 60 FPS as a target; record results and investigate noticeable stuttering. The 100-millisecond restart limit remains mandatory.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start and play a round (Priority: P1)

As a player, I want to start with spacebar and flap through moving obstacles so that I can enjoy a responsive skill-based game.

**Why this priority**: Control and hazard avoidance form the core playable experience.

**Independent Test**: Load a game, start, flap, stop flapping, and encounter obstacles and the ground. Observe movement and game over.

**Acceptance Scenarios**:

1. **Given** a fresh page, **When** the game is ready, **Then** the title and icon appear above the play area, the score is zero, the bird is stationary at its starting position, a start instruction is visible, and restart appears below the play area (FR-07, FR-08).
2. **Given** ready state, **When** spacebar is pressed, **Then** gameplay starts and that same press produces one upward flap (FR-01, FR-07).
3. **Given** active gameplay, **When** spacebar is pressed once, **Then** the bird flaps once; without further input, gravity slows its rise and causes it to fall (FR-01, FR-02).
4. **Given** active gameplay, **When** time advances, **Then** successive obstacle pairs enter from the right and move left, with openings within the play area (FR-03).
5. **Given** active gameplay, **When** the bird touches an obstacle or the ground, **Then** game over appears, motion and scoring stop, and the final score remains visible (FR-05, FR-09).
6. **Given** an active round, **When** the page loses focus or is hidden and then returns, **Then** the round remains paused with a resume instruction; a fresh spacebar press resumes the preserved round with exactly one flap and no movement for time away (FR-11).

---

### User Story 2 - Track progress fairly (Priority: P2)

As a player, I want a point for each obstacle I clear so that I can understand my progress.

**Why this priority**: Accurate feedback makes successful play meaningful.

**Independent Test**: Use known obstacle positions and clear two pairs, comparing the score before and after each pass.

**Acceptance Scenarios**:

1. **Given** score zero, **When** the bird's leftmost edge moves strictly beyond a pair's rightmost edge without collision, **Then** the displayed score becomes one (FR-06).
2. **Given** an already scored pair, **When** it continues moving left, **Then** it adds no further points; clearing another pair increases the score to two (FR-06).
3. **Given** a collision and a possible pass during the same gameplay update, **When** the outcome is evaluated, **Then** game over takes priority and no point is awarded during that update (FR-05, FR-06).

---

### User Story 3 - Restart and play again (Priority: P2)

As a player, I want to restart after losing so that I can quickly attempt another round.

**Why this priority**: Restart makes the game replayable without reloading.

**Independent Test**: Begin with a game-over state and nonzero score, activate restart, then start using spacebar.

**Acceptance Scenarios**:

1. **Given** game over with a nonzero score, **When** restart is activated, **Then** within 100 milliseconds the ready state is visibly restored: score zero, stationary bird at its starting position, no obstacles, no game-over message, and the start instruction visible (FR-04, NFR-02).
2. **Given** the restored ready state, **When** spacebar is pressed, **Then** exactly one round starts with one flap and the same rules as before (FR-01, FR-07, NFR-03).
3. **Given** ready or active gameplay, **When** restart is activated repeatedly, **Then** one clean ready state remains (FR-04).

---

### User Story 4 - Verify predictable behavior (Priority: P3)

As a developer, I want defined, verifiable rules so that I can maintain the game without breaking player behavior.

**Why this priority**: Maintainability supports reliable delivery of the player journeys.

**Independent Test**: Review requirement references and repeat controlled gameplay checks across rounds.

**Acceptance Scenarios**:

1. **Given** identical starting conditions, obstacle sequences, and timed inputs, **When** rounds are repeated, **Then** movement, collision outcomes, and scores match at corresponding elapsed times (NFR-03).
2. **Given** completed implementation work, **When** reviewed, **Then** each requirement has implementation and verification references, and automated core tests and recorded browser checks cover the specified journeys (NFR-04, NFR-05).

### Edge Cases

- Holding spacebar gives one flap per physical press; keyboard repeat produces no extra flaps (FR-01).
- Gameplay spacebar does not scroll the page or activate a focused restart button; Tab and Enter still allow restart (FR-08).
- Spacebar during game over leaves the state unchanged until restart (FR-07).
- Touching any obstacle boundary, including an opening edge, counts as collision. Ground contact also ends the round, exactly once (FR-05).
- Touching the top constrains the bird inside the play area without ending the round; gravity permits subsequent descent (FR-10).
- Equality at the passing boundary does not score. One upper/lower pair yields only one point (FR-06).
- A delayed visible frame must not let the bird pass through a hazard undetected or score a pair twice (FR-05, FR-06, NFR-03).
- Hiding the page or losing focus suspends gameplay and clears held-key input. Returning leaves the round paused with a visible resume instruction; a fresh spacebar press resumes from the preserved state with one flap, without simulating time away (FR-11).
- Rapid restart clears pending input and all previous-round progress (FR-04).
- Openings do not intersect the ground or exceed the upper boundary; retired obstacles no longer affect gameplay (FR-03).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-01**: Each distinct spacebar press during gameplay MUST give the bird one upward flap. Holding the key MUST NOT repeat flaps. The starting press MUST also flap.
- **FR-02**: Gravity MUST continuously accelerate the bird downward during active gameplay, including between flaps. It MUST NOT move the bird in ready, suspended, or game-over states.
- **FR-03**: Active gameplay MUST generate successive upper/lower obstacle pairs with traversable openings, move them right to left, and retire them after they leave the play area. Generation MUST continue until game over, with unchanged movement and spacing rules throughout a round.
- **FR-04**: Restart MUST return any game state to the initial ready state, clearing score, obstacles, motion, elapsed round progress, and pending input without a page reload. The bird MUST remain stationary until a new spacebar press starts the round.
- **FR-05**: Contact or overlap with an obstacle or the ground MUST end the round and stop motion, generation, and scoring. Collision MUST take priority over scoring in the same gameplay update.
- **FR-06**: Score MUST start at zero and increase by exactly one per obstacle pair when the entire bird clears the entire pair horizontally during active play. Each pair MUST score at most once. The displayed score MUST update by the next rendered gameplay frame.
- **FR-07**: Ready, playing, paused, and game-over states MUST be distinguishable. Spacebar MUST start a new round only from ready and resume an existing paused round only as specified by FR-11; game over MUST retain the final score and require restart before another round.
- **FR-08**: The interface MUST show a title and icon above the play area, the bird and obstacles within it, a current score, a start instruction when ready, and a labeled restart button below. Restart MUST support pointer and Tab/Enter activation. Gameplay spacebar MUST prevent scrolling and accidental restart activation.
- **FR-09**: Game over MUST visibly communicate that the round ended and that restart is available.
- **FR-10**: Flapping against the top boundary MUST keep the bird within the play area without ending the round; gravity MUST allow descent afterward.
- **FR-11**: An active round MUST pause when hidden or unfocused, preserving bird position, motion, obstacles, score, and elapsed active time while clearing held-key input. When visible and focused again, it MUST remain paused and display a spacebar-to-resume instruction. Only a fresh spacebar press while visible and focused MUST resume the preserved round with exactly one flap, without simulating elapsed time away. Restart while paused MUST return to ready as specified by FR-04.

### Non-Functional Requirements

- **NFR-01 — Smoothness**: The game SHOULD aim to maintain 60 frames per second during normal visible, focused gameplay on a desktop display running at 60 Hz or higher. Measure and report the average rendered frames per second over a 60-second collision-free test round in each supported browser, without unrelated heavy workloads. Record device, operating system, display refresh rate, exact browser versions, and any noticeable stuttering. Investigate and document causes and follow-up actions for observed stuttering. The 60 FPS goal is a target, not a mandatory numerical pass threshold; the NFR-02 restart limit remains mandatory.
- **NFR-02 — Restart latency**: The complete initial ready state MUST be visibly displayed within 100 milliseconds after restart activation, measured from receipt of activation to the first displayed frame containing the full reset state, on the NFR-01 baseline.
- **NFR-03 — Consistency**: Identical starting conditions, obstacle sequences, and timed inputs MUST produce the same movement, collision, and scoring outcomes across rounds. Rendering cadence MUST NOT change gameplay rules. Verification MUST cover 100 consecutive start/play/end/restart cycles with zero unexpected errors, stale state, or duplicate scoring.
- **NFR-04 — Maintainability**: Review MUST confirm meaningful names, consistent formatting, focused responsibilities, named gameplay constants, and no duplicated gameplay rules, following constitution principles II and IV.
- **NFR-05 — Verification and traceability**: Each requirement MUST have references through planned tasks, implementation, and verification. Core gameplay MUST have repeatable automated tests covering start, flap/movement, obstacles, collisions/game over, scoring, restart, and relevant boundaries. Recorded browser checks MUST verify rendering, inputs, and the full play-to-restart journey. Relevant tests MUST pass before implementation is complete.
- **NFR-06 — Browser support**: Functional requirements MUST work in desktop Chrome, Firefox, Edge, and Safari stable versions installed at implementation validation; record exact versions. Keyboard spacebar is the required gameplay input. Mobile/touch gameplay is outside scope.

### Key Entities *(include if feature involves data)*

- **Round**: Lifecycle state, elapsed active time, current score, bird, and obstacles. Restart discards previous progress.
- **Bird**: Player character with position, vertical motion, and a collision boundary.
- **Obstacle pair**: Upper/lower hazards with one opening, horizontal position, and a shared scored/unscored status.
- **Score**: Nonnegative integer counting cleared pairs in this round; retained on game over and cleared on restart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-01**: Every supported-browser acceptance run completes ready → playing → game over → restart → ready → playing using the specified controls and displaying the required interface (FR-01–FR-11, NFR-06).
- **SC-02**: Controlled rounds clearing exactly 0, 1, and 10 pairs display respectively 0, 1, and 10 points. Boundary and simultaneous-collision cases award no extra points (FR-05, FR-06).
- **SC-03**: Every supported-browser baseline has a recorded 60-second performance result compared with the 60 FPS target, with observations and an investigation of any noticeable stuttering. Acceptance requires these records rather than a numerical frame-rate threshold (NFR-01).
- **SC-04**: All 100 restart activations in the repeated-cycle check display the complete ready state within 100 milliseconds (NFR-02, NFR-03).
- **SC-05**: Across 100 repeated cycles, controlled inputs and obstacle sequences produce matching outcomes with no unexpected errors, duplicate points, or stale-round effects (NFR-03).
- **SC-06**: Every requirement has verification references, all core automated checks pass, and required review and browser-check results are recorded before implementation acceptance (NFR-04–NFR-06).

## Assumptions

- **A-01 — Scope**: Single-player, current-round scoring only. Accounts, multiplayer, audio, saved high scores, leaderboards, and mobile controls are excluded. No external service or stored player data is required.
- **A-02 — Confirmed restart behavior**: Restart returns to a stationary ready state and waits for spacebar, as confirmed in the clarification session. It remains usable from every state; the next spacebar press starts and flaps.
- **A-03 — Obstacles/difficulty ambiguity**: One obstacle means one upper/lower pair and one point. Openings may vary within safe bounds; difficulty does not increase. Exact gravity, flap strength, speed, spacing, opening size, collision geometry, and starting position must be documented in planning and checked for playable traversal before implementation.
- **A-04 — Boundary default and confirmed focus behavior**: The top is nonfatal; obstacle/ground contact is fatal. Hidden or unfocused play pauses; returning requires a fresh spacebar press to resume with one flap, as confirmed in the clarification session. The top-boundary behavior remains a provisional default.
- **A-05 — Confirmed performance interpretation**: 60 FPS is a measured target rather than a mandatory pass threshold; results and any stuttering investigation must be recorded. The 100-millisecond restart limit remains mandatory. Planning MUST record a representative desktop baseline before performance validation; minimum hardware is not a product guarantee.
- **A-06 — Supplied delivery constraints**: The user and constitution require HTML, CSS, JavaScript, and native browser capabilities. Additional dependencies require documented justification in planning. This preserves an explicit project constraint without choosing an implementation design.
- **A-07 — Environment dependencies**: Players need a supported desktop browser, keyboard, and display capable of showing the complete game interface. No external integration is needed.
- **A-08 — Clarification status**: Restart, focus/resume behavior, and performance acceptance were confirmed in the clarification session. Remaining defaults include pair-based scoring, desktop browser scope, and a nonfatal top boundary. Gameplay tuning, collision geometry, and the representative test environment are deferred to planning. No blocking clarification remains; any changed behavior must update this specification first.
