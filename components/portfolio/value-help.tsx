/**
 * What the two portfolio figures mean, in one place.
 *
 * The dashboard card and the Portfolio page both show the same pair of
 * numbers and both used to explain them in their own words — "Running USD
 * balance: profit adds; loss, fees and tax subtract; selling USD for cash
 * removes it; buying USD adds it back" on one, two shorter lines on the
 * other. Neither reads like something written for a person, and two
 * descriptions of one number can quietly disagree.
 *
 * Written as sentences rather than rules, because the reader is the person
 * who typed the entries, not someone auditing the arithmetic.
 */

export const PORTFOLIO_HELP = {
  gross:
    "Everything you have earned, less everything it cost you — losses, fees and tax. Moving money between USD and cash does not change this number.",
  net: "The same figure, then less the USD you sold for cash and plus any you bought back. This is what is actually left in USD.",
} as const

/** Both figures side by side, for the one help button above the chart. */
export function ChartValueHelp() {
  return (
    <span className="flex flex-col gap-2.5">
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">Gross Portfolio Value</span>
        <span className="text-muted-foreground">{PORTFOLIO_HELP.gross}</span>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">Net Portfolio Value</span>
        <span className="text-muted-foreground">{PORTFOLIO_HELP.net}</span>
      </span>
      <span className="text-muted-foreground">
        {/* Saying what the distance between the lines is turns the chart from
            two curves into one story. */}
        The gap between the two lines is exactly the cash you have moved.
      </span>
    </span>
  )
}
