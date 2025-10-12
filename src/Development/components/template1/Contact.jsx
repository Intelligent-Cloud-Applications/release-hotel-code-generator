import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { EditModeProvider } from "../../context/EditModeContext.jsx";

const initialState = { name: '', email: '', message: '' };

const Contact = () => {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState({ loading: false, success: null, error: null });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Simulate mock API call
  const handleSubmit = async e => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });
    await new Promise(res => setTimeout(res, 1200)); // Simulate network delay
    if (form.name && form.email && form.message) {
      setStatus({ loading: false, success: "Your message has been sent!", error: null });
      setForm(initialState);
    } else {
      setStatus({ loading: false, success: null, error: "Please fill in all fields." });
    }
  };

  return (
    <EditModeProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground font-quicksand">
        <Navbar />
        <main className="flex-1 container mx-auto py-16 px-4 lg:px-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-orange-500">Contact Us</h1>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto text-center">
            We’d love to hear from you! Fill out the form and our team will get back to you soon.
          </p>
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Name</label>
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-400"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Email</label>
                <input
                  required
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-400"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Message</label>
                <textarea
                  required
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-400"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                disabled={status.loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-3 font-semibold transition"
              >
                {status.loading ? "Sending..." : "Send Message"}
              </button>
              {status.success && <p className="text-green-600 font-semibold mt-2">{status.success}</p>}
              {status.error && <p className="text-red-500 font-semibold mt-2">{status.error}</p>}
            </form>
            <div className="mt-8 text-gray-600 text-sm border-t pt-6">
              <div><b>Phone:</b> +1 234 567 8900</div>
              <div><b>Email:</b> info@luxuryhotel.com</div>
              <div><b>Address:</b> 123 Paradise Avenue, Dream City, Country</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </EditModeProvider>
  );
};

export default Contact;