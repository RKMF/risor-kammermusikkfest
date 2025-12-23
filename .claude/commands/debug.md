Debug: $ARGUMENTS

**Mode:** Steps 1-2, 4 work in plan mode (investigate, plan). Exit plan mode at Step 3 to test/fix.

## 1. Reproduce & Evidence
- Can you trigger it consistently? Minimal reproduction?
- Gather: error messages, console logs, network tab
- Look for patterns: timing, frequency, boundary conditions

## 2. Understand & Hypothesize
- Trace code path from trigger to failure
- Compare: what differs between working and broken state?
- Check recent changes: `git log --oneline -10`, consider `git bisect`
- Form hypothesis: where is the bug and why?

## 3. Test Hypothesis
Before writing any fix:
- Add logging/console.log to verify hypothesis
- If hypothesis wrong, return to step 2

## 4. Plan the Fix
Present before implementing:
- **Problem**: [root cause - one sentence]
- **Fix**: [solution approach - one sentence]
- **Risk**: [what could break?]
- **Test**: [how to verify?]

Ask for approval before proceeding.

## 5. Fix & Verify
- Make smallest change that fixes issue
- Test the specific bug is resolved
- Test related functionality didn't break
- Run build/typecheck if applicable

## 6. Prevent Recurrence
- Search for similar patterns: are there other instances?
- Add code comment if pattern could recur
- If complex fix, note in relevant docs
