import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" },
      { title: "GRIDGuard AI — Infrastructure Protection" },
      { name: "description", content: "Monitors power infrastructure for real-time vandalism and theft, providing operators with instant alerts and response tools." },
      { name: "theme-color", content: "#EF1C25" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "GRIDGuard" },
      { name: "author", content: "GRIDGuard AI" },
      { property: "og:title", content: "GRIDGuard AI — Infrastructure Protection" },
      { property: "og:description", content: "Monitors power infrastructure for real-time vandalism and theft, providing operators with instant alerts and response tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@GRIDGuardAI" },
      { name: "twitter:title", content: "GRIDGuard AI — Infrastructure Protection" },
      { name: "twitter:description", content: "Monitors power infrastructure for real-time vandalism and theft, providing operators with instant alerts and response tools." },
      { property: "og:image", content: "/src/assets/logo.png" },
      { name: "twitter:image", content: "/src/assets/logo.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/src/assets/logo.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "apple-touch-icon",
        href: "/src/assets/logo.png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { token, logout, updateActivity, lastActivity } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    // Session Timeout Logic (30 minutes)
    const TIMEOUT = 30 * 60 * 1000; 
    
    const checkSession = () => {
      const now = Date.now();
      if (now - lastActivity > TIMEOUT) {
        logout();
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute

    const handleActivity = () => updateActivity();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [token, lastActivity, logout, updateActivity]);

  return (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
    </>
  );
}
