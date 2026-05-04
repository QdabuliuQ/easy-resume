/**
 * Helper function to get the correct path for static assets
 * consistent with how Vite handles imports
 * 
 * @param {string} assetPath - The path to the asset
 * @returns {string} The processed asset path
 */
export function getStaticAsset(assetPath) {
  // Handle absolute paths from root
  if (assetPath.startsWith('/')) {
    return assetPath;
  }
  
  // Handle relative paths
  if (assetPath.startsWith('./') || assetPath.startsWith('../')) {
    // For Next.js, assets should be in the public directory
    // This is a simplified version and might need adjustment based on your project
    return assetPath;
  }
  
  return `/${assetPath}`;
}

/**
 * For direct asset imports that were working in Vite
 * Useful for when you have imports like:
 * import logo from 'assets/logo.png'
 */
export function importedAssetPath(importedAsset) {
  if (!importedAsset) return '';
  
  // Handle objects with src property (common in Next.js)
  if (typeof importedAsset === 'object' && importedAsset.src) {
    return importedAsset.src;
  }
  
  // Handle string paths
  if (typeof importedAsset === 'string') {
    return importedAsset;
  }
  
  return '';
}