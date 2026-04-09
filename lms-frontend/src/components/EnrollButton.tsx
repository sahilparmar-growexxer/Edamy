"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createCourseOrder, verifyCoursePayment } from "@/lib/api";
import { getDefaultRouteForRole, readStoredUser } from "@/lib/auth";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type EnrollButtonProps = {
  courseId: string;
  redirectUrl?: string | null;
};

export function EnrollButton({ courseId, redirectUrl }: EnrollButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resolveRedirectUrl(apiRedirect?: string | null) {
    return apiRedirect ?? redirectUrl ?? null;
  }

  async function loadRazorpayScript() {
    if (typeof window === "undefined") return false;
    if (window.Razorpay) return true;

    return await new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  function handleEnrollmentSuccess(payload: {
    message: string;
    redirectUrl: string | null;
  }) {
    toast.success(payload.message || "Enrolled successfully. Your course is ready.");

    const nextUrl = resolveRedirectUrl(payload.redirectUrl);
    const currentUser = readStoredUser();
    const myCoursesRoute = currentUser ? getDefaultRouteForRole(currentUser) : "/my-courses";

    router.prefetch(myCoursesRoute);

    if (nextUrl) {
      window.location.assign(nextUrl);
      return;
    }

    router.push(myCoursesRoute);
    router.refresh();
  }

  async function handleEnroll() {
    const currentUser = readStoredUser();

    if (!currentUser) {
      toast("Please sign in to enroll in a course.");
      router.push("/login");
      return;
    }

    if (currentUser.role !== "student") {
      toast.error("Only students can enroll in courses.");
      return;
    }

    if (!currentUser.email?.trim() || !currentUser.mobileNumber?.trim()) {
      toast.error("Please register your email and mobile number before enrolling.");
      router.push("/account");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderResponse = await createCourseOrder(courseId, currentUser._id);

      if (orderResponse.status !== "order_created") {
        handleEnrollmentSuccess({
          message: orderResponse.message,
          redirectUrl: orderResponse.redirectUrl ?? null,
        });
        setIsSubmitting(false);
        return;
      }

      const scriptReady = await loadRazorpayScript();

      if (!scriptReady || !window.Razorpay) {
        throw new Error("Razorpay SDK failed to load.");
      }

      const razorpay = new window.Razorpay({
        key: orderResponse.keyId,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: "GreatStack LMS",
        description: `Enroll in ${orderResponse.courseTitle}`,
        order_id: orderResponse.orderId,
        prefill: {
          name: currentUser.name,
          email: currentUser.email ?? undefined,
          contact: currentUser.mobileNumber ?? undefined,
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
        handler: async (response) => {
          try {
            const verifyResponse = await verifyCoursePayment(courseId, {
              studentId: currentUser._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            handleEnrollmentSuccess({
              message: verifyResponse.message,
              redirectUrl: verifyResponse.redirectUrl ?? null,
            });
          } catch (verifyError) {
            toast.error(
              verifyError instanceof Error
                ? verifyError.message
                : "Payment verification failed.",
            );
          } finally {
            setIsSubmitting(false);
          }
        },
      });

      razorpay.on("payment.failed", (response) => {
        toast.error(response.error?.description ?? "Payment failed. Please try again.");
        setIsSubmitting(false);
      });

      razorpay.open();
    } catch (enrollError) {
      toast.error(
        enrollError instanceof Error ? enrollError.message : "Could not enroll in this course.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleEnroll}
      disabled={isSubmitting}
      className="secondary-btn w-full disabled:opacity-70"
    >
      {isSubmitting ? "Enrolling..." : "Enroll course"}
    </button>
  );
}
