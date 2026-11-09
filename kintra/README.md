# KINTRA: workforce management template

*Your people. Your operations. In sync.*

KINTRA is a workforce management and people operations workspace for businesses with shift-based, hourly or salaried teams. It covers restaurants, retail, hotels, clinics, logistics and multi-location companies. It is a working front-end template. Every screen is driven by one shared data layer, and the demo company is fictional.

Live: <https://www.cielafrica.com/kintra>

## Demo company

**Kijani Hearth Hospitality** is fictional. Its demo data includes:

- Four Nairobi locations: Westlands, Kilimani, Karen and a Central Kitchen.
- Five departments and 43 employee records (one onboarding, one who has left).
- Eleven sign-in users across the eight roles.
- Ten weeks of shifts and matching clock records.
- Time-off requests, seven job openings (four open) with 22 candidates, and five fortnightly pay periods.

Everything is generated around the visitor's "today", so the current week is always live.

The records are consistent with each other:

- Shifts point at real employees.
- Attendance comes from those shifts.
- Approved leave turns the employee's shifts into open shifts and shows on their profile and in the schedule.
- Payroll hours are the approved clock records.
- A hired candidate becomes an employee with an onboarding checklist.

Contact details use `.example` email domains and `+254 000 …` numbers, which can't belong to anyone.

Use **Reset** in the top bar to restore the demo. Use the account menu to switch user and see each role's view.

## What works

| Area | What it does |
|---|---|
| Overview | People working now, scheduled today, open shifts, late arrivals, absences and pending time off. Also a timeline of today's team (a list on phones), a needs-attention queue, staffing coverage, payroll deadlines and recent activity. Filters for date, department and team. Employees get their own home: today's shift, time clock, balances and upcoming shifts. |
| Scheduling | Day, week and list views; filters by location, department, role, employee and state. The editor validates shifts, including overnight shifts, breaks and payroll-locked periods. It warns about overlaps, rest periods, weekly hour limits, approved leave and role fit. Also: drag and drop (saved to the data, with undo), duplicate, cancel with a reason, copy week, publish, open shifts with suggested people, and coverage against staffing requirements per role and time window. |
| Attendance | Scheduled versus actual times, exceptions (late, left early, missed in or out, absent, unscheduled) and break records. Timesheet approval, one by one or in bulk. Corrections require a reason and leave an audit trail. CSV export. |
| Time clock | Clock in and out, start and end a break, today's hours and recent timesheets. Location checks (GPS), biometric devices and kiosks are listed as future options, not active features. |
| Time off | Balances, requests (including half days), cancelling a pending request and approvals. Decline needs a reason. The approval card shows the employee's shifts, coverage gaps and overlapping requests. Team calendar. Leave types and rules are configurable. |
| Hiring | Pipeline board (drag or stage buttons), candidate profile, notes, interviews, CV upload and history, job openings and a hire flow that creates the employee. A public careers page posts applications into the pipeline. |
| Employees | Directory in table or cards with search, filters and sorting. Profile tabs: overview, employment, schedule, attendance, time off, documents, pay and activity. Add or edit records, onboarding checklist and ending employment. Personal data and pay are shown only to roles allowed to see them. |
| Payroll | Pay periods and a step-by-step run: review timesheets, calculate, check flags, approve, record payment. Each record can be opened to see its figures. Summary and detail CSVs. The person who calculates a run cannot approve it. |
| Reports | Attendance and absence, scheduled versus actual, labour cost, overtime, leave use, staffing coverage, recruitment, headcount and payroll summary. Date range, department and location filters change the figures. CSV export and print. |
| Settings | Organisation, locations and location rules, departments and roles, scheduling rules, staffing requirements, leave policy and holidays, approval workflows, payroll rules, notifications, users and access, and demo data. |
| Shell | Collapsible sidebar, mobile bottom bar, location selector (filters every module), search (Ctrl/⌘ K), notification centre with read state and links, breadcrumbs, and user and role switching. |

## Roles

The eight roles are Owner, Administrator, HR Manager, Operations Manager, Location Manager, Recruiter, Payroll Manager and Employee.

Permissions are defined in `js/policy.js`. Each user also has a set of locations. Location-scoped permissions, such as scheduling, attendance and time-off approval, only apply inside those locations.

**Every write in `js/store.js` checks the policy before it changes anything.** Hiding a button is never the only protection: calling the store from the console is refused the same way.

Employees can't see payroll, HR controls or colleagues' personal details.

## Rules are settings, not law

- **Overtime, rest and shift rules.** Weekly hour limits, minimum rest, shift length and break rules, and the late grace period are organisation settings. Each location can override them.
- **Leave.** Leave types, yearly allowances, whether a note is required and how days are counted (weekdays, Monday to Saturday or calendar days, excluding public holidays) are policy settings, not statutory tables for any one country. Accrual and carry-over aren't modelled yet.
- **Payroll deductions.** These are configurable rules (percentage, fixed or bands) and are labelled as examples. Confirm current statutory rates with a payroll professional before using real figures.
- **Payments.** KINTRA records payroll; it doesn't pay anyone. A run is marked paid only when a user enters the payment date and a bank or provider reference and confirms that it was paid outside KINTRA.

## Architecture

Vanilla JS, no build step, under the `KT` namespace.

- `js/rules.js`: pure business rules with no DOM access. They cover dates and overnight spans, shift validation, coverage, attendance evaluation, leave days and balances, and the payroll calculation. The file is UMD, so it runs in Node too.
- `js/policy.js`: roles, permissions and location scope (UMD).
- `js/data.js`: the seeded demo company.
- `js/store.js`: the service layer and the only module that changes data. Each write checks permission, validates, writes, records an audit event and creates real notifications, then saves.
- `js/ui.js`, `js/charts.js`: components (tables, modals, badges, toasts, menus) and dependency-free SVG charts.
- `js/app.js`: shell, router, navigation counts, search, notifications and location scope. `js/pages-*.js` holds one module per section.

## Persistence: what this template is and isn't

This is a **single-browser prototype**. Records are saved in the visitor's `localStorage` (`kintra:demo:v1`) and uploaded files in IndexedDB. Nothing leaves the browser: no emails, SMS or payments are sent. Two people on two devices do not share data.

That is right for a demo anyone can try without affecting anyone else. It is **not** suitable for real employee, scheduling or payroll records.

## Path to production

1. **Server and database.** Put `store.js` behind an API backed by Postgres (or similar), with every table scoped by `organisation_id`. The data model maps directly to tables:
   - organisations, locations, departments, teams and job roles;
   - users, employees, shifts, time entries and leave requests;
   - jobs, candidates, pay periods and payroll records;
   - notifications and audit events.
2. **Enforce on the server.** Run `policy.js` and `rules.js` in the API for every request, the same files the browser uses. The browser copy then only shapes the interface.
3. **Authentication.** Real sign-in, invitations by email and sessions. Optionally SSO for larger customers.
4. **Notifications.** Send the in-app events by email, SMS or push through a provider, from a job queue.
5. **Files.** Store CVs and documents in object storage with signed URLs and access checks.
6. **Payroll adapters.** Implement country rules as configurable deduction sets reviewed by a payroll professional. Export to the customer's payroll provider or bank file format. No bank, tax authority or payment integration exists in this template.
7. **Time clock hardware.** GPS checks, kiosks or biometric terminals can feed the same time-entry API.

## Credentials this depends on

None to run the template. A production build needs a database, an auth provider, an email or SMS provider, object storage and a job runner.
