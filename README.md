**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Deploy to Vercel**

Vite embeds `VITE_*` variables at build time. In your Vercel project, add these environment variables before deploying:

```
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Without them, the production build cannot connect to Supabase and the app will show a configuration error instead of loading.

**Supabase auth setup**

In the [Supabase dashboard](https://supabase.com/dashboard) → Authentication → URL Configuration, add these **Redirect URLs**:

```
http://localhost:5173/login
https://your-production-domain.com/login
```

For Google sign-in: Authentication → Providers → Google (enable it and add your Google OAuth client ID/secret).

Email sign-up sends a confirmation email by default. Either confirm via the email link, or disable **Confirm email** under Authentication → Providers → Email for easier local testing.

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
