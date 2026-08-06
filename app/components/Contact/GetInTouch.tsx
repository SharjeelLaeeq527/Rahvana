"use client";

import React, { useState, useRef } from "react";
import {
  Send,
  MessageSquare,
  Instagram,
  Linkedin,
  Facebook,
} from "lucide-react";
import { Loader } from "@/components/ui/spinner";
import { submitContactForm } from "./contact-action";
import { useLanguage } from "../../context/LanguageContext";
import * as Errors from "@/lib/errors";
import { useToast } from "@/app/components/shared/ToastProvider";
const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298l13.312 17.403z" />
  </svg>
);

export default function GetInTouch() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { t } = useLanguage();
  const { showToast } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await submitContactForm(formData);
      if (result.success) {
        showToast(
          t("homePage.contactSection.success") ||
            "Thank you! Your message has been sent successfully. We'll get back to you soon.",
          "success"
        );
        formRef.current?.reset();
      } else {
        showToast(result.error || Errors.msg(Errors.E.CONTACT_SUBMIT_FAILED), "error");
      }
    } catch {
      showToast(Errors.msg(Errors.E.CONTACT_SUBMIT_FAILED), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="relative overflow-hidden py-8 md:py-16 font-sans"
      id="contact"
      suppressHydrationWarning
      style={{ background: "linear-gradient(180deg,#f7fffd 0%,#f3f8ff 30%,#fffafc 100%)" }}
    >
      {/* Texture overlay - matching opacity from original */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "url('assets/images/footer-texture.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden="true"
      ></div>

      <div className="relative z-10 w-full mx-auto px-6 sm:px-8 md:px-12 2xl:px-30">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full mb-5">
            <MessageSquare size={16} />
            {t("homePage.contactSection.badge") || "Let's Connect"}
          </span>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {t("homePage.contactSection.title") || "Get in Touch"}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("homePage.contactSection.description") ||
              "Have questions or need support? We're here to help."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Social Column */}
          <div className="flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-semibold text-foreground mb-6">
              {t("homePage.contactSection.followUs") || "Follow Us"}
            </h3>
            <div className="flex justify-between items-center gap-4 w-full max-w-[380px]">
              <SocialCard
                icon={<Instagram size={28} />}
                href="https://www.instagram.com/rahvana.co?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr"
                target="_blank"
                ariaLabel="Follow us on Instagram"
              />
              <SocialCard
                icon={<Linkedin size={28} />}
                href="https://www.linkedin.com/company/rahvana/posts/?feedView=all"
                target="_blank"
                ariaLabel="Connect on LinkedIn"
              />
              <SocialCard
                icon={<XIcon size={28} />}
                href="https://x.com/rahvanaco?s=21&t=a8CQwdRgHqBFZmUfsX8Gpg"
                target="_blank"
                ariaLabel="Follow us on X"
              />
              <SocialCard
                icon={<Facebook size={28} />}
                href="https://www.facebook.com/profile.php?id=61587967827317&mibextid=wwXIfr"
                target="_blank"
                ariaLabel="Follow us on Facebook"
              />
            </div>
          </div>

          {/* Contact Form Wrapper */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-6">
              {t("homePage.contactSection.sendMessage") || "Send a Message"}
            </h3>

            <form
              className="flex flex-col gap-4"
              id="contactForm"
              onSubmit={handleSubmit}
              ref={formRef}
              noValidate
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                    {t("homePage.contactSection.firstName") || "First Name"}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder={t("homePage.contactSection.placeholderFirstName") || "John"}
                    required
                    disabled={isSubmitting}
                    className="p-3 border border-border rounded-lg text-base bg-muted/50 focus:bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60"
                    suppressHydrationWarning
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                    {t("homePage.contactSection.lastName") || "Last Name"}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Smith"
                    required
                    disabled={isSubmitting}
                    className="p-3 border border-border rounded-lg text-base bg-muted/50 focus:bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60"
                    suppressHydrationWarning
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  {t("homePage.contactSection.email") || "Email Address"}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={t("homePage.contactSection.placeholderEmail") || "john@example.com"}
                  required
                  disabled={isSubmitting}
                  className="p-3 border border-border rounded-lg text-base bg-muted/50 focus:bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60"
                  suppressHydrationWarning
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  {t("homePage.contactSection.message") || "Message"}
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder={
                    t("homePage.contactSection.placeholderMessage") || "How can we help you?"
                  }
                  required
                  disabled={isSubmitting}
                  className="p-3 border border-border rounded-lg text-base bg-muted/50 min-h-28 resize-y focus:bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60"
                  suppressHydrationWarning
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="self-start inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
                suppressHydrationWarning
              >
                {isSubmitting ? (
                  <>
                    {t("homePage.contactSection.sending") || "Sending..."}
                    <Loader size="sm" />
                  </>
                ) : (
                  <>
                    {t("homePage.contactSection.sendButton") || "Send Message"}
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialCard({
  icon,
  href,
  target,
  ariaLabel,
}: {
  icon: React.ReactNode;
  href: string;
  target?: string;
  ariaLabel: string;
}) {
  return (
    <a
      href={href}
      target={target}
      className="flex items-center justify-center w-20 h-20 bg-muted/30 border border-border rounded-2xl text-primary no-underline transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary hover:-translate-y-1 hover:shadow-lg group"
      aria-label={ariaLabel}
    >
      <div className="transition-transform duration-300 group-hover:scale-110">{icon}</div>
    </a>
  );
}
