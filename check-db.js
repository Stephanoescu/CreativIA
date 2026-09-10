const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDb() {
  const { data, error } = await supabase.from('organizations').select('*');
  console.log("Organizations:", data);
  if (error) console.error("Error:", error);
}

checkDb();

