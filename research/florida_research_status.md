# Florida Research Status

Date: 2026-03-04

## What is in this batch

- `florida_carriers_research.csv`: public-web verified carriers in Florida advertising truck-mounted forklift / piggyback / Moffett-style self-unload capability.
- `florida_carrier_verification_targets.csv`: carrier-only prospects that may be worth calling, but currently lack explicit public forklift-on-truck confirmation.
- `florida_private_fleet_excluded.csv`: fleets confirmed as shipper/distributor internal operations and therefore excluded from broker carrier prospecting.
- `florida_private_fleet_targets_scrapling.json`: Scrapling pass output used to validate private-fleet signals and identify non-carrier patterns.
- `florida_shippers_research.csv`: Florida shippers with strong fit for direct-to-jobsite freight brokerage, especially scaffold, lumber, truss, steel, roofing and specialty building products.
- `florida_excel_leads_review.csv`: review of the two Excel lead files, with each lead classified as usable carrier, shipper prospect, false positive, broker/3PL, or out-of-state.
- `florida_scaffold_branches.csv`: branch-level file for scaffold companies in Florida so outreach can be run by branch, not just parent company.
- `florida_roofing_builder_branches.csv`: branch-level file for roofing and builder-supply companies in Florida for branch-level outreach and mapping.

## What is verified vs partial

- `verified`: official company page was found with usable contact info and/or a direct capability signal.
- `partial`: official site was found, but branch address, buyer contact, dispatch contact, or freight-ownership signal still needs phone or email verification.

## Current totals

- `8` carriers
- `54` shippers
- `35` scaffold branches
- `19` roofing / builder branches
- `5` low-confidence carrier-only prospects
- `11` private fleets excluded from carrier sourcing

## Current reality

This is a serious statewide batch, but it is not yet exhaustive.

The two Excel files were useful as lead generation, but they contained several categories that should not be merged blindly into a Florida carrier list:

- false positives from keyword matching
- brokers / 3PLs advertising Moffett services
- out-of-state carriers
- building-material shippers that own fleets but are not for-hire carriers

The blocker is not scraping volume alone. The carrier niche is thin on public web signals because many Florida carriers that can self-unload do not clearly advertise:

- truck-mounted forklift
- piggyback forklift
- Moffett / Moffetts
- mounted forklift delivery

For that reason, a credible "all Florida" carrier list requires a second pass using:

1. Google Maps / local business listings by metro and keyword cluster
2. FMCSA / SAFER + company website matching
3. direct phone verification of capability, service radius and broker setup acceptance

## What changed in this pass

- Confirmed and excluded `11` internal fleets from carrier prospecting; they now live in `florida_private_fleet_excluded.csv`.
- Ran a targeted Scrapling pass for private-fleet validation and stored results in `florida_private_fleet_targets_scrapling.json`.
- Expanded Orlando/Central Florida shippers with strong delivery-freight fit:
  - `Master Construction Products` (Orlando/Kissimmee footprint with delivery-fleet signal)
  - `Bedrock Orlando` (explicit delivery radius and outsourced heavy deliveries)
  - `Surplus Steel & Supply` (Apopka-based Central Florida delivery footprint)
- Expanded Orlando-area carrier call list with low-confidence prospects:
  - `Comet Delivery Services`
  - `Ultimate Heavy Hauling Express`
  - plus existing `NEXLIFT`, `ByGrace Transports`, and `428 Transport`

## Highest-value next expansion

1. Continue web research for Florida-based carriers that explicitly market truck-mounted forklift, Moffett, piggyback, or self-unload construction delivery
2. Treat the `5` rows in `florida_carrier_verification_targets.csv` as low-confidence and call only to validate forklift-on-truck assets
3. Keep `florida_private_fleet_excluded.csv` as intelligence only and out of the broker carrier sheet

## Recommended data standard for next pass

For each company, keep:

- company type
- branch / address
- metro / coverage area
- main phone
- direct contact name
- direct contact email
- equipment or work-type signal
- verification status
- source URL
- last verified date
