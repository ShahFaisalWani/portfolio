import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faCheckCircle, faFrown } from "@fortawesome/free-regular-svg-icons";
import { SocialBar } from "./social-bar";
import { motion } from 'framer-motion';
import React, { useState, useRef } from "react";
import emailjs from '@emailjs/browser';
import { cn } from "@lib/utils";

const ContactForm: React.FC<{ onClose: () => void }> = () => {
  const form = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const validateForm = () => {
    const formData = new FormData(form.current!);
    const name = formData.get("user_name")?.toString() || "";
    const email = formData.get("user_email")?.toString() || "";
    const message = formData.get("message")?.toString() || "";

    const newErrors: { name?: string; email?: string; message?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email.";
    }

    if (!message.trim()) {
      newErrors.message = "Message is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    if (form.current) {
      emailjs
        .sendForm(
          'service_9r6wred',
          'template_c5sh1ji',
          form.current,
          'c4nY5ohJFe3OH89j1'
        )
        .then(
          () => {
            setStatus('success');
            setLoading(false);
            form.current?.reset();
          },
          (error) => {
            console.error(error.text);
            setStatus('error');
            setTimeout(() => {
              setStatus(null);
            }, 2500);
            setLoading(false);
          }
        );
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-primary-contrast">Contact Me</h1>
        <motion.button
          type="submit"
          className={cn("rounded-xl px-6 py-4 text-text text-lg flex gap-4 w-40 h-20 justify-center items-center font-gt-bold relative", status === 'success' ? "bg-green" : status === 'error' ? "bg-red-500" : "bg-primary-20")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          disabled={loading}
          onClick={sendEmail}
        >
          {loading ? (
            <motion.div
              className="loader border-4 border-t-transparent border-white rounded-full w-10 h-10"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
          ) : status === 'success' ? (
            <>
              <span className="text-white">Done</span>
              <FontAwesomeIcon icon={faCheckCircle} size="xl" className="text-white" />
            </>
          ) : status === 'error' ? (
            <>
              <span className="text-white">Failed</span>
              <FontAwesomeIcon icon={faFrown} size="xl" className="text-white" />
            </>
          ) : (
            <>
              <span className="text-white">Send</span>
              <FontAwesomeIcon icon={faPaperPlane} size="xl" className="text-white" />
            </>
          )}
        </motion.button>
      </div>

      <form ref={form} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-primary-contrast text-lg">
          Name:
          <input
            type="text"
            name="user_name"
            className={`border ${errors.name ? "border-red-500" : "border-bg"} focus:border-bg-contrast text-lg text-accent-10 rounded-lg p-2`}
            placeholder="Your name"
            required
          />
          {errors.name && <span className="text-red-400 text-sm">{errors.name}</span>}
        </label>

        <label className="flex flex-col gap-2 text-primary-contrast text-lg">
          Email:
          <input
            type="email"
            name="user_email"
            className={`border ${errors.email ? "border-red-500" : "border-bg"} focus:border-bg-contrast text-lg text-accent-10 rounded-lg p-2`}
            placeholder="Your email"
            required
          />
          {errors.email && <span className="text-red-400 text-sm">{errors.email}</span>}
        </label>

        <label className="flex flex-col gap-2 text-primary-contrast text-lg">
          Message:
          <textarea
            name="message"
            className={`border ${errors.message ? "border-red-500" : "border-bg"} focus:border-bg-contrast text-lg text-accent-10 rounded-lg p-2 h-40`}
            placeholder="Your message"
            required
          />
          {errors.message && <span className="text-red-400 text-sm">{errors.message}</span>}
        </label>
      </form>
      <SocialBar />
    </div>
  );
};

export default ContactForm;
