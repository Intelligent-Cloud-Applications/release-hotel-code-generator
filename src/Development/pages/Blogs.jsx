import React from 'react';
import Navbar from '../components/template1/Navbar.jsx';
import Footer from '../components/template1/Footer.jsx';
import { EditModeProvider } from "../context/EditModeContext.jsx";

const blogs = [
  {
    title: "5 Tips for a Relaxing Vacation",
    date: "June 10, 2025",
    excerpt: "Planning your perfect holiday getaway? Discover our top 5 tips to unwind and make the most of your stay.",
    author: "Jane Smith",
    image: "https://source.unsplash.com/600x400/?hotel,relaxation"
  },
  {
    title: "Inside Our Luxury Suites",
    date: "May 20, 2025",
    excerpt: "Take a peek inside our premium suites and see what makes our accommodation truly special.",
    author: "John Doe",
    image: "https://source.unsplash.com/600x400/?hotel,room"
  },
  {
    title: "Gourmet Dining: Chef’s Secrets",
    date: "May 05, 2025",
    excerpt: "Meet our executive chef and learn about the culinary secrets behind our five-star dining experience.",
    author: "Chef Marco",
    image: "https://source.unsplash.com/600x400/?restaurant,food"
  }
];

const Blogs = () => (
  <EditModeProvider>
    <div className="min-h-screen flex flex-col bg-background text-foreground font-quicksand">
      <Navbar />
      <main className="flex-1 container mx-auto py-16 px-4 lg:px-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-orange-500">Our Blogs</h1>
        <div className="grid gap-10 md:grid-cols-3">
          {blogs.map((blog, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
              <img src={blog.image} alt={blog.title} className="h-48 w-full object-cover" />
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-2xl font-semibold mb-2 text-orange-600">{blog.title}</h2>
                <p className="text-gray-500 text-sm mb-4">{blog.date} • by {blog.author}</p>
                <p className="text-gray-700 mb-6 flex-1">{blog.excerpt}</p>
                <button className="mt-auto bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 px-4 font-semibold transition">
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  </EditModeProvider>
);

export default Blogs;