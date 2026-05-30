-- Create a table for company invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'membro',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = invitations.company_id
        AND role IN ('gestao', 'desenvolvedor') -- Existing roles
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND is_master_admin = true
    )
);

CREATE POLICY "Anyone can view invitation by token"
ON public.invitations
FOR SELECT
TO public
USING (status = 'pending' AND expires_at > now());

-- RPC to accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(invite_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
    v_user_id UUID;
    v_role_to_assign TEXT;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
    END IF;

    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invitation invalid or expired');
    END IF;

    -- Map requested role to existing app_role enum values
    -- member/membro -> desenvolvedor
    -- manager/gestor/admin -> gestao
    IF v_invitation.role IN ('admin', 'gestor', 'manager', 'gestao') THEN
        v_role_to_assign := 'gestao';
    ELSE
        v_role_to_assign := 'desenvolvedor';
    END IF;

    -- Add user to company
    INSERT INTO public.user_companies (user_id, company_id)
    VALUES (v_user_id, v_invitation.company_id)
    ON CONFLICT DO NOTHING;

    -- Set user role
    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (v_user_id, v_invitation.company_id, v_role_to_assign::public.app_role)
    ON CONFLICT (user_id, company_id) DO UPDATE
    SET role = v_role_to_assign::public.app_role;

    -- Update profile if company_id is null or different
    UPDATE public.profiles
    SET company_id = v_invitation.company_id
    WHERE id = v_user_id AND (company_id IS NULL OR company_id != v_invitation.company_id);

    -- Mark as accepted
    UPDATE public.invitations
    SET status = 'accepted',
        updated_at = now()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Invitation accepted successfully',
        'company_id', v_invitation.company_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
