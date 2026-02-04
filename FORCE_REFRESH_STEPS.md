# 🔄 Force Refresh Steps - Tooltip Not Updating

## The Problem
The browser is serving cached JavaScript. The new tooltip code isn't loading.

## Solution: Nuclear Option

### Step 1: Stop Everything
```powershell
# Stop the dev server (Ctrl+C)
```

### Step 2: Delete ALL Cache
```powershell
# Delete Next.js cache
Remove-Item -Recurse -Force .next

# Delete node_modules/.cache if it exists
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
```

### Step 3: Rebuild
```powershell
npm run build
```

### Step 4: Start Fresh
```powershell
npm run dev
```

### Step 5: Browser - Disable Cache Completely
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check **"Disable cache"** checkbox
4. Keep DevTools open
5. Refresh page (Ctrl+Shift+R)

### Step 6: If Still Not Working - Try Different Browser
- Open in Chrome Incognito
- Or Firefox Private Window
- This bypasses ALL cache

## Alternative: Check if File is Being Used

Open browser DevTools:
1. Press F12
2. Go to **Sources** tab
3. Navigate to: `webpack://_N_E/./components/charts/attendance-chart.tsx`
4. Search for "CustomTooltip"
5. Check if you see the new code with `dark:text-white`

If you DON'T see it there, the file isn't being loaded.

## Last Resort: Add Timestamp to Force Reload

Add this to the component to force a new version:
```typescript
// Version: 2024-02-04-v2
```

This changes the file hash and forces a reload.
