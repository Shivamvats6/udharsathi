import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDeleteActions() {
  const queryClient = useQueryClient();

  async function deleteLoan(id: string) {
    await api.delete(`/loans/${id}`);
    // loans list, loan details, customer details, dashboard, reports sab refresh ho jayenge
    await queryClient.invalidateQueries();
  }

  return { deleteLoan };
}