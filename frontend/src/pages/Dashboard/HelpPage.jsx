// import React from "react";
// import { HelpCircle, Mail, FileText } from "lucide-react";

// export default function HelpPage() {
//   const faqs = [
//     { q: "How do I upload my CV?", a: "Click on the Upload CV button on the home page and select your file." },
//     { q: "What file formats are supported?", a: "We support PDF, DOC, and DOCX formats up to 10MB." },
//     { q: "How is the match score calculated?", a: "Our AI analyzes your CV using NLP and semantic embeddings." },
//   ];

//   return (
//     <div className="space-y-8">
//       <h1 className="text-4xl font-bold text-gray-800">Help Center</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
//           <HelpCircle className="w-12 h-12 mb-4" />
//           <h3 className="text-2xl font-bold mb-2">FAQs</h3>
//           <p className="text-blue-100 mb-4">Find answers to common questions</p>
//           <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition">
//             Browse FAQs
//           </button>
//         </div>

//         <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
//           <Mail className="w-12 h-12 mb-4" />
//           <h3 className="text-2xl font-bold mb-2">Contact Support</h3>
//           <p className="text-purple-100 mb-4">Get help from our team</p>
//           <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition">
//             Contact Us
//           </button>
//         </div>
//       </div>

//       <div className="bg-white rounded-2xl shadow-xl p-8">
//         <h2 className="text-2xl font-bold text-gray-800 mb-6">Common Questions</h2>
//         <div className="space-y-4">
//           {faqs.map((item, idx) => (
//             <div key={idx} className="p-4 bg-gray-50 rounded-xl">
//               <h3 className="font-semibold text-gray-800 mb-2">{item.q}</h3>
//               <p className="text-gray-600">{item.a}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
// HelpPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { Mail, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";

export default function HelpPage() {
  const faqs = [
    { q: "How do I upload my CV?", a: "Click on the Upload CV button on the home page and select your file." },
    { q: "What file formats are supported?", a: "We support PDF, DOC, and DOCX formats up to 10MB." },
    { q: "How is the match score calculated?", a: "Our AI analyzes your CV using NLP and semantic embeddings." },
  ];

  const [form, setForm] = useState({
    name: "", email: "", subject: "", category: "general", message: ""
  });
  const [notice, setNotice] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setNotice({ text: "", type: "" });
  };

  const submit = async (e) => {
    e.preventDefault();
    const { name, email, subject, message, category } = form;
    if (!name || !email || !subject || !message) {
      setNotice({ text: "Please fill in all required fields", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://127.0.0.1:8000/support/complaints",
        { name, email, subject, category, message },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setNotice({ text: "Message sent! We’ll get back to you within 24 hours.", type: "success" });
      setForm({ name: "", email: "", subject: "", category: "general", message: "" });
    } catch {
      setNotice({ text: "Could not send your message. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold text-gray-800 text-center">Contact Us</h1>
      <p className="text-center text-gray-600 -mt-3">We’re here to help! Send us a message and we’ll respond ASAP.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Email card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Email Us</h3>
            <p className="text-gray-600 mb-3">Our team will respond within 24 hours</p>
            <a href="mailto:support@cvmatcher.com" className="text-blue-600 font-semibold hover:text-blue-700">
              support@cvmatcher.com
            </a>
          </div>
        </div>

        {/* Send a message form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Send us a Message</h2>
            </div>

            {notice.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                notice.type === "success"
                  ? "bg-green-50 border-2 border-green-200 text-green-800"
                  : "bg-red-50 border-2 border-red-200 text-red-800"
              }`}>
                {notice.type === "success" ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                <span className="font-medium">{notice.text}</span>
              </div>
            )}

            <form onSubmit={submit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input name="name" value={form.name} onChange={onChange}
                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" name="email" value={form.email} onChange={onChange}
                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select name="category" value={form.category} onChange={onChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:border-purple-400">
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feedback">Feedback</option>
                    <option value="bug">Report a Bug</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input name="subject" value={form.subject} onChange={onChange}
                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea rows="6" name="message" value={form.message} onChange={onChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 resize-none" />
              </div>

              <button disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:shadow-2xl disabled:opacity-50">
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Common Questions */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Common Questions</h2>
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-2">{item.q}</h3>
              <p className="text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
