# MediSync Backend Authentication & Authorization Architecture

This document outlines the implementation details for the Authentication, Authorization, and Security layers present in the MediSync backend system. The system relies on a secure, auto-refreshing Cookie-based JWT architecture supplemented by rigorous endpoint protection and Redis-backed session workflows.

## 1. Cookie-based JWT & State Management

The core authentication mechanism revolves around a dual-token (Access + Refresh) JSON Web Token (JWT) system, avoiding `localStorage` completely in favor of more secure transport mechanisms.

- **Token Generation (`app/core/auth.py`)**: The `JWTAuthManager` uses `PyJWT` to encode user identities (including `sub`, `role_id`, and token `type`) using the `HS256` symmetric algorithm paired with an environment-provided `SECRET_KEY`.
- **Storage Strategy**: Tokens are attached as `HTTPOnly` cookies. This strictly prohibits client-side JavaScript from accessing token strings, neutralizing cross-site scripting (XSS) token theft. 
- **Security Flags**: Variables align with modern standards — `Secure` is enabled in production (mandating HTTPS transmission), and `SameSite=Lax` allows first-party usability while preventing broad cross-site request forgery (CSRF).
- **Expiration Policies**: Access tokens are deliberately short-lived (defaulting to 30 minutes via `ACCESS_TOKEN_EXPIRE_MINUTES`) while refresh tokens persist for a longer `7-day` window.

## 2. Auto-Refresh Mechanism

To provide uninterrupted user experiences without sacrificing the security benefits of short-lived access tokens, the backend maintains an intelligent silent-refresh middleware.

- **Middleware Orchestration (`app/middleware/auth.py`)**: The `JWTAuthenticationMiddleware` intercepts every incoming HTTP request. It parses cookies for both token forms.
- **Failover Logic**: When an access token is absent or has expired (failing signature/expiration checks), the middleware automatically evaluates the refresh token.
- **Seamless Re-issuing**: If the refresh token is valid, the middleware securely generates a renewed token pair on-the-fly and seamlessly appends `Set-Cookie` headers to the outgoing response. The application route natively receives a valid authentication context, entirely circumventing 401 Unauthorized errors and manual re-login flows.

## 3. Account Locking & Rate Limiting (Brute-Force Protection)

The primary defense against credential stuffing and brute-forcing is enforced directly at the `/login` endpoint context (`app/api/v1/auth.py`).

- **Attempt Tracking**: The user model tracks a `failed_login_attempts` integer state. Incorrect password submissions increment this counter.
- **Automatic Lockout**: Upon breaching the threshold (`>= 5` failures), the account enters a strictly locked state. The system sets the user's `locked_until` field to 15 minutes in the future.
- **Auditing**: Every success or failure generates a distinct audit trace mapping via `UserService.log_activity`, permanently logging the IP address and email context.

## 4. Redis-Backed Password Reset

The `Forgot Password` and `Reset Password` workflows leverage an ephemeral, time-restricted architectural pattern using Upstash Redis.

- **Token Generation**: An unpredictable 32-byte URL-safe token is generated for the reset lifecycle.
- **Redis TTL Map (`app/services/redis_token_service.py`)**: `RedisTokenService` isolates these tokens within an in-memory Redis datastore, mapping `reset:{token}` directly to a `user_id`. Critically, this sets a strict 5-minute (300-second) Time-To-Live (TTL).
- **Idempotency**: Providing success responses on the `/forgot-password` endpoint explicitly prevents email-enumeration attacks (even when users do not exist).
- **Single-Use Burn**: Upon consumption at `/reset-password`, the token is immediately confirmed and functionally eradicated from Redis prior to the update transaction resolving replay-attack vulnerabilities. 

## 5. Role-Based Access Control (RBAC) & Fine-Grained Permissions

Authorization pivots on decoupled Roles and Permissions mappings directly bound to fast intra-pipeline FastAPI dependencies.

- **Granular Permissions (`app/core/permissions.py`)**: Predefined string flags dictate exact domain access levels (e.g., `"appointment:create"`, `"patient:delete"`, `"manage_users"`). 
- **Dependency Injections (`app/api/deps.py`)**: Evaluates a contextual user derived safely from the active middleware payload (`request.state.user_payload`). Check suites abstract this easily:
  - Macro-Level: `get_current_active_admin`, `get_current_active_provider`
  - Micro-Level: `PermissionChecker` acts as a class-based barrier testing if the user's assigned database role explicitly possesses intersectional subsets of `required_permissions`. Failed checks inherently bounce with HTTP 403 Forbidden.
