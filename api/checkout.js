import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PIANI = {
  single: { priceId: 'price_1TcRP0DfTPFearaDhqH0nT4z', crediti: 1 },
  pack3: { priceId: 'price_1TcROyDfTPFearaDaeVK9hgY', crediti: 3 },
  pack10: { priceId: 'price_1TcROuDfTPFearaDWg7tWRol', crediti: 10 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pianoId, userId, userEmail } = req.body;
  const piano = PIANI[pianoId];

  if (!piano) {
    return res.status(400).json({ error: 'Piano non valido' });
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: piano.priceId, quantity: 1 }],
    mode: 'payment',
    success_url: `https://knittranslate.vercel.app?payment=success&piano=${pianoId}&userId=${userId}`,
    cancel_url: `https://knittranslate.vercel.app?payment=cancelled`,
    customer_email: userEmail,
    metadata: { userId, pianoId, crediti: piano.crediti.toString() },
  });

  res.status(200).json({ url: session.url });
}