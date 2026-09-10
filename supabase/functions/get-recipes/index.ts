// Proxies Spoonacular's find-by-ingredients search.
//
// The point of this function is that the API key never reaches the browser.
// It lives in this project's secrets as SPOONACULAR_KEY and is read here,
// server side, where nobody can copy it out of the page source.
//
// The function always answers 200 with { ok, message?, recipes? }. supabase-js
// hides the response body when the status is not 2xx, which would leave the
// app unable to tell "quota gone" apart from "no internet", so failures are
// reported in the payload instead of in the status code.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// One pantry should not be able to spend the whole daily quota in one call.
const MAX_INGREDIENTS_LENGTH = 500;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const key = Deno.env.get("SPOONACULAR_KEY");
  if (!key) return reply({ ok: false, message: "Recipe service is not set up yet." });

  let ingredients = "";
  try {
    const body = await req.json();
    ingredients = String(body?.ingredients ?? "").trim();
  } catch {
    return reply({ ok: false, message: "Could not read the request." });
  }

  if (!ingredients) {
    return reply({ ok: false, message: "Add something to your pantry first!" });
  }
  if (ingredients.length > MAX_INGREDIENTS_LENGTH) {
    return reply({ ok: false, message: "That is too many ingredients at once." });
  }

  const url = new URL("https://api.spoonacular.com/recipes/findByIngredients");
  url.searchParams.set("ingredients", ingredients);
  url.searchParams.set("number", "5");
  url.searchParams.set("ranking", "1");
  url.searchParams.set("ignorePantry", "true");
  url.searchParams.set("apiKey", key);

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return reply({ ok: false, message: "Could not reach the recipe service." });
  }

  // 402 is Spoonacular's way of saying the daily points are spent. Saying so
  // beats letting the app blame the user's connection.
  if (res.status === 402) {
    return reply({ ok: false, message: "Today's recipe quota is used up. Try again tomorrow!" });
  }
  if (!res.ok) {
    return reply({ ok: false, message: "The recipe service is having trouble." });
  }

  const recipes = await res.json();
  if (!Array.isArray(recipes)) {
    return reply({ ok: false, message: "The recipe service sent something unexpected." });
  }

  return reply({ ok: true, recipes });
});

function reply(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
