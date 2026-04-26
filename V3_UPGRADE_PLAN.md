# Smart Taxi - System Upgrade V 3.0 Plan

This document outlines the systematic upgrade and audit of the Smart Taxi Management System to Version 3.0.

## 1. Global Infrastructure (V 3.0)
- [ ] **Versioning**: Update `global-config.js` to version `v3.0.0`.
- [ ] **Mobile Experience**: 
    - [ ] Add `<link rel="apple-touch-icon">` for iPhone bookmarking.
    - [ ] Add meta tags for `apple-mobile-web-app-capable`.
- [ ] **UI Stabilization**: 
    - [ ] Ensure all pages hide the global header properly if required (like in Reports).
    - [ ] Standardize the "Luxury" font injection across all modules.

## 2. Code Review & Optimization
- [ ] **Redundancy Audit**: Identify duplicate helper functions (e.g., date formatters, plate formatters) and move them to `global-config.js`.
- [ ] **API Efficiency**: Ensure `fetch` calls use `Promise.all` and implement simple in-session caching for lookups.
- [ ] **Comment Standard**: Upgrade all function headers to a bilingual format:
    ```javascript
    /**
     * [AR] وظيفة حفظ البيانات مع التحقق
     * [EN] Save data function with validation logic
     */
    ```

## 3. Module-Specific Audits
- [ ] **Work Days**: Refine the daily dues generation logic to prevent duplicates.
- [ ] **Payments & Revenues**: Standardize the "Matching" logic between payments and expenses.
- [ ] **Reports**: Finalize the "One-Page Print" logic for all report types.

## 4. Visual Cleanup
- [ ] **Version Stamp**: Add a small "V 3.0" label in the sidebar or footer.
- [ ] **Logo Fix**: Ensure the `favicon.png` or `icon.png` is correctly linked everywhere.

## 5. Verification
- [ ] Test the "Add to Home Screen" feature on iPhone.
- [ ] Verify print quality for all ledger pages.
- [ ] Ensure no console errors remain in the system.
