# Settings Menu Screens & APIs — Implementation Tasks

Parent spec: `spec.md` (same folder)
Scope: 10 tasks total (backend fixes + navigation + 6 new screens + Settings mapping)

---

## Task 1: Backend publicUser expose + blocked endpoint + User model defaults + reviewController bug

**Coverage:** AC-2 (preferences render), AC-4 (me payload keys), AC-5 (blocked list route), AC-9 (rating query), AC-7 NPR default

### Sub-work
1. `Backend/src/models/User.js` — `preferences.currency` default ko `"INR (₹)"` se `"NPR (₨)"` update.
2. `Backend/src/utils/token.js` — `publicUser()` return mein add: `preferences`, `location`, `coordinates`, `blockedCount`, `createdAt`. Preferences ko default values ke saath ensure karna (agar undefined ho to fallback to defaults).
3. `Backend/src/controllers/authController.js` — add `getBlockedUsers(req, res)`:
   ```
   const blocked = await User.find({ _id: { $in: req.user.blockedUserIds || [] } }, 'name avatarUrl phone');
   res.json({ users: blocked.map(...) });
   ```
4. `Backend/src/routes/auth.js` — `router.get('/blocked', requireAuth, getBlockedUsers)`.
5. `Backend/src/controllers/reviewController.js` line 48 — `reviewedUser` (doc object) ko `reviewedUserId` (string) se replace query mein: `{ reviewedUser: reviewedUserId, status: 'approved' }`. Sath hi average calc mein `allReviews.length + 1` ki jagah `allReviews.length` + new rating (old code jo 1 add karta hai woh theek hai because allReviews mein current nahi hai).
6. Server restart se verify — POST login + GET auth/me payload includes new fields.

### Test Requirements
- **TR-1.1 (rule):** `GET /auth/me` response JSON object mein `"preferences"`, `"location"`, `"blockedCount"` keys present hain (can be null/empty, keys must exist). Evidence: curl or Metro network log capture.
- **TR-1.2 (rule):** `GET /auth/blocked` returns array `[{id,name,avatarUrl}]`, empty array when none blocked. Evidence: curl.
- **TR-1.3 (rule):** After creating a 2nd review for a user, User.rating matches `(rating1 + rating2)/2`. Evidence: db User doc read after POST /reviews twice.
- **TR-1.4 (rule):** User model new user create karne par `preferences.currency === "NPR (₨)"`. Evidence: fresh signup + me response.

**Status:** pending
**Blocked By:** —
**Completion Evidence:** —

---

## Task 2: Mobile api.js — duplicate methods remove + add getBlockedUsers

**Coverage:** AC-8 (no duplicates), AC-5 (mobile calls GET /auth/blocked)

### Sub-work
1. `Mobile/src/services/api.js` — lines 328–335 (duplicate `createReport`, `blockUser`, `unblockUser`, `getMyReports`) DELETE karo. Only lines 317–324 original rakho.
2. Add `getBlockedUsers: () => request('/auth/blocked')` in the `api` object near block/unblock methods.

### Test Requirements
- **TR-2.1 (rule):** api.js ke `api` object mein `createReport`, `blockUser`, `unblockUser`, `getMyReports` — har ek ki exactly 1 definition hoti hai. Grep -c se evidence.
- **TR-2.2 (rule):** `api.getBlockedUsers` function exists and issues `/auth/blocked` GET request. Evidence: function source + network log when invoked.

**Status:** pending
**Blocked By:** Task 1 (for the route existence, but code changes independent)
**Completion Evidence:** —

---

## Task 3: colors.js — missing supportPayments + Currency default align

**Coverage:** AC-3 (Payments card renders), AC-7, AC-10 theme keys

### Sub-work
1. `Mobile/src/theme/colors.js` `buildColors()` return object mein add:
   - `supportPaymentsBg: tint(m.warning, isDark ? 0.20 : 0.12)` — warning/wallet vibe
   - `supportPaymentsIcon: m.warning`
2. SettingsScreen ke `currency` state initial value ko `"INR (₹)"` se align karna: read user.preferences.currency if available, else fallback to `"NPR (₨)"` to match new backend default (AC-7).

### Test Requirements
- **TR-3.1 (rule):** `buildColors('light').supportPaymentsBg` non-empty string, `supportPaymentsIcon` non-empty string. Evidence: direct eval in test import or console log after Metro reload.
- **TR-3.2 (rule):** HelpSupportScreen render par Payments card crash nahi; background + icon colors visible (not NaN / undefined fallback). Evidence: screenshot after navigate to Help Center.
- **TR-3.3 (rule):** SettingsScreen currency initial fallback = "NPR (₨)" when no preferences yet. Evidence: fresh user settings screen value row.

**Status:** pending
**Blocked By:** —
**Completion Evidence:** —

---

## Task 4: Register ROUTES constants + AppNavigator Stack screens

**Coverage:** AC-1 (every dedicated screen registered)

### Sub-work
1. `Mobile/src/navigation/helpers.js` ROUTES mein add:
   - `EDIT_PROFILE: 'EditProfile'`
   - `PRIVACY: 'Privacy'`
   - `LANGUAGE_SELECT: 'LanguageSelect'`
   - `CURRENCY_SELECT: 'CurrencySelect'`
   - `TERMS: 'Terms'`
   - `PRIVACY_POLICY: 'PrivacyPolicy'`
2. `Mobile/src/navigation/AppNavigator.js`:
   - Sabhi 6 naye screens ke imports add karo (file create Task 5–9 mein honge; import paths must match final).
   - Stack.Screen entries: `AllCategories`, `Category` etc. ke saath hi in 6 screens ke `Stack.Screen name=... component=...` add (no options override needed, default stack behaviour fine).

### Test Requirements
- **TR-4.1 (rule):** `ROUTES` has 6 new keys with string values. Evidence: grep ROUTES object in helpers.js.
- **TR-4.2 (rule):** AppNavigator Stack.Navigator children list includes 6 new `<Stack.Screen name="<name>" …>` entries matching the ROUTES constants exactly. Evidence: AppNavigator source.

**Status:** pending
**Blocked By:** Task 5–9 screens ke file names ke saath sync (import paths consistent). We will write imports matching the new file names (EditProfileScreen.js, PrivacyScreen.js, LanguageSelectScreen.js, CurrencySelectScreen.js, TermsScreen.js, PrivacyPolicyScreen.js). So task must be done after or along with those files.

**Completion Evidence:** —

---

## Task 5: EditProfileScreen (dedicated) + AuthContext refresh sync

**Coverage:** AC-1 (Edit Profile dedicated screen), AC-6 (save → reflect profile screens), AC-10 design, AC-11 organization

### Sub-work
1. New file `Mobile/src/screens/EditProfileScreen.js` with structure:
   - Header: gradient + back chevron + "Edit Profile" title.
   - Body card: Avatar picker (circular + edit button). Use `expo-image-picker` (already installed; use pattern from ProfileSetupScreen — check first).
   - Name TextInput, Phone read-only badge, Location text row + auto-locate button (expo-location reverseGeocode → City, District).
   - Gradient "Save Changes" button → `api.updateMe({name, avatarUrl, location, coordinates?})`.
   - On success: AlertModal success → go back. Also `useAuth().setUser?.(updatedUser)` or refresh me sync (check AuthContext API).
   - useThemedStyles(createStyles) pattern; match Settings header/cards design.
2. `Mobile/src/context/AuthContext.js` review: if no setter to refresh user, add `async refreshUser()` method that calls `api.me()` + updates state + storage.

### Test Requirements
- **TR-5.1 (rule):** Settings > "Edit Profile" tap par `EditProfileScreen` open hota hai (NOT InfoScreen). Evidence: navigation.navigate call in SettingsScreen now uses ROUTES.EDIT_PROFILE + actual screen header title "Edit Profile" appears.
- **TR-5.2 (rule):** Save karne ke baad `PATCH /auth/me` network call fire hota hai; ProfileScreen header + HomeScreen auth user show updated name/avatar within same session. Evidence: 2 screenshots (before+after) OR AuthContext state value read before/after.
- **TR-5.3 (rule):** Undefined user/colors guard → no crash. Phone read-only. Empty name: validation alert.
- **TR-5.4 (rubric, scale 0-3, threshold 2):** Design match against Settings/Help. Header gradient, card border radius, icon circles, save gradient button height ≥54px. Score + rationale + screenshot evidence.

**Status:** pending
**Blocked By:** —
**Completion Evidence:** —

---

## Task 6: PrivacyScreen (Blocked Users list + My Reports mini list + unblock action)

**Coverage:** AC-1 (Privacy dedicated), AC-5 (blocked list endpoint + unblock), AC-10

### Sub-work
1. New file `Mobile/src/screens/PrivacyScreen.js`:
   - Header: gradient + back + "Privacy & Security" title.
   - Sections (cards):
     a) **Blocked Users** — use `api.getBlockedUsers` on mount/useFocusEffect. Row per user (avatar, name, Unblock pressable → confirmation Alert → `api.unblockUser(id)` → row remove). Empty-state message when none.
     b) **Your Reports** — use `api.getMyReports` mini card rows (reportedUser name, reason badge, status badge: pending/resolved). 10 items limit. "See all…" → go back/navigate to full list later (out of scope stub OK).
   - useThemedStyles(createStyles); card design = Settings card (16 radius, border 1px).
2. Unblock confirmation: native `Alert.alert('Unblock user?', … [{text:'Cancel'},{text:'Unblock', style:'destructive', onPress:…}])`.

### Test Requirements
- **TR-6.1 (rule):** Settings "Privacy & Security" open par PrivacyScreen load hota hai; NOT InfoScreen placeholder.
- **TR-6.2 (rule):** Blocked users list = `GET /auth/blocked` array. After unblock 1 user (confirm), re-fetch list mein wo user absent hain. Evidence: network + UI before/after.
- **TR-6.3 (rule):** My Reports section renders GET /reports/my data correctly (reason + user name). Empty state for no reports = "No reports submitted yet" info message.
- **TR-6.4 (rubric, 0-3, threshold 2):** Layout quality. Section labels, card spacing, per-row actions intuitive.

**Status:** pending
**Blocked By:** Task 1 (/blocked route + model), Task 2 (getBlockedUsers mobile method)
**Completion Evidence:** —

---

## Task 7: LanguageSelectScreen (radio list + persist via preferences)

**Coverage:** AC-1, AC-7

### Sub-work
1. New file `Mobile/src/screens/LanguageSelectScreen.js`.
   - Header: gradient + back + "Language" title.
   - 3 radio rows: English, Nepali, Hindi (Hinglish label fine). Selection highlight = outer 2px border primary + inner radio dot (ReportBlockUserScreen radio pattern).
   - `useEffect` mein current value = `useAuth().user?.preferences?.language || 'English'` → pre-select.
   - Confirm "Save" gradient button OR direct persist on select. Use direct-select + implicit persist (immediate feedback): on row press → `api.updatePreferences({language: val})` → after ok, goBack 1s delay no. Save button optional but better UX. Implementation choice: "select auto saves + go back" for frictionless.
   - SettingsScreen wapas aane par valueText "Nepali" → reflect (via re-read user.preferences on focus). Ensure SettingsScreen `useFocusEffect` re-reads user (or calls refreshUser) to sync after selection. Add this if missing.

### Test Requirements
- **TR-7.1 (rule):** Settings "Language" opens LanguageSelectScreen, NOT Info placeholder.
- **TR-7.2 (rule):** After selecting "Nepali", next GET auth/me or refreshUser response includes preferences.language === "Nepali". SettingsScreen valueText reflects new value.
- **TR-7.3 (rule):** Network offline scenario handled: show error alert, do not leave screen mid-change without confirmation (optimistic local then rollback on error — or simple wait for response). Evidence: either approach OK, documented.
- **TR-7.4 (rubric, 0-3, threshold 2):** Consistent radio rows, spacing, active selection highlight is visually clear.

**Status:** pending
**Blocked By:** Task 1 (preferences in me payload), Task 4 (ROUTES + navigator reg)
**Completion Evidence:** —

---

## Task 8: CurrencySelectScreen (radio list + persist via preferences)

**Coverage:** AC-1, AC-7

### Sub-work
1. New file `Mobile/src/screens/CurrencySelectScreen.js`.
   - Copy-paste + adapt LanguageSelectScreen pattern.
   - Rows: `NPR (₨)`, `INR (₹)`, `USD ($)` — 3 options.
   - NPR default + highlight current selection.
   - On select: `api.updatePreferences({currency: label})` → success → goBack.
   - SettingsScreen Currency valueText mein updated label show.

### Test Requirements
- **TR-8.1 (rule):** Settings "Currency" opens CurrencySelectScreen, NOT Info placeholder.
- **TR-8.2 (rule):** Post-select → preferences.currency == selection. SettingsScreen valueText reflects.
- **TR-8.3 (rule):** Same offline guard as Language.
- **TR-8.4 (rubric, 0-3, threshold 2):** Design parity with LanguageSelect.

**Status:** pending
**Blocked By:** Task 1, Task 4
**Completion Evidence:** —

---

## Task 9: TermsScreen + PrivacyPolicyScreen (long-form scrollable content)

**Coverage:** AC-1, AC-10

### Sub-work
1. New file `Mobile/src/screens/TermsScreen.js`:
   - Header + gradient + back + "Terms & Conditions" title.
   - Scroll body with section headings (bold 16-18px) + paragraphs (14-15px muted, 20 lineHeight). Sections: Acceptance, User Conduct, Listing Rules, Transactions, Payments, Disclaimers, Liability, Termination, Changes. Content must be Nepal-classifieds appropriate (generic realistic copy, not Lorem ipsum).
2. New file `Mobile/src/screens/PrivacyPolicyScreen.js`:
   - Header + back + "Privacy Policy" title.
   - Sections: Info Collected, How We Use It, Location Data, Sharing, Security, Retention, Your Rights, Cookies/Storage, Contact. Realistic marketplace copy.
3. Both screens use useThemedStyles(createStyles) + SafeAreaView + ThemeStatusBar variant="header". Consistent paragraph spacing 10–12.

### Test Requirements
- **TR-9.1 (rule):** Settings "Terms & Conditions" opens TermsScreen. "Privacy Policy" opens PrivacyPolicyScreen. No Info placeholders.
- **TR-9.2 (rule):** Each screen contains ≥7 paragraph sections, ≥40 lines text content. No Lorem ipsum/Lorem-ish placeholder.
- **TR-9.3 (rule):** Scroll works (content exceeds viewport height on 6.5"+ phone); no layout overflow.
- **TR-9.4 (rubric, 0-3, threshold 2):** Typography hierarchy (headings vs body) + spacing visually readable + matches Settings/Help typography scale.

**Status:** pending
**Blocked By:** Task 4 (register routes + nav imports)
**Completion Evidence:** —

---

## Task 10: SettingsScreen navigation map + live value sync + re-fetch on focus

**Coverage:** AC-1 (menu to correct screens), AC-2 (preferences re-read), AC-7 (reflect changes), AC-10 overall screen polish

### Sub-work
1. `Mobile/src/screens/SettingsScreen.js`:
   - `ACCOUNT_ROWS` mappings update:
     - Edit Profile → `ROUTES.EDIT_PROFILE` (no params)
     - Privacy → `ROUTES.PRIVACY` (no params)
     - Addresses → keep Info + update INFO_COPY.Addresses to note "Coming soon — no saved locations yet" with better copy (already has body, improve to specific).
     - Payment Methods → keep Info, similarly improved INFO_COPY.PaymentMethods body with "Wallets, eSewa, Khalti, bank coming soon".
     - My Listings → keep.
   - `SUPPORT_ROWS` mappings update:
     - Help Center → keep `ROUTES.HELP`
     - Contact Us → keep INFO route/body (open chat button fine)
     - Terms → `ROUTES.TERMS` (no params)
     - Privacy Policy → `ROUTES.PRIVACY_POLICY` (no params)
   - Preferences rows (Language onPress → ROUTES.LANGUAGE_SELECT; Currency onPress → ROUTES.CURRENCY_SELECT).
2. SettingsScreen mein `useFocusEffect(useCallback(() => { call refreshUser or re-read user }, []))` add karna — taaki Language/Currency screen se wapas aane par updated value dikhe. Agar `refreshUser` nahi hai to AuthContext mein add (Task 5). Agar simple hota: direct api.me() call + local re-sync only for preferences display; do NOT reset whole auth context unnecessarily.
3. Also if `user.preferences` is undefined (old token) — fallbacks still work (notifications=true, language=English, currency=NPR(₨)). Already present guard lines 168–174; verify.

### Test Requirements
- **TR-10.1 (rule):** 8 menu taps verify (Edit Profile, Privacy, Help Center T&C/Privacy, Language, Currency) → navigate to expected dedicated screens AND browser stack back returns to Settings.
- **TR-10.2 (rule):** Change language to Nepali → back. Settings value row shows "Nepali". Change currency to USD → back. Shows "USD ($)". Turn notifications off → next me payload shows notifications:false. Evidence: sequential screenshots or step log.
- **TR-10.3 (rule):** Addresses + Payment Methods still open InfoScreen (per out-of-scope decision) but improved body copy ("Coming soon — " / "Wallets… soon") visible.
- **TR-10.4 (rubric, 0-3, threshold 2):** Settings screen overall polish — no stale info, live values, taps feel snappy.

**Status:** pending
**Blocked By:** Tasks 4, 5, 6, 7, 8, 9 (navigation routes must be registered + files existing for Settings navigates to resolve)
**Completion Evidence:** —

---

## Order of Execution (dependency order)

1. Task 1 — Backend core (publicUser, /blocked route, User defaults, review bug). Independent.
2. Task 2 — api.js de-dup + getBlockedUsers. Independent.
3. Task 3 — colors.js supportPayments keys + Settings currency fallback. Independent.
4. Task 5 — EditProfileScreen + AuthContext refresh. Independent (doesn't need routes registered to exist).
5. Task 6 — PrivacyScreen. Depends on 1 and 2.
6. Task 7 — LanguageSelectScreen. Depends on 1 (prefs route) minimally.
7. Task 8 — CurrencySelectScreen. Depends on 1.
8. Task 9 — Terms + PrivacyPolicy. Independent content files.
9. Task 4 — AppNavigator register routes + ROUTES constants. Depends on files 5–9 (imports point to those files).
10. Task 10 — SettingsScreen wiring to use new ROUTES + focus refresh. Depends on 4 and all screens.

Review gate → after all 10 tasks self-verified (TRs each).
