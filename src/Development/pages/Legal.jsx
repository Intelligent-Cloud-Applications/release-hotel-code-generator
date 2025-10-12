import React from 'react';
import Navbar from '../components/template1/Navbar.jsx';
import Footer from '../components/template1/Footer.jsx';
import { EditModeProvider } from "../context/EditModeContext.jsx";

const Legal = () => (
  <EditModeProvider>
    <div className="min-h-screen flex flex-col bg-background text-foreground font-quicksand">
      <Navbar />
      <main className="flex-1 container mx-auto py-16 px-4 lg:px-24 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-orange-500 text-center">Legal Information</h1>
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6 text-gray-700">
          <h2 className="text-2xl font-bold text-orange-500">Terms and Conditions</h2>
          <p>
            By using our website and services, you agree to comply with our terms and conditions. Please read them carefully before proceeding with any bookings.
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>All bookings are subject to availability and confirmation.</li>
            <li>Guests are responsible for any damages caused during their stay.</li>
            <li>Personal data will be handled according to our Privacy Policy.</li>
            <li>Unauthorized commercial use of our site and services is prohibited.</li>
          </ul>
          <h2 className="text-2xl font-bold text-orange-500">Disclaimer</h2>
          <p>
            The information on this website is provided for general information purposes only. We make every effort to ensure accuracy, but do not guarantee completeness or timeliness.
          </p>
          <h2 className="text-2xl font-bold text-orange-500">Contact</h2>
          <p>
            For any legal inquiries, please contact us at <b>legal@luxuryhotel.com</b>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  </EditModeProvider>
);

export default Legal;