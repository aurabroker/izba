-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ 0005 · Utwardzenie funkcji (search_path + odbiór EXECUTE)              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Adres ostrzeżeń Supabase security advisors:
--  • function_search_path_mutable
--  • {anon,authenticated}_security_definer_function_executable

-- Stały search_path dla funkcji triggerowej updated_at.
alter function public.izba_set_updated_at() set search_path = public;

-- Funkcje triggerowe oraz log_audit nie powinny być wywoływalne przez klientów
-- (triggery działają w kontekście właściciela; log_audit wołany tylko z triggerów).
revoke execute on function public.izba_set_updated_at() from public;
revoke execute on function public.izba_protect_profile_role() from public;
revoke execute on function public.izba_validate_application_ownership() from public;
revoke execute on function public.izba_audit_application() from public;
revoke execute on function public.izba_audit_certificate() from public;
revoke execute on function public.izba_audit_payment() from public;
revoke execute on function public.izba_log_audit(text, text, uuid, jsonb) from public;

-- Funkcje pomocnicze RLS: zdejmujemy domyślny grant dla PUBLIC (więc anon traci
-- dostęp), ale przywracamy EXECUTE dla authenticated — ewaluacja polityk RLS
-- wymaga uprawnienia EXECUTE u wywołującej roli. Zwracają wyłącznie informacje
-- o bieżącym użytkowniku (rola/własność), nie ujawniają cudzych danych.
revoke execute on function public.izba_current_app_role() from public;
revoke execute on function public.izba_is_staff() from public;
revoke execute on function public.izba_is_agency_or_admin() from public;
revoke execute on function public.izba_is_admin() from public;
revoke execute on function public.izba_owns_station(uuid) from public;
revoke execute on function public.izba_owns_diagnostician(uuid) from public;
revoke execute on function public.izba_owns_application(uuid) from public;

grant execute on function public.izba_current_app_role() to authenticated;
grant execute on function public.izba_is_staff() to authenticated;
grant execute on function public.izba_is_agency_or_admin() to authenticated;
grant execute on function public.izba_is_admin() to authenticated;
grant execute on function public.izba_owns_station(uuid) to authenticated;
grant execute on function public.izba_owns_diagnostician(uuid) to authenticated;
grant execute on function public.izba_owns_application(uuid) to authenticated;
