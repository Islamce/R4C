# Software supply-chain security

Phase 13 makes known-vulnerability and secret detection part of the release gate.

## Blocking security workflow

The dedicated `Security` workflow runs on every pull request, every push to `main`, weekly, and by manual dispatch. It blocks on:

1. frozen pnpm installation;
2. production JavaScript dependency advisories at high or critical severity;
3. resolved Python dependency advisories;
4. repository dependency, secret, and configuration findings;
5. BIM worker container vulnerabilities, embedded secrets, and misconfiguration at high or critical severity.

Unfixed findings are reported but do not block a release until an upstream fix exists. Any exception must be specific, time-bounded, linked to a risk decision, and removed when the fix becomes available.

## SBOM evidence

Every security run generates a CycloneDX repository software bill of materials and retains it as a workflow artifact for 30 days. Release evidence should record:

- release commit SHA;
- security workflow run;
- SBOM artifact digest;
- scanner versions;
- approved exceptions, if any.

## Dependency maintenance

Dependabot checks four ecosystems every Monday in the Riyadh timezone:

- pnpm/npm workspace dependencies;
- BIM worker Python dependencies;
- BIM worker base images;
- GitHub Actions.

Updates are grouped by ecosystem to reduce noise while retaining independent container update review.

## Container controls

The BIM worker image:

- uses a non-root runtime user;
- has a minimized Docker build context;
- is rebuilt before every image scan;
- must pass high/critical vulnerability, secret, and configuration scanning.

## Exception policy

Do not add broad ignore rules. A vulnerability exception must include:

- advisory identifier;
- affected component and exposure assessment;
- compensating control;
- owner;
- approval reference;
- expiry date no longer than 30 days;
- tracked remediation action.

Expired exceptions fail the release review even if the scanner technically accepts the ignore file.
