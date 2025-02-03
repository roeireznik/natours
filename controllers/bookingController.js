const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utiles/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);
  console.log('Result of Tour.findById():', tour);
  if (!tour) {
    console.error('Tour not found with ID:', tourId); // Log the ID that wasn't found
    return next(new AppError('No tour found with that ID.', 404)); // Return the error
  }
  console.log('Tour price:', tour.price); // Log the tour price (if tour was found)
  console.log('Tour name:', tour.name); // Log the tour name
  console.log('Tour image:', tour.imageCover);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours/?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
            ],
          },
        },
      },
    ],
  });
  console.log('Stripe Session Object:', session); // Log the entire session object

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is only TEMPORARY, because it's UNSECURE: everyone can make booking without paying
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  if (!user) {
    console.error('User not found for email:', session.customer_email);
    throw new Error('User not found'); // Stop execution and log the error
  }
  if (!session.line_items || session.line_items.length === 0) {
    console.error('No line items found in session:', session);
    throw new Error('No line items found');
  }

  const price = session.line_items[0].price_data.unit_amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  console.log('Webhook hit!');

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    const body = JSON.parse(req.body.toString('utf8')); // Parse the buffer to JSON
    console.log('Parsed request body:', body);
    const id = body.data.object.id; // Or body.id, body.data.id, etc. - check your logs!
    console.log('ID:', id);
    if (!id) {
      console.error('ID is missing in webhook payload!');
      return res.status(400).send('ID is required.');
    }
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
    res.status(200).json({ received: true });
  }
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
