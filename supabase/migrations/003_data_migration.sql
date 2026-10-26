-- ==============================================================================
-- 003_data_migration.sql
-- Historical Data Export from RFID Supabase
-- ==============================================================================

-- 1. Doors (1 records)
INSERT INTO public.doors (id, name, code, enabled, unlock_window_ms, held_open_alarm_ms, override_mode, override_unlock_window_ms, override_expires_at)
VALUES ('3ab2da1c-4192-453a-a8ce-558a9b0385dc', 'Main Door', 'main-door', true, 5000, 30000, false, 60000, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, code = EXCLUDED.code, enabled = EXCLUDED.enabled,
  unlock_window_ms = EXCLUDED.unlock_window_ms, held_open_alarm_ms = EXCLUDED.held_open_alarm_ms;

-- 2. Devices (1 records)
INSERT INTO public.devices (id, door_id, name, secret_sha256, enabled, firmware_version, last_seen_at)
VALUES ('70cd0062-1a10-44f6-8bbf-8a821f4d673d', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', 'Main Door ESP32', 'd16e33ad032496f74eca68366ec3d1ef566a1672b7df60369ad7dcec42297f53', true, '0.1.3', '2026-10-26T06:45:59.387+00:00')
ON CONFLICT (id) DO UPDATE SET
  door_id = EXCLUDED.door_id, name = EXCLUDED.name, secret_sha256 = EXCLUDED.secret_sha256, enabled = EXCLUDED.enabled;

-- 3. People (16 records)
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('a13fd304-3664-4385-afe4-a530ee3591d0', 'Raaj Patkar', 'TE', 'B', '2026-27', 'admin', true, 'president', '2026-09-11T11:07:02.231828+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('0a6660e3-649b-46ef-86eb-6037608da739', 'Daivik Pawar', 'TE', 'B', '2026-27', 'admin', true, 'vice president', '2026-09-11T11:35:32.577618+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('e0ac4172-fd2c-4834-8959-dda7e7456151', 'Daivik Pawar 2', 'TE', 'B', '2026-27', 'member', true, 'hi', '2026-09-11T11:37:26.81561+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('bd9f0036-3a69-4041-ae28-b757cb6e2b2c', 'Sachman Chadhaa', 'SE', 'C', '2026-27', 'member', true, 'ai ml lead', '2026-09-11T11:41:08.322769+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('810b0080-4ae9-4c3a-a7f3-4d8959342b8a', 'Shubham Gupta', 'BE-IT', 'A', '', 'member', true, '- unpaid engineer', '2026-09-21T08:27:54.868236+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('a6ebc8c9-9355-4313-847f-8d17f3b9c862', 'Jeeval Patil', 'SE', 'IT-B', '2026-27', 'admin', true, 'Devops nigga', '2026-09-11T11:43:08.465588+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('b60058e9-39b2-49d1-bbcc-a04e0750fbf9', 'Subhra Parija', 'SE', 'B', '2026-27', 'admin', true, '', '2026-09-22T08:35:50.213158+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('12426e5e-76f9-4caf-a351-dd609a1aae7e', 'Maahi Nagdeote', 'SE-EXTC', 'A', '2026-27', 'member', true, 'social media manager', '2026-09-28T06:46:18.229375+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('f82d82dc-32e8-4a00-93bf-702fa0987d70', 'Krishna Mundhara', 'SE', 'B', '2026-27', 'member', true, '', '2026-09-30T06:42:27.082303+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('58fe5e5d-947b-4de5-adc7-307b2673670e', 'Piyush Singh', 'TE-comps', 'c', '', 'member', true, '- Event head', '2026-10-13T07:52:06.868793+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('99bde014-96ff-414f-8f6c-f7db5c284e29', 'Rushabh Makwana', 'SE', 'B', '2026-27', 'admin', true, '', '2026-09-23T10:53:01.68517+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('74c6fbcd-94de-44eb-988a-20ee15d017b4', 'Aryan Wesavkar', 'BE', 'B', '', 'admin', true, '- Cyber security head', '2026-09-21T07:24:11.208273+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('4edd9026-86fb-4a08-8983-e29db331a5b4', 'Aryan Wesavkar', 'BE', 'B', '', 'admin', true, '- Cyber security head', '2026-10-13T07:59:58.203614+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('e62bec5b-5faa-4d67-ba18-5c157a2fa8b6', 'Devayani Palaye', 'SE Comps', 'B', '', 'member', true, '', '2026-10-14T09:03:23.596683+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('46e6a054-d388-4db8-871d-bdfae1dbac87', 'Vaishnav Yevale', 'SE Comps', 'C', '', 'member', true, '', '2026-10-14T11:13:34.275808+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;
INSERT INTO public.people (id, full_name, class_name, division, academic_year, role, access_enabled, notes, created_at)
VALUES ('c9dd0738-8e54-4925-bf8a-b857a05b58eb', 'sahil madhiwala', 'SE Comps', 'B', '', 'member', true, '', '2026-10-15T08:23:12.742353+00:00')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name, class_name = EXCLUDED.class_name, division = EXCLUDED.division,
  academic_year = EXCLUDED.academic_year, role = EXCLUDED.role, access_enabled = EXCLUDED.access_enabled, notes = EXCLUDED.notes;

-- 4. Cards (14 records)
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('672B0002', '0a6660e3-649b-46ef-86eb-6037608da739', true, '2026-09-11T11:36:12.993134+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('08FB4FA9', 'e0ac4172-fd2c-4834-8959-dda7e7456151', true, '2026-09-11T11:39:25.847809+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('1AF24B07', 'a6ebc8c9-9355-4313-847f-8d17f3b9c862', true, '2026-09-11T11:44:17.417369+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('8A630102', '74c6fbcd-94de-44eb-988a-20ee15d017b4', true, '2026-09-21T07:27:15.260489+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('01020304', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', true, '2026-09-21T08:28:44.129658+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('76950202', 'b60058e9-39b2-49d1-bbcc-a04e0750fbf9', true, '2026-09-23T10:51:18.595529+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('42720102', '99bde014-96ff-414f-8f6c-f7db5c284e29', true, '2026-09-23T10:54:00.559513+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('64194507', '12426e5e-76f9-4caf-a351-dd609a1aae7e', true, '2026-09-28T06:47:10.021514+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('C3550F35', 'f82d82dc-32e8-4a00-93bf-702fa0987d70', true, '2026-09-30T06:44:27.246175+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('BE1F4307', '58fe5e5d-947b-4de5-adc7-307b2673670e', true, '2026-10-13T07:57:43.785884+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('E2924307', 'a13fd304-3664-4385-afe4-a530ee3591d0', true, '2026-10-13T08:02:14.018359+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('B16A4507', 'e62bec5b-5faa-4d67-ba18-5c157a2fa8b6', true, '2026-10-14T09:05:32.11775+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('458E4B07', 'bd9f0036-3a69-4041-ae28-b757cb6e2b2c', true, '2026-10-14T11:10:40.602282+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;
INSERT INTO public.cards (uid, person_id, active, created_at)
VALUES ('65810202', 'c9dd0738-8e54-4925-bf8a-b857a05b58eb', true, '2026-10-15T10:13:13.425798+00:00')
ON CONFLICT (uid) DO UPDATE SET
  person_id = EXCLUDED.person_id, active = EXCLUDED.active;

-- 5. Access Revision
UPDATE public.access_revision SET value = value + 1 WHERE singleton = true;

-- 6. Recent Access Events (100 records)
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('c1657300-4136-4dd8-95fd-c50ec46cd08c', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T06:22:46Z', '{}'::jsonb, '2026-10-15T06:23:14.013254+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('b937b4f5-eaf7-4dc6-9a81-1f66fd09898d', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-15T06:31:17.681402+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('2ebc1911-9b95-4170-865e-da3e9a5426d6', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'OFFLINE_CACHE', true, '2026-10-15T06:31:17Z', '{}'::jsonb, '2026-10-15T06:31:53.255553+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('39cc33af-3ca5-4af0-8554-a4bea5bceb27', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T06:43:59Z', '{}'::jsonb, '2026-10-15T06:44:18.646927+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('b36e9c40-56a9-4673-b0da-d394ff0572a1', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'f82d82dc-32e8-4a00-93bf-702fa0987d70', 'C3550F35', 'granted', 'OFFLINE_CACHE', true, '2026-10-15T06:56:27Z', '{}'::jsonb, '2026-10-15T06:59:06.634446+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('f74d3b25-cedf-4fb2-ba63-0e613e80a07b', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T07:00:02Z', '{}'::jsonb, '2026-10-15T07:00:11.824034+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('2ce7affc-fb89-4647-bbef-3d4c63254995', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T07:03:44Z', '{}'::jsonb, '2026-10-15T07:04:17.756605+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('43784587-f5c7-4d6a-98cc-6e2658dff4e8', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T07:02:05Z', '{}'::jsonb, '2026-10-15T07:04:17.756605+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('dcec98db-17a3-4b5a-93db-25d190a0859e', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T07:11:48Z', '{}'::jsonb, '2026-10-15T07:12:41.826265+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('9e612bec-d2fa-4981-8b8a-28b29533f831', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T07:11:43Z', '{}'::jsonb, '2026-10-15T07:12:41.826265+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('2c051181-de50-48dc-a0bb-08375d8a5b0a', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T07:21:40Z', '{}'::jsonb, '2026-10-15T07:22:26.967032+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('37be6f6e-108d-4e38-acf0-c07c13183a19', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T07:38:47Z', '{}'::jsonb, '2026-10-15T07:39:12.632749+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('823ce46d-dfde-486f-980a-91a89b62b4c7', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T07:40:48Z', '{}'::jsonb, '2026-10-15T07:41:19.418498+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('4b1fea26-8276-4205-bc55-16d4616e50cb', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-15T08:24:10.261668+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('af1e8a81-cb44-4e7a-8048-483c41bf9f69', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'OFFLINE_CACHE', true, '2026-10-15T08:24:05Z', '{}'::jsonb, '2026-10-15T08:24:37.752553+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('68edd61b-ad55-420b-891f-f7d8df503619', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'OFFLINE_CACHE', true, '2026-10-15T08:23:53Z', '{}'::jsonb, '2026-10-15T08:24:37.752553+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('bbdd8a0d-4965-4da7-ac6d-c69979e1c30a', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, '65810202', 'denied', 'UNKNOWN_CARD', false, NULL, '{}'::jsonb, '2026-10-15T08:27:32.543899+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('7603a264-de76-4000-829a-2e3cd06dcf0c', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, '65810202', 'denied', 'OFFLINE_UNKNOWN_CARD', true, '2026-10-15T08:27:32Z', '{}'::jsonb, '2026-10-15T08:28:34.664175+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('98c24f7f-dff1-4e01-98fd-6f5ab665dd54', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, '65810202', 'denied', 'UNKNOWN_CARD', false, NULL, '{}'::jsonb, '2026-10-15T08:31:51.958067+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('4ddd80ca-ef46-4be7-a8e1-88b64e1eb3ae', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, '65810202', 'denied', 'OFFLINE_UNKNOWN_CARD', true, '2026-10-15T08:31:51Z', '{}'::jsonb, '2026-10-15T08:32:09.751211+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('9c1f1b68-2f2b-47c6-9081-0174d3dd1842', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'granted', 'REMOTE_UNLOCK', false, NULL, '{}'::jsonb, '2026-10-15T08:35:35.614216+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('1f14b467-c917-4d9d-ae44-041e78508563', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T08:51:22Z', '{}'::jsonb, '2026-10-15T08:53:08.071487+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('5e184850-12c5-4910-bf86-e2a5d1335660', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-15T10:03:07Z', '{}'::jsonb, '2026-10-15T10:03:43.493099+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('440ad4ed-8c40-43ed-ab2c-b0e11db27733', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-15T10:05:04.112677+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('59aa2d5c-e40c-433c-a465-50f0530c4760', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'c9dd0738-8e54-4925-bf8a-b857a05b58eb', '65810202', 'enrollment_success', 'ADMIN_VERIFIED_ENROLLMENT', false, NULL, '{}'::jsonb, '2026-10-15T10:13:13.718152+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('3d671822-ed89-4f42-bf3e-e9689f3c9638', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'c9dd0738-8e54-4925-bf8a-b857a05b58eb', '65810202', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-15T10:13:24.304832+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('8ec0a563-4b14-41b8-bff9-2f974f86c461', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'f82d82dc-32e8-4a00-93bf-702fa0987d70', 'C3550F35', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-15T10:15:22.693207+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('41295b1d-1b69-47de-9c73-022674aba723', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'f82d82dc-32e8-4a00-93bf-702fa0987d70', 'C3550F35', 'granted', 'OFFLINE_CACHE', true, '2026-10-15T10:15:22Z', '{}'::jsonb, '2026-10-15T10:16:46.45789+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('a12ab8ed-3848-45df-90c2-c550a94621ea', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-16T04:19:05.82403+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('2de535d5-6f19-4be3-8ae6-6f3c7666c39d', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '99bde014-96ff-414f-8f6c-f7db5c284e29', '42720102', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-16T04:19:36.851027+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('5381dfe2-e167-4879-81a0-670d1ee84b7e', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'OFFLINE_CACHE', true, '2026-10-16T04:18:56Z', '{}'::jsonb, '2026-10-16T04:19:53.823024+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('6e7eb91a-15e2-4f86-8acf-bc232b37fccf', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'OFFLINE_CACHE', true, '2026-10-16T04:28:44Z', '{}'::jsonb, '2026-10-16T04:29:39.074166+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('81012afc-4e4d-43e8-ba46-05e999581977', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-16T04:27:45Z', '{}'::jsonb, '2026-10-16T04:29:39.074166+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('59e69e08-7790-44cb-b8aa-47644c27ce37', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'OFFLINE_CACHE', true, '2026-10-16T06:54:49Z', '{}'::jsonb, '2026-10-16T06:55:11.789934+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('aadc2452-7e01-4cb5-b8b7-c59195d8d667', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-16T07:37:39Z', '{}'::jsonb, '2026-10-16T07:39:57.957252+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('888b560d-740a-483b-9088-09e3bcc03e75', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-16T10:31:30Z', '{}'::jsonb, '2026-10-16T10:32:13.155609+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('580c7ed7-9f21-4b86-abe9-1c039b4c0163', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-16T13:34:53.281787+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('a4e00f53-4b9f-4fd6-9470-d4dd239449ea', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'OFFLINE_CACHE', true, '2026-10-16T13:34:53Z', '{}'::jsonb, '2026-10-16T13:35:10.728356+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('bbd0f6bc-fe35-482e-bd59-1a21bace2d7e', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'OFFLINE_CACHE', true, '2026-10-16T15:01:55Z', '{}'::jsonb, '2026-10-16T15:02:07.049866+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('d2b80a84-de8f-4dd2-a5b1-24453fc979d4', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-16T15:30:19Z', '{}'::jsonb, '2026-10-16T15:31:05.320147+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('6c7f67c6-7873-4d8b-b3fc-7d97e12ee571', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-16T15:30:01Z', '{}'::jsonb, '2026-10-16T15:31:05.320147+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('a2ad962d-92bd-416a-99b4-bb5d1c3bf599', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-16T15:43:07.735594+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('64d8ae9c-9000-41eb-8a4d-7829492d1e35', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-17T09:11:45Z', '{}'::jsonb, '2026-10-17T09:12:25.553116+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('bf6edab6-2d50-4e06-ab94-f22e34e1a6ea', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-17T11:37:31Z', '{}'::jsonb, '2026-10-17T11:39:12.77919+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('40c78fb7-7393-459f-ba92-3e68a8f464cc', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '12426e5e-76f9-4caf-a351-dd609a1aae7e', '64194507', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-19T03:55:13.307027+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('fa746b78-3171-4f71-992f-47744ae776aa', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '12426e5e-76f9-4caf-a351-dd609a1aae7e', '64194507', 'granted', 'OFFLINE_CACHE', true, '2026-10-19T03:55:13Z', '{}'::jsonb, '2026-10-19T03:56:15.100793+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('4a829aac-e8a8-4c99-9c66-fb9dc76101fa', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '58fe5e5d-947b-4de5-adc7-307b2673670e', 'BE1F4307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-19T05:05:31.635318+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('26795710-e555-4716-bf09-d3e4c804ae39', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-19T07:23:40Z', '{}'::jsonb, '2026-10-19T07:24:31.868224+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('e37b1069-e116-423f-9259-a08efcf1c332', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-19T08:49:28Z', '{}'::jsonb, '2026-10-19T08:49:58.241277+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('a92aec69-68d0-43c4-ab27-78ab30ae8a35', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '12426e5e-76f9-4caf-a351-dd609a1aae7e', '64194507', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-21T03:49:02.1038+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('f2876a31-964e-4522-8cd9-f0bce5b898dd', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, '64194507', 'granted', 'OFFLINE_BUILT_IN', true, '2026-10-21T03:37:26Z', '{}'::jsonb, '2026-10-21T03:49:20.178774+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('c7461b9d-cd9f-425d-b1a8-33f3d6016e7c', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, '64194507', 'granted', 'OFFLINE_BUILT_IN', true, '2026-10-21T03:37:25Z', '{}'::jsonb, '2026-10-21T03:49:20.178774+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('48440191-0c1c-44d7-84ac-297cbdd1ac39', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '12426e5e-76f9-4caf-a351-dd609a1aae7e', '64194507', 'granted', 'OFFLINE_CACHE', true, '2026-10-21T03:49:02Z', '{}'::jsonb, '2026-10-21T03:49:20.178774+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('4dd486e9-6ef0-4fef-867a-621365994129', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-21T04:53:14Z', '{}'::jsonb, '2026-10-21T04:55:48.097134+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('586c44c2-6764-43fc-bfef-08f5ecbf0966', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-21T13:26:34Z', '{}'::jsonb, '2026-10-21T13:26:50.052382+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('da5144ba-5f62-46b5-8dcd-3d511b3f2fe0', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-21T13:25:52Z', '{}'::jsonb, '2026-10-21T13:26:50.052382+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('0288a2f6-9e06-4a7f-bf1d-8bcc55c1fb64', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '12426e5e-76f9-4caf-a351-dd609a1aae7e', '64194507', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-22T03:39:57.879415+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('1e8177b0-1b83-4efd-b86d-291f27077290', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-22T04:13:46Z', '{}'::jsonb, '2026-10-22T04:16:42.158819+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('e7c8048a-3a3a-4b41-9e80-68d37295ca09', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-22T11:12:00Z', '{}'::jsonb, '2026-10-22T11:15:02.5532+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('365be49c-f32e-4416-bd73-0099bef90b7f', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-23T04:12:04Z', '{}'::jsonb, '2026-10-23T04:12:20.964796+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('8a5f70dd-1de9-49c8-980f-23a2c5c35008', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'OFFLINE_CACHE', true, '2026-10-23T04:20:26Z', '{}'::jsonb, '2026-10-23T04:21:46.975691+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('7b899027-9750-4423-b8af-a3cd55e73fee', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-23T12:47:39.481642+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('68dd0719-1d25-474a-b881-b69a207ed331', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-23T12:48:02.659469+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('8b4fc8a4-2d06-43e1-b0eb-e180383f73b2', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-23T12:48:15.8318+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('1ff7a3e9-84e9-4712-9d32-51528f8b8f58', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'OFFLINE_CACHE', true, '2026-10-23T12:48:02Z', '{}'::jsonb, '2026-10-23T12:51:04.850154+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('edf8f217-79db-4b52-9182-f7b2a6aca19b', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-23T12:47:57Z', '{}'::jsonb, '2026-10-23T12:51:04.850154+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('cedb1ab9-5de2-4138-b0b0-c1618d495eb2', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, '421E4907', 'denied', 'OFFLINE_UNKNOWN_CARD', true, '2026-10-23T12:47:27Z', '{}'::jsonb, '2026-10-23T12:51:04.850154+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('cedc7a09-f890-4061-ada1-d1eeb53d3182', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'f82d82dc-32e8-4a00-93bf-702fa0987d70', 'C3550F35', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-23T12:51:28.436325+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('24fc92cf-ba8e-4b9c-aa3c-d7b9e26543bb', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'f82d82dc-32e8-4a00-93bf-702fa0987d70', 'C3550F35', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-23T13:57:19.11976+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('d8567ef5-7690-4795-8b1e-4e780a073f8b', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-23T14:00:24Z', '{}'::jsonb, '2026-10-23T14:01:16.548063+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('50742a16-3e94-4c22-88fd-d41735cc877a', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-24T04:37:36.773757+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('4ae22515-28e0-4f9c-90f0-d88012113394', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-24T06:17:24.828189+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('38a0010b-ab7b-4128-b4b0-bc056426d8e7', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'OFFLINE_CACHE', true, '2026-10-24T06:17:02Z', '{}'::jsonb, '2026-10-24T06:17:41.071256+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('742ec065-83ed-472d-b526-9934224799bc', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'OFFLINE_CACHE', true, '2026-10-24T06:18:14Z', '{}'::jsonb, '2026-10-24T06:21:00.290891+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('62656382-860a-473e-953e-fd8a39460b87', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-24T09:04:45.051215+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('d8583611-252b-45eb-ac6f-8040b66d0ba1', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-24T09:05:06.537608+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('e44cfb36-ccfc-425c-bffd-6faef93e6ed7', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-24T09:44:55Z', '{}'::jsonb, '2026-10-24T09:45:12.286619+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('4acc1f16-ccf4-4f1a-824c-85aa9518e5ca', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-24T10:10:28Z', '{}'::jsonb, '2026-10-24T10:11:05.44865+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('4e2e074a-7beb-4cda-9183-f3f7d522563f', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-24T11:17:56Z', '{}'::jsonb, '2026-10-24T11:19:02.423502+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('f7a4b546-ac80-48f9-8156-3d41458a4753', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'f82d82dc-32e8-4a00-93bf-702fa0987d70', 'C3550F35', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-24T11:39:49.366522+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('d97fc5c0-8b1b-4d57-afe1-8d4bdfdf4076', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-24T13:27:03.068278+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('562df6b4-f945-4531-9521-e377f5d5c6c8', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-24T13:55:17.282064+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('71cf230e-d0ca-419f-9e3e-7d1e87a6d260', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'OFFLINE_CACHE', true, '2026-10-24T13:55:17Z', '{}'::jsonb, '2026-10-24T13:55:29.201384+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('7c1a1d7e-4f57-4520-a8a4-4496ae27df77', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T03:56:54.410642+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('2b229eaf-08b5-4357-8b65-2a35dfba4402', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T04:27:39.621641+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('a7bb056f-317d-43fc-8de5-c639c00a82bf', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T04:32:07.347046+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('6e194265-bc73-4e44-81b5-840afaf6ebfc', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'a13fd304-3664-4385-afe4-a530ee3591d0', 'E2924307', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T04:33:57.968917+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('0de4f21e-4533-4539-8c32-9e06195f9037', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '0a6660e3-649b-46ef-86eb-6037608da739', '672B0002', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T04:42:37.640084+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('6bfd2680-ca94-44e3-9106-d2b5ddf6938d', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T04:48:58.617678+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('ce073446-a8a3-4c5d-a6d4-fce22b11254d', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T04:49:07.387266+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('f294a05d-305b-4a56-b224-cef546a01327', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'OFFLINE_CACHE', true, '2026-10-26T04:49:07Z', '{}'::jsonb, '2026-10-26T04:49:24.198637+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('486ed2b2-f5bc-4600-b4c6-ecc50ac39a96', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'OFFLINE_CACHE', true, '2026-10-26T04:48:57Z', '{}'::jsonb, '2026-10-26T04:49:24.198637+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('37cb9f7c-864d-4215-9885-7ede59a1034a', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'OFFLINE_CACHE', true, '2026-10-26T04:48:57Z', '{}'::jsonb, '2026-10-26T04:49:24.198637+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('5a753c49-00d4-4c69-bb8d-21e0fccc6027', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-26T05:13:27Z', '{}'::jsonb, '2026-10-26T05:14:16.742171+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('b15880c6-eb88-4cdd-8f33-e359cc05a3a8', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '99bde014-96ff-414f-8f6c-f7db5c284e29', '42720102', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T06:02:20.204298+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('f637b180-1a5b-4e88-a606-da3140b2c4c0', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'b60058e9-39b2-49d1-bbcc-a04e0750fbf9', '76950202', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T06:02:35.223779+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('599525d6-4cff-4277-b0cb-a3868cfa58a1', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', 'b60058e9-39b2-49d1-bbcc-a04e0750fbf9', '76950202', 'granted', 'OFFLINE_CACHE', true, '2026-10-26T06:02:35Z', '{}'::jsonb, '2026-10-26T06:04:46.79645+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('655b12ff-3b4d-45aa-93ae-e356dd6aad5e', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '99bde014-96ff-414f-8f6c-f7db5c284e29', '42720102', 'granted', 'OFFLINE_CACHE', true, '2026-10-26T06:02:20Z', '{}'::jsonb, '2026-10-26T06:04:46.79645+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('633cb5fc-7f64-4486-aa0e-770f4698b40d', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', NULL, NULL, 'exit', 'TOUCHLESS_REX', false, '2026-10-26T06:28:32Z', '{}'::jsonb, '2026-10-26T06:28:47.064842+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
INSERT INTO public.access_events (event_uuid, door_id, device_id, person_id, uid, decision, reason, offline, device_time, metadata, created_at)
VALUES ('845d34d1-d8a9-4724-ba54-3caa9928ea1b', '3ab2da1c-4192-453a-a8ce-558a9b0385dc', '70cd0062-1a10-44f6-8bbf-8a821f4d673d', '810b0080-4ae9-4c3a-a7f3-4d8959342b8a', '01020304', 'granted', 'ACCESS_GRANTED', false, NULL, '{}'::jsonb, '2026-10-26T06:31:34.906293+00:00')
ON CONFLICT (event_uuid) DO NOTHING;
