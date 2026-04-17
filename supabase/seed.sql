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
