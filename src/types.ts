export interface PortalConfig {
  brandName: string;
  brandSubtitle: string;
  announcementText: string;
  logoUrl: string;
  qrImageUrl: string;
  qrMerchantName: string;
  qrMerchantId: string;
  videoUrl: string;
  videoTitle: string;
  videoBanglaDesc: string;
  supportPhone: string;
  supportTelegram: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PaymentInstruction {
  id?: string;
  stepNumber: number;
  title: string;
  description: string;
  iconName?: string;
  badgeText?: string;
}

export interface PortalFAQ {
  id?: string;
  question: string;
  answer: string;
  order: number;
}

export interface PaymentConfirmation {
  id?: string;
  trxId: string;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Other';
  amount: number;
  senderPhone: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
}

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAdmin: boolean;
}
