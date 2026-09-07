# CareerPilot Project Map

Browser → resume text → `POST /api/analyze` → profile score + detected skills + suggestions

Browser → register/login → JWT → localStorage

Browser → `GET /api/jobs` → job catalogue → search/filter

Browser → `POST /api/saved-jobs` → authenticated saved role

Browser → `GET /api/dashboard` → saved jobs + analysis count

Models:
- User
- Analysis
- SavedJob

The current analysis engine is deterministic local text analysis rather than an external LLM integration.
