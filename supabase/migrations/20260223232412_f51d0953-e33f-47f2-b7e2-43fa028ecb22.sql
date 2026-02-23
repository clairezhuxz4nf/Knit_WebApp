-- Temporarily disable the trigger, update, then re-enable
ALTER TABLE public.people DISABLE TRIGGER prevent_admin_escalation_trigger;

UPDATE public.people SET is_admin = true WHERE id = 'df35e9cf-496e-4b53-a178-b9bbbc3549ad';

ALTER TABLE public.people ENABLE TRIGGER prevent_admin_escalation_trigger;