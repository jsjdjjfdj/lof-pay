# Security Specification & Threat Model
**Legend of Fire - Official Bangla QR Payment Portal**

## 1. Data Invariants
- `portal_settings/{settingId}`:
  - Readable publicly so non-logged-in customers can view the current official Bangla QR code, branding, payment methods, instructions, and video.
  - Modifiable strictly by authenticated administrators (verified email or presence in `/admins/{uid}` or bootstrapped admin `mdrobiulislam34t@gmail.com`).
  - Size bounded on text, QR base64/URL, and video fields to prevent Denial of Wallet.
- `instructions/{instructionId}`:
  - Readable publicly.
  - Modifiable and creatable only by authenticated administrators.
- `faqs/{faqId}`:
  - Readable publicly.
  - Modifiable and creatable only by authenticated administrators.
- `payment_confirmations/{confirmationId}`:
  - Creatable by any user submitting a payment verification (rate bounded, validated shape: non-empty transaction ID, valid method `bKash`/`Nagad`/`Rocket`/`Other`, positive amount, phone number <= 20 chars).
  - Listing/reading and updating status strictly by administrators.
- `admins/{adminUid}`:
  - Readable and writable only by verified administrators.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Portal Settings Update**: Attacker attempts to change the `qrImageUrl` to a phishing QR code without login.
2. **Non-Admin Tampering**: Authenticated non-admin user attempts to replace the portal's `videoUrl`.
3. **Ghost Field Injection**: Attempt to write arbitrary malicious fields (`maliciousScript: true`) to `portal_settings/config`.
4. **Denial of Wallet Payload**: Attempt to upload a 50MB string into `brandName` or `announcementText`.
5. **Instruction Hijack**: Unauthenticated user attempts to delete or overwrite Bangla payment steps.
6. **FAQ Overwrite**: Non-admin attempts to inject spam/phishing links into the FAQ collection.
7. **Confirmation Snooping**: Unauthenticated user attempts to list all customers' submitted payment confirmation transaction numbers and phone numbers.
8. **Malicious Admin Self-Promotion**: Non-admin user tries to write a document into `/admins/{theirUid}` to grant themselves super_admin privileges.
9. **Negative Payment Amount**: Confirmation submission with amount <= 0 or fake non-numeric string.
10. **Oversized TrxID Attack**: Malicious user attempts to submit a 100KB string into `trxId` to bloat Firestore storage.
11. **Direct Path Traversal Document ID**: Attempt to write a document ID with illegal directory characters or control characters.
12. **Status Privilege Escalation**: Regular user submitting a confirmation attempts to directly flag their transaction status as `verified` rather than `pending`.

## 3. Test Runner Design
Any request failing the validation helpers, lacking proper admin role lookup, or containing unauthorized fields will be rejected with `PERMISSION_DENIED`.
