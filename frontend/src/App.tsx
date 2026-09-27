import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { AppRoutes } from "@/routes/AppRoutes";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
