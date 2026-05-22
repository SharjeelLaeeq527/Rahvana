"use server";

import { sendEmail } from "@/lib/email/resend";
import { E, msg } from "@/lib/errors";

export async function submitContactForm(formData: FormData) {
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    if (!firstName || !lastName || !email || !message) {
        return { success: false, error: msg(E.CONTACT_ALL_FIELDS_REQUIRED) };
    }

    const subject = `New Contact Form Submission from ${firstName} ${lastName}`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; rounded-lg: 12px;">
            <h2 style="color: #0d7377; border-bottom: 2px solid #0d7377; padding-bottom: 10px;">New Message from Rahvana</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #fafbfc; border-radius: 8px;">
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #586069; border-top: 1px solid #e1e4e8; padding-top: 10px;">
                This message was sent from the contact form on Rahvana.com
            </p>
        </div>
    `;

    try {
        const result = await sendEmail({
            to: "support@rahvana.com",
            subject,
            html,
        });

        if (result.success) {
            return { success: true };
        } else {
            return { success: false, error: result.error || msg(E.CONTACT_SEND_FAILED) };
        }
    } catch (error) {
        console.error("Error submitting contact form:", error);
        return { success: false, error: msg(E.CONTACT_UNEXPECTED_ERROR) };
    }
}
