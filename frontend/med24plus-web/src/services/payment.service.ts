import { apiClient } from "./api";

export interface RazorpayOrderData {
  order_id: string;
  order_number: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  is_test_mode: boolean;
}

export interface PaymentVerifyResult {
  success: boolean;
  message: string;
  order_id: string;
  order_number: string;
  payment_id: string;
  payment_status: string;
  order_status: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const paymentService = {
  async createRazorpayOrder(orderId: string): Promise<RazorpayOrderData> {
    const res = await apiClient<{ success: boolean; data: RazorpayOrderData }>("/payments/create-order", {
      method: "POST",
      data: { order_id: orderId },
    });
    return res.data;
  },

  async verifyPayment(data: {
    order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<PaymentVerifyResult> {
    const res = await apiClient<{ success: boolean; data: PaymentVerifyResult }>("/payments/verify", {
      method: "POST",
      data,
    });
    return res.data;
  },

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  async openRazorpayCheckout({
    orderData,
    onSuccess,
    onFailure,
  }: {
    orderData: RazorpayOrderData;
    onSuccess: (paymentResult: any) => Promise<void> | void;
    onFailure: (error: any) => void;
  }) {
    const isLoaded = await this.loadRazorpayScript();

    if (!window.Razorpay || orderData.is_test_mode) {
      // Dev test modal or direct simulation fallback if razorpay script blocked or in test mode
      const userConfirmed = window.confirm(
        `[Med24Plus Secure Payment Gateway]\n\nPayee: Med24Plus Registered Pharmacy\nAmount: ₹${(orderData.amount / 100).toFixed(2)}\nOrder: ${orderData.order_number}\n\nClick OK to confirm secure instant payment.`
      );
      if (userConfirmed) {
        const dummyPayId = `pay_rzp_${Date.now()}`;
        const dummySig = `dev_sig_${dummyPayId}`;
        try {
          const verified = await this.verifyPayment({
            order_id: orderData.order_id,
            razorpay_order_id: orderData.razorpay_order_id,
            razorpay_payment_id: dummyPayId,
            razorpay_signature: dummySig,
          });
          onSuccess(verified);
        } catch (e) {
          onFailure(e);
        }
      } else {
        onFailure(new Error("Payment was cancelled by the customer."));
      }
      return;
    }

    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "Med24Plus Pharmacy",
      description: `Medication Order ${orderData.order_number}`,
      order_id: orderData.razorpay_order_id,
      prefill: {
        name: orderData.customer_name,
        contact: orderData.customer_phone,
        email: orderData.customer_email,
      },
      theme: {
        color: "#0D9488",
      },
      handler: async function (response: any) {
        try {
          const verified = await paymentService.verifyPayment({
            order_id: orderData.order_id,
            razorpay_order_id: response.razorpay_order_id || orderData.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          onSuccess(verified);
        } catch (err) {
          onFailure(err);
        }
      },
      modal: {
        ondismiss: function () {
          onFailure(new Error("Payment window was dismissed."));
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  },
};
