"use client";

import React, { useState, useRef } from "react";
import {
  Send,
  MessageSquare,
  Instagram,
  Linkedin,
  Youtube,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Facebook,
} from "lucide-react";
import { submitContactForm } from "./contact-action";
const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298l13.312 17.403z" />
  </svg>
);


export default function GetInTouch() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      const result = await submitContactForm(formData);
      if (result.success) {
        setStatus("success");
        formRef.current?.reset();
      } else {
        setStatus("error");
        setErrorMessage(
          result.error || "Something went wrong. Please try again.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="relative bg-background overflow-hidden py-20 font-sans"
      id="contact"
      suppressHydrationWarning
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

      <div className="relative z-10 max-w-[1200px] mx-auto px-5">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full mb-5">
            <MessageSquare size={16} />
            Let&#39;s Connect
          </span>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-muted-foreground">
            Have questions or need support? We&#39;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Social Column */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Follow Us
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <SocialCard
                icon={<Instagram size={20} />}
                label="Instagram"
                href="https://www.instagram.com/rahvana.co?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr"
                target="_blank"
                ariaLabel="Follow us on Instagram"
              />
              {/* <SocialCard
                icon={<Linkedin size={20} />}
                label="LinkedIn"
                href="#"
                ariaLabel="Connect on LinkedIn"
              /> */}
              <SocialCard
                icon={<Youtube size={20} />}
                label="Youtube"
                href="https://youtube.com/@rahvana_co?si=Mb5-OwJmc5ThTxJs"
                target="_blank"
                ariaLabel="Follow us on Youtube"
              />
              <SocialCard
                icon={<XIcon size={20} />}
                label="X"
                href="https://x.com/rahvanaco?s=21&t=a8CQwdRgHqBFZmUfsX8Gpg"
                target="_blank"
                ariaLabel="Follow us on X"
              />
              <SocialCard
                icon={<Facebook size={20} />}
                label="Facebook"
                href="https://www.facebook.com/profile.php?id=61587967827317&mibextid=wwXIfr"
                target="_blank"
                ariaLabel="Follow us on Facebook"
              />
            </div>
          </div>

          {/* Contact Form Wrapper */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Send a Message
            </h3>

            {status === "success" && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-600 dark:text-green-400">
                <CheckCircle2 size={20} className="shrink-0" />
                <p className="text-sm font-medium">
                  Thank you! Your message has been sent successfully. We&#39;ll
                  get back to you soon.
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <form
              className="flex flex-col gap-4"
              id="contactForm"
              onSubmit={handleSubmit}
              ref={formRef}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium text-foreground"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    required
                    disabled={isSubmitting}
                    className="p-3 border border-border rounded-lg text-base bg-muted/50 focus:bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60"
                    suppressHydrationWarning
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-foreground"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    required
                    disabled={isSubmitting}
                    className="p-3 border border-border rounded-lg text-base bg-muted/50 focus:bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60"
                    suppressHydrationWarning
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  required
                  disabled={isSubmitting}
                  className="p-3 border border-border rounded-lg text-base bg-muted/50 focus:bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-60"
                  suppressHydrationWarning
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-foreground"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="How can we help you?"
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
                    Sending...
                    <Loader2 size={18} className="animate-spin" />
                  </>
                ) : (
                  <>
                    Send Message
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
  label,
  href,
  target,
  ariaLabel,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  target?: string;
  ariaLabel: string;
}) {
  return (
    <a
      href={href}
      target={target}
      className="flex items-center gap-3 p-4 bg-muted/30 border border-border rounded-xl text-foreground no-underline transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-md group"
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-lg shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
