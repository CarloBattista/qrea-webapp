import { createClient } from '@supabase/supabase-js';
import process from 'process';

// Configurazione Supabase per il backend
const SUPABASE_URL = 'https://ozqjliffrzdnjgumkxeb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cWpsaWZmcnpkbmpndW1reGViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ1MTIyMSwiZXhwIjoyMDY5MDI3MjIxfQ.XAVvJpna3_DVigVOIhj9-87T-Tifvo-Xst4xX-PeI5E';

// Crea il client Supabase con la service role key per operazioni backend
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
