-- Open Ledger seed para testes E2E locais.
-- Apenas usuários fictícios para autenticação local.

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'test@open-ledger.local',
  '$2a$10$PznXR5VSgzjNrCAETWb.DOjKbCxE.bKFQGvQQmvp4b9kOgNuaFIi.',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User","avatar_url":null}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","email":"test@open-ledger.local","email_verified":true}',
  'email',
  'aaaaaaaa-0000-0000-0000-000000000001',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider_id, provider) DO NOTHING;

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000002'
);

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'test-2@open-ledger.local',
  '$2a$10$PznXR5VSgzjNrCAETWb.DOjKbCxE.bKFQGvQQmvp4b9kOgNuaFIi.',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User 2","avatar_url":null}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  'bbbbbbbb-0000-0000-0000-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000002',
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","email":"test-2@open-ledger.local","email_verified":true}',
  'email',
  'bbbbbbbb-0000-0000-0000-000000000002',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider_id, provider) DO NOTHING;
