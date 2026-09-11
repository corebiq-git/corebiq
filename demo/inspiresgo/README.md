# Travells — Travel & Your Packages Admin

Responsive admin web/mobile app for a travel business.

## Product types

1. **eVisa**
2. **Umrah**
3. **Tour — Fixed Price**
4. **Tour — Custom Choose**

Each package supports:
- INR (₹)
- AED (د.إ)
- Fixed or Custom pricing model
- Status
- Destination
- Duration
- Description

## Admin & Staff

### Admin
The Admin role has full control of the system, including:
- Packages
- Bookings
- Customers
- Drivers & vehicles
- Expenses
- Backup & restore
- Staff accounts
- Staff permissions
- System settings

### Staff
Staff accounts are created by an Admin. The Admin chooses which modules each staff member can access:
- Packages
- Bookings
- Customers
- Drivers
- Expenses
- Backup

The UI hides unavailable modules and Firestore security rules also check permissions. Do not rely on UI hiding alone.

## Firebase setup

1. Create a Firebase project.
2. Add a Web App.
3. Enable Email/Password Authentication.
4. Create Firestore.
5. Enable Storage if you will upload package images/documents.
6. Put the Web App config in `firebase-config.js`.
7. Deploy rules and functions.
8. Create the first admin user/profile.

### First admin

After creating the first admin Authentication user, create a Firestore document:

`users/{ADMIN_UID}`

Example:

```json
{
  "name": "Main Admin",
  "email": "admin@example.com",
  "role": "admin",
  "status": "active",
  "permissions": {
    "packages": true,
    "bookings": true,
    "customers": true,
    "drivers": true,
    "expenses": true,
    "backup": true
  }
}
```

The Admin role is then unrestricted in the application and Firestore rules.

## Deploy

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy
```

The hosting rewrite maps:

`/api/createStaff`

to the admin-only Cloud Function that creates Firebase Authentication staff users and their permission profiles.

## Backup

### Manual
Backup & Restore exports the five operational Firestore collections to JSON and restores compatible backups.

### Scheduled
`functions/index.js` includes a 24-hour scheduled backup to Cloud Storage. Review Firebase/Google Cloud billing, IAM and retention requirements before production use.

## Production security recommendations

- Use separate admin/staff roles.
- Keep staff permissions minimal.
- Add audit logs for create/update/delete operations.
- Use Cloud Storage path-based rules for uploaded documents.
- Do not expose service-account private keys in the frontend.
- Consider App Check, MFA for administrators, and stronger authentication policies.
- Add server-side validation for prices, booking status and sensitive operations.

## Document templates

The admin includes a printable document generator for:
- Invoice / Tax Invoice
- Quotation
- Payment Receipt
- Itinerary

Documents are stored in the Firestore `documents` collection. Each document can use INR or AED, with subtotal, discount, tax rate, status, booking reference, customer and notes. The print view is designed for A4 and can be printed or saved to PDF from the browser.

Before production, add your final Travells legal/business details such as:
- registered business name
- address
- phone/email
- GSTIN for India invoices where applicable
- UAE TRN where applicable
- bank/payment details
- invoice numbering policy
- tax wording and applicable tax treatment

These fields should be configured to match the actual operating entity and jurisdiction.

## Invoice & document templates

The admin now includes a document register and printable A4 templates for:
- Invoice / Tax Invoice
- Quotation
- Payment Receipt
- Itinerary

Each document supports:
- INR (₹)
- AED (د.إ)
- Customer
- Booking reference
- Issue date
- Subtotal
- Discount
- Tax percentage
- Status
- Notes / payment terms
- Print / Save as PDF

Documents are stored in the Firestore `documents` collection and included in backup/restore.

For production, configure the actual business identity, registered address, GSTIN/TRN, contact details, bank/payment information and jurisdiction-specific invoice/tax wording.

## Professional CRM + ERP integration

The v4 architecture adds:

### CRM
- Lead / enquiry pipeline
- Lead source
- Interest: eVisa, Umrah, fixed tour, custom tour
- Estimated opportunity value
- Follow-up date
- Sales stages
- Owner
- Notes
- CRM → quotation → booking workflow foundation

### ERP
- Sales / booking value
- Collected amount
- Receivables
- Expenses
- Supplier payables
- Profitability view
- Supplier / vendor master
- INR / AED support

### Operations
- Operational handoff concept from confirmed booking to hotel, transport, driver and trip tasks.
- Existing drivers/vehicles and documents are connected to the workflow.

### Firebase integration
The Firestore rules now use the `users/{uid}` profile to enforce:
- `role == admin` → full control
- staff → only the modules granted in `permissions`

New Firestore collections:
`crm`, `vendors`, `payments`, `operations`.

Recommended production workflow:
`Lead → Customer → Quotation → Booking → Service Delivery → Invoice → Payment → Receipt → Profit`.

This kit is a strong application foundation; jurisdiction-specific tax/accounting logic, payment gateways and official eVisa/airline/hotel APIs should be integrated only after their credentials, contracts and business rules are configured.
