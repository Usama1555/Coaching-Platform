const { sendEmailWithResend } = require('./email');
const { getOwnerEmails } = require('./ownerHelpers');
const { getPrimaryClientUrl } = require('./clientAppUrl');

async function notifyOwnersOfPendingCoachSignup({ coachName, coachEmail, coachId, createdAt }) {
  const ownerEmails = getOwnerEmails();

  if (!ownerEmails.length) {
    return { skipped: true, reason: 'No owner emails configured' };
  }

  const from = process.env.EMAIL_FROM;

  if (!from) {
    return { skipped: true, reason: 'EMAIL_FROM is not configured' };
  }

  const ownerDashboardUrl = `${getPrimaryClientUrl()}/owner`;

  return sendEmailWithResend({
    from,
    to: ownerEmails,
    subject: 'New coach signup pending approval',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">New coach signup pending approval</h2>
        <p>A new coach has requested access to the platform.</p>
        <ul>
          <li><strong>Name:</strong> ${coachName}</li>
          <li><strong>Email:</strong> ${coachEmail}</li>
          <li><strong>Coach ID:</strong> ${coachId}</li>
          <li><strong>Created at:</strong> ${new Date(createdAt).toLocaleString()}</li>
        </ul>
        <p>
          Review this signup in the owner dashboard:
          <a href="${ownerDashboardUrl}">${ownerDashboardUrl}</a>
        </p>
      </div>
    `,
  });
}

module.exports = {
  notifyOwnersOfPendingCoachSignup,
};
