// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ultcwpsxdqoztyhjjujq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsdGN3cHN4ZHFvenR5aGpqdWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDM5MzcsImV4cCI6MjA5Mjc3OTkzN30.JpHD4A6ubMBkF7aDat83taXM3qB2L5XIE1Q0tqbz3-o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
