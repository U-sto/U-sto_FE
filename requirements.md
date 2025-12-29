## Packages
framer-motion | Smooth animations for form steps and page transitions
react-hook-form | Form state management and validation
@hookform/resolvers | Zod resolver for react-hook-form
zod | Schema validation

## Notes
The backend API authentication routes are defined in @shared/routes.
We assume standard JWT or Session based auth (handled by browser cookies via credentials: "include").
Email verification is mocked on the frontend if the backend doesn't send real emails yet (code 123456).
