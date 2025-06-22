import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  DatabaseIcon,
  ExternalLink,
  FileText,
  Terminal,
  Github,
  Loader2
} from "lucide-react";

interface DbErrorStateProps {
  error: string | null;
  refreshing: boolean;
  refreshData: () => Promise<void>;
}

export function DbErrorState({ error, refreshing, refreshData }: DbErrorStateProps) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="border-red-200 bg-red-50 max-w-3xl w-full shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            Database Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-red-100">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg border border-blue-100 space-y-4">
            <h3 className="font-semibold flex items-center text-blue-800">
              <DatabaseIcon className="h-4 w-4 mr-2 text-blue-600" />
              How to fix this:
            </h3>
            
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li className="pb-3 border-b border-gray-100">
                <span className="font-medium">Go to your Supabase Dashboard</span>
                <div className="mt-2 pl-7">
                  <a 
                    href="https://app.supabase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md inline-flex items-center hover:bg-blue-700"
                  >
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Open Supabase Dashboard
                  </a>
                </div>
              </li>
              
              <li className="pb-3 border-b border-gray-100">
                <span className="font-medium">Navigate to the SQL Editor</span>
                <div className="mt-2 pl-7 text-gray-600">
                  Select your project → SQL Editor → New Query
                </div>
              </li>
              
              <li className="pb-3 border-b border-gray-100">
                <span className="font-medium">Run the migration scripts in order</span>
                <div className="mt-2 pl-7 flex flex-col gap-2">
                  <div className="flex items-center text-xs bg-gray-100 p-2 rounded">
                    <FileText className="h-3 w-3 mr-1.5 text-gray-500" />
                    <code>supabase/migrations/20250618063939_fragrant_dune.sql</code>
                  </div>
                  <div className="flex items-center text-xs bg-gray-100 p-2 rounded">
                    <FileText className="h-3 w-3 mr-1.5 text-gray-500" />
                    <code>supabase/migrations/20250618094103_square_garden.sql</code>
                  </div>
                </div>
              </li>
              
              <li className="pb-3 border-b border-gray-100">
                <span className="font-medium">For development environments:</span>
                <div className="mt-2 pl-7">
                  <div className="text-xs bg-gray-900 text-gray-100 p-3 rounded font-mono mb-2">
                    <div className="flex gap-2">
                      <Terminal className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span>
                        # Create a .env file with your Supabase credentials<br/>
                        echo "VITE_SUPABASE_URL=https://your-project-id.supabase.co" &gt; .env<br/>
                        echo "VITE_SUPABASE_ANON_KEY=your-anon-key" &gt;&gt; .env<br/>
                        # Restart the development server<br/>
                        npm run dev
                      </span>
                    </div>
                  </div>
                </div>
              </li>
              
              <li>
                <span className="font-medium">Check the setup documentation</span>
                <div className="mt-2 pl-7 flex gap-2">
                  <a 
                    href="SUPABASE_SETUP.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-md inline-flex items-center hover:bg-purple-700"
                  >
                    <FileText className="h-3 w-3 mr-1.5" />
                    Setup Guide
                  </a>
                  <a 
                    href="https://github.com/supabase/supabase" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm bg-gray-700 text-white px-3 py-1.5 rounded-md inline-flex items-center hover:bg-gray-800"
                  >
                    <Github className="h-3 w-3 mr-1.5" />
                    Supabase Docs
                  </a>
                </div>
              </li>
            </ol>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={refreshData} 
              disabled={refreshing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Retry Connection
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate("/login")} 
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 