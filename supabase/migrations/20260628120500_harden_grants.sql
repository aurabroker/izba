-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ 0006 · Utwardzenie c.d. — bezpośredni odbiór EXECUTE od ról API         ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- W tym projekcie role anon/authenticated mają EXECUTE nadane bezpośrednio
-- (domyślne uprawnienia Supabase), więc REVOKE ... FROM public nie wystarcza.
-- Odbieramy wprost.

-- Funkcje triggerowe + log_audit: niedostępne dla żadnej roli API.
revoke execute on function public.izba_set_updated_at() from anon, authenticated;
revoke execute on function public.izba_protect_profile_role() from anon, authenticated;
revoke execute on function public.izba_validate_application_ownership() from anon, authenticated;
revoke execute on function public.izba_audit_application() from anon, authenticated;
revoke execute on function public.izba_audit_certificate() from anon, authenticated;
revoke execute on function public.izba_audit_payment() from anon, authenticated;
revoke execute on function public.izba_log_audit(text, text, uuid, jsonb) from anon, authenticated;

-- Funkcje pomocnicze RLS: anon nie ma do nich dostępu; authenticated zachowuje
-- EXECUTE (wymagane przy ewaluacji polityk RLS — zwracają jedynie informacje
-- o bieżącym użytkowniku).
revoke execute on function public.izba_current_app_role() from anon;
revoke execute on function public.izba_is_staff() from anon;
revoke execute on function public.izba_is_agency_or_admin() from anon;
revoke execute on function public.izba_is_admin() from anon;
revoke execute on function public.izba_owns_station(uuid) from anon;
revoke execute on function public.izba_owns_diagnostician(uuid) from anon;
revoke execute on function public.izba_owns_application(uuid) from anon;
