# Frontend Deployment Checklist

**Date**: 2026-02-01  
**Project**: Zenith Frontend  
**Target**: Production Deployment

---

## Pre-Deployment Verification Steps

### ✅ Phase 1: Code Quality & Compilation

- [ ] **1.1 TypeScript Type Checking**
  ```bash
  npm run typecheck
  ```
  - **Status**: ⚠️ IN PROGRESS - 9 type errors found
  - **Errors Found**:
    1. `data-hospital/page.tsx` - Missing ForensicPageLayout import
    2. `cases/[id]/page.tsx` - Missing toast export  
    3. `cases/page.tsx` - Missing toast export
    4. `forensic/swarm/page.tsx` - Type mismatch (string | null)
    5. `ingestion/hospital/page.tsx` - Missing toast export
    6. `investigate/page.tsx` - Props type mismatch
    7. `page.tsx` - Missing emit method on ForensicEventBus
    8-9. `ReconciliationWorkspace.tsx` - Toast argument type mismatch
  - **Action Required**: Fix all type errors before deployment

- [ ] **1.2 Linting**
  ```bash
  npm run lint
  ```
  - **Status**: PENDING
  - **Expected**: No linting errors
  - **Action**: Run and fix any linting issues

- [ ] **1.3 Code Formatting**
  ```bash
  npm run format:check
  ```
  - **Status**: PENDING
  - **Action**: Verify all files are properly formatted

### ✅ Phase 2: Testing

- [ ] **2.1 Unit Tests**
  ```bash
  npm run test
  ```
  - **Status**: PENDING
  - **Expected**: All tests pass
  - **Action**: Verify test suite passes

- [ ] **2.2 Test Coverage**
  ```bash
  npm run test:coverage
  ```
  - **Status**: PENDING
  - **Action**: Review coverage report

### ✅ Phase 3: Build Verification

- [ ] **3.1 Clean Build Artifacts**
  ```bash
  rm -rf .next
  rm -rf node_modules/.cache
  ```
  - **Status**: PENDING
  - **Action**: Clean old build artifacts

- [ ] **3.2 Production Build**
  ```bash
  npm run build
  ```
  - **Status**: ⚠️ ATTEMPTED - Timed out
  - **Expected**: Build completes without errors
  - **Warnings to Check**:
    - Bundle size warnings
    - Deprecated API warnings
    - Next.js optimization warnings
  - **Action**: Complete full build and review output

- [ ] **3.3 Build Output Analysis**
  - Check bundle sizes in build output
  - Verify no critical warnings
  - Review page sizes (should be < 200KB)
  - **Lighthouse Optimizations**: Verify bundle reduction (~180KB savings)

### ✅ Phase 4: Local Production Testing

- [ ] **4.1 Start Production Server**
  ```bash
  npm run start
  ```
  - **Status**: PENDING
  - **Port**: 3000
  - **Action**: Verify server starts without errors

- [ ] **4.2 Homepage Verification**
  - **URL**: `http://localhost:3000`
  - **Checks**:
    - [ ] Page loads without errors
    - [ ] No console errors
    - [ ] CSS animations work (replaced framer-motion)
    - [ ] Dynamic imports load correctly
    - [ ] WebSocket connection establishes
  - **Status**: PENDING

- [ ] **4.3 Key Routes Testing**
  Test critical application routes:
  - [ ] `/` - Mission Control Hub
  - [ ] `/forensic` - Forensic Hub
  - [ ] `/investigate` - Investigations
  - [ ] `/ingestion` - Data Ingestion
  - [ ] `/reconciliation` - Reconciliation Workspace
  - [ ] `/forensic/flow` - Flow Analysis
  - [ ] `/forensic/nexus` - Nexus Detection
  
  **For each route verify**:
  - Page loads successfully
  - No 404 errors
  - No console errors
  - Data loads correctly
  - UI renders properly

### ✅ Phase 5: Environment & Configuration

- [ ] **5.1 Environment Variables**
  ```bash
  cat .env.local
  ```
  - **Required Variables**:
    - [ ] `NEXT_PUBLIC_API_URL` - Backend API URL
    - [ ] `NEXT_PUBLIC_WS_URL` - WebSocket URL
    - [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN (if using)
    - [ ] `NEXT_PUBLIC_SENTRY_TRACE` - Sentry trace
  - **Status**: PENDING
  - **Action**: Verify all required env vars are set

- [ ] **5.2 API Connectivity**
  - [ ] Backend API is reachable
  - [ ] WebSocket server is running
  - [ ] Authentication endpoints work
  - [ ] CORS is properly configured
  - **Status**: PENDING

### ✅ Phase 6: Performance & Lighthouse

- [ ] **6.1 Lighthouse Audit**
  ```bash
  npm run lighthouse:report
  ```
  - **Target Scores**: ≥ 95% in all categories
  - **Expected Results** (based on optimizations):
    - Performance: 96/100
    - Accessibility: 98/100
    - Best Practices: 95/100
    - SEO: 100/100
  - **Status**: PENDING
  - **Report Location**: Will open in browser

- [ ] **6.2 Core Web Vitals Verification**
  - [ ] **LCP** ≤ 2.5s (Expected: ~1.8s)
  - [ ] **FID/TBT** ≤ 100ms/200ms (Expected: ~45ms)
  - [ ] **CLS** ≤ 0.1 (Expected: ~0.02)
  - **Status**: PENDING

- [ ] **6.3 Bundle Size Analysis**
  - Review build output for bundle sizes
  - Verify ~180KB reduction from optimizations
  - Check for any unexpected large bundles
  - **Status**: PENDING

### ✅ Phase 7: Browser Compatibility

- [ ] **7.1 Desktop Browsers**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **7.2 Mobile Browsers**
  - [ ] Chrome Mobile
  - [ ] Safari iOS
  - [ ] Test responsive design breakpoints

- [ ] **7.3 Console Error Check**
  - Open DevTools in each browser
  - Check for errors, warnings
  - Verify no CORS errors
  - **Status**: PENDING

### ✅ Phase 8: Feature Verification

- [ ] **8.1 Authentication Flow**
  - [ ] Login works
  - [ ] Logout works  
  - [ ] Session persistence
  - [ ] Protected routes redirect correctly

- [ ] **8.2 WebSocket Connectivity**
  - [ ] Real-time stats update
  - [ ] Connection indicator shows green
  - [ ] Reconnection works after disconnect
  - [ ] No memory leaks

- [ ] **8.3 PWA Features**
  - [ ] Service worker registers correctly
  - [ ] Offline indicator shows when offline
  - [ ] App works offline (cached pages)
  - [ ] Manifest.json loads

- [ ] **8.4 Critical User Flows**
  - [ ] Create new project
  - [ ] Upload data / Ingest CSV
  - [ ] Run reconciliation
  - [ ] View forensic analysis
  - [ ] Generate report
  - [ ] Export data

### ✅ Phase 9: Security Checks

- [ ] **9.1 Security Headers**
  - Check response headers for:
    - Content-Security-Policy
    - X-Frame-Options
    - X-Content-Type-Options
    - Referrer-Policy

- [ ] **9.2 No Sensitive Data**
  - [ ] No API keys in client code
  - [ ] No secrets in .env.local checked into git
  - [ ] No sensitive data in console logs
  - [ ] No debug mode enabled

- [ ] **9.3 HTTPS**
  - [ ] All API calls use HTTPS (production)
  - [ ] No mixed content warnings
  - [ ] WebSocket uses WSS (production)

### ✅ Phase 10: Documentation

- [ ] **10.1 Deployment Documentation**
  - [ ] README.md updated
  - [ ] Deployment steps documented
  - [ ] Environment variables documented
  - [ ] Troubleshooting guide available

- [ ] **10.2 Changelog**
  - [ ] Version number updated
  - [ ] Lighthouse optimizations documented
  - [ ] Breaking changes noted (if any)

---

## Current Issues to Resolve

### 🔴 High Priority (Must Fix Before Deploy)

1. **TypeScript Errors** (9 errors)
   - Fix all type errors listed in Phase 1.1
   - Files affected: 6 files
   - Estimated time: 30-60 minutes

2. **Complete Production Build**
   - Previous build timed out
   - Need clean, successful build
   - Estimated time: 5-10 minutes

3. **Environment Variables**
   - Verify all required variables are set
   - Test API connectivity
   - Estimated time: 5 minutes

### 🟡 Medium Priority (Should Fix)

1. **Run Full Test Suite**
   - Ensure no broken tests from optimizations
   - Estimated time: 5 minutes

2. **Linting**
   - Fix any linting issues
   - Estimated time: 10-20 minutes

3. **Cross-browser Testing**
   - Test in multiple browsers
   - Estimated time: 15 minutes

### 🟢 Low Priority (Nice to Have)

1. **PWA Service Worker Verification**
   - Test offline functionality
   - Estimated time: 10 minutes

2. **Mobile Responsiveness**
   - Test on actual mobile devices
   - Estimated time: 15 minutes

---

## Deployment Readiness Checklist

### Ready When:
- [x] Lighthouse optimizations complete
- [ ] All TypeScript errors fixed
- [ ] Production build succeeds
- [ ] All tests pass
- [ ] Lighthouse scores ≥ 95%
- [ ] No console errors on key pages
- [ ] API connectivity verified
- [ ] Environment variables set

### Current Status: 🟡 **NOT READY**

**Blocking Issues**: 
1. TypeScript errors (9)
2. Incomplete production build
3. Untested runtime functionality

**Estimated Time to Ready**: 1-2 hours

---

## Quick Start Commands

```bash
# Navigate to frontend directory
cd /Users/Arief/Newzen/zenith-lite/frontend

# Fix TypeScript errors (work through them one by one)
npm run typecheck

# Run linting and auto-fix
npm run lint:fix

# Run tests
npm run test

# Clean and build
rm -rf .next
npm run build

# Start production server
npm run start

# In another terminal - run Lighthouse
npm run lighthouse:report
```

---

## Post-Deployment Monitoring

After deployment, monitor:
- [ ] Error tracking (Sentry)
- [ ] Performance metrics (Core Web Vitals)
- [ ] Lighthouse scores in production
- [ ] User feedback
- [ ] API response times
- [ ] WebSocket connection stability

---

## Rollback Plan

If deployment fails:
1. Revert to previous commit: `git revert HEAD`
2. Rebuild: `npm run build`
3. Redeploy previous version
4. Investigate issues in staging

---

## Support & Resources

- **Lighthouse Report**: `/LIGHTHOUSE_OPTIMIZATION_REPORT.md`
- **Environment Setup**: `/README.md`
- **Sentry Dashboard**: (if configured)
- **Next.js Docs**: https://nextjs.org/docs

---

**Last Updated**: 2026-02-01  
**Prepared By**: OpenCode AI Assistant  
**Next Review**: After TypeScript errors are fixed

