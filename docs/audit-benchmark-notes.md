# Benchmark evidence notes

## Reterra

The official Reterra site describes an all-in-one Saudi proptech platform for developers, operators, and communities. Observed claims include listings, lead tracking, automated maintenance, access control, Arabic-first experience, KSA compliance, centralized sales management, analytics and forecasts, digital contracting with Nafath where enabled, and modular products for sales, resident experience, analytics, and smart access. These are vendor-published claims and should be marked as documented rather than independently verified.

Source: https://reterra.io/

## Salesforce real-estate CRM

Salesforce's official real-estate CRM guide describes centralized contact management, unified customer profiles, AI-assisted lead qualification, lead scoring, sales forecasts, automation and personalized journeys, task management, reporting and analytics, mobile access, and integrations. These are documented capabilities in Salesforce's own guide, not direct observations of a tenant configuration.

Source: https://www.salesforce.com/crm/real-estate-crm/

## Oracle Primavera Unifier Real Estate Management

Oracle's official documentation describes portfolio management for leased and owned properties, leases, transactions, real-estate data, utilities and energy consumption, configurable business processes, portfolio visibility, acquisitions, construction, dispositions and financing transactions, alerts, approvals, drill-down dashboards, KPI charting, occupancy levels and demand forecasts.

Source: https://docs.oracle.com/cd/F50962_01/English/User_Guides/fam/10285651.htm

## Yardi

Yardi's official site positions its platform around integrated property management, accounting, tenant services, investment management, asset performance, procurement, analytics, mobile operations and leasing across multiple markets. It also describes portfolio-level investment management, financial reporting, debt oversight and AI capabilities. These are documented vendor-level capabilities, not direct observations of a configured implementation.

Source: https://www.yardi.com/

## R4C source audit anchors

The current source has a bilingual commercial suite in `apps/web/components/CommercialWorkspaceSuite.tsx` with four tabs: executive overview, project and unit control, title transfer file, and sales operations. The suite contains hardcoded project, unit, and transfer arrays. The export report control has no action. The preview sales-operations workflow uses local state and simulated notices; production uses `CommercialOperatorWorkspace` instead. The live operator workspace is connected to the commercial API for leads, activities, units, prices, payment plans, holds, and reservation confirmation. The production route was inaccessible without authentication and redirected to `/login`.

