User is buying through CheckoutButton (message 1800 comes only from there). The problem: CheckoutButton throws a generic message for any non-200 — it ignores the real data.error the server sends (e.g. "You already own the premium plan", the 503 text, or a past_due→portal case). So the real reason is being hidden.

Given the account history (leftover/duplicate live subscriptions existed, 57 payment rows), the most likely real reason is the duplicate/downgrade guard returning 400 because a live subscription already exists for that customer — which is correct behavior, just shown as a scary generic message.

Fix: make CheckoutButton show the real error and route past_due/manage cases to the billing portal (same as the pricing page already does):

● Update(app\components\payment\CheckoutButton.tsx)
Added 23 lines, removed 1 line
      const data = await response.json();

      if (!response.ok) {
        throw new Error(msg(E.PAYMENT_CHECKOUT_FAILED));
        // Payment is failing on a plan the user already holds (past_due / manage),
        // or the server asks us to send them to the billing portal to recover
        // instead of buying again. Route there rather than showing a dead error.
        if (data?.portal) {
          try {
            const portalRes = await fetch("/api/stripe/portal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });
            const portalData = await portalRes.json();
            if (portalData?.url) {
              window.location.href = portalData.url;
              return;
            }
          } catch {
            /* fall through to showing the server's message */
          }
        }
        // Surface the ACTUAL reason from the server (e.g. "You already own the
        // premium plan", or a "try again in a moment" message) instead of a
        // generic one, so the user knows what to do.
        throw new Error(data?.error || msg(E.PAYMENT_CHECKOUT_FAILED));
      }

      // Redirect to Stripe checkout

  Ran 1 shell command

Type-clean. Yeh raha diagnosis + fix:

Kya ho raha tha

Woh message (PAYMENT_CHECKOUT_FAILED, id 1800) sirf CheckoutButton component se aata hai, aur woh har non-200 response pe same generic message dikhata tha — server ka asli data.error ignore kar raha tha. Yani asli wajah chhup rahi thi.

Maine kya check kiya (live)

- Teeno naye Stripe calls (customers.search, customers.list, subscriptions.list for-await) live key pe theek chal rahe hain — to 503 wala path wajah nahi hai.
- Migration/column bhi theek hai (pehle confirm kiya tha).

Sabse mumkin asli wajah

Us customer ke paas pehle se ek live subscription mojood hai (purane testing/duplicate-subs ke leftover se — us account pe 57 payment rows aur duplicate subs the). Aise me checkout ka guard jaan-boojh ke 400 return karta hai ("You already own..." ya downgrade) — yeh sahi behavior hai (duplicate rokne ke liye), bas CheckoutButton usay scary generic message bana ke dikha raha tha.

Fix kiya

app/components/payment/CheckoutButton.tsx — ab:
1. Server ka asli error message dikhata hai (e.g. "You already own the premium plan"), generic ki jagah.
2. Agar server portal: true bhejta hai (past_due / manage case), to seedha billing portal pe le jaata hai, buy dobara karane ki bajaye.

Type-clean. Deploy ke baad button asli wajah bata dega.

Aap abhi confirm kaise karein

Deploy ke baad dobara buy karein — ab message asli reason dikhayega. 3 me se koi hoga:
- "You already own..." → us account ke paas already active plan hai (Stripe dashboard me us customer ki active subscription cancel karke fresh buy karein, ya doosre test account se try karein).
- "...past due..." → portal khul jayega, card update karein.
- "...try again in a moment..." → transient, dobara try.

Agar aap mujhe woh exact email/account bata dein jisse buy kar rahe the (taha.nadeem wala account is DB me nahi mila), to main uska live Stripe state nikaal ke exact reason bata deta hoon — 30 second ka kaam. Bolo?

✻ Baked for 5m 24s · done 12:26 AM
