import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendInvitationEmail({ invitedEmail, workspaceName, inviterEmail, invitationId, expiresAt }) {
  const acceptUrl = `${env.FRONTEND_URL}/invitations/${invitationId}`;
  const expiresDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend's shared testing domain -- swap once a real domain is verified
      to: invitedEmail,
      subject: `You've been invited to join ${workspaceName}`,
      html: `
        <p>Hi,</p>
        <p><strong>${inviterEmail}</strong> has invited you to collaborate on "<strong>${workspaceName}</strong>".</p>
        <p><a href="${acceptUrl}">Accept Invitation</a></p>
        <p>This invitation expires on ${expiresDate}.</p>
      `,
    });

    if (error) {
      console.error('Failed to send invitation email:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to send invitation email:', err);
    return false;
  }
}