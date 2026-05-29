import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PIANI = {
  single: { priceId: 'price_1TcPeZDzFAPbyVzISB9RhUq3', crediti: 1 },
  pack3: { priceId: 'price_1TcPfADzFAPbyVzIUtXCYVjp', crediti: 3 },
  pack10: { priceId: 'price_1TcPfdDzFAPbyVzIA9hmxWx9', crediti: 10 },
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
    payment_method_types: ['card'],
    line_items: [{ price: piano.priceId, quantity: 1 }],
    mode: 'payment',
    success_url: `https://knittranslate.vercel.app?payment=success&piano=${pianoId}&userId=${userId}`,
    cancel_url: `https://knittranslate.vercel.app?payment=cancelled`,
    customer_email: userEmail,
    metadata: { userId, pianoId, crediti: piano.crediti.toString() },
  });

  res.status(200).json({ url: session.url });
}
