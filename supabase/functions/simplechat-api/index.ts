// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// --- Deno-compatible JWT signing ---
// We'll use jose for Deno (https://deno.land/x/jose)
import { importPKCS8, SignJWT } from "npm:jose@5.1.2";

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  try {
    // Parse request body
    const { user_id, title, body } = await req.json();
    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Get FCM access token
    let jwt;
    try {
      jwt = await createJWT();
    } catch (jwtErr) {
      const msg = (jwtErr && typeof jwtErr === 'object' && 'message' in jwtErr) ? jwtErr.message : String(jwtErr);
      return new Response(JSON.stringify({ error: `JWT signing failed: ${msg}` }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    let accessToken;
    try {
      accessToken = await getAccessToken(jwt);
    } catch (tokenErr) {
      const msg = (tokenErr && typeof tokenErr === 'object' && 'message' in tokenErr) ? tokenErr.message : String(tokenErr);
      return new Response(JSON.stringify({ error: `Access token fetch failed: ${msg}` }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Fetch FCM tokens from Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const tokensRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user_id}`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });
    const users = await tokensRes.json();
    if (!users.length || !users[0].fcm_tokens || users[0].fcm_tokens.length === 0) {
      return new Response(JSON.stringify({ error: "No FCM tokens found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    const fcmTokens = users[0].fcm_tokens;

    // --- This is what actually sends the notification ---
    const results: any[] = [];
    for (const token of fcmTokens) {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${Deno.env.get("FCM_PROJECT_ID")}/messages:send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
          },
        }),
      });
      results.push({ token, status: res.status });
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    let message = (e && typeof e === 'object' && 'message' in e) ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

// Helper: Create JWT for FCM using npm:jose
async function createJWT() {
  const privateKey = Deno.env.get("FCM_PRIVATE_KEY");
  const clientEmail = Deno.env.get("FCM_CLIENT_EMAIL");
  if (!privateKey || !clientEmail) {
    throw new Error("FCM_PRIVATE_KEY or FCM_CLIENT_EMAIL environment variable is not set");
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1 hour

  const alg = "RS256";
  const pkcs8Key = await importPKCS8(privateKey, alg);

  const jwt = await new SignJWT({
      scope: "https://www.googleapis.com/auth/firebase.messaging"
    })
    .setProtectedHeader({ alg })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setIssuer(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .sign(pkcs8Key);

  return jwt;
}

// Helper: Exchange JWT for access token
async function getAccessToken(jwt: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get FCM access token");
  return data.access_token;
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/simplechat-api' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
