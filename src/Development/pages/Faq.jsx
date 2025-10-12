import React from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { EditModeProvider } from "../context/EditModeContext.jsx";

const faqs = [
  {
    q: "How can I make a reservation?",
    a: "You can reserve a room directly on our website or by calling our front desk at +1 234 567 8900."
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancellations are free up to 48 hours before check-in. After that, one night's stay will be charged."
  },
  {
    q: "Is breakfast included?",
    a: "Yes, all room bookings include a complimentary breakfast buffet."
  },
  {
    q: "Do you offer airport shuttle services?",
    a: "Yes, we provide 24/7 airport transfers. Please contact us in advance to schedule your pickup."
  },
  {
    q: "Are pets allowed in the hotel?",
    a: "Yes, pets are welcome! Please let us know when booking so we can prepare your room accordingly."
  }
];

const Faq = () => (
  <EditModeProvider>
    <div className="min-h-screen flex flex-col bg-background text-foreground font-quicksand">
      <Navbar />
      <main className="flex-1 container mx-auto py-16 px-4 lg:px-24 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-orange-500 text-center">Frequently Asked Questions</h1>
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {faqs.map((item, idx) => (
            <div key={idx} className="border-b last:border-none pb-6 last:pb-0">
              <h3 className="text-xl text-orange-600 font-semibold mb-2">{item.q}</h3>
              <p className="text-gray-700">{item.a}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  </EditModeProvider>
);

export default Faq;