# Static Assets Migration Guide

When migrating from Vite to Next.js, static assets handling changes. Here's how to adapt your code:

## Asset location

Move your static assets to the `public` directory. In Next.js, any file inside the `public` directory is served at the root path.

For example:
- `src/assets/logo.png` should be moved to `public/assets/logo.png`
- `public/favicon.ico` can stay in `public/favicon.ico`

## Importing assets

### Before (Vite)

```jsx
// Direct imports in Vite
import logo from '/logo.png'
import icon from './assets/icon.svg'

function App() {
  return (
    <div>
      <img src={logo} alt="Logo" />
      <img src={icon} alt="Icon" />
    </div>
  )
}
```

### After (Next.js)

```jsx
// Next.js asset handling
import { importedAssetPath } from '@/app/utils/static-assets'
import Image from 'next/image'

// For TypeScript projects, you can use these imports 
// but they return an object with a 'src' property instead of a string
import logo from '/public/logo.png'
import icon from '/public/assets/icon.svg'

function App() {
  return (
    <div>
      {/* Option 1: Use the helper function */}
      <img src={importedAssetPath(logo)} alt="Logo" />
      
      {/* Option 2: Access the src property directly */}
      <img src={logo.src} alt="Logo" />
      
      {/* Option 3 (recommended): Use Next.js Image component */}
      <Image src={logo} alt="Logo" width={100} height={100} />
      <Image src={icon} alt="Icon" width={24} height={24} />
    </div>
  )
}
```

## URL paths in CSS

If you reference assets in CSS, update the paths to point to the public directory:

### Before (Vite)

```css
.logo {
  background-image: url('/assets/logo.png');
}
```

### After (Next.js)

```css
.logo {
  background-image: url('/assets/logo.png');
}
```

The path remains the same because Next.js also serves files from `public` at the root URL,
but you need to ensure the file is actually in `public/assets/logo.png`.

## Dynamic imports

For dynamic imports (like user-uploaded content or variable paths), use the `getStaticAsset` helper:

```jsx
import { getStaticAsset } from '@/app/utils/static-assets'

function DynamicImage({ imageName }) {
  const imageUrl = getStaticAsset(`assets/${imageName}.png`);
  
  return <img src={imageUrl} alt={imageName} />
}
```
