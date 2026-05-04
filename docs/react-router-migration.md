# React Router to Next.js Migration Guide

This project has been migrated from Vite to Next.js, and we've detected React Router usage.
Here's how to gradually migrate from React Router to Next.js routing:

## Option: Migrate to Next.js App Router

The recommended approach is to refactor your code to use Next.js App Router:

1. Create page components in the `app` directory following the Next.js file-based routing pattern
2. Replace `useNavigate()` with `router.push()` from `next/navigation`
3. Replace `useLocation()` with `usePathname()` and `useSearchParams()` from `next/navigation`
4. Replace `<Link>` components with Next.js's `<Link>` from `next/link`

## Migration steps:

1. Identify all files using React Router hooks and components
2. Replace them one by one with Next.js equivalents
3. Convert route definitions to Next.js's file-based routing system

For more detailed information, see the [Next.js migration guide](https://nextjs.org/docs/app/building-your-application/upgrading/from-react-router).
