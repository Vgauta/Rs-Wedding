export type MediaCategory =
  | "Wedding"
  | "Pre Wedding"
  | "Reception"
  | "Haldi"
  | "Mehendi"
  | "Engagement"
  | "Drone"
  | "Cinematic"
  | "Candid";

export type PdfTemplate = "Luxury Editorial" | "Magazine Style" | "Minimal Elegant" | "Premium Dark Theme";
export type GalleryLayout = "Editorial Layout" | "Masonry Layout" | "Premium Grid" | "Story Layout" | "Showcase Layout";
export type CoverStyle = "Full Screen Hero Image" | "Split Layout" | "Magazine Cover" | "Luxury Minimal";

export type ServiceBlock = {
  id: string;
  title: string;
  description?: string;
  points: string[];
  icon?: string;
  featured?: boolean;
  badge?: string;
};

export type DeliveryItem = { id: string; title: string; points: string[] };
export type AddonItem = { id: string; title: string; description?: string };

export type MediaAsset = {
  id: string;
  url: string;
  name: string;
  category: MediaCategory;
  alt?: string;
  sortOrder: number;
  createdAt: string;
};

export type PackageTemplate = {
  id: string;
  name: string;
  servicesTitle: string;
  services: ServiceBlock[];
  deliveryItems: DeliveryItem[];
  addons: AddonItem[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
};

export type ProposalPayload = {
  clientName: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  whatsappNumber: string;
  servicesTitle: string;
  services: ServiceBlock[];
  deliveryItems: DeliveryItem[];
  addons: AddonItem[];
  pdfTemplate: PdfTemplate;
  coverStyle: CoverStyle;
  galleryLayout: GalleryLayout;
  showcaseImageCount: 1 | 2 | 4 | 6 | 8;
  selectedMediaIds: string[];
  includeClientStory: boolean;
  welcomeMessage: string;
  packageTemplateId?: string;
};

export type Settings = {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  goldColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  beautifulBeginning: string;
  whyChooseUs: string;
  terms: string;
  footer: string;
  whatsappTemplate: string;
};

export type DashboardStats = {
  totalProposals: number;
  mostUsedPackage: string;
  recentProposals: Array<{ id: string; clientName: string; brideName: string; groomName: string; pdfUrl: string; createdAt: string }>;
  recentClients: Array<{ clientName: string; whatsappNumber: string; createdAt: string }>;
};
