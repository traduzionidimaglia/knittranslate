import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: 'Webhook error' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, crediti } = session.metadata;
    const creditiDaAggiungere = parseInt(crediti);

    const { data } = await supabase
      .from('user_translations')
      .select('id, traduzioni_effettuate')
      .eq('user_id', userId)
      .single();

    if (data) {
      await supabase
        .from('user_translations')
        .update({ traduzioni_effettuate: data.traduzioni_effettuate + creditiDaAggiungere })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_translations')
        .insert({ user_id: userId, traduzioni_effettuate: creditiDaAggiungere });
    }
  }

  res.status(200).json({ received: true });
}
