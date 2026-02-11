# 🛡️ PROJECT RULES & GOVERNANCE

**⚠️ CRITICAL: READ BEFORE EDITING ANY CODE ⚠️**

This project is under **STRICT LOCKDOWN**.
All source files have been marked with protection headers.
**NO FILE** should be modified unless the user explicitly requests a change to that specific file.
Refactoring, "cleanup", or "optimization" without request is **STRICTLY PROHIBITED**.

## 1. Immutable Business Logic
The following configurations are **LOCKED** for production stability:

### 💰 Monetization Rules
- **Vehicles**:
  - 1st Vehicle: **Free for 6 Months**
  - Vehicles 2-25: **Free for 7 Days**
  - Vehicles 26+: **Paid Immediately** (1 Credit/Month)
- **Businesses**:
  - 1st Business: **Free for 3 Months**
  - Businesses 2+: **Paid Immediately** (1 Credit/Month)

### 📍 Search Configuration
- **Radius**: Default search radius must start at **25km**.
- **Expansion**: Expansion tiers must start at **25km** (not 12km).

### 💲 Pricing
- **Base Price**: Defined in `src/lib/pricing.ts`. Do not change the 20/40 MXN logic.

### 🤖 AI Configuration
- **Moderation**: "Ruben's Rules" (Cover Photo Sovereignty, Duplicate checks) in `src/lib/ai-moderation.ts` are **IMMUTABLE**.
- **Smart Search**: The "Brain Trust" prompt in `src/app/api/ai/analyze-vehicle-query/route.ts` is fine-tuned and must not be altered.

### 🔐 Infrastructure & Security
- **Authentication**: Server-side fingerprinting in `src/lib/auth.ts` is vital for preventing fraud.
- **Storage**: Image compression settings in `src/lib/cloudinary.ts` are set to minimize costs. **DO NOT REMOVE**.

## 2. Protected Files
Do not edit the logic within these files unless specifically asked to "update monetization rules":
- `src/app/api/business/register/route.ts`
- `src/app/api/vehicles/route.ts`
- `src/lib/pricing.ts`
- `src/lib/businessMonetization.ts`
- `src/lib/geolocation.ts` (Radius logic)
- `src/lib/ai-moderation.ts` (AI Rules)
- `src/app/api/ai/analyze-vehicle-query/route.ts` (Search Prompt)
- `src/lib/auth.ts` (Security)
- `src/lib/cloudinary.ts` (Cost Optimization)

## 3. General Guidelines
- **No Refactoring of Logic**: Do not "clean up" or "optimize" these rules. They are business requirements, not just code.
- **Respect Comments**: If a line says `// CRITICAL: DO NOT MODIFY`, believe it.

---
*This file serves as the source of truth for Project Governance.*
