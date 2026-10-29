# Feature Specification: Browser Flappy Bird

**Feature Branch**: `sdd-development` (existing branch; no branch hook configured)

**Created**: 2026-10-27

**Status**: Clarified — 2026-10-29 scope decisions recorded; design synchronized

**Input**: Browser-based Flappy Bird with spacebar control, gravity, moving obstacles, collision-based game over, scoring, restart, a title and icon, and responsive, consistent gameplay. Preserve the supplied FR-01–FR-06 and NFR-01–NFR-03 identifiers.

## Clarifications

### Session 2026-10-27

- Q: When the player presses restart, should the game wait for spacebar or immediately begin a new round? → A: Reset to a stationary ready state and wait for spacebar to start.
- Q: What should happen when the player returns after switching tabs or moving focus away from the game? → A: Pause while away; remain paused on return until spacebar resumes the round with one flap.
- Q: How should the 60-frames-per-second goal affect acceptance of the game? → A: Treat 60 FPS as a target; record results and investigate noticeable stuttering. The 100-millisecond restart limit remains mandatory.

### Session 2026-10-29 (supersedes conflicting earlier answers)

- Current-round scores only; no saved best score or storage.
- Support Space, ArrowUp, mouse click and touch tap on the game. Start through gameplay input or a button below the game; the initiating action produces one flap.
- After game over, both the below-game “Restart game” button and on-screen “Tap to try again” action immediately start a fresh round. Reset-to-ready followed by a separate starting press is superseded.
- After focus/visibility pause, resume the preserved round rather than starting fresh; returning alone never resumes. Fresh gameplay input or the below-game resume button resumes with one flap.
- Ceiling contact is fatal, just like obstacle and ground contact.
- Desktop Chrome, Firefox, Edge and Safari remain the supported platforms. Touch input includes desktop touchscreens; mobile platforms remain outside scope.
- Independently drawn vintage arcade presentation, strong colors and animations are required; Vibe artwork reuse is not required or authorized.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start and play a round (Priority: P1)

As a player, I want to start with keyboard, mouse, touch or the start button and flap through moving obstacles so that I can enjoy a responsive skill-based game.

**Why this priority**: Control and hazard avoidance form the core playable experience.

**Independent Test**: Load a game, start, flap, stop flapping, and encounter obstacles and the ground. Observe movement and game over.

**Acceptance Scenarios**:

1. **Given** a fresh page, **When** the game is ready, **Then** the title and icon appear above the play area, the score is zero, the bird is stationary at its starting position, a start instruction is visible, and a start button appears below the play area (FR-07, FR-08).
2. **Given** ready state, **When** Space, ArrowUp, a game-area click/tap or the start button is activated, **Then** gameplay starts and that same action produces one upward flap (FR-01, FR-07).
3. **Given** active gameplay, **When** a supported gameplay input is activated once, **Then** the bird flaps once; without further input, gravity slows its rise and causes it to fall (FR-01, FR-02).
4. **Given** active gameplay, **When** time advances, **Then** successive obstacle pairs enter from the right and move left, with openings within the play area (FR-03).
5. **Given** active gameplay, **When** the bird touches an obstacle, ceiling or ground, **Then** game over appears, motion and scoring stop, and the final score remains visible (FR-05, FR-09).
6. **Given** an active round, **When** the page loses focus or is hidden and then returns, **Then** the round remains paused with a resume instruction; a fresh supported gameplay input or resume-button activation resumes the preserved round with exactly one flap and no movement for time away (FR-11).

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

**Independent Test**: Begin with a game-over state and nonzero score, activate either retry action and observe an immediately playing fresh round.

**Acceptance Scenarios**:

1. **Given** game over with a nonzero score, **When** “Restart game” or “Tap to try again” is activated, **Then** within 100 milliseconds a fresh playing round is visibly displayed: score zero, bird reset to its starting position with one initiating flap, no old obstacles or game-over message (FR-04, NFR-02).
2. **Given** the fresh playing round, **When** another distinct supported gameplay input is activated, **Then** exactly one flap occurs with the same rules as before (FR-01, FR-07, NFR-03).
3. **Given** ready or active gameplay, **When** restart is activated repeatedly, **Then** each activation starts one clean playing round with no duplicate listeners or loops (FR-04).

---

### User Story 4 - Verify predictable behavior (Priority: P3)

As a developer, I want defined, verifiable rules so that I can maintain the game without breaking player behavior.

**Why this priority**: Maintainability supports reliable delivery of the player journeys.

**Independent Test**: Review requirement references and repeat controlled gameplay checks across rounds.

**Acceptance Scenarios**:

1. **Given** identical starting conditions, obstacle sequences, and timed inputs, **When** rounds are repeated, **Then** movement, collision outcomes, and scores match at corresponding elapsed times (NFR-03).
2. **Given** completed implementation work, **When** reviewed, **Then** each requirement has implementation and verification references, and automated core tests and recorded browser checks cover the specified journeys (NFR-04, NFR-05).

### Edge Cases

- Holding Space or ArrowUp gives one flap per physical press; keyboard repeat produces no extra flaps. A mouse click or touch tap generates one action; compatibility mouse events after touch MUST NOT duplicate it (FR-01).
- Gameplay Space/ArrowUp does not scroll the page or activate a focused button; Tab and Enter still allow restart (FR-08).
- Spacebar during game over leaves the state unchanged until restart (FR-07).
- Touching any obstacle boundary, including an opening edge, counts as collision. Ceiling and ground contact also end the round, exactly once (FR-05).
- Exact ceiling contact, initial overlap or crossing the ceiling ends the round once (FR-10).
- Equality at the passing boundary does not score. One upper/lower pair yields only one point (FR-06).
- A delayed visible frame must not let the bird pass through a hazard undetected or score a pair twice (FR-05, FR-06, NFR-03).
- Hiding the page or losing focus suspends gameplay and clears held-key input. Returning leaves the round paused with a visible resume instruction; a fresh supported gameplay input or resume-button activation resumes from the preserved state with one flap, without simulating time away (FR-11).
- Rapid restart clears pending input and all previous-round progress (FR-04).
- Openings do not intersect the ground or exceed the upper boundary; retired obstacles no longer affect gameplay (FR-03).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-01**: Each distinct Space or ArrowUp press, mouse click or touch tap on the game during gameplay MUST give the bird one upward flap. Holding a key MUST NOT repeat flaps. Each pointer gesture MUST yield only one action, including touch compatibility events. The initiating start/resume/retry action MUST also produce exactly one flap. During active play, all accepted inputs targeting the same simulation tick MUST be consumed in FIFO order before movement; each flap sets the configured upward velocity without accumulating impulse or carrying into later ticks.
- **FR-02**: Gravity MUST continuously accelerate the bird downward during active gameplay, including between flaps. It MUST NOT move the bird in ready, suspended, or game-over states.
- **FR-03**: Active gameplay MUST generate successive upper/lower obstacle pairs with traversable openings, move them right to left, and retire them after they leave the play area. Generation MUST continue until game over, with unchanged movement and spacing rules throughout a round.
- **FR-04**: Restart MUST immediately start a fresh playing round from any state, clearing score, old obstacles, prior motion, elapsed progress and pending input without a reload, then immediately applying one initiating flap velocity without advancing position or simulation time. The initiating flap MUST NOT also be queued for a later tick. After game over, both the below-game “Restart game” button and the on-screen “Tap to try again” action MUST perform this operation.
- **FR-05**: Contact or overlap with an obstacle, the ceiling or the ground MUST end the round and stop gameplay motion, generation and scoring. Collision MUST take priority over scoring in the same gameplay update.
- **FR-06**: Score MUST start at zero and increase by exactly one per obstacle pair when the entire bird clears the entire pair horizontally during active play. Each pair MUST score at most once. The displayed score MUST update by the next rendered gameplay frame.
- **FR-07**: Ready, playing, paused and game-over states MUST be distinguishable. Supported gameplay input or the below-game start button MUST start from ready with one flap. Game over MUST retain the final score; the on-screen retry action or below-game restart button MUST start fresh immediately. Space/ArrowUp alone during game over MUST leave it unchanged.
- **FR-08**: The interface MUST show a title and icon above the play area, the bird and obstacles within it, current-round score, state-appropriate instructions and a labeled button below. The button MUST say “Start game” in ready, “Resume game” when paused and “Restart game” during play or game over. Buttons MUST support pointer and Tab/Enter activation. Gameplay keys MUST prevent scrolling and accidental focused-button activation. The presentation MUST use independently drawn vintage arcade artwork, strong colors and animations; decorative animation MUST NOT alter gameplay rules or collision bounds.
- **FR-09**: Game over MUST visibly communicate that the round ended and that restart is available.
- **FR-10**: Contact, overlap or crossing of the ceiling MUST end the round, using the same collision priority and frozen gameplay behavior as obstacle or ground contact.
- **FR-11**: An active round MUST pause when hidden or unfocused, preserving bird position, motion, obstacles, score and elapsed active time while clearing held/pending input. Returning MUST leave it paused with a visible resume instruction. Fresh supported gameplay input or “Resume game” button activation while visible and focused MUST resume the preserved round with exactly one flap and no simulation of time away. This resume action MUST NOT reset progress.

### Non-Functional Requirements

- **NFR-01 — Smoothness**: The game SHOULD aim to maintain 60 frames per second during normal visible, focused gameplay on a desktop display running at 60 Hz or higher. Measure and report the average rendered frames per second over a 60-second collision-free test round in each supported browser, without unrelated heavy workloads. Record device, operating system, display refresh rate, exact browser versions, and any noticeable stuttering. Investigate and document causes and follow-up actions for observed stuttering. The 60 FPS goal is a target, not a mandatory numerical pass threshold; the NFR-02 restart limit remains mandatory.
- **NFR-02 — Restart latency**: The complete fresh playing round MUST be visibly displayed within 100 milliseconds after restart activation, measured from receipt of activation to the first displayed frame containing the full reset state and initiating flap, on the NFR-01 baseline.
- **NFR-03 — Consistency**: Identical starting conditions, obstacle sequences, and timed inputs MUST produce the same movement, collision, and scoring outcomes across rounds. Rendering cadence MUST NOT change gameplay rules. Verification MUST cover 100 consecutive start/play/end/restart cycles with zero unexpected errors, stale state, or duplicate scoring.
- **NFR-04 — Maintainability**: Review MUST confirm meaningful names, consistent formatting, focused responsibilities, named gameplay constants, and no duplicated gameplay rules, following constitution principles II and IV.
- **NFR-05 — Verification and traceability**: Each requirement MUST have references through planned tasks, implementation, and verification. Core gameplay MUST have repeatable automated tests covering start, flap/movement, obstacles, collisions/game over, scoring, restart, and relevant boundaries. Recorded browser checks MUST verify rendering, inputs, and the full play-to-restart journey. Relevant tests MUST pass before implementation is complete.
- **NFR-06 — Browser support**: Functional requirements MUST work in desktop Chrome, Firefox, Edge and Safari stable versions installed at implementation validation; record exact versions. Space, ArrowUp, mouse and touch input MUST be supported, including touch-capable desktop hardware. Mobile platforms are outside scope.

### Key Entities *(include if feature involves data)*

- **Round**: Lifecycle state, elapsed active time, current score, bird, and obstacles. Restart discards previous progress.
- **Bird**: Player character with position, vertical motion, and a collision boundary.
- **Obstacle pair**: Upper/lower hazards with one opening, horizontal position, and a shared scored/unscored status.
- **Score**: Nonnegative integer counting cleared pairs in this round; retained on game over and cleared on restart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-01**: Every supported-browser acceptance run completes ready → playing → game over → restart → playing using the specified controls and displaying the required interface (FR-01–FR-11, NFR-06).
- **SC-02**: Controlled rounds clearing exactly 0, 1, and 10 pairs display respectively 0, 1, and 10 points. Boundary and simultaneous-collision cases award no extra points (FR-05, FR-06).
- **SC-03**: Every supported-browser baseline has a recorded 60-second performance result compared with the 60 FPS target, with observations and an investigation of any noticeable stuttering. Acceptance requires these records rather than a numerical frame-rate threshold (NFR-01).
- **SC-04**: All 100 restart activations in the repeated-cycle check display the complete fresh playing state within 100 milliseconds (NFR-02, NFR-03).
- **SC-05**: Across 100 repeated cycles, controlled inputs and obstacle sequences produce matching outcomes with no unexpected errors, duplicate points, or stale-round effects (NFR-03).
- **SC-06**: Every requirement has verification references, all core automated checks pass, and required review and browser-check results are recorded before implementation acceptance (NFR-04–NFR-06).

## Assumptions

- **A-01 — Scope**: Single-player, current-round scoring only (confirmed 2026-10-29). Accounts, multiplayer, audio, saved high scores, leaderboards and mobile platform support are excluded. Desktop touch input is included. No external service or stored player data is required.
- **A-02 — Confirmed restart behavior**: The 2026-10-29 clarification supersedes reset-to-ready: retry starts a fresh playing round immediately with one flap. Pause resume preserves the existing round.
- **A-03 — Obstacles/difficulty ambiguity**: One obstacle means one upper/lower pair and one point. Openings may vary within safe bounds; difficulty does not increase. Exact gravity, flap strength, speed, spacing, opening size, collision geometry, and starting position MUST be documented before implementation. Playable traversal MUST be verified against the implemented simulation before browser acceptance; failed traversal requires tuning and corresponding updates to the plan and tests.
- **A-04 — Confirmed boundaries and focus behavior**: Ceiling, obstacle and ground contact are fatal. Hidden or unfocused play pauses; fresh supported gameplay input or Resume game resumes the preserved round with one flap and no simulation of time away.
- **A-05 — Confirmed performance interpretation**: 60 FPS is a measured target rather than a mandatory pass threshold; results and any stuttering investigation must be recorded. The 100-millisecond restart limit remains mandatory. Planning MUST record a representative desktop baseline before performance validation; minimum hardware is not a product guarantee.
- **A-06 — Supplied delivery constraints**: The user and constitution require HTML, CSS, JavaScript, and native browser capabilities. Additional dependencies require documented justification in planning. This preserves an explicit project constraint without choosing an implementation design.
- **A-07 — Environment dependencies**: Players need a supported desktop browser and display; keyboard, mouse or desktop touchscreen provides gameplay input. Real touch-capable desktop hardware is required to validate touch support. No external integration is needed.
- **A-08 — Clarification status**: High scores, controls, immediate retry, preserved-round resume, fatal ceiling, desktop scope and arcade presentation were confirmed on 2026-10-29. Gameplay tuning, collision geometry and recorded test environment remain planning/validation work. No product-scope decision remains open.

### Additional acceptance scenarios (2026-10-29)

- **Given** ready state, **When** each supported start method is exercised independently, **Then** one round starts with one flap; key repeat and touch-generated compatibility events never duplicate actions (FR-01, FR-07).
- **Given** a paused round with nonzero progress, **When** each supported gameplay input or “Resume game” is activated, **Then** the same score, obstacles and elapsed progress remain and one flap is applied (FR-11).
- **Given** game over, **When** each retry action is activated independently, **Then** a fresh playing round with zero score and one flap appears within 100 ms (FR-04, NFR-02).
- **Given** active play, **When** exact ceiling contact, overlap or a crossing occurs, **Then** game over occurs once and no point is awarded in that update (FR-05, FR-10).
- **Given** the rendered interface, **When** reviewed across lifecycle states, **Then** independent vintage arcade artwork, strong colors and visible decorative animations are present; pause/game-over freeze the gameplay world and decorative animation never changes gameplay outcomes (FR-08, FR-09, NFR-03).
