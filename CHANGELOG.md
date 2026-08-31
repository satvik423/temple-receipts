# Changelog

## Unreleased

### Changed
- Bill/receipt printouts now render entirely in bold (`receipt-print-view.module.css`), instead of only the header row and total.
- Seva ordering is no longer alphabetical. Sevas now carry a persisted `order` field; the Sevas page lists them in that order and lets you drag rows up/down (via a grip handle, mouse or touch, with arrow-key support) to reorder. The Sell page shows sevas in the same custom order.
- The Sevas list layout was reworked from a fixed-column table to a wrapping row layout so it no longer overflows horizontally on small screens.
- The Sell page no longer has a separate cart panel. Each seva is listed once with its name, price, and a quantity stepper (minus on the left, plus on the right); custom-amount sevas show their added entries (name, phone, amount) inline and can be removed individually. A sticky bar at the bottom shows the running total and a single "Save & Print" button.

- Bills now show two numbers: the existing running receipt number is labeled "GBN" (Grand Bill Number), and a new "DBN" (Date Bill Number) counts sales within a single business day, resetting to 1 each day.
- Sales History is now date-based instead of a date-range + seva filter, defaulting to the current business day, with previous/next-day navigation. It no longer paginates (a full day's sales are shown at once). The table is one row per receipt, with columns GBN | DBN | Date | Time | Items | Amount | Action (reprint).

- Sales History's date filter no longer sits in its own near-empty card; the date navigator now lives in the results card's header, next to the receipt count/total.

- "Save & Print" on the Sell page is now a true one-shot action: it saves the bill and prints it in place, without navigating to a separate `/print/[id]` page. You stay on the Sell page, ready for the next sale, with a "Print Again" button available if you need to reprint the last bill. The printable receipt markup was extracted into `ReceiptDocument` (`src/components/receipt-document.tsx`), shared by the Sell page, the History page's reprint action, and the standalone `/print/[receiptNo]` page.
- On the Sell page, a seva's line amount now appears immediately to the left of its quantity stepper (in a fixed-width slot) instead of after it, so the +/- buttons no longer shift position as quantities change.
- History's reprint action (the printer icon in the Action column) prints the bill in place too — no page navigation, no separate dialog — and stamps the reprint with a "*** COPY ***" badge (`ReceiptDocument`'s new `isCopy` prop) so a duplicate is never mistaken for the original.

### Added
- `PATCH /api/sevas/reorder` endpoint to persist a new seva display order.
- `order` field on the `Seva` model and `SevaDTO`; new sevas are appended to the end of the current order.
- `dbn` field on the `Receipt` model and `ReceiptDTO`, generated per business date via a daily counter.
- Sales History now has two separate PDF downloads instead of one: "Bill" (`GET /api/receipts/report/bill`) lists every bill's line items (GBN | DBN | NAME | QTY | AMOUNT), and "Report" (`GET /api/receipts/report/summary`) lists seva-wise totals per date (NAME | QTY | AMOUNT), aggregating repeat sales of the same seva on a day into one line. Both are A4 PDFs, for either the full history or a chosen month/year (defaulting to the current month), repeat the bill header, group by date with a "R.No start - end" line and a daily total, end with a grand total, and number every page "current of total" in the footer. Uses the new `pdfmake` dependency; shared PDF-building logic lives in `src/lib/pdf-report.ts`.
- A "Grand Bill Number" card on the Settings page shows the last issued bill number and lets you jump the counter forward (e.g. to continue an existing paper/billing system's numbering) via `GET`/`PATCH /api/settings/gbn`. Left untouched, numbering just continues from wherever it already is (0 for a brand-new setup). Moving it backward is rejected to avoid colliding with already-issued bill numbers.
