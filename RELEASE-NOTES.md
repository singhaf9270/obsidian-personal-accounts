## 2.0.9

- Preserve each transaction's canonical Gregorian ISO date in Markdown metadata, independently of the selected display calendar.
- Preserve due dates in the same way, so switching between Jalali and Gregorian calendars changes only presentation, not the underlying day.
- Read canonical dates when available and retain compatibility with older numeric Gregorian and Jalali dates.

Validation: JavaScript syntax check, canonical date metadata parsing, transaction and due-date serialization, and version registry checks passed. In-app verification with an existing vault remains pending.

