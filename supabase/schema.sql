-- ============================================================
-- CreativIA – Script SQL Completo para Supabase
-- ============================================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- Crea todas las tablas, activa RLS, y define políticas de seguridad.
-- ============================================================

-- Habilitar extensión UUID (disponible por defecto en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PASO 1: ENUMS (Tipos personalizados)
-- ============================================================

CREATE TYPE user_role AS ENUM ('designer', 'writer', 'approver', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE document_status AS ENUM ('draft', 'in_review', 'approved', 'rejected', 'archived');
CREATE TYPE image_style AS ENUM ('anime', 'photorealism', 'oil-painting', 'watercolor', 'digital-art', 'sketch');
CREATE TYPE image_generation_status AS ENUM ('pending', 'generating', 'completed', 'failed', 'moderated');
CREATE TYPE comment_resource_type AS ENUM ('document', 'image');
CREATE TYPE comment_status AS ENUM ('open', 'resolved', 'deleted');
CREATE TYPE ai_provider AS ENUM ('mock', 'bedrock');

-- ============================================================
-- PASO 2: TABLA organizations (Tenants del SaaS)
-- ============================================================

CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    logo_url        TEXT,
    plan            subscription_plan NOT NULL DEFAULT 'free',
    max_members     INTEGER NOT NULL DEFAULT 5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'Tenant raíz del SaaS. Agrupa usuarios, documentos e imágenes.';

-- ============================================================
-- PASO 3: TABLA profiles (Extiende auth.users de Supabase)
-- ============================================================
-- NOTA: auth.users es gestionada por Supabase Auth.
-- profiles extiende esa tabla con datos de negocio.

CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    avatar_url      TEXT,
    role            user_role NOT NULL DEFAULT 'writer',
    status          user_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Perfil extendido del usuario. 1:1 con auth.users.';

-- ============================================================
-- PASO 4: TABLA documents
-- ============================================================

CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    approver_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
    content         TEXT NOT NULL DEFAULT '',
    status          document_status NOT NULL DEFAULT 'draft',
    tags            TEXT[] NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE documents IS 'Documentos de texto editable con flujo de aprobación.';

CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_author ON documents(author_id);
CREATE INDEX idx_documents_status ON documents(status);

-- ============================================================
-- PASO 5: TABLA document_versions (Control de versiones)
-- ============================================================

CREATE TABLE document_versions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    author_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    version_number      INTEGER NOT NULL,
    title               TEXT NOT NULL,
    content             TEXT NOT NULL,
    change_description  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Garantiza que los números de versión sean únicos por documento
    UNIQUE (document_id, version_number)
);

COMMENT ON TABLE document_versions IS 'Snapshots inmutables de documentos para historial de versiones.';

CREATE INDEX idx_doc_versions_document ON document_versions(document_id);

-- ============================================================
-- PASO 6: TABLA images
-- ============================================================

CREATE TABLE images (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    prompt              TEXT NOT NULL CHECK (char_length(prompt) BETWEEN 3 AND 1000),
    negative_prompt     TEXT,
    style               image_style NOT NULL,
    width               INTEGER NOT NULL DEFAULT 1024 CHECK (width % 64 = 0),
    height              INTEGER NOT NULL DEFAULT 1024 CHECK (height % 64 = 0),
    storage_url         TEXT,
    thumbnail_url       TEXT,
    status              image_generation_status NOT NULL DEFAULT 'pending',
    moderation_passed   BOOLEAN NOT NULL DEFAULT FALSE,
    moderation_flags    TEXT[] NOT NULL DEFAULT '{}',
    ai_provider         ai_provider NOT NULL DEFAULT 'mock',
    model_version       TEXT NOT NULL DEFAULT 'mock-v1',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE images IS 'Imágenes generadas por IA con metadatos de moderación y generación.';

CREATE INDEX idx_images_org ON images(organization_id);
CREATE INDEX idx_images_author ON images(author_id);
CREATE INDEX idx_images_status ON images(status);

-- ============================================================
-- PASO 7: TABLA comments
-- ============================================================

CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    resource_type   comment_resource_type NOT NULL,
    resource_id     UUID NOT NULL,  -- ID del documento o imagen
    author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,
    body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    status          comment_status NOT NULL DEFAULT 'open',
    resolved_by_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE comments IS 'Comentarios colaborativos en documentos e imágenes.';

CREATE INDEX idx_comments_resource ON comments(resource_type, resource_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ============================================================
-- PASO 8: FUNCIÓN Y TRIGGER para updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas mutables
CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_images_updated_at
    BEFORE UPDATE ON images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PASO 9: FUNCIÓN para crear perfil automáticamente al registrarse
-- ============================================================
-- Esta función se dispara cuando un usuario se registra en Supabase Auth.
-- Requiere que se pase el organization_id en los metadata del registro.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, organization_id, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(
            (NEW.raw_user_meta_data->>'organization_id')::UUID,
            NULL
        ),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::user_role,
            'writer'::user_role
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- PASO 10: ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Activa RLS en todas las tablas. Sin política explícita,
-- ningún usuario puede leer ni escribir datos.

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- HELPER FUNCTION: Obtener organización del usuario actual
-- ────────────────────────────────────────────────────────────
-- Usada internamente en las políticas RLS.
-- SECURITY DEFINER para acceder a la tabla profiles con privilegios.

CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS UUID AS $$
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- HELPER FUNCTION: Obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
    SELECT role
    FROM profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS: organizations
-- ────────────────────────────────────────────────────────────

-- Ver: Solo miembros de la misma organización
CREATE POLICY "org_select_own"
    ON organizations FOR SELECT
    USING (id = get_my_organization_id());

-- Crear: Solo admins (via service role en backend, o el primer registro)
CREATE POLICY "org_insert_admin"
    ON organizations FOR INSERT
    WITH CHECK (get_my_role() = 'admin');

-- Actualizar: Solo admins de esa organización
CREATE POLICY "org_update_admin"
    ON organizations FOR UPDATE
    USING (id = get_my_organization_id() AND get_my_role() = 'admin')
    WITH CHECK (id = get_my_organization_id());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS: profiles
-- ────────────────────────────────────────────────────────────

-- Ver: Cualquier miembro puede ver perfiles de su organización
CREATE POLICY "profiles_select_own_org"
    ON profiles FOR SELECT
    USING (organization_id = get_my_organization_id());

-- Actualizar: Propio perfil, o admins pueden editar cualquiera en su org
CREATE POLICY "profiles_update_self_or_admin"
    ON profiles FOR UPDATE
    USING (
        id = auth.uid()
        OR (organization_id = get_my_organization_id() AND get_my_role() = 'admin')
    )
    WITH CHECK (organization_id = get_my_organization_id());

-- Insertar: Solo via service role (trigger handle_new_user lo hace)
CREATE POLICY "profiles_insert_trigger"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS: documents
-- ────────────────────────────────────────────────────────────

-- Ver: Cualquier miembro de la organización
CREATE POLICY "documents_select_own_org"
    ON documents FOR SELECT
    USING (organization_id = get_my_organization_id());

-- Crear: Escritores, Diseñadores y Admins
CREATE POLICY "documents_insert_writers"
    ON documents FOR INSERT
    WITH CHECK (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('writer', 'designer', 'admin')
    );

-- Actualizar: El autor puede editar sus drafts.
--             Approvers y Admins pueden editar cualquier documento.
CREATE POLICY "documents_update_author_or_approver"
    ON documents FOR UPDATE
    USING (
        organization_id = get_my_organization_id()
        AND (
            author_id = auth.uid()
            OR get_my_role() IN ('approver', 'admin')
        )
    )
    WITH CHECK (organization_id = get_my_organization_id());

-- Eliminar (archivar): Solo admins
CREATE POLICY "documents_delete_admin"
    ON documents FOR DELETE
    USING (
        organization_id = get_my_organization_id()
        AND get_my_role() = 'admin'
    );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS: document_versions
-- ────────────────────────────────────────────────────────────

-- Ver: Cualquier miembro de la organización (via documento)
CREATE POLICY "doc_versions_select"
    ON document_versions FOR SELECT
    USING (
        document_id IN (
            SELECT id FROM documents
            WHERE organization_id = get_my_organization_id()
        )
    );

-- Insertar: Quien pueda editar el documento
CREATE POLICY "doc_versions_insert"
    ON document_versions FOR INSERT
    WITH CHECK (
        document_id IN (
            SELECT id FROM documents
            WHERE organization_id = get_my_organization_id()
        )
    );

-- Las versiones son INMUTABLES: no se permiten UPDATE ni DELETE
-- (Solo el service role puede eliminarlas si es necesario)

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS: images
-- ────────────────────────────────────────────────────────────

-- Ver: Cualquier miembro de la organización
CREATE POLICY "images_select_own_org"
    ON images FOR SELECT
    USING (organization_id = get_my_organization_id());

-- Crear: Diseñadores y Admins
CREATE POLICY "images_insert_designers"
    ON images FOR INSERT
    WITH CHECK (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('designer', 'admin')
    );

-- Actualizar: El autor puede actualizar sus propias imágenes
CREATE POLICY "images_update_author"
    ON images FOR UPDATE
    USING (
        organization_id = get_my_organization_id()
        AND (author_id = auth.uid() OR get_my_role() = 'admin')
    )
    WITH CHECK (organization_id = get_my_organization_id());

-- Eliminar: Autor o Admin
CREATE POLICY "images_delete_author_or_admin"
    ON images FOR DELETE
    USING (
        organization_id = get_my_organization_id()
        AND (author_id = auth.uid() OR get_my_role() = 'admin')
    );

-- ────────────────────────────────────────────────────────────
-- POLÍTICAS RLS: comments
-- ────────────────────────────────────────────────────────────

-- Ver: Cualquier miembro de la organización
CREATE POLICY "comments_select_own_org"
    ON comments FOR SELECT
    USING (organization_id = get_my_organization_id());

-- Crear: Cualquier miembro activo
CREATE POLICY "comments_insert_members"
    ON comments FOR INSERT
    WITH CHECK (
        organization_id = get_my_organization_id()
        AND author_id = auth.uid()
    );

-- Actualizar: Solo el autor del comentario puede editar su texto
CREATE POLICY "comments_update_author"
    ON comments FOR UPDATE
    USING (
        organization_id = get_my_organization_id()
        AND author_id = auth.uid()
    )
    WITH CHECK (organization_id = get_my_organization_id());

-- Resolver comentario: Approvers y Admins
CREATE POLICY "comments_resolve_approver"
    ON comments FOR UPDATE
    USING (
        organization_id = get_my_organization_id()
        AND get_my_role() IN ('approver', 'admin')
    )
    WITH CHECK (organization_id = get_my_organization_id());

-- Eliminar (soft): Solo el autor o un admin
CREATE POLICY "comments_delete_author_or_admin"
    ON comments FOR DELETE
    USING (
        organization_id = get_my_organization_id()
        AND (author_id = auth.uid() OR get_my_role() = 'admin')
    );

-- ============================================================
-- PASO 11: DATOS SEMILLA (Seed Data para desarrollo)
-- ============================================================
-- Crea una organización demo y un usuario admin inicial.
-- ATENCIÓN: El admin debe registrarse primero en Supabase Auth
-- con el email admin@creativia.dev para que el trigger
-- handle_new_user cree su perfil con organization_id correcto.
-- Por eso, primero insertamos la organización, y el organization_id
-- se pasa en los user_metadata al registrar desde la app.

INSERT INTO organizations (id, name, slug, plan, max_members)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'CreativIA Demo',
    'creativia-demo',
    'pro',
    20
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
-- Verifica en Supabase Dashboard → Table Editor que las tablas
-- fueron creadas correctamente.
-- En Authentication → Policies verifica que RLS esté activo.
-- ============================================================

