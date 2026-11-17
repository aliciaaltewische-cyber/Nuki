// Empfängt Stripe-Webhooks und schaltet bezahlte Orte als "Empfohlen" frei.
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import Stripe from 'npm:stripe@14.25.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() });
const crypto = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(), signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, crypto);
  } catch (e) {
    console.error('Ungültige Signatur', e);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid' && session.metadata?.order_id) {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { error } = await admin.rpc('mark_order_paid', { p_order_id: session.metadata.order_id, p_session_id: session.id });
      if (error) { console.error(error); return new Response('DB error', { status: 500 }); }
    }
  }
  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
