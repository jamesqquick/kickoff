import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth";

export const ALL: APIRoute = async ({ request }) => {
  return getAuth().handler(request);
};
