// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

// Add this, or 'window' will be an undeclared variable.
export const ssr = false;
