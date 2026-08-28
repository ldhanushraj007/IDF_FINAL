import { useState } from 'react';
import { MapPin, Phone, MessageCircle, Mail, Send, CheckCircle } from 'lucide-react';
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

    // Build WhatsApp message with form data
    const msg = `Hello IN DESIGN!\n\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || 'Not provided'}\n\nMessage:\n${form.message}`;
    const waUrl = waLink(msg);

    // Open WhatsApp with pre-filled message
    window.open(waUrl, '_blank');

    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 500);
  };

  if (submitted) {
    return (
      <>
        <section className="bg-[#FFE6E9] py-20 md:py-28 px-6 md:px-12">
          <div className="max-w-[600px] mx-auto text-center">
            <CheckCircle className="h-12 w-12 text-[#1F0505] mx-auto mb-6" strokeWidth={1} />
            <h1 className="font-serif text-[36px] md:text-[48px] text-[#1F0505] leading-tight">
              Message Sent
            </h1>
            <p className="mt-4 text-[14px] text-[#1F0505]/50 leading-relaxed">
              Thank you for reaching out. We'll get back to you shortly. If you'd like an immediate response, please use WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <a href={WA_DEFAULT} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sheen">
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </a>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }); }}
                className="btn btn-outline"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-[#FFE6E9] py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          <span className="kicker-dark">Get in Touch</span>
          <h1 className="mt-4 font-serif text-[42px] md:text-[64px] text-[#1F0505] leading-[0.95] tracking-tight">
            Contact Us
          </h1>
          <p className="mt-5 text-[14px] text-[#1F0505]/50 max-w-[480px] leading-relaxed">
            We'd love to hear from you. Whether you have a question about fabrics, need assistance with an order, or want to plan a showroom visit — reach out.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="bg-white py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
          {/* Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1F0505]/40 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className={`w-full border ${errors.name ? 'border-red-400' : 'border-[#1F0505]/15'} bg-transparent px-4 py-3 text-[14px] text-[#1F0505] focus:border-[#1F0505] focus:outline-none transition-colors`}
                    placeholder="Your name"
                  />
                  {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1F0505]/40 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    className={`w-full border ${errors.email ? 'border-red-400' : 'border-[#1F0505]/15'} bg-transparent px-4 py-3 text-[14px] text-[#1F0505] focus:border-[#1F0505] focus:outline-none transition-colors`}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label className="block font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1F0505]/40 mb-2">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-[#1F0505]/15 bg-transparent px-4 py-3 text-[14px] text-[#1F0505] focus:border-[#1F0505] focus:outline-none transition-colors"
                  placeholder="+91 ..."
                />
              </div>
              <div>
                <label className="block font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1F0505]/40 mb-2">
                  Message *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={5}
                  className={`w-full border ${errors.message ? 'border-red-400' : 'border-[#1F0505]/15'} bg-transparent px-4 py-3 text-[14px] text-[#1F0505] focus:border-[#1F0505] focus:outline-none transition-colors resize-y`}
                  placeholder="Tell us how we can help..."
                />
                {errors.message && <p className="text-red-500 text-[11px] mt-1">{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={sending}
                className="btn btn-dark btn-sheen"
              >
                {sending ? 'Sending...' : (
                  <>
                    <Send className="h-4 w-4" /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info sidebar */}
          <div className="space-y-8">
            <div>
              <h3 className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1F0505]/30 mb-4">
                Direct Contact
              </h3>
              <div className="space-y-4">
                <a href={`tel:${BUSINESS.phoneRaw}`} className="flex items-center gap-3 text-[14px] text-[#1F0505]/70 hover:text-[#1F0505] transition-colors">
                  <Phone className="h-4 w-4 shrink-0 text-[#1F0505]/30" /> {BUSINESS.phoneDisplay}
                </a>
                <a href={WA_DEFAULT} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[14px] text-[#1F0505]/70 hover:text-[#1F0505] transition-colors">
                  <MessageCircle className="h-4 w-4 shrink-0 text-[#1F0505]/30" /> WhatsApp
                </a>
                <a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-3 text-[14px] text-[#1F0505]/70 hover:text-[#1F0505] transition-colors break-all">
                  <Mail className="h-4 w-4 shrink-0 text-[#1F0505]/30" /> {BUSINESS.email}
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-[#1F0505]/6">
              <h3 className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-[#1F0505]/30 mb-4">
                Showroom
              </h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#1F0505]/30" />
                <p className="text-[13px] text-[#1F0505]/60 leading-relaxed">
                  {BUSINESS.addressLine1}<br />
                  {BUSINESS.addressLine2}<br />
                  {BUSINESS.addressLine3}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#1F0505]/6">
              <iframe
                title="Map"
                src={BUSINESS.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[200px]"
                style={{ border: '1px solid rgba(31,5,5,0.08)', filter: 'sepia(0.1) saturate(0.9)' }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
