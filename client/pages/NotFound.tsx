import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a 
            href="/" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-300 to-fuchsia-500 text-slate-900 font-semibold hover:shadow-md transition-shadow"
          >
            Return to Home
          </a>
          <a 
            href="/doctors" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-full ring-1 ring-border text-foreground hover:bg-accent transition-colors"
          >
            Find a Doctor
          </a>
        </div>
        
        <div className="mt-8 p-4 bg-card rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            Need help? Try our <a href="/" className="text-primary hover:underline">AI health assistant</a> or <a href="/contact" className="text-primary hover:underline">contact us</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
