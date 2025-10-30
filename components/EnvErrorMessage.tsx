'use client'

/**
 * Error message component shown when required environment variables are missing
 * Helps developers quickly identify and fix configuration issues
 */
export function EnvErrorMessage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  
  const isSupabaseMissing = !supabaseUrl || !supabaseKey || 
    supabaseUrl === 'https://placeholder.supabase.co' || 
    supabaseKey === 'placeholder-key'
  
  if (!isSupabaseMissing) return null
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-red-900/20 border border-red-500 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Configuration Error
            </h2>
            <p className="text-white mb-4">
              Supabase environment variables are not configured. Please add them to your Railway deployment.
            </p>
            
            <div className="bg-black/50 rounded p-4 mb-4 font-mono text-sm">
              <p className="text-gray-400 mb-2">Required environment variables:</p>
              <ul className="space-y-1">
                <li className={supabaseUrl ? 'text-green-400' : 'text-red-400'}>
                  • NEXT_PUBLIC_SUPABASE_URL {supabaseUrl ? '✓' : '✗'}
                </li>
                <li className={supabaseKey ? 'text-green-400' : 'text-red-400'}>
                  • NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY {supabaseKey ? '✓' : '✗'}
                </li>
              </ul>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <p className="font-semibold text-white">To fix this:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to your Railway project dashboard</li>
                <li>Click on your service → Variables tab</li>
                <li>Add the missing environment variables</li>
                <li>Get values from your Supabase project (Settings → API)</li>
                <li>Redeploy your application</li>
              </ol>
            </div>
            
            <div className="mt-6 pt-4 border-t border-red-500/30">
              <p className="text-xs text-gray-400">
                See <code className="bg-black/50 px-2 py-1 rounded">env.template</code> for all required variables
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

