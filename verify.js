const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyUsers() {
  console.log("Obteniendo usuarios...");
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error obteniendo usuarios:", error.message);
    return;
  }

  const unverified = data.users.filter(u => !u.email_confirmed_at);
  console.log(`Encontrados ${unverified.length} usuarios sin verificar.`);

  for (const u of unverified) {
    console.log(`Verificando usuario: ${u.email}...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(u.id, { email_confirm: true });
    if (updateError) {
      console.error(`Error verificando ${u.email}:`, updateError.message);
    } else {
      console.log(`¡Usuario ${u.email} verificado con éxito!`);
    }
  }
}

verifyUsers();

