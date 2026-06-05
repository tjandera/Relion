import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/models/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/home" : "/auth" });
  },
  component: () => null,
});
