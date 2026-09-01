import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Mail, Clock, CheckCircle } from 'lucide-react';
import { BUSINESS, WA_DEFAULT, waLink } from '../lib/constants';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);

    const msg = `Hello IN DESIGN!\n\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || 'Not provided'}\n\nMessage:\n${form.message}`;
    const waUrl = waLink(msg);

    window.open(waUrl, '_blank');

    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 500);
  };

  if (submitted) {
    return (
      <div className="bg-[#FAF7F5] text-[#1F1916] min-h-screen py-20 px-6">
        <div className="max-w-[600px] mx-auto text-center bg-white p-12 border border-[#1F1916]/10 shadow-sm">
          <CheckCircle className="h-12 w-12 text-[#1F1916] mx-auto mb-6" strokeWidth={1} />
          <h1 className="font-serif text-[36px] md:text-[48px] text-[#1F1916] font-light leading-tight">
            Message Sent
          </h1>
          <p className="mt-4 text-[14px] text-[#1F1916]/70 leading-relaxed font-sans">
            Thank you for reaching out. We'll get back to you shortly. If you'd like an immediate response, please use WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a href={WA_DEFAULT} target="_blank" rel="noopener noreferrer" className="bg-[#1F1916] text-white px-7 py-3 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
            <button
              type="button"
              onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }); }}
              className="border border-[#1F1916] text-[#1F1916] px-7 py-3 text-[11px] font-sans font-semibold tracking-[0.2em] uppercase"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F5] text-[#1F1916] min-h-screen relative overflow-hidden">
      {/* Full-Bleed Right Background Image */}
      <div className="absolute right-0 top-0 w-full md:w-3/4 h-[560px] z-0 overflow-hidden pointer-events-none">
        <img
          src="/images/contact-bg.jpg"
          alt="Organza Swatches with Cherry Blossom"
          className="w-full h-full object-cover object-right-top scale-[1.24] origin-top-left"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/collections/bridal.jpg';
          }}
        />
        {/* Left-to-Right Fade Mask */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F5] via-[#FAF7F5]/50 to-transparent pointer-events-none" />
        {/* Top-to-Bottom Fade Mask */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F5]/40 via-transparent to-[#FAF7F5] pointer-events-none" />
      </div>

      {/* Breadcrumb Header */}
      <div className="w-full max-w-[1340px] mx-auto px-6 pt-6 pb-2 text-[11px] font-sans tracking-[0.2em] uppercase text-[#1F1916]/60 relative z-10">
        <Link to="/" className="hover:text-[#1F1916] transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-[#1F1916]">CONTACT US</span>
      </div>

      {/* Main Split Section */}
      <section className="py-12 md:py-20 px-6 relative z-10">
        <div className="max-w-[1340px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left Column: Heading & Contact Details */}
          <div>
            <h1 className="font-serif text-[40px] sm:text-[54px] md:text-[66px] text-[#1F1916] font-light leading-[1.05] tracking-tight mb-8">
              Let's Create<br />Something<br />Beautiful.
            </h1>

            <div className="space-y-6 text-[14px] font-sans text-[#1F1916]/80 mt-10">
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-[#1F1916] shrink-0 mt-0.5" strokeWidth={1.3} />
                <div>
                  <p className="font-medium text-[#1F1916]">Bengaluru, India</p>
                  <p className="text-[13px] text-[#1F1916]/60 mt-0.5">Commercial Street, Tasker Town</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-[#1F1916] shrink-0" strokeWidth={1.3} />
                <p className="font-medium text-[#1F1916]">+91 80 4123 4567</p>
              </div>

              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-[#1F1916] shrink-0" strokeWidth={1.3} />
                <p className="font-medium text-[#1F1916]">hello@indesignfabrics.com</p>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-[#1F1916] shrink-0 mt-0.5" strokeWidth={1.3} />
                <div>
                  <p className="font-medium text-[#1F1916]">10:30 AM - 8:00 PM</p>
                  <p className="text-[13px] text-[#1F1916]/60 mt-0.5">Monday - Sunday</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form + Image accent */}
          <div className="bg-white border border-[#1F1916]/10 p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full border ${errors.name ? 'border-red-400' : 'border-[#1F1916]/20'} bg-[#FAF7F5] px-4 py-3.5 text-[14px] text-[#1F1916] focus:border-[#1F1916] focus:outline-none transition-colors font-sans`}
                  placeholder="Your Name *"
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`w-full border ${errors.email ? 'border-red-400' : 'border-[#1F1916]/20'} bg-[#FAF7F5] px-4 py-3.5 text-[14px] text-[#1F1916] focus:border-[#1F1916] focus:outline-none transition-colors font-sans`}
                  placeholder="Email Address *"
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-[#1F1916]/20 bg-[#FAF7F5] px-4 py-3.5 text-[14px] text-[#1F1916] focus:border-[#1F1916] focus:outline-none transition-colors font-sans"
                  placeholder="Phone Number"
                />
              </div>

              <div>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  className={`w-full border ${errors.message ? 'border-red-400' : 'border-[#1F1916]/20'} bg-[#FAF7F5] px-4 py-3.5 text-[14px] text-[#1F1916] focus:border-[#1F1916] focus:outline-none transition-colors font-sans resize-none`}
                  placeholder="Your Message *"
                />
                {errors.message && <p className="text-[11px] text-red-500 mt-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-[#1F1916] text-white hover:bg-black transition-colors py-4 text-[11px] font-sans font-semibold tracking-[0.25em] uppercase flex items-center justify-center gap-2 group"
              >
                {sending ? 'SENDING...' : 'SEND MESSAGE'}
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

