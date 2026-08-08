// Help content shared by the Help Centre page and the Settings FAQ panel, so
// the two never drift apart.

export interface HelpArticle {
  q: string
  a: string
}

export interface HelpCategory {
  id: string
  title: string
  description: string
  articles: HelpArticle[]
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "The basics of putting your money into Artha.",
    articles: [
      {
        q: "How do I add my first entry?",
        a: "Use Add Entry on the Dashboard or the Entries page. Pick a date and time, choose a type, then add an amount. Category, tags, source and notes are optional — you can fill them in later.",
      },
      {
        q: "Why is everything entered by hand?",
        a: "Because automated imports miss exactly the entries that matter most: a peer-to-peer trade at a rate you negotiated, freelance income, cash settled in person. Entering them yourself takes a minute and produces a ledger that matches what actually happened.",
      },
      {
        q: "What do the entry types mean?",
        a: "Profit and Loss are money earned or lost. Fee and Tax are costs. Fiat/P2P is converting between USD and cash. Transfer is moving money without gaining or losing any.",
      },
      {
        q: "What is a source?",
        a: "Wherever the money came from — an exchange, a platform, a person, or a campaign. Sources can hold a social handle, a platform link and a campaign link, and you create them as you go.",
      },
    ],
  },
  {
    id: "money-maths",
    title: "How the numbers work",
    description: "What counts towards which figure, and why.",
    articles: [
      {
        q: "Why do my totals ignore Fiat/P2P entries?",
        a: "Converting USD to cash moves money between forms rather than earning or losing it, so it never counts as profit or loss. It does affect your portfolio value, since that money has left your USD balance.",
      },
      {
        q: "How is portfolio value calculated?",
        a: "Net income minus the USD you sold for cash, plus the USD you bought back. Gross portfolio value is the same figure before any cash movement — the gap between the two is exactly your P2P activity.",
      },
      {
        q: "What is net income versus gross income?",
        a: "Gross income is everything you earned. Net income is what is left after losses, fees and tax are taken off.",
      },
      {
        q: "How does the heatmap decide a day's colour?",
        a: "By that day's net: profit minus loss. Green means you finished the day up, red means down, and the shade scales against your biggest day of the year.",
      },
    ],
  },
  {
    id: "planning",
    title: "Goals and planning",
    description: "Targets, timeframes and staying on pace.",
    articles: [
      {
        q: "What does the gauge on a goal show?",
        a: "Three parts: how much is completed, how much remains, and — once you pass the target — how far past it you went. The centre reads the amount reached and the percentage of the target it represents.",
      },
      {
        q: "Can a goal cover any period?",
        a: "Yes. Pick This Month, This Quarter, This Year, or set a custom from and to date for anything else.",
      },
      {
        q: "What does pinning a goal do?",
        a: "Show in Dashboard puts that goal on the dashboard alongside your other figures. Everything else stays on the Goals page.",
      },
    ],
  },
  {
    id: "data",
    title: "Reports and your data",
    description: "Getting figures out, and where they live.",
    articles: [
      {
        q: "How do I get my data out?",
        a: "Reports exports everything, or a filtered slice, as PDF, CSV or JSON. Every export carries your logo, the period it covers and your totals.",
      },
      {
        q: "Can I change the currency everything is shown in?",
        a: "Yes — Settings, then General, then Display currency. Every amount across Artha converts to it, including charts, reports and goals.",
      },
      {
        q: "What happens when I delete a year?",
        a: "Every entry dated in that year is removed along with the tab. You are prompted to export first, and have to hold the delete button for four seconds.",
      },
      {
        q: "Where is my data stored?",
        a: "During this preview it stays in the browser you entered it in, which is why the exports are worth using. Accounts and synced storage are the next thing being built.",
      },
    ],
  },
]

/** A flat list, for search and for the shorter Settings panel. */
export const HELP_ARTICLES: HelpArticle[] = HELP_CATEGORIES.flatMap(
  (category) => category.articles
)
