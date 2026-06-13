import { Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import LibraryMap from "@/pages/LibraryMap";
import AdminLogin from "@/pages/AdminLogin";
import AdminPanel from "@/pages/AdminPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route
        path="/dashboard"
        component={() => (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        )}
      />
      <Route
        path="/library-map"
        component={() => (
          <AppLayout>
            <LibraryMap />
          </AppLayout>
        )}
      />
      <Route path="/admin" component={() => <Redirect to="/admin/panel" />} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route
        path="/admin/panel"
        component={() => (
          <AppLayout>
            <AdminPanel />
          </AppLayout>
        )}
      />
      <Route component={() => <Redirect to="/dashboard" />} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}
