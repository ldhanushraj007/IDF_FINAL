import { RAZORPAY, BUSINESS } from './constants';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  amount: number; // in paise
  orderId: string; // Razorpay order_id
  name?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (res: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(opts: RazorpayOptions) {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Razorpay SDK failed to load. Please check your network connection.');
  }

  const key = RAZORPAY.keyId;
  if (!key) {
    throw new Error('Razorpay Key ID is missing in configuration.');
  }

  const options: any = {
    key: key,
    amount: opts.amount,
    currency: 'INR',
    name: opts.name || BUSINESS.name,
    description: opts.description || 'Order Payment',
    handler: function (response: RazorpaySuccessResponse) {
      opts.onSuccess(response);
    },
    prefill: {
      name: opts.customerName || '',
      email: opts.customerEmail || '',
      contact: opts.customerPhone || '',
    },
    theme: {
      color: '#1F0505',
    },
    modal: {
      ondismiss: function () {
        if (opts.onDismiss) {
          opts.onDismiss();
        }
      },
    },
  };

  if (opts.orderId && opts.orderId.startsWith('order_')) {
    options.order_id = opts.orderId;
  }

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (response: any) {
    if (opts.onError) {
      opts.onError(response.error);
    }
  });
  rzp.open();
}
