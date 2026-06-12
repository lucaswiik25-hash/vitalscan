export default function ConfigError({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl bg-white/90 backdrop-blur p-6 border border-border shadow-sm">
        <h1 className="text-xl font-bold text-foreground mb-2">Configuration required</h1>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <p className="text-xs text-muted-foreground mb-2">
          Create a <code className="bg-secondary px-1 rounded">.env</code> file in the project root (see <code className="bg-secondary px-1 rounded">.env.example</code>), then restart the dev server.
        </p>
        <pre className="text-xs bg-secondary rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{`VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}</pre>
      </div>
    </div>
  );
}
