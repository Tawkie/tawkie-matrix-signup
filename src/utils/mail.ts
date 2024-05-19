import axios from 'axios';

export type EmailHeader = {
  key: string;
  value: string;
};

export type EmailRecipient = {
  name: string;
  email: string;
};

export type MailData = {
  from: EmailRecipient;
  to: EmailRecipient[];
  subject: string;
  text: string;
  html: string;
  project_id?: string,
  additional_headers: EmailHeader[];
};

const EMAIL_API_REGION = process.env.EMAIL_API_REGION || 'fr-par';
const EMAIL_API_PROJECT_ID = process.env.EMAIL_API_PROJECT_ID;
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;

const sendMailUrl = `https://api.scaleway.com/transactional-email/v1alpha1/regions/${EMAIL_API_REGION}/emails`;

export const sendMail = (mailData: MailData): Promise<void> => {
  if (!EMAIL_API_KEY) {
    throw new Error('EMAIL_API_KEY is not set');
  } else if (!EMAIL_API_PROJECT_ID) {
    throw new Error('EMAIL_API_PROJECT_ID is not set');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Auth-Token': EMAIL_API_KEY,
  };
  return axios.post(sendMailUrl, { ...mailData, project_id: EMAIL_API_PROJECT_ID }, { headers });
}

export const sendAcceptanceMail = async (recipientEmailAddress: string, username: string): Promise<void> => {
  const mailData: MailData = {
    from: {
      name: 'Tawkie - No Reply',
      email: 'no-reply@tawkie.fr',
    },
    to: [
      {
        name: username,
        email: recipientEmailAddress,
      },
    ],
    subject: 'Start using Tawkie Today !',
    text: `Hello ${username},
    Your account has been accepted, you can now start using Tawkie !`,
    html: `Hello ${username},<br>
    Your account has been accepted, you can now start using Tawkie !`,
    additional_headers: [],
  };
  return sendMail(mailData);
}
