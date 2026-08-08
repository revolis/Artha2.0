"use client"

import * as React from "react"

import { Check, Eye, EyeOff } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { PASSWORD_RULES, STRENGTH_LABELS, passwordScore } from "@/lib/auth-flow"
import { cn } from "@/lib/utils"

/**
 * A password input that shows its own strength, with the rules listed rather
 * than hidden behind a score — someone who fails a check should be able to see
 * which one.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  showRules = false,
  autoComplete = "new-password",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  showRules?: boolean
  autoComplete?: string
}) {
  const [visible, setVisible] = React.useState(false)
  const score = passwordScore(value)

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••••"
        />
        <InputGroupAddon align="inline-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((open) => !open)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </Button>
        </InputGroupAddon>
      </InputGroup>

      {showRules ? (
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Four segments, one per rule met. */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {PASSWORD_RULES.map((rule, index) => (
                <span
                  key={rule.id}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    index < score ? "bg-[var(--chart-2)]" : "bg-border"
                  )}
                />
              ))}
            </div>
            <span className="w-16 text-right text-[11px] text-muted-foreground">
              {value ? STRENGTH_LABELS[score] : ""}
            </span>
          </div>

          <ul className="flex flex-col gap-1">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(value)
              return (
                <li
                  key={rule.id}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors",
                    met ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "size-3 shrink-0",
                      met ? "text-[var(--chart-2)]" : "text-muted-foreground/40"
                    )}
                  />
                  {rule.label}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </Field>
  )
}
