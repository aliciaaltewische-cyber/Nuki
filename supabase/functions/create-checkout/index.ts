// Startet eine Stripe-Checkout-Zahlung, um einen Ort hervorzuheben.
// Deploy: supabase functions deploy create-checkout
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() });
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SITE_URL = Deno.env.get('SITE_URL')!; // z. B. https://deinname.github.io/Nuki/

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    // Wer ruft auf? (JWT des eingeloggten Mitglieds)
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Bitte melde dich an.' }, 401);

    const { place_id, plan_id } = await req.json();
    const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Preis kommt ausschließlich aus der Datenbank – nie vom Client
    const { data: plan } = await admin.from('featured_plans').select('*').eq('id', plan_id).eq('active', true).maybeSingle();
    const { data: place } = await admin.from('places').select('id, name').eq('id', place_id).eq('hidden', false).maybeSingle();
    if (!plan || !place) return json({ error: 'Ungültige Auswahl.' }, 400);

    const { data: order, error } = await admin.from('featured_orders').insert({
      place_id: place.id, user_id: user.id, plan_id: plan.id, days: plan.days,
      amount_cents: plan.price_cents, currency: plan.currency,
    }).select('id').single();
    if (error) throw error;

    const back = new URL(SITE_URL);
    const success = new URL(back); success.searchParams.set('featured', 'success'); success.hash = `/place/${place.id}`;
    const cancel = new URL(back); cancel.searchParams.set('featured', 'cancel'); cancel.hash = `/place/${place.id}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: plan.currency,
          unit_amount: plan.price_cents,
          product_data: { name: `Nuki Empfohlen: ${place.name}`, description: `Hervorhebung für ${plan.label}` },
        },
      }],
      customer_email: user.email ?? undefined,
      metadata: { order_id: order.id, place_id: place.id },
      success_url: success.toString(),
      cancel_url: cancel.toString(),
    });

    await admin.from('featured_orders').update({ stripe_session_id: session.id }).eq('id', order.id);
    return json({ url: session.url });
  } catch (e) {
    console.error(e);
    return json({ error: 'Bezahlung konnte nicht gestartet werden.' }, 500);
  }
});
