import React from 'react';
import Navbar from '../components/template1/Navbar.jsx';
import Footer from '../components/template1/Footer.jsx';
import { EditModeProvider } from "../context/EditModeContext.jsx";

const Privacy = () => (
  <EditModeProvider>
    <div className="min-h-screen flex flex-col bg-background text-foreground font-quicksand">
      <Navbar />
      <main className="flex-1 container mx-auto py-16 px-4 lg:px-24 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-orange-500 text-center">Privacy Policy</h1>
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6 text-gray-700">
          <p>
            <b>Effective Date:</b> January 1, 2025
          </p>
          <p>
            Welcome to Luxury Hotel. We value your privacy and are committed to protecting your personal information. This privacy policy explains what information we collect, how we use it, and your choices regarding your data.
          </p>
          <h2 className="text-2xl font-bold text-orange-500">Information We Collect</h2>
          <ul className="list-disc list-inside ml-4">
            <li>Personal identification information (Name, email, phone number, etc.)</li>
            <li>Booking details and preferences</li>
            <li>Website usage data (cookies, analytics, etc.)</li>
          </ul>
          <h2 className="text-2xl font-bold text-orange-500">How We Use Your Information</h2>
          <ul className="list-disc list-inside ml-4">
            <li>To manage bookings and provide services</li>
            <li>To improve our website and services</li>
            <li>To send promotional communications (with your consent)</li>
          </ul>
          <h2 className="text-2xl font-bold text-orange-500">Your Rights</h2>
          <ul className="list-disc list-inside ml-4">
            <li>Access, update, or delete your information</li>
            <li>Opt-out of marketing emails</li>
            <li>Request a copy of your data</li>
          </ul>
          <p>
            For more details, contact us at <b>privacy@luxuryhotel.com</b>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  </EditModeProvider>
);

export default Privacy;