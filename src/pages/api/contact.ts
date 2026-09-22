import 'dotenv/config';
import nodemailer from 'nodemailer';
import type { APIRoute } from 'astro';

export const prerender = false;

const CONTACT_TO = process.env.CONTACT_TO || 'mason.rivera1@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT) || 587,
	secure: Number(process.env.SMTP_PORT) === 465,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const cleanLine = (value: unknown) =>
	String(value ?? '')
		.replace(/[\r\n]+/g, ' ')
		.trim();

const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const name = cleanLine(body?.name).slice(0, 200);
	const email = cleanLine(body?.email).slice(0, 200);
	const message = String(body?.message ?? '').trim().slice(0, 5000);

	if (!name || !email || !message) {
		return json({ error: 'Name, email, and message are required.' }, 400);
	}
	if (!EMAIL_RE.test(email)) {
		return json({ error: 'That email address does not look valid.' }, 400);
	}

	try {
		await transporter.sendMail({
			from: process.env.SMTP_FROM || process.env.SMTP_USER,
			to: CONTACT_TO,
			replyTo: email,
			subject: `Masonsblog.com contact from ${name}`,
			text: `${message}\n\n— ${name} (${email})`,
		});
		return json({ ok: true });
	} catch (err) {
		console.error('Failed to send contact email:', err);
		return json({ error: 'Failed to send email. Please try again later.' }, 502);
	}
};
