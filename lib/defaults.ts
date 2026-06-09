import type { AddonItem, DeliveryItem, PackageTemplate, ServiceBlock, Settings } from "./types";

export const defaultSettings: Settings = {
  logoUrl: "/brand/rs-logo.svg",
  primaryColor: "#0D2A24",
  secondaryColor: "#133A33",
  backgroundColor: "#F4F2EC",
  goldColor: "#D6C3A5",
  accentColor: "#A58F68",
  headingFont: "Cormorant Garamond",
  bodyFont: "Inter",
  beautifulBeginning: "A wedding is more than an event; it is a carefully layered memory of people, places, rituals, and emotion. Our proposals are designed to preserve the atmosphere of your celebration with quiet elegance and cinematic intention.",
  whyChooseUs: "RS Weddings blends editorial composition, documentary instinct, and traditional coverage discipline. From intimate candid frames to full-family documentation, every deliverable is planned for beauty, clarity, and lasting value.",
  terms: "Booking is confirmed after advance payment. Dates are reserved on a first-confirmed basis. Travel, accommodation, permissions, venue fees, and any third-party production costs are billed as applicable. Final deliverables begin after event completion and data selection where required.",
  footer: "RS Weddings · Creating timeless memories",
  whatsappTemplate: "Hello [Client Name],\n\nThank you for considering RS Weddings.\n\nPlease find your personalized wedding proposal attached below.\n\n[PDF LINK]\n\nLooking forward to creating timeless memories together.\n\nRS Weddings Team",
};

const id = (value: string) => value;

export const defaultServices: ServiceBlock[] = [
  { id: id("service-traditional"), title: "Traditional Photography", description: "Formal family, rituals, and complete ceremony documentation.", icon: "◈", featured: true, badge: "Recommended", points: ["1 Professional Photographer", "Complete Coverage", "Family Coverage"] },
  { id: id("service-cinematic"), title: "Cinematic Videography", description: "Film-led coverage for emotions, rituals, entries, and atmosphere.", icon: "◎", featured: false, badge: "Premium", points: ["2 Professional Cinematographers", "Full event coverage", "Candid moments and rituals"] },
];

export const defaultDeliveryItems: DeliveryItem[] = [
  { id: id("delivery-film"), title: "Traditional Film", points: ["Full-length edited ceremony film", "Delivered in HD"] },
  { id: id("delivery-photos"), title: "Photos", points: ["Edited high-resolution photographs", "Private downloadable gallery"] },
  { id: id("delivery-raw"), title: "Raw Data", points: ["Complete event raw footage and images", "Delivered on storage drive"] },
];

export const defaultAddons: AddonItem[] = [
  { id: id("addon-pre-wedding"), title: "Pre Wedding Shoot", description: "Editorial portrait session planned before the wedding celebration." },
  { id: id("addon-led"), title: "LED Wall", description: "Premium display setup for live event visuals." },
  { id: id("addon-sde"), title: "Same Day Edit", description: "A beautifully cut film presented during the event." },
];

export const starterPackageTemplates: PackageTemplate[] = [
  { id: "royal-wedding", name: "Royal Wedding Package", servicesTitle: "ROYAL WEDDING PHOTOGRAPHY + CINEMATIC FILMS", services: defaultServices, deliveryItems: defaultDeliveryItems, addons: defaultAddons, usageCount: 0, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: "destination-wedding", name: "Destination Wedding Package", servicesTitle: "DESTINATION WEDDING STORYTELLING", services: defaultServices.map((service) => ({ ...service, featured: true })), deliveryItems: defaultDeliveryItems, addons: [...defaultAddons, { id: "addon-drone", title: "Drone Coverage", description: "Aerial establishing visuals and venue storytelling." }], usageCount: 0, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
];
