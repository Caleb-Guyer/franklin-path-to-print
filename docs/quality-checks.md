# Verification record

## Source coverage

- Canonical input: `Franklin Part 1.pdf`, 27 scanned spreads, printed Part One pp. 1–53.
- Every spread rendered at 1800px and inspected visually before content authoring.
- Comprehensive per-spread outline retained in `source-outline.md`.
- 252 factual records; all appear in playable scenes and have PDF citations.
- 272 unique question IDs, 252 cards, 60 scenes/events, 12 chapter trials.
- All 27 PDF spreads represented in the factual records.
- Dialogue explicitly paraphrased; illustrative setting text separated from factual detail.
- Source uncertainties preserved, including the Courant date and the partnership dissolution date.

## Automated checks

- `npm install` completed with a committed lockfile.
- `npm run check`: TypeScript, 36 unit/data/physics/combat/speech-format tests, production build.
- Data validation checks identifiers, page bounds, references, matching pairs, chronological order, scene coverage and question coverage per chapter.
- Grading tests canonical answers, aliases, punctuation, number normalization, mistaken names, incomplete matching and incorrect chronology.
- Memory tests cover wrong-answer priority, Trouble List removal, mastery, save serialization and corrupted-data recovery.
- Repeated randomized selection verifies a balanced 20-question exam with all 12 chapters and both ordering and matching.
- End-to-end tests actually answer all story recall prompts and all twelve 10-question trials, then verify all 60 scenes, 12 chapters and 252 cards are unlocked.
- Exam test answers 18 of 20 correctly, checks 90%, saved mistakes and achievement, retries misses and reloads the save.
- UI tests exercise every major screen and 390px phone layout, scan viewing, mobile navigation and confirmed/cancelled reset.
- Additional browser flows verify all 272 questions in Everything mode, Easy recognition, timer pause/resume, flashcard flipping, collection filters and location-specific drills. Fourteen browser tests cover the learning tools and the platformer.
- Production tests request the PDF and every scan and refresh hash routes under both `/franklin-path-to-print/` and `/franklin-part-one-game/`.

## Dialogue and multiple-choice checks

- All 272 questions convert deterministically to 2–4 distinct choices with exactly one accepted answer. All generated factual distractors come from the canonical bank.
- Chronology questions test the next event; relationship questions test a source-backed connection. Their original IDs, source citations and review history are preserved.
- Every fact and scene narration splits into short speech beats without dropping or rewriting words.
- Browser checks verify progressive text reveal, reveal/skip, replay, Auto/Hold, voice cancellation, stale callback isolation, saved narration preference and music ducking.
- Question tests verify spoken prompts/options, one-key scoring, immediate spoken feedback, no double scoring and no confidence step.
- A phone test disables speech support and enables reduced motion, then verifies complete readable lines, working advancement and no horizontal overflow.

## Platformer checks

- Each of the 12 levels has one NPC, two source-backed main-idea lines, one unique weapon, two combat barriers and a guardian. There are no book pickups. The complete factual bank remains in the optional study tools.
- Unit checks exercise all 12 weapon attacks, cooldowns, fast-projectile collision, crossbow piercing, boomerang return hits, enemy windups and arena clearing.
- A locked exit cannot be entered before its combat encounters are cleared.
- Simulated movement traverses the ground route of all twelve worlds without falling. Unit tests cover double jumps, variable jump height, late jumps, dash cooldown and old-save migration.
- Browser controllers clear full levels using the bow, axe, boomerang and comet staff with movement and attack inputs. They cross hazards, defeat guardians and unlock the next chapter. The extra loadout tests start with a valid unlocked save; they do not teleport during play or alter combat outcomes.
- Browser checks cover audio synthesis after Play, saved mute, keyboard and touch movement, pause, conversation dismissal, saved checkpoints and reload.
- Best times are recorded only for levels started from the beginning, so a resumed checkpoint cannot produce a misleading record.
- Platform mechanics and artwork are explicitly described as imaginative in Settings and the README; historical facts retain their source references.

## Visual review

Desktop and phone screenshots inspected for typography, contrast, clipping, spacing, navigation and answer controls. Motion is disabled in screenshot capture to inspect the completed transition. Source scans remain zoomable and selectable in the source viewer.

## Practical limits

- Speech uses the installed browser/device voices; if speech is unavailable, text and gameplay continue. Speech engine behavior is tested with controlled callbacks, and native Windows Edge voices were separately verified to start playback.
- Historical free-form scoring remains in the source-audit code and older saves; current questions use immediate multiple-choice scoring with no confidence prompt.
- The location diagram is schematic, not a geographical survey.
- Browser storage can be cleared by the browser or user. Export/import is provided.
- Hosting has been tested locally with real production output at both supported subpaths. GitHub Actions checks and deploys `main`; the current remote result is recorded in the repository's workflow history.
