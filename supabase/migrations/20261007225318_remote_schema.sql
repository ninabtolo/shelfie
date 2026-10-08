DROP VIEW "public"."public_libraries";

CREATE VIEW "public"."public_libraries" AS  SELECT p.username,
    b.google_books_id,
    b.title,
    b.subtitle,
    b.authors,
    b.description,
    b.isbn_10,
    b.isbn_13,
    b.publisher,
    b.published_date,
    b.page_count,
    b.genres,
    b.language,
    b.cover_url,
    ub.status,
    ub.is_favorite,
    ub.created_at AS added_at
   FROM ((public.user_books ub
     JOIN public.profiles p ON ((p.id = ub.user_id)))
     JOIN public.books b ON ((b.id = ub.book_id)));

REVOKE ALL ON TABLE "public"."public_libraries" FROM "anon";

REVOKE ALL ON TABLE "public"."public_libraries" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."public_libraries" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."public_libraries" TO "postgres";

REVOKE ALL ON TABLE "public"."public_libraries" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."public_libraries" TO "service_role";

