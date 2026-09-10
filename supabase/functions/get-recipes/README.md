# get-recipes

Server-side proxy for the Spoonacular recipe search. It exists so the API key
stays out of `index.html`, where anyone viewing source could copy it.

## Before deploying

The old key is in this repository's git history and cannot be removed from it,
so it has to be replaced rather than deleted:

1. Sign in at spoonacular.com and generate a **new** API key.
2. Revoke or regenerate the old one so the leaked value stops working.

## Deploy from the dashboard

No command line needed. In the Supabase project that this app uses:

1. **Edge Functions → Deploy a new function**, name it `get-recipes`, and paste
   the contents of `index.ts`.
2. **Edge Functions → Secrets**, add `SPOONACULAR_KEY` with the new key.

## Deploy from the CLI

```
npx supabase@latest login
npx supabase@latest link --project-ref <this project's ref>
npx supabase@latest secrets set SPOONACULAR_KEY=<the new key>
npx supabase@latest functions deploy get-recipes
```

## Notes

JWT verification is left on, which is the default. Only a signed-in user can
call the function, so a stranger cannot drain the daily quota. The cauldron is
already behind sign-in, so nothing in the app changes.

Spoonacular's terms ask for attribution on displayed recipes. The response
carries `sourceName` and `sourceUrl` per recipe, and neither is shown yet.
