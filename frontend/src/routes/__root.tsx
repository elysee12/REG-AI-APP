import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { messaging, getToken, onMessage } from "@/firebase";
import { API_BASE } from "@/lib/config";
import { toast } from "sonner";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

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
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function RootComponent() {
  const { token, logout, updateActivity, lastActivity } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    // --- FCM Setup ---
    const setupFCM = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: 'BLAWPWX8dLhLeSiTPgUVVL7D0YEbF9RW5DGITq4kipli6GK5KcYGbtrM6m2eUn2o2-78jdMaPA7_9t2dLh5A1fU'
          });

          if (currentToken) {
            // Send token to backend
            await fetch(`${API_BASE}/users/fcm-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ fcmToken: currentToken })
            });
            console.log('FCM token updated successfully');
          }
        }
      } catch (error) {
        console.error('Error setting up FCM:', error);
      }
    };

    setupFCM();

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show custom toast with sound if possible
      toast.error(payload.notification?.body || 'New Incident Detected!', {
        title: payload.notification?.title,
        duration: 10000,
      });

      // Play alarm sound
      const audio = new Audio('/alarm.mp3');
      audio.play().catch(e => console.error('Error playing alarm:', e));
    });

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
      unsubscribe();
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
