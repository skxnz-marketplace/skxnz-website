// Auto-generated from project-data/source-sheets/SKXNZ_MASTER_STORE_DATABASE_FINAL.xlsx

export type CarouselSlide = {
  id: string;
  carouselName: string;
  title: string;
  subtitle: string;
  image: string;
  mobileImage: string;
  sourceImageFileName: string;
  buttonText: string;
  buttonLink: string;
  displayOrder: number;
  status: string;
  dataSource: "sheet";
};

export const carouselSlides: CarouselSlide[] = [
  {
    "id": "car-001",
    "carouselName": "Homepage Main Carousel",
    "title": "WEAR THE SIGNAL.",
    "subtitle": "Future-forward drops. AI-curated. Globally delivered.",
    "image": "/assets/home/hero/wear-the-signal.png",
    "mobileImage": "/assets/home/hero/wear-the-signal.png",
    "sourceImageFileName": "carousel-wear-the-signal.png",
    "buttonText": "SHOP THE FUTURE",
    "buttonLink": "/shop",
    "displayOrder": 1,
    "status": "Active",
    "dataSource": "sheet"
  },
  {
    "id": "car-002",
    "carouselName": "Homepage Main Carousel",
    "title": "CHROME HORIZONS.",
    "subtitle": "Liquid-metal essentials built for high-signal wardrobes.",
    "image": "/assets/home/hero/new-season-picks.png",
    "mobileImage": "/assets/home/hero/new-season-picks.png",
    "sourceImageFileName": "carousel-new-season.png",
    "buttonText": "EXPLORE DROPS",
    "buttonLink": "/shop?q=chrome",
    "displayOrder": 2,
    "status": "Active",
    "dataSource": "sheet"
  },
  {
    "id": "car-003",
    "carouselName": "Homepage Main Carousel",
    "title": "AI STYLED FUTURE.",
    "subtitle": "Sharper discovery for futurewear, streetwear, and statement pieces.",
    "image": "/assets/home/hero/ai-styled-fits.png",
    "mobileImage": "/assets/home/hero/ai-styled-fits.png",
    "sourceImageFileName": "carousel-ai-styled.png",
    "buttonText": "TRY STYLING",
    "buttonLink": "/ai-stylist",
    "displayOrder": 3,
    "status": "Active",
    "dataSource": "sheet"
  }
];
