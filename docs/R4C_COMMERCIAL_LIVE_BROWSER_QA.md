# Live Aggregation Browser QA

## Authenticated production workspace

Visited `https://r4c.kynox.io/commercial` in the connected user browser. The authenticated production workspace loaded successfully for the Alomran Development tenant. The deployed screen remains the prior accepted frontend: executive metrics are still labeled as portfolio/current-view values, the context bar is not showing the new governed-live state, and the production decision queue remains the pre-live snapshot implementation. No production records were changed.

## Local preview after live integration

Visited the exposed local preview in the connected browser after restarting the Next.js renderer from a clean process. The styled redesign rendered correctly. The preview route correctly retained preview provenance and showed `Preview`, `Review preview queue`, and a governed-exception empty state without calling the live API.

The Project & unit control workflow remained reachable. It showed the working context, project/floor navigation, unit table, status legend, selected-unit drawer, progressive-disclosure sections, and Record interest/Create reservation actions.

Arabic mode was switched successfully. The page localized executive labels, decision-queue headings, inventory labels, and closing summary text while preserving canonical identifiers/currencies. Text extraction confirms Arabic coverage; the browser screenshot upload failed for that action, so the RTL visual arrangement should be rechecked after deployment.

## Interpretation

The frontend integration is safe in preview and the production browser confirms the deployed app is still on the previous commit. Live API behavior requires deployment of the backend/frontend branch before production can show governed-live freshness and deterministic exceptions.
