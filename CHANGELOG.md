# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-07-08
### Added
- Implemented **Consignee Dispatch Summary Report** feature:
  - Generates month-wise sums of dispatched products to selected parties in standard formats.
  - Supports exporting the report to a formatted spreadsheet named `PARAGON CONSIGNEE.xlsx` in the user's Downloads folder.
- Added **Consignee Details Management & Profile Validation**:
  - Validates selected consignees against 10 critical profile fields (Name, Address, Country, State, District, City, Pincode, Telephone, Mobile, Email Id).
  - Displays a warning checklist banner if any selected consignees have missing profile fields, preventing submission until resolved.
  - Built an interactive **Configure Details Modal** directly inside the reporting panel to view, add, or edit these profile fields and save them instantly to `localStorage`.
- Added **Imported Data Controls**:
  - Implemented a **Clear Imported Data** button that selective-purges only the consignee sales imported logs, keeping other manual entries safe.
  - Persisted imported session IDs in `localStorage` (`sms_consignee_imported_ids_<id>`) to keep the clear status accurate across page reloads.
- Improved **Preview & Export Flexibility**:
  - Refactored the internal data structure to support **Multi-Month Accumulation** (adds multiple months to the same preview list so they export together).
  - Added a **Delete (Trash)** button on each preview table row to remove that consignee/month combination and recalculate totals.
  - Added a **Clear All** button to empty the report preview entirely.
  - Hides zero-quantity entries automatically from the preview table and Excel exports.
- Implemented **Active Consignees Filter**:
  - Step 2 consignee checklist now dynamically screens out consignees who do not have any dispatch logs in the selected month and year, displaying an empty-state warning if the entire period has no dispatches.

## [1.1.0] - 2026-07-07
### Added
- Implemented the fully functional **SMS Settings Dashboard** featuring:
  - **Auto-Calculations Configurator**: configure custom weight factors (with 3-decimal precision, e.g. `kg/mtr` or `kg/pipe`) and standard value rate values.
  - **Standard-Specific Units & Constraints**: dynamically shows/hides inputs (e.g. hides weight for IS 13487, IS 17425, IS 14483; uses "Weight per Pipe" for IS 4985) and labels values appropriately (per KG, per 1000 Nos, per Tonn, per Nos).
  - **Auto-Calculations Rates Backup & Restore**: dedicated JSON import/export panel to backup and restore only conversion settings.
  - **System State Maintenance**: comprehensive download backups for all SMS databases and selective/full wipe commands.
  - **Restore Default Rates Control**: instant restoration of standard presets from hardcoded data.
- Pre-populated and hardcoded **43 master default conversion rates** from `SMS_Conversion_Rates_Backup_2026-07-07.json` with self-healing hooks to auto-populate them on first mount or after database resets.
- Added **Automated Entry Calculations** on typing:
  - For IS 13488 / IS 12786: computes KG and Value automatically from Meters.
  - For IS 13487: computes Value from Nos.
  - For IS 4985: computes KG, Tonn (formatted to 2 decimal places), and Value automatically from Pipes.
  - For IS 17425 / IS 14483: computes Value from Quantity.
- Implemented **Custom IS 13488 Production Log Importer**:
  - Dynamically scans Excel worksheets to locate the header row (containing DATE and SIZE) in the first 15 rows.
  - Resolves column index offsets dynamically to handle shifted columns.
  - Groups raw entries by Date + Size daily, summing up coils, meters, kg, and value to align with the daily ledger database.
  - Normalizes sizes case-insensitively.
  - Merges imported logs with the local database, overwriting overlaps while keeping historical logs.
- Added **Import Production Excel button** dynamically in the header of the Production Logs table in `SmsEntryPanel.tsx`, displaying status badges for upload outcomes.

## [1.0.0] - 2026-07-05
### Added
- Integrated the new **Welcome Portal** (`Welcome.tsx`) as the post-login landing screen.
- Introduced the **Stock Management System (SMS)** module placeholder (`SmsDashboard.tsx`) containing a responsive grid of 6 standard categories: IS 13488, IS 13487, IS 12786, IS 4985, IS 17425, and IS 14483.
- Created the **SMS Standard Detail** sub-dashboard (`SmsStandardDetail.tsx`) at `/sms/standard/:id` to display action cards for each standard category (Production Entry, Dispatch Entry, and Daily Stock) in a clean 3-column layout.
- Created the **SMS Entry Panel** (`SmsEntryPanel.tsx`) at `/sms/standard/:id/:type` which features a left vertical size/class selection sidebar tailored specifically to the standard's configurations, and handles the `stock` route type to render an animated under-development placeholder page.
- Implemented LocalStorage-persisted **Production Entry Forms & Tables** for all 6 IS standards (IS 13488, IS 12786, IS 4985, IS 17425, IS 13487, IS 14483) with custom schemas, automatic calculations (e.g. Unit of 1000 for emitters), data grids, summary totals, and added Production (KG) column after Production (Pipe) for IS 4985.
- Implemented LocalStorage-persisted **Dispatch Entry Forms & Tables** for all 6 IS standards (IS 13488, IS 12786, IS 4985, IS 17425, IS 13487, IS 14483) with custom schemas, automated closing stock calculations (`Production - Dispatch`), dynamic table footers, auto-filled Party Name with "FARMER" (if dispatch qty exists) or "-" (otherwise), auto-calculated Batch No as YYYYMMDD (if production quantity is not 0) or "-" (otherwise), and auto-fetched Production quantity fields (e.g. coils/meters/nos) directly from the Production logs matching the selected date and size (defaulting to 0 if no production entry exists), while excluding the redundant Size field.
- Implemented the fully automated **Daily Stock Ledger Sheets** for all 6 IS standards, dynamically combining and sorting production and dispatch logs chronologically, supporting a customizable and persisted "Last Closing Stock" starting balance input per size, auto-calculating running stock balances sequentially, and rendering it as a read-only table with identical column headers to dispatch.
- Added **Stock From** and **Stock To** Month/Year range selection filters, permitting users to slice and review ledger records inside a targeted timeframe window while maintaining accurate running stock ledger calculations.
- Integrated **Dynamic Auto-Adapting Starting Balances** where selecting a starting range month (e.g. March 2026) automatically sets the "Closing Stock On" month to the preceding period (February 2026) and loads its final computed stock balance dynamically as the starting ledger stock.
- Implemented **Smart Edit Protections** on Last Closing Stock: editing is locked if historical entries exist in the preceding month (marked as "Auto-calculated"), while manual input remains fully editable via the pencil icon if no logs exist.
- Implemented a **Mandatory Starting Stock Initialization Popup Modal**: triggers if the user views a range whose preceding month has neither logs nor a saved starting balance, forcing them to initialize the balance with a valid value, and includes a **Cancel** option that dismisses the prompt for the current selection so the user can easily switch sizes or adjust ranges.
- Configured **Last Closing Stock Dash Indicator**: displaying a dash (`-`) in the starting stock display area if it has not been initialized yet, prompting the user to edit and fill it.
- Added a new **Import / Export** action card to standard detail pages, styled with a teal theme, configured in a responsive 2x2 grid layout alongside Production, Dispatch, and Daily Stock cards.
- Implemented the **Import / Export Dashboard Panel Layout**: includes descriptive subheadings, drag-and-drop file upload dropzone mockup (Import option), and report category selection checkmarks (Export option).
- Integrated **Tabbed Excel Import & Split Templates**: separated Production and Dispatch into individual uploader tabs inside the Import section. Added custom single-sheet template downloads (`Production_Template.xlsx` and `Dispatch_Template.xlsx`) preconfigured with standard-specific sizes.
- Fixed **Dispatch Uploader Derived Calculations**: parses dispatch imports, looks up corresponding production quantities from the database in state, and automatically calculates derived fields (`prodRoll`, `prodMtr`, `closeMtr`, etc.), resolving display blanks (`m`) and incorrect totals (`0R-2`).
- Configured **SMS Module-Wide DD/MM/YYYY dates**: formats dates displayed in tables, download templates, and bulk data exports to the `DD/MM/YYYY` format while preserving `YYYY-MM-DD` internally for sortability.
- Integrated **Multi-Size Export Selection Dropdown**: added a premium dropdown selection menu with select multiple option inside the Export Options card, replacing the left sidebar on the Import/Export panel, allowing users to customize which sizes to export.
- Configured **Multi-Sheet Size-Separated Excel Export**: handles exporting Production logs, Dispatch sheets, and Daily stock ledgers separated by sheet per selected size (e.g. `Prod - [Size]`, `Disp - [Size]`, `Stock - [Size]`) inside a single `.xlsx` workbook, respecting Excel's 31-character sheet name limits and character restrictions.
- Created the **Universal Bulk Data Center Dashboard**: removed individual standard-level import/export cards and panels, and created a single, unified Universal Data Center at the bottom of the main Stock Management Hub.
- Implemented **Smart Universal Excel Import**: parses a single master sales sheet containing mixed product transactions, automatically maps item names to the correct standard and size using regex-based classification, and saves them to local storage.
- Implemented **Option B Size Enforcement**: checks if parsed items are configured in the standard settings. If not, skips the row and warns the user in a detailed, scrollable warning modal listing skipped rows and reasons.
- Implemented **Daily Invoice Grouping (Date + Size + MIS Type)**: groups daily dispatch rows by Date, Size, and MIS Type, automatically summing quantities, ignoring party names (forcing them to `"FARMER"`), and formatting the bill number field as `[FirstInvoice]-[LastInvoice]-[MisType]`.
- Implemented **Universal Export Panel**: allows exporting multiple selected standards, standard-specific sizes (via checklist dropdowns), and selected logs (Production, Dispatch, Daily Stock) into a single, multi-sheet, consolidated Excel workbook.
- Configured **Excel Bulk Data Export**: compiles and exports Production Logs, Dispatch Sheets, and daily chronological stock ledgers as structured worksheets in a single `.xlsx` workbook.
- Configured automatic meters calculation (`Coils * MtrPerCoil`) and responsive input fields (Date, Size, Coils, MTR, KG, Value) with number input spinners (scrolling increment arrows) and mouse scroll-wheel value modifications disabled globally for a cleaner, key-driven UX.
- Added dynamic table columns, data persistence across reloads, summary totals row, and entry deletion.
- Integrated the exact sizes and classes for all 6 IS standards (IS 13488, IS 13487, IS 12786, IS 4985, IS 17425, IS 14483) into the vertical sizing sidebar.
- Configured dynamic under-development panels on the right side which update when sizes or classes are toggled by the user.
- Added **Production Entry** and **Dispatch Entry** action cards for each IS standard under the SMS module detail panel.
- Created a dedicated standard-specific **Under Development** placeholder page (`SmsUnderDevelopment.tsx`) for the SMS module at `/sms/develop` which dynamically renders action contexts.
- Added a **Switch Module** button in the main layout header to allow users to switch between Reporting and SMS modules.
- Created the **SMS Layout** (`SmsLayout.tsx`) with a dedicated top navigation bar featuring Home, Switch Module, and Logout actions.

### Changed
- Refactored `App.tsx` routing:
  - Welcome portal set to root `/`.
  - SMS module placeholder set to `/sms`.
  - Wrapped all existing Reporting sub-routes (`/reporting`, `/new`, `/saved`, `/data`) under the `Layout` component.
- Updated `Layout.tsx` "Home" navigation link to point to `/reporting` instead of `/` to keep user navigation inside the Reporting module.
- Hidden the **Switch Module** button on all Reporting system tabs except the Home (`/reporting`) tab.
