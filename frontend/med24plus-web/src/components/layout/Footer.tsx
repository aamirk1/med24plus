import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ShieldCheck, Phone, Mail, MapPin, FileText, CheckCircle2, Clock } from "lucide-react";

export const Footer: React.FC = () => {
  return (
              <footer className="bg-[#172B24] text-slate-300 text-xs border-t border-slate-800">
                {/* Top Value Assurance Grid */}
                <div className="border-b border-slate-800/80 py-8">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-xs">100% Genuine Medicines</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Directly sourced from licensed pharmaceutical distributors.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-xs">Registered Pharmacist Vetted</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Prescriptions verified by Pharmacy Council registered pharmacists.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-xs">GST & Batch Cash Memo</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Form 20 compliant retail invoice with batch numbers & expiries.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-xs">Cold-Chain Assured</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Temperature-monitored courier boxes for sensitive insulins.</p>
                      </div>
                    </div>
                  </div>
                </div>

                          {/* Main Footer Links */}
                          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                              {/* Col 1 & 2: Brand & Compliance Declaration */}
                              <div className="lg:col-span-2 space-y-4">
                                <BrandLogo />
                                <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                                  Med24Plus is a licensed single retail community pharmacy operating in India under the Drugs and Cosmetics Act, 1940 and Drugs and Cosmetics Rules, 1945.
                                </p>

                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-300">
                                  <p className="font-semibold text-white">Statutory Drug License Credentials:</p>
                                  <p>Retail Drug License (Form 20): <span className="font-mono text-teal-400">KA-BLR-20B-849201</span></p>
                                  <p>Retail Drug License (Form 21): <span className="font-mono text-teal-400">KA-BLR-21B-849202</span></p>
                                  <p>GSTIN: <span className="font-mono text-teal-400">29AABCM9482Q1Z8</span></p>
                                  <p>Supervising Pharmacist: <span className="text-slate-200">Ramesh Sharma (PCI-REG-94821)</span></p>
                                </div>
                              </div>

                              {/* Col 3: Quick Navigation */}
                              <div className="space-y-3">
                                <h5 className="text-white font-semibold text-xs tracking-wider uppercase">Pharmacy Catalog</h5>
                                <ul className="space-y-2 text-slate-400 text-xs">
                                  <li><Link href="/products" className="hover:text-white transition">All Medicines</Link></li>
                                  <li><Link href="/categories/diabetes-care" className="hover:text-white transition">Diabetes Care</Link></li>
                                  <li><Link href="/categories/cardiac-care" className="hover:text-white transition">Cardiac & BP</Link></li>
                                  <li><Link href="/categories/vitamins-supplements" className="hover:text-white transition">Vitamins & Supplements</Link></li>
                                  <li><Link href="/categories/ayurveda-herbal" className="hover:text-white transition">Ayurveda & Herbal</Link></li>
                                  <li><Link href="/prescription/upload" className="text-teal-400 font-semibold hover:underline">Upload Doctor Prescription</Link></li>
                                </ul>
                              </div>

                              {/* Col 4: Legal & Policies */}
                              <div className="space-y-3">
                                <h5 className="text-white font-semibold text-xs tracking-wider uppercase">Legal & Compliance</h5>
                                <ul className="space-y-2 text-slate-400 text-xs">
                                  <li><Link href="/legal/prescription-policy" className="hover:text-white transition">Prescription (Rule 65) Policy</Link></li>
                                  <li><Link href="/legal/terms" className="hover:text-white transition">Terms & Conditions of Sale</Link></li>
                                  <li><Link href="/legal/privacy" className="hover:text-white transition">Patient Privacy Policy</Link></li>
                                  <li><Link href="/delete-account" className="text-rose-400 hover:text-rose-300 transition font-medium">Delete Account &amp; Data</Link></li>
                                  <li><Link href="/about" className="hover:text-white transition">About Our Registered Pharmacy</Link></li>
                                  <li><Link href="/contact" className="hover:text-white transition">Grievance Officer & Contacts</Link></li>
                                </ul>
                              </div>

                              {/* Col 5: Registered Pharmacy Location */}
                              <div className="space-y-3">
                                <h5 className="text-white font-semibold text-xs tracking-wider uppercase">Retail Pharmacy Unit</h5>
                                <div className="space-y-2.5 text-slate-400 text-xs">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                                    <p>No. 42, 80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka - 560034</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#0D9488] shrink-0" />
                                    <span>+91 80 4123 4567</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#0D9488] shrink-0" />
                                    <span>care@med24plus.in</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Bar */}
                          <div className="border-t border-slate-800/80 py-4 bg-slate-950/60">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
                              <p>© {new Date().getFullYear()} Med24Plus Healthcare Pvt. Ltd. All rights reserved.</p>
                              <p>Schedule H & H1 drugs dispensed exclusively against valid Registered Medical Practitioner prescriptions.</p>
                            </div>
                          </div>
                        </footer>
                        );
};
