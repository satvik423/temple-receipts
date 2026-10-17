# Invoice — Temple Receipts & Billing Application

**Delivered by:** Satvik R Shetty
**Delivered to:** Shree Guru Raghavendra Swamy Vrindavanam
**Project:** Temple Receipts App (Sevas billing, Kanike donations, printing, reporting, admin)

---

## 1. Features Delivered

| # | Feature | Description |
|---|---|---|
| 1 | **Sell (POS) billing** | Searchable seva catalog with a quantity stepper per seva, plus custom-amount items (name, phone, amount) for one-off entries. "Save & Print" saves and prints in one action. Every bill gets a GBN (Grand Bill Number, sequential across all time) and a DBN (Date Bill Number, resets each business day) |
| 2 | **Kanike (donation) module** | Dedicated donation entry form — donation type, optional bhakta address, optional remark, an "Online Pay" flag, and a "no money" (in-kind) option. Entries can be edited after the fact, including correcting the recorded date, and reprinted |
| 3 | **Kanike A5 voucher** | Custom printable voucher matching the temple's own paper template, including the amount written out in words and a period label |
| 4 | **Kanike thermal report** | A seva/donation-type-wise donation summary for a chosen period, formatted for and printed directly to the thermal printer |
| 5 | **Dual-path printing** | Direct USB thermal printer support (WebUSB, ESC/POS-style rasterized printing so Kannada renders correctly) with automatic fallback to the browser's print dialog when no printer is connected; reprints are stamped "COPY" |
| 6 | **UPI QR on receipts** | QR code auto-generated per bill, pre-filled with the exact amount via a UPI ID set once in Settings; not shown at all if no UPI ID is configured |
| 7 | **Sales History** | Day-by-day browsing with previous/next-day navigation and running totals; any past bill can be reprinted; admins can permanently delete a bill, which automatically closes the resulting gap in both the GBN and DBN sequences |
| 8 | **Analytics dashboard** | Revenue over daily / weekly / monthly / yearly ranges, plus a breakdown by seva — visible to admins only |
| 9 | **Reports (Sell)** | "Bill" report (every line item) and "Summary" report (seva-wise totals per day), each downloadable as PDF or Excel, for a chosen month, custom date range, or full history |
| 10 | **Reports (Kanike)** | Equivalent itemized donation report, downloadable as PDF or Excel, for a chosen month, custom date range, or full history |
| 11 | **Kannada-correct PDF rendering** | PDF reports are rendered through headless Chrome with an embedded Kannada font, so conjuncts and vowel signs shape correctly (not just glyph-substituted) |
| 12 | **Sevas management** | Add/edit sevas and kanike types, drag-and-drop reorder, activate/deactivate, fixed or free-entry pricing |
| 13 | **Settings** | Temple name/place/phone (used on every print), UPI ID, a Grand Bill Number override (to continue an existing paper numbering scheme), and printer connection |
| 14 | **Multi-user accounts & roles** | Admin vs. staff roles, admin-only user management, bcrypt-hashed passwords, forgot-password flow via a one-time emailed code (10-minute expiry, console-logged if no SMTP is configured), first-time setup when no users exist yet |
| 15 | **Access control & basic hardening** | Admin-only routes for settings, user management, seva editing, reports, analytics, and receipt deletion; signed session cookies; rate-limiting on login/password-reset endpoints |
| 16 | **Bilingual Kannada + English** | Kannada font rendering and consistent bold typography across the UI and every print/report output |
| 17 | **Installable, responsive app** | Works as an installable PWA (custom icons, manifest) on phone, tablet, or laptop |

---

## 2. What's Needed to Run This Smoothly

| Requirement | Purpose | Notes |
|---|---|---|
| **Web hosting** (Node.js / Next.js compatible, e.g. Vercel) | Runs the application server | Currently on the developer's personal account |
| **MongoDB database** (e.g. MongoDB Atlas, or self-hosted via the included `docker-compose.yml`) | Stores receipts, sevas, users, settings | Currently on the developer's personal account |
| **SMTP email account** (Gmail, Outlook, Zoho, or similar) | Sends the forgot-password one-time code | Without it, the code is only logged to the server console — not usable in production |

---

## 3. Final Price

## **₹30,000**

*(Covers the full feature set above — Sell/POS, Kanike donations, dual printing paths, UPI QR, Kannada-correct reporting, analytics, multi-user admin, and access control — inclusive of the development, testing, and printer-integration work already completed.)*

---

## 4. Post-Payment Handover

Once payment is received in full, the following will be migrated from the developer's personal accounts to accounts owned by the temple/client:

- **Hosting account** (currently on the developer's personal hosting account)
- **Database** (currently on the developer's personal MongoDB account)
- **Any other service credentials** (e.g. SMTP email sender) currently tied to the developer's personal accounts

This ensures the temple has full ownership and control of its own data and infrastructure going forward.
