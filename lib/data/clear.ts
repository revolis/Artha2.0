"use client"

// Empties every client-side cache of user data.
//
// All of these are module-level singletons that outlive a route change, so
// signing out has to reach each one. Kept in its own file so lib/auth-flow.ts
// does not have to import the whole data layer.

import { resetAllStores } from "@/lib/data/stores"
import { resetProfile } from "@/lib/use-profile"
import { resetSettings } from "@/lib/use-settings"
import { resetYears } from "@/lib/use-years"

export function clearAllData() {
  resetAllStores()
  resetSettings()
  resetProfile()
  resetYears()
}
