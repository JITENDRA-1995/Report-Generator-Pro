# Project Rules for Stock Management Hub (SMS)

## Stability Constraints
1. **Do Not Touch Verified Standards (IS 13488, IS 13487, IS 4985, IS 17425, IS 12786, IS 14483)**: The mapping logic, schemas, and UI/export components for IS 13488, IS 13487, IS 4985 (uPVC Pipe), IS 17425 (HDPE Pipe), IS 12786 (Plain Laterals), and IS 14483 (Venturi Injector) are verified and perfected. Never touch, modify, or break them under any circumstances without obtaining explicit user confirmation first.
2. **Double check regex match side-effects**: Always use regex word boundaries (e.g. `\bcl-i\b` and `\bcl-ii\b`) when resolving item classes to avoid substring collisions.
3. **Browser Login Rule**: If a login page appears while using browser tools, always ask the user to fill in the credentials directly. Do not assume or make false login attempts.

## IS 4985 uPVC Pipe Business Logic Rules
1. **Production Import Parsing**:
   - Group entries dynamically by date and matched size.
   - Map tonnage weight in kilograms as `tonn * 1000`.
2. **Universal Dispatch Import**:
   - Spreadsheet quantities are treated as meters (`dispMtrPipe = totalQty`).
   - Calculate corresponding pipe count as `Math.round(totalQty / 6)`.
3. **Daily Stock Ledger Excel Export Layout**:
   - Must use the 12-column layout (pipe-only columns: MFG in Pipe, Dispatch Qty in Pipe, C. S in Pipe) using `xlsx-js-style`.
   - Monthly summary sidebars and closing stock columns must calculate and track stock strictly in **pipes**, not in meters.

## IS 12786 Plain Laterals Business Logic Rules
1. **Pressure Rating Rules**:
   - `2.5kg` explicitly maps to **Class-2**.
   - `2.0kg` explicitly maps to **Class-1**.
2. **Production Grouping and Coil Length Normalization**:
   - Production logs for the same day and size must be dynamically grouped.
   - When mixed lengths exist (e.g. 200m and 500m coils on the same day for a size), convert the total quantity using the largest target coil length (`Math.max` of coil lengths) and round to the nearest integer coil count without decimals.
3. **Universal Dispatch Mapping**:
   - Initially, map all 20mm Plain Lateral dispatches from universal sheets to **`20mm Cl-2`** to pool the entries.
4. **Class-1 Dispatch Sheet Import**:
   - Default missing size values to `"20mm Cl-1"` when uploading files inside the `20mm Cl-1` tab.
   - Skip header-in-value rows (e.g. cell values like `'Date'` and `'Qty'`).
   - Map custom columns: `'20MM CL-1'` (Date) and `'__EMPTY'` (Quantity).
   - Auto-correct 3-digit year typos starting with 20 (e.g. `206` -> `2026`).
5. **Reconciliation Flow**:
   - Provide a "Reconcile & Combine from 20mm Cl-2" action for `20mm Cl-1`.
   - Run a subset-sum match to move complete bills from Class-2 to Class-1, and split the remaining difference from a single Class-2 bill, carrying over all invoice details (bill number, party name, batch number).
6. **Excel Stock Ledger Export Layout**:
   - IS 12786 Plain Laterals must use the formatted styled Excel layout (xlsx-js-style) with dynamic standard titles and monthly summary sidebars matching the IS 13488 structure.

## IS 17425 HDPE Pipe Business Logic Rules
1. **Production Import Parsing**:
   - Scan the uploaded file to dynamically detect the header row containing `Date` and `Size` columns (not a fixed row number).
   - Group entries dynamically by date and matched size.
   - Map production quantities to **both** `nos` and `pipe` fields so the table renders correctly.
2. **Universal Dispatch Import**:
   - Map dispatch quantities as `dispNos` (number of pipes) for IS 17425.
3. **Daily Stock Ledger Excel Export Layout**:
   - Must use the 12-column layout (matching IS 4985 structure) with `xlsx-js-style`.
   - Pipe-only columns: `MFG in Nos`, `Dispatch QTY in Nos`, `C. S in Nos`.
   - Monthly summary sidebars and closing stock must track stock strictly in **Nos (pipes)**, not meters.
   - Header code string format: `IS CODE : 17425 HDPE PIPE (SIZE)`.

## Consignee Management Rules
1. **Name Normalization for Matching**:
   - Always use `getCleanConsigneeName` (splits on `/`, `-`, `(` and trims) when comparing imported dispatch party names with registered consignees.
   - This handles imported suffixes like `"Siddhi Corporation / prantij"` matching to registered `"Siddhi Corporation"`.
2. **Performance — Use Memoized Map for Lookups**:
   - Never call `localStorage.getItem("sms_consignees")` or `JSON.parse` inside dispatch entry loops.
   - Pre-build a `cleanToRegisteredMap: Map<string, string>` (clean base name → registered name) as a memoized constant and use O(1) Map lookups inside loops.
3. **Report Aggregation**:
   - When aggregating dispatch quantities for consignee monthwise summary, compare both the selected name and the dispatch `partyName` through `getCleanConsigneeName` to correctly match entries with location suffixes.

## Git Workflow Constraints
1. **Local Verification Before Push**: Any changes made must be kept local initially. Do not stage, commit, or push changes to the remote git repository until the changes are verified. Once verification is complete, they can be pushed.
