"use client"

// Empties every client-side cache of user data.
//
// All of these are module-level singletons that outlive a route change, so
// signing out has to reach each one. Kept in its own file so lib/auth-flow.ts
// does not have to import the whole data layer.

import { resetAllStores } from "@/lib/data/stores"
import { clearSignedUrls } from "@/lib/storage"
import { resetNotificationReads } from "@/lib/use-notifications"
import { resetProfile } from "@/lib/use-profile"
import { resetSelectedYear } from "@/lib/use-selected-year"
import { resetSettings } from "@/lib/use-settings"
import { resetYears } from "@/lib/use-years"

export function clearAllData() {
  resetAllStores()
  resetSettings()
  resetProfile()
  resetYears()
  resetNotificationReads()
  resetSelectedYear()
  // Signed links outlive the session that made them, so a shared machine could
  // otherwise still load the previous account's photos and attachments.
  clearSignedUrls()
}
