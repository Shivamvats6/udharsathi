import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Customers } from "@/pages/Customers";
import { CustomerDetails } from "@/pages/CustomerDetails";
import { Loans } from "@/pages/Loans";
import { AddLoan } from "@/pages/AddLoan";
import { LoanDetails } from "@/pages/LoanDetails";
import { AddPayment } from "@/pages/AddPayment";
import { Notifications } from "@/pages/Notifications";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/loans/new" element={<AddLoan />} />
        <Route path="/loans/:id/edit" element={<AddLoan />} />
        <Route path="/loans/:id" element={<LoanDetails />} />
        <Route path="/payments/new" element={<AddPayment />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}