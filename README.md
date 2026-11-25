# Fine Print Court

Paste any app's Terms of Service or privacy policy. Its worst clauses stand trial in a 3D courtroom: the Prosecutor reads the charge and the evidence, the clause defends itself, and the Judge gives the verdict in plain English. You leave with a grade (A to E) and a list of what you're really agreeing to.

Built on the arena, characters, voices and camera from [Font Debate](https://font-debate.vercel.app).

## How the court decides

- `src/charges.ts` holds 22 rules for known bad patterns, like selling data, forced arbitration, or keeping data after you delete your account. Each rule has a severity from 1 to 5, a plain-English verdict and a defence line for the clause.
- The policy is split into sentences and tagged with its clause number (like "Clause 14.2"). Each rule is charged once, at the first sentence that matches it.
- Sentences that deny the offence ("we never sell your data") don't count for rules where that matters.
- The 5 worst charges go on trial. The grade comes from the total severity of every charge.
- Everything runs in the browser. Nothing is sent anywhere.

The rules match on keywords, so unusual wording can slip through.

## Run it

```bash
npm install
npm run dev     # open the link it prints
npm test        # checks the rules
npm run build   # makes the files to put online
```
