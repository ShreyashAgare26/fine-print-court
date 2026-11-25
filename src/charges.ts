// The rules of the court: find the worst clauses in a Terms of Service or privacy policy. No DOM, so it runs in tests too.
// ponytail: keyword rules, so unusual wording slips through. Add an LLM pass (Claude API) when this misses too much.

export interface Rule {
  id: string;
  /** Finishes "accused of ...". */
  charge: string;
  /** Any of these, on one sentence, is a match. */
  tests: RegExp[];
  /** 1 = standard boilerplate, 5 = genuinely bad for you. */
  severity: 1 | 2 | 3 | 4 | 5;
  /** What you're really agreeing to, in plain English. */
  plain: string;
  /** The clause's weaselly defence. */
  defence: string;
  /** "We never sell your data" is a promise, not an offence: skip sentences that deny it. */
  denyable?: boolean;
}

// Each test is matched against one sentence, so `[^.]{0,N}` keeps both halves in the same sentence.
export const RULES: Rule[] = [
  { id: "sell", denyable: true, charge: "selling your personal data", severity: 5,
    tests: [/\b(sell|rent|trade)\b[^.]{0,80}\b(personal|your)\s+(data|information)/i, /\b(data|information)\b[^.]{0,60}\b(sold|sell)\b/i],
    plain: "They can sell information about you to other companies.",
    defence: "I said 'trusted partners'. Trust is right there in the name." },
  { id: "biometric", denyable: true, charge: "collecting your face and voice", severity: 5,
    tests: [/\b(biometric|face ?prints?|facial (recognition|geometry)|voice ?prints?)\b/i],
    plain: "They can collect measurements of your face or voice, which you can never change like a password.",
    defence: "Your face was just sitting there. In public. On your head." },
  { id: "location", denyable: true, charge: "tracking where you go", severity: 4,
    tests: [/\b(precise |exact |gps |geo-?)?location\b[^.]{0,100}\b(collect|share|track|use|partners|third)/i, /\b(collect|share|track)\b[^.]{0,80}\b(precise |exact |gps |geo-?)location\b/i],
    plain: "They can record where your phone is and use or share it.",
    defence: "I only follow you around because I care." },
  { id: "ai", denyable: true, charge: "feeding your stuff to their AI", severity: 4,
    tests: [/\b(train|training|improve|develop)\b[^.]{0,80}\b(artificial intelligence|machine learning|AI|models?)\b/i],
    plain: "Your posts, photos or messages can be used to train their AI.",
    defence: "Your selfies are helping the robots learn. You should be proud." },
  { id: "license", charge: "taking a forever license to your content", severity: 4,
    tests: [/\b(worldwide|perpetual|irrevocable)\b[^.]{0,100}\blicen[cs]e\b/i],
    plain: "They can use, copy and show anything you upload, anywhere, forever, without paying you.",
    defence: "You still own it! I'm just allowed to do everything with it, forever." },
  { id: "share", denyable: true, charge: "handing your data to advertisers", severity: 4,
    tests: [/\b(share|disclose|provide|transfer)\b[^.]{0,80}\b(third[- ]part(y|ies)|advertis(ers|ing partners)|marketing partners|data brokers)\b/i],
    plain: "Other companies, including advertisers, can get your data.",
    defence: "Sharing is caring. My partners care about you very much." },
  { id: "retain", denyable: true, charge: "keeping your data after you delete it", severity: 4,
    tests: [/\b(retain|keep|store|preserve)\b[^.]{0,120}\b(after|even if|following)\b[^.]{0,60}\b(delet|terminat|clos|cancel)/i],
    plain: "Deleting your account doesn't delete everything. They can keep copies.",
    defence: "Deleted is a strong word. I prefer 'resting'." },
  { id: "arbitration", charge: "blocking you from court", severity: 4,
    tests: [/\b(binding|mandatory|individual)? ?arbitration\b/i],
    plain: "If something goes wrong, you can't sue them in a normal court. A private arbitrator decides instead.",
    defence: "Courts are so stuffy. Let's settle this somewhere cosier. My place." },
  { id: "classaction", charge: "banning group lawsuits", severity: 4,
    tests: [/\bclass[- ]action\b/i, /\bclass,? collective,? or representative\b/i],
    plain: "You can't team up with other users to sue them. Everyone has to fight alone.",
    defence: "Group projects never work out anyway." },
  { id: "tracking", denyable: true, charge: "following you around the internet", severity: 3,
    tests: [/\b(cookies|pixels|web beacons|tracking technologies|SDKs?)\b[^.]{0,120}\b(other (websites|sites|apps|services)|across)\b/i, /\bacross (other |third[- ]party )?(websites|sites|apps|devices|services)\b/i],
    plain: "They track what you do on other websites and apps, not just theirs.",
    defence: "I wasn't following you. We just kept ending up on the same websites." },
  { id: "scan", denyable: true, charge: "reading your messages", severity: 3,
    tests: [/\b(scan|analy[sz]e|review|monitor|access)\b[^.]{0,60}\b(messages|communications|chats|private content|photos|files)\b/i],
    plain: "They can look through what you send and store, often with software.",
    defence: "I read your messages for quality purposes. Mostly the juicy ones." },
  { id: "contacts", denyable: true, charge: "copying your address book", severity: 3,
    tests: [/\b(contacts|address book|phone ?book|contact list)\b/i],
    plain: "They can upload your contacts, so people who never signed up end up in their records too.",
    defence: "Your friends wanted to be here. They just didn't know it yet." },
  { id: "changes", charge: "changing the rules whenever it wants", severity: 3,
    tests: [/\b(modify|change|update|amend|revise)\b[^.]{0,80}\b(terms|agreement|policy)\b[^.]{0,120}\b(any ?time|sole discretion|without (prior )?notice)/i,
      /\b(any ?time|sole discretion)\b[^.]{0,80}\b(modify|change|update|amend|revise)\b[^.]{0,60}\b(terms|agreement|policy)\b/i,
      /\bcontinued use\b[^.]{0,80}\b(accept|constitutes|agree)/i],
    plain: "They can change these terms later, and just using the app counts as agreeing.",
    defence: "I told you about the changes. On page 47. In grey text." },
  { id: "terminate", charge: "deleting your account for no reason", severity: 3,
    tests: [/\b(terminate|suspend|disable)\b[^.]{0,100}\b(any ?time|any reason|no reason|without (prior )?notice|sole discretion)/i],
    plain: "They can shut down your account whenever they like, without warning or explanation.",
    defence: "It's not you, it's me. Actually, it's you." },
  { id: "jury", charge: "waiving your right to a jury", severity: 3,
    tests: [/\bwaive\b[^.]{0,60}\b(jury|right to (a )?trial)\b/i, /\bjury trial\b[^.]{0,40}\bwaive/i],
    plain: "You give up your right to have a jury decide a case against them.",
    defence: "Twelve strangers judging me? Rude. Present company excepted, your honour." },
  { id: "renew", charge: "renewing your subscription quietly", severity: 3,
    tests: [/\b(automatic(ally)?[- ]renew|auto[- ]renew|renew automatically)/i],
    plain: "Your subscription keeps charging you until you remember to cancel.",
    defence: "You looked so happy paying. I didn't want to interrupt." },
  { id: "liability", charge: "dodging responsibility", severity: 2,
    tests: [/\b(not|never) (be )?(liable|responsible)\b/i, /\blimitation of liability\b/i, /\bas is\b/i],
    plain: "If the service breaks, loses your stuff or causes harm, they owe you very little or nothing.",
    defence: "Accidents happen. Mostly to you." },
  { id: "indemnify", charge: "making you pay its legal bills", severity: 2,
    tests: [/\bindemnif(y|ication)\b/i, /\bhold (us )?harmless\b/i],
    plain: "If someone sues them because of something you did, you may have to pay their legal costs.",
    defence: "If I get in trouble, you get in trouble. That's friendship." },
  { id: "merger", charge: "selling you along with the company", severity: 2,
    tests: [/\b(merger|acquisition|bankruptcy|sale of (all|some|substantially all)|change of control)\b/i],
    plain: "If the company is sold or goes bust, your data goes to the new owner.",
    defence: "If I move house, you come with the furniture." },
  { id: "abroad", charge: "shipping your data overseas", severity: 2,
    tests: [/\b(transfer|store|process)\w*\b[^.]{0,80}\b(outside (of )?your|other countries|countries other than|outside the (EEA|EU|European))/i],
    plain: "Your data may be stored in other countries with weaker privacy laws.",
    defence: "Your data deserves a holiday too." },
  { id: "refunds", charge: "keeping your money", severity: 2,
    tests: [/\b(non-?refundable|no refunds?|not (be )?refundable)\b/i],
    plain: "Once you've paid, you usually can't get your money back.",
    defence: "All sales are final. Like this trial, hopefully." },
  { id: "police", charge: "chatting with the authorities", severity: 1,
    tests: [/\b(law enforcement|government (agencies|authorities|requests))\b/i],
    plain: "They may hand your data to police or governments when asked. Most apps say this.",
    defence: "I only talk to the police when they ask nicely. Or at all." },
];

/** "4.3 We may..." reads better in court as "We may...". */
const LEAD_NUMBER = /^\s*(?:(?:section|clause|article)\s+)?\d{1,2}(?:\.\d{1,2}){0,3}[.):]?\s+/i;
const DENIAL = /\b(do not|does not|don't|doesn't|never|will not|won't|cannot|can't)\b/i;

export interface Charge {
  rule: Rule;
  /** "Clause 14.2", or "Paragraph 6" when the policy isn't numbered. */
  label: string;
  /** The offending sentence, trimmed to something a voice can read. */
  quote: string;
  /** Position of the sentence in the document, for ordering ties. */
  at: number;
}
export interface Case {
  company: string;
  /** Worst first. */
  charges: Charge[];
  grade: Grade;
}
export type Grade = "A" | "B" | "C" | "D" | "E";

const SECTION = /^\s*(?:(?:section|clause|article)\s+)?(\d{1,2}(?:\.\d{1,2}){0,3})[.):]?\s+\S/i;
/** Trims a sentence to about `max` characters at a word boundary. */
export function trimQuote(s: string, max = 190): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max), sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[,;:\s]+$/, "") + "…";
}

/** Splits a policy into sentences, each tagged with the section it sits in. */
export function sentences(text: string): { label: string; text: string }[] {
  const out: { label: string; text: string }[] = [];
  let section = "", para = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    para++;
    const m = SECTION.exec(line);
    if (m) section = m[1];
    // Don't split on "e.g." / "i.e." / "Inc." or decimals like 14.2
    const parts = line.replace(/\b(e\.g|i\.e|etc|inc|ltd|co|vs|no)\./gi, "$1․").split(/(?<=[.!?])\s+(?=[A-Z"“(])/);
    for (const p of parts) if (p.trim().length > 12) out.push({ label: section ? `Clause ${section}` : `Paragraph ${para}`, text: p.replace(/․/g, ".") });
  }
  return out;
}

export function gradeOf(charges: Charge[]): Grade {
  const pts = charges.reduce((s, c) => s + c.rule.severity, 0);
  return pts <= 2 ? "A" : pts <= 8 ? "B" : pts <= 16 ? "C" : pts <= 26 ? "D" : "E";
}

/**
 * Does the sentence commit the offence? For rules a policy can deny, a negation counts only when it sits in the match
 * or just before it: "we never sell your data" is a denial, but "we share it with advertisers and you cannot opt out" is not.
 */
function commits(rule: Rule, text: string): boolean {
  return rule.tests.some(t => {
    const m = t.exec(text);
    if (!m) return false;
    return !(rule.denyable && DENIAL.test(text.slice(Math.max(0, m.index - 25), m.index + m[0].length)));
  });
}

/** Every rule that matches, once each, at its first matching sentence. Worst first; ties keep document order. */
export function prosecute(text: string, company = ""): Case {
  const found: Charge[] = [];
  const sents = sentences(text);
  for (const rule of RULES) {
    const at = sents.findIndex(s => commits(rule, s.text));
    if (at >= 0) found.push({ rule, label: sents[at].label, quote: trimQuote(sents[at].text.replace(LEAD_NUMBER, "")), at });
  }
  found.sort((a, b) => b.rule.severity - a.rule.severity || a.at - b.at);
  return { company: company.trim() || guessCompany(text), charges: found, grade: gradeOf(found) };
}

/** Words policies define in quotes that are not the company: ("Terms"), ("Services"), ("you")... */
const DEFINED_TERMS = /^(terms|terms of service|agreement|services?|policy|privacy policy|site|website|app|application|platform|content|user|you|we|us|our|account|data)$/i;
/**
 * "Glimmer" from '... between you and Glimmer Labs Inc. ("Glimmer")'. A quoted short name is preferred when it isn't a
 * defined term; otherwise the name after "between you and" / "welcome to". Falls back to a generic name.
 */
export function guessCompany(text: string): string {
  for (const m of text.matchAll(/\(\s*["“]([A-Z][\w&' -]{1,30})["”]/g)) if (!DEFINED_TERMS.test(m[1].trim())) return m[1].trim();
  const m = /\b(?:welcome to|between you and)\s+([A-Z][\w&'-]*(?: [A-Z][\w&'-]*){0,2})/.exec(text);
  return m ? m[1].trim().replace(/\s+(Inc|Ltd|LLC|Corp)$/, "") : "The App";
}

/** How many charges go on trial in the courtroom; the rest are listed in the report. */
export const TRIAL_SIZE = 5;
