## 2025-05-14 - [RBAC and Input Validation Implementation]
**Vulnerability:** Lack of role-based access control (RBAC) and robust input validation in financial mutation endpoints.
**Learning:** In a financial application, allowing any authenticated user to mutate records without role verification or strict schema validation poses a high risk to data integrity and security.
**Prevention:** Always implement RBAC checks (e.g., using `ADMIN` or `EDITOR` roles) for any action that modifies data. Use schema-based validation (like Zod) to enforce data types, constraints, and formats at the entry point of actions and API routes. Centralize these security policies to ensure consistency across the application.
