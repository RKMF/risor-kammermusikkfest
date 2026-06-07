Debug an issue: $ARGUMENTS

**Mode:** Investigate first, then implement the smallest fix that holds up under verification.

## Use This When
- a bug needs reproduction and root-cause analysis
- behavior differs between expected and actual output
- you need a disciplined path from evidence to fix

## Step 1: Reproduce and Gather Evidence
- identify the smallest reliable reproduction
- capture the exact error, log output, or broken UI state
- note timing, environment, and boundary conditions

## Step 2: Trace and Form a Hypothesis
- follow the path from trigger to failure
- compare working and broken states
- inspect recent relevant changes if the regression is recent
- state the most likely root cause in one sentence

## Step 3: Verify the Hypothesis
- add temporary diagnostics only if needed
- confirm the suspected root cause before changing logic
- if the hypothesis fails, return to Step 2

## Step 4: Fix With Minimal Scope
- make the smallest change that addresses the root cause
- avoid opportunistic refactors unless they are necessary for the fix

## Step 5: Verify the Fix
- retest the original reproduction
- test the closest related path that could regress
- run typecheck, build, or targeted verification if the change touches shared logic

## Step 6: Prevent Recurrence
- search for the same pattern elsewhere if the bug suggests duplication
- add a brief code comment or doc note only if the behavior is easy to misread later
