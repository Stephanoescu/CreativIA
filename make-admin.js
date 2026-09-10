const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeAdmin() {
  const email = 'stephanoescu@gmail.com';
  
  // Buscar al usuario por email para sacar el ID
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) return console.error("Error obteniendo usuarios:", usersError);
  
  const user = usersData.users.find(u => u.email === email);
  if (!user) return console.error("Usuario no encontrado");

  // Actualizar el rol en la tabla profiles
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', user.id);

  if (updateError) {
    console.error("Error actualizando rol:", updateError.message);
  } else {
    console.log(`¡El usuario ${email} ahora es ADMIN!`);
  }
}

makeAdmin();

