import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourID) => {
  console.log(tourID);
  try {
    const stripe = Stripe(
      'pk_test_51QmGflFb5ABD0L3C8ZaU8Rff17eYNdvsrCFsoF5E59X2xCdxJ82RZ9iN3Qy1TOpPLsaOZGiTtljocLgVRXuCVayv00pmkL5P4n',
    );
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);
    // console.log(session);
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
