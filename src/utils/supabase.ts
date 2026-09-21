import { createClient } from "@supabase/supabase-js";
import { clientEnv, isSupabaseConfigured } from "@/configs/env";

export { isSupabaseConfigured };

export const supabase = createClient(
	clientEnv.VITE_SUPABASE_URL,
	clientEnv.VITE_SUPABASE_KEY,
);
