import React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ShieldCheck, Lock, Trash2, Mail, FileText, Bell } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <Breadcrumb
        items={[
          { label: "Legal", href: "/legal/terms" },
          { label: "Privacy Policy" },
        ]}
      />

      {/* Header Banner */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#087F5B] mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Google Play & Statutory Healthcare Compliance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#172B24] tracking-tight">
          Med24Plus Privacy Policy & Data Protection
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          <strong>Application:</strong> Med24Plus (Package ID: <code>com.technosolz.med24plus</code>) • <strong>Developer:</strong> Technosolz • <strong>Last Updated:</strong> November 19, 2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
        {/* Overview */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-950 text-xs">
          <p className="font-semibold mb-1">Executive Summary for Patients and Reviewers:</p>
          <p>
            Med24Plus is a licensed community pharmacy application operated by Technosolz under the Drugs and Cosmetics Act, 1940 and Rules, 1945, and compliant with the Digital Personal Data Protection (DPDP) Act, 2023. We do not sell patient data, track users across third-party websites, or use health records for targeted marketing.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#172B24] flex items-center gap-2">
            <span>1. Information We Collect and Process</span>
          </h2>
          <p>
            To provide safe online pharmacy services and verify doctor prescriptions, Med24Plus collects the following categories of data:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-600">
            <li>
              <strong>Personal Contact Information:</strong> Patient name, verified mobile phone number, optional email address, and delivery street address with postal pincode.
            </li>
            <li>
              <strong>Sensitive Health Data (Prescriptions):</strong> Uploaded doctor prescription images, prescribing doctor registration details, medication names, dosage instructions, and patient age/gender for pharmacological safety verification.
            </li>
            <li>
              <strong>Order & Dispensing History:</strong> Tax invoice records, batch numbers, manufacturer details, and delivery fulfillment timestamps.
            </li>
            <li>
              <strong>Technical & Device Identifiers:</strong> Firebase Cloud Messaging (FCM) device registration tokens for push notifications, operating system version, and IP address for secure session management.
            </li>
          </ul>
        </section>

        {/* 2. Device Permissions */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#172B24] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#087F5B]" />
            <span>2. Device Permissions and Purpose</span>
          </h2>
          <p>
            The Med24Plus Android application requests only the minimum necessary permissions required for medical dispensing:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <p className="font-bold text-[#172B24]">POST_NOTIFICATIONS (Android 13+)</p>
              <p className="text-slate-600 mt-1">
                Used solely to notify you about critical order status changes, Schedule H prescription verification decisions by registered pharmacists, and delivery dispatch updates.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <p className="font-bold text-[#172B24]">INTERNET & ACCESS_NETWORK_STATE</p>
              <p className="text-slate-600 mt-1">
                Used to establish secure TLS/HTTPS encrypted connections to pharmacy cloud servers and the Firebase infrastructure.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <p className="font-bold text-[#172B24]">Camera & Storage Access</p>
              <p className="text-slate-600 mt-1">
                Requested on-demand only when you choose to take a photo or select an image of your physical doctor prescription slip to upload.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <p className="font-bold text-[#172B24]">RECEIVE_BOOT_COMPLETED & VIBRATE</p>
              <p className="text-slate-600 mt-1">
                Ensures urgent medication delivery alerts and critical pharmacist verification notifications are received reliably.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Third-Party Services */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#172B24] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#087F5B]" />
            <span>3. Third-Party Services & SDKs</span>
          </h2>
          <p>
            We integrate trusted third-party SDKs that process limited data strictly on our behalf:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-600">
            <li>
              <strong>Google Firebase Cloud Messaging (FCM):</strong> Delivers encrypted order and prescription status push notifications. (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">Google Privacy Policy</a>)
            </li>
            <li>
              <strong>Google Firebase Phone Authentication:</strong> Delivers instant SMS verification codes for passwordless, secure patient sign-in.
            </li>
            <li>
              <strong>Google Firebase Cloud Storage:</strong> Stores encrypted prescription images in private buckets accessible only by licensed pharmacy staff.
            </li>
          </ul>
        </section>

        {/* 4. Sensitive Health Data Security */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#172B24] flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#087F5B]" />
            <span>4. Security & Sensitive Health Data Protection</span>
          </h2>
          <p>
            In compliance with Google Play&apos;s Health Apps Policy and the DPDP Act 2023:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-600">
            <li><strong>Encryption in Transit:</strong> All communications between the mobile application and backend APIs are encrypted using modern Transport Layer Security (TLS 1.3 / HTTPS).</li>
            <li><strong>Encryption at Rest:</strong> All stored patient records, authentication tokens in <code>flutter_secure_storage</code>, and prescription images are encrypted with AES-256.</li>
            <li><strong>Access Controls:</strong> Prescription documents are accessible strictly by licensed Registered Pharmacists with active Pharmacy Council of India (PCI) credentials.</li>
            <li><strong>No Commercial Monetization:</strong> We never sell, rent, monetize, or trade patient health records, diagnostic files, or prescription details to third parties, brokers, or advertisers.</li>
          </ul>
        </section>

        {/* 5. Account and Data Deletion (Google Play Mandate) */}
        <section className="space-y-2 border-2 border-rose-200 bg-rose-50/50 rounded-xl p-4">
          <h2 className="text-lg font-bold text-rose-950 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <span>5. Account Deletion and Data Retention Policy</span>
          </h2>
          <p className="text-xs text-slate-700">
            Med24Plus complies with Google Play&apos;s Account Deletion Policy. You have the permanent right to delete your patient account and request the deletion of all associated personal data at any time.
          </p>
          <div className="space-y-2 pt-2 text-xs">
            <p className="font-semibold text-[#172B24]">How to request account deletion:</p>
            <ol className="list-decimal list-inside space-y-1 pl-2 text-slate-600">
              <li><strong>Online Web Portal:</strong> You can submit a deletion request directly at our dedicated <Link href="/delete-account" className="text-rose-700 font-semibold underline">Account Deletion Page</Link> without needing to sign in.</li>
              <li><strong>In-App:</strong> Open the Med24Plus mobile application, navigate to <strong>Profile &gt; Account Settings &gt; Delete Account &amp; Data</strong>, and confirm your request.</li>
              <li>
                <strong>Online Request:</strong> Email our dedicated Privacy &amp; Grievance Officer at{" "}
                <a href="mailto:privacy@med24plus.in?subject=Account%20and%20Data%20Deletion%20Request" className="text-emerald-700 font-medium underline">
                  privacy@med24plus.in
                </a>{" "}
                with your registered mobile phone number.
              </li>
            </ol>
            <p className="font-semibold text-[#172B24] pt-2">Data Deletion Timeline &amp; Statutory Exceptions:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li>
                <strong>Deleted within 30 days:</strong> Your user profile, phone number, credentials, saved delivery addresses, push notification tokens, and session histories.
              </li>
              <li>
                <strong>Statutory Pharmacy Retention Exception:</strong> Under Rule 65 of the Drugs and Cosmetics Rules, 1945 (India), records of dispensed Schedule H, H1, and X medicines (including cash memo counterfoils and doctor prescription verification logs) must be retained for a mandatory statutory audit period of 2 years before permanent cryptographic purging.
              </li>
            </ul>
          </div>
        </section>

        {/* 6. Children's Privacy */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#172B24]">6. Children&apos;s Privacy</h2>
          <p className="text-xs text-slate-600">
            Med24Plus is designed for adults authorized to order prescription medications. We do not knowingly solicit or collect personal information from individuals under the age of 18 without parental or legal guardian supervision.
          </p>
        </section>

        {/* 7. Contact & Grievance Redressal */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#172B24] flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#087F5B]" />
            <span>7. Grievance Officer &amp; Regulatory Contact</span>
          </h2>
          <p className="text-xs text-slate-600">
            For privacy inquiries, data deletion requests, or regulatory questions, contact our designated Grievance Officer:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 space-y-1">
            <p><strong>Entity:</strong> Med24Plus Central Pharmacy (Technosolz)</p>
            <p><strong>Grievance Officer:</strong> Ramesh Sharma (PCI-REG-94821)</p>
            <p><strong>Address:</strong> Ground Floor, Health Horizon Hub, Koramangala 4th Block, Bengaluru, Karnataka - 560001, India</p>
            <p><strong>Support &amp; Privacy Email:</strong> <a href="mailto:care@med24plus.in" className="text-emerald-700 underline">care@med24plus.in</a> / <a href="mailto:privacy@med24plus.in" className="text-emerald-700 underline">privacy@med24plus.in</a></p>
            <p><strong>Helpline:</strong> +91 8000 124 247</p>
          </div>
        </section>
      </div>
    </div>
  );
}
