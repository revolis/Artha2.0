import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored chart library source pulled in from the @bklit registry. It is
    // upstream code we don't hand-maintain, and any re-add would overwrite
    // local edits, so it is linted upstream rather than here.
    "components/charts/**",
    "components/shimmering-text.tsx",
    // Same deal for registry components pulled from lab.moumen.dev.
    "components/lab/**",
    // And for the landing-page pieces from @animate-ui, @sona-ui, @magicui
    // and @gammaui.
    "components/animate-ui/**",
    "components/ui/marquee/**",
    "components/ui/dot-pattern.tsx",
    "components/ui/wave-path.tsx",
    "components/ui/wavy-text-block.tsx",
  ]),
])

export default eslintConfig
