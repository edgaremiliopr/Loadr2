# Florida Research Status

Date: 2026-03-04

## What is in this batch

- `florida_carriers_research.csv`: public-web verified carriers in Florida advertising truck-mounted forklift / piggyback / Moffett-style self-unload capability.
- `florida_shippers_research.csv`: Florida shippers with strong fit for direct-to-jobsite freight brokerage, especially scaffold, lumber, truss, steel, roofing and specialty building products.
- `florida_excel_leads_review.csv`: review of the two Excel lead files, with each lead classified as usable carrier, shipper prospect, false positive, broker/3PL, or out-of-state.
- `florida_scaffold_branches.csv`: branch-level file for scaffold companies in Florida so outreach can be run by branch, not just parent company.

## What is verified vs partial

- `verified`: official company page was found with usable contact info and/or a direct capability signal.
- `partial`: official site was found, but branch address, buyer contact, dispatch contact, or freight-ownership signal still needs phone or email verification.

## Current totals

- `8` carriers
- `38` shippers
- `35` scaffold branches

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

## Highest-value next expansion

1. Jacksonville and Panhandle carriers with mounted-forklift capability
2. statewide builder-supply and roofing branches beyond the current core set
3. branch-level contacts for truss / scaffold / builder-supply manufacturers and distributors

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
