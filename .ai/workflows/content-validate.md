Validate content consistency for: $ARGUMENTS

**Mode:** Investigation and reporting first. Apply edits only after explicit approval.

## Use This When
- checking performer listings against artist profiles
- validating that event/program text matches structured content
- auditing one document type for repeated content inconsistencies

## Step 1: Define the Validation Target
- identify whether the request is for one document or a broader audit
- query only the fields needed for the check

## Step 2: Extract the Compared Values
- pull the source text or structured content being validated
- pull the canonical profile or reference data it should match
- keep the comparison narrow and explicit

## Step 3: Compare and Classify
Classify each finding as:
- match
- mismatch
- missing source data
- ambiguous and needs human review

## Step 4: Report Before Editing
Present:
- what was checked
- which items matched
- which items differed
- which items were ambiguous
- the minimal edits needed, if any

## Step 5: Apply Only Approved Fixes
If approved:
- patch only the affected draft fields
- preserve unrelated structure and ordering
- re-query the updated fields to verify the change

## Rules
- report findings before making any edits
- patch the minimum necessary fields
- treat Norwegian as source of truth unless the user says otherwise
- keep validation logic explicit; do not infer missing facts without evidence
