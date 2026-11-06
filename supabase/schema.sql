--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: recalculate_bucket_scores(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.recalculate_bucket_scores(p_user_id uuid, p_bucket text) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  v_min numeric;
  v_max numeric;
  v_count integer;
begin
  select count(*) into v_count from ratings where user_id = p_user_id and bucket = p_bucket;
  if v_count = 0 then
    return;
  end if;

  case p_bucket
    when 'liked' then v_min := 7.0; v_max := 10.0;
    when 'ok' then v_min := 4.0; v_max := 6.9;
    when 'disliked' then v_min := 0.1; v_max := 3.9;
  end case;

  if v_count = 1 then
    update ratings
      set score = round(((v_min + v_max) / 2)::numeric, 1),
          updated_at = now()
      where user_id = p_user_id and bucket = p_bucket;
  else
    update ratings
      set score = round((v_max - (v_max - v_min) * (rank_position - 1)::numeric / (v_count - 1))::numeric, 1),
          updated_at = now()
      where user_id = p_user_id and bucket = p_bucket;
  end if;
end;
$$;


--
-- Name: submit_rating(uuid, text, text, integer, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.submit_rating(p_user_id uuid, p_restaurant_id text, p_bucket text, p_final_rank integer, p_tags text[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
  v_old_bucket text;
  v_old_rank integer;
begin
  if p_bucket not in ('liked', 'ok', 'disliked') then
    raise exception 'invalid bucket: %', p_bucket;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select bucket, rank_position into v_old_bucket, v_old_rank
    from ratings where user_id = p_user_id and restaurant_id = p_restaurant_id;

  if found then
    delete from ratings where user_id = p_user_id and restaurant_id = p_restaurant_id;
    update ratings
      set rank_position = rank_position - 1
      where user_id = p_user_id and bucket = v_old_bucket and rank_position > v_old_rank;
    perform recalculate_bucket_scores(p_user_id, v_old_bucket);
  end if;

  update ratings
    set rank_position = rank_position + 1
    where user_id = p_user_id and bucket = p_bucket and rank_position >= p_final_rank;

  insert into ratings (user_id, restaurant_id, bucket, rank_position, score, tags)
    values (p_user_id, p_restaurant_id, p_bucket, p_final_rank, 0, coalesce(p_tags, '{}'));

  perform recalculate_bucket_scores(p_user_id, p_bucket);

  insert into liked (user_id, restaurant_id)
    values (p_user_id, p_restaurant_id)
    on conflict (user_id, restaurant_id) do nothing;

  -- Saved and visited are mutually exclusive. saved.user_id is text, not uuid.
  delete from saved where user_id = p_user_id::text and restaurant_id = p_restaurant_id;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT follows_check CHECK ((follower_id <> following_id)),
    CONSTRAINT follows_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text])))
);


--
-- Name: liked; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.liked (
    user_id uuid NOT NULL,
    restaurant_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pick_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pick_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    pick_id uuid NOT NULL,
    anon_id uuid NOT NULL,
    user_id uuid,
    event text NOT NULL,
    restaurant_id text,
    props jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT pick_events_event_check CHECK ((event = ANY (ARRAY['pick_started'::text, 'pick_completed'::text, 'result_action'::text, 'visit_answer'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    username text,
    preferred_neighborhoods text[] DEFAULT '{}'::text[],
    preferred_cuisines text[] DEFAULT '{}'::text[],
    onboarding_completed boolean DEFAULT false NOT NULL,
    preferred_price numeric,
    bio text,
    avatar_url text,
    CONSTRAINT profiles_bio_length_check CHECK ((char_length(bio) <= 280)),
    CONSTRAINT profiles_username_format CHECK (((username IS NULL) OR (username ~ '^[a-z0-9_]{3,20}$'::text)))
);


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ratings (
    user_id uuid NOT NULL,
    restaurant_id text NOT NULL,
    bucket text NOT NULL,
    rank_position integer NOT NULL,
    score numeric(3,1) NOT NULL,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ratings_bucket_check CHECK ((bucket = ANY (ARRAY['liked'::text, 'ok'::text, 'disliked'::text])))
);


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reactions (
    user_id text NOT NULL,
    restaurant_id text NOT NULL,
    reaction text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reactions_reaction_check CHECK ((reaction = ANY (ARRAY['better'::text, 'expected'::text, 'disappointing'::text])))
);


--
-- Name: restaurant_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurant_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    restaurant_name text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: saved; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    restaurant_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: saved favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: saved favorites_user_id_restaurant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved
    ADD CONSTRAINT favorites_user_id_restaurant_id_key UNIQUE (user_id, restaurant_id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (follower_id, following_id);


--
-- Name: liked liked_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liked
    ADD CONSTRAINT liked_pkey PRIMARY KEY (user_id, restaurant_id);


--
-- Name: pick_events pick_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pick_events
    ADD CONSTRAINT pick_events_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (user_id, restaurant_id);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (user_id, restaurant_id);


--
-- Name: restaurant_requests restaurant_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_requests
    ADD CONSTRAINT restaurant_requests_pkey PRIMARY KEY (id);


--
-- Name: follows_follower_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX follows_follower_status_idx ON public.follows USING btree (follower_id, status);


--
-- Name: follows_following_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX follows_following_status_idx ON public.follows USING btree (following_id, status);


--
-- Name: pick_events_event_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pick_events_event_created_idx ON public.pick_events USING btree (event, created_at DESC);


--
-- Name: pick_events_pick_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pick_events_pick_idx ON public.pick_events USING btree (pick_id);


--
-- Name: ratings_user_bucket_rank_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ratings_user_bucket_rank_idx ON public.ratings USING btree (user_id, bucket, rank_position);


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: liked liked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liked
    ADD CONSTRAINT liked_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pick_events pick_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pick_events
    ADD CONSTRAINT pick_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: restaurant_requests restaurant_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurant_requests
    ADD CONSTRAINT restaurant_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

--
-- Name: liked; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.liked ENABLE ROW LEVEL SECURITY;

--
-- Name: pick_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pick_events ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: reactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: restaurant_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restaurant_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: saved; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION recalculate_bucket_scores(p_user_id uuid, p_bucket text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.recalculate_bucket_scores(p_user_id uuid, p_bucket text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.recalculate_bucket_scores(p_user_id uuid, p_bucket text) TO service_role;


--
-- Name: FUNCTION submit_rating(p_user_id uuid, p_restaurant_id text, p_bucket text, p_final_rank integer, p_tags text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.submit_rating(p_user_id uuid, p_restaurant_id text, p_bucket text, p_final_rank integer, p_tags text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.submit_rating(p_user_id uuid, p_restaurant_id text, p_bucket text, p_final_rank integer, p_tags text[]) TO service_role;


--
-- Name: TABLE follows; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.follows TO anon;
GRANT ALL ON TABLE public.follows TO authenticated;
GRANT ALL ON TABLE public.follows TO service_role;


--
-- Name: TABLE liked; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.liked TO anon;
GRANT ALL ON TABLE public.liked TO authenticated;
GRANT ALL ON TABLE public.liked TO service_role;


--
-- Name: TABLE pick_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pick_events TO anon;
GRANT ALL ON TABLE public.pick_events TO authenticated;
GRANT ALL ON TABLE public.pick_events TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE ratings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ratings TO anon;
GRANT ALL ON TABLE public.ratings TO authenticated;
GRANT ALL ON TABLE public.ratings TO service_role;


--
-- Name: TABLE reactions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.reactions TO anon;
GRANT ALL ON TABLE public.reactions TO authenticated;
GRANT ALL ON TABLE public.reactions TO service_role;


--
-- Name: TABLE restaurant_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.restaurant_requests TO anon;
GRANT ALL ON TABLE public.restaurant_requests TO authenticated;
GRANT ALL ON TABLE public.restaurant_requests TO service_role;


--
-- Name: TABLE saved; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.saved TO anon;
GRANT ALL ON TABLE public.saved TO authenticated;
GRANT ALL ON TABLE public.saved TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--


