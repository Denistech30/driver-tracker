import emailjs from '@emailjs/browser';

// ------------------------------------------------------------------------
// IMPORTANT: EmailJS Configuration
// ------------------------------------------------------------------------
// To use real email functionality:
// 1. Sign up at https://www.emailjs.com/ (they have a free tier)
// 2. Create an Email Service (like Gmail, Outlook, etc.)
// 3. Create an Email Template with these parameters:
//    - {{to_email}} : The recipient's email
//    - {{recovery_code}} : The 8-digit recovery code
//    - {{app_name}} : The name of the app ("Xpense")
//    - {{valid_for}} : How long the code is valid for ("15 minutes")
// 4. Set these environment variables in your deployment platform
// ------------------------------------------------------------------------
const EMAIL_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAIL_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAIL_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Check if EmailJS is properly configured
const isEmailJSConfigured = Boolean(
  EMAIL_SERVICE_ID && EMAIL_TEMPLATE_ID && EMAIL_PUBLIC_KEY
);

// Check if we have an internet connection
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Use a GET request for a small resource instead of HEAD for a more reliable check
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'GET', // Changed from HEAD to GET
      signal: controller.signal,
      mode: 'no-cors' // Use no-cors mode to avoid CORS issues
    });
    
    clearTimeout(timeoutId);
    // Check if the status code is in the success range (200-299)
    return true; // If we get here without throwing, we have a connection
  } catch (error) {
    console.log('No internet connection available', error);
    return false;
  }
};

// Send recovery email using EmailJS
export const sendRecoveryEmail = async (
  email: string, 
  recoveryCode: string
): Promise<boolean> => {
  try {
    // Check if EmailJS is properly configured
    if (!isEmailJSConfigured) {
      console.error('EmailJS not configured. Please set VITE_EMAILJS_* environment variables.');
      throw new Error('Email service not configured. Please contact support.');
    }

    // Check internet connection
    const isOnline = await checkInternetConnection();
    
    if (!isOnline) {
      throw new Error('No internet connection available to send recovery email');
    }
    
    // Template parameters (these should match your EmailJS template)
    const templateParams = {
      to_name: 'User', // Common parameter name in EmailJS templates
      to_email: email,
      recovery_code: recoveryCode,
      app_name: 'Xpense',
      valid_for: '15 minutes',
      // Adding additional parameters that might be expected by the template
      from_name: 'Xpense App',
      message: `Your recovery code is ${recoveryCode}. It will be valid for 15 minutes.`
    };
    
    console.log('Sending email to:', email, 'with code:', recoveryCode);
    
    // Make sure we log exactly what we're sending to help debug
    console.log('Template params:', JSON.stringify(templateParams));
    
    // Direct method using EmailJS with explicit recipient parameter
    const response = await emailjs.send(
      EMAIL_SERVICE_ID,
      EMAIL_TEMPLATE_ID,
      {
        // Try all common variations of recipient parameter names
        to_email: email,
        recipient: email,
        email: email,
        user_email: email,
        to: email,
        // Include the recovery code and other info
        recovery_code: recoveryCode,
        code: recoveryCode,
        message: `Your recovery code is ${recoveryCode}. It is valid for 15 minutes.`,
        app_name: 'Xpense Driver Tracker',
        from_name: 'Xpense Security',
      },
      EMAIL_PUBLIC_KEY
    );
    
    // Log the complete response
    console.log('EmailJS response:', response);
    
    if (response.status === 200) {
      console.log('Recovery email sent successfully!');
      return true;
    } else {
      throw new Error(`Failed to send email: Status ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending recovery email:', error);
    return false;
  }
};

// Initialize EmailJS (call this once when your app starts)
export const initEmailService = () => {
  if (!isEmailJSConfigured) {
    console.warn('EmailJS not configured. Email recovery features will not work.');
    return false;
  }
  
  try {
    emailjs.init(EMAIL_PUBLIC_KEY);
    console.log('EmailJS initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize EmailJS:', error);
    return false;
  }
};

// Check if email service is available
export const isEmailServiceAvailable = (): boolean => {
  return isEmailJSConfigured;
};
