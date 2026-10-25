## 2.0.8

- Import UTF-8 CSV transactions from settings, with a row preview, duplicate detection and append-only merging.
- Automatically save a JSON backup beside the ledger before importing CSV.
- Support Persian and English headers/digits, comma/semicolon/tab separators, quoted and multiline fields.
- Fix ledger date parsing: recognize named Jalali/Gregorian months instead of replacing unreadable transaction dates with today.
- Stop loading and prevent writes when ledger dates cannot be parsed; write stable numeric dates for new saves.
- Simplify transaction date presentation to a calendar icon and date, removing the misleading payment-registration label.
- Preserve descriptions containing escaped table separators.

Validation: JavaScript syntax check, 32 date round trips, CSV import/export, all transaction types, duplicate detection and invalid-input checks passed. In-app visual verification remains pending.

Previously overwritten dates require a backup or file history; this release does not reconstruct lost dates.
