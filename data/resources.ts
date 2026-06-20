export interface ResourceInterface {
  id: string;
  name: string;
  image: string;
  status: "Available" | "Maintenance" | "Booked";
  category: "Academic" | "Research" | "Public" | "Facilities";
  location: string;
  capacity: number;
  features: string[];
  tags: string[];
  description: string;
}

export const resourcesData: ResourceInterface[] = [
  {
    id: "res-1",
    name: "Main Auditorium",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2000&auto=format&fit=crop",
    status: "Available",
    category: "Academic",
    location: "Block A, 1st Floor",
    capacity: 500,
    features: ["WiFi", "Projector", "AC", "Audio System", "Stage Light"],
    tags: ["AV System", "VIP Seating", "Accessible"],
    description: "The Main Auditorium is a state-of-the-art facility designed for large lectures, guest speakers, and university-wide events. It features tiered seating for optimal viewing and a professional-grade acoustic layout."
  },
  {
    id: "res-2",
    name: "Advanced Chemistry Lab",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2000&auto=format&fit=crop",
    status: "Maintenance",
    category: "Research",
    location: "Science Wing, Room 302",
    capacity: 40,
    features: ["Fume Hoods", "Gas Lines", "Safety Showers", "AC"],
    tags: ["Hazardous Materials", "Ventilation", "Lockers"],
    description: "Equipped with the latest safety and research technologies, this lab is suited for upper-level chemistry practicals and graduate-level biomedical research. Please adhere to safety protocols."
  },
  {
    id: "res-3",
    name: "Innovation Hub & Makerspace",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2000&auto=format&fit=crop",
    status: "Available",
    category: "Public",
    location: "Library Annex, Ground Floor",
    capacity: 80,
    features: ["WiFi", "Whiteboards", "3D Printers", "Workbenches", "AC"],
    tags: ["Collaborative", "Tech Setup", "24/7 Access"],
    description: "An open workspace for creative minds. Students and faculty can collaborate on engineering, robotics, and design projects. Tools and hardware available upon request."
  },
  {
    id: "res-4",
    name: "Conference Room Alpha",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop",
    status: "Booked",
    category: "Facilities",
    location: "Main Admin Building, 2nd Floor",
    capacity: 15,
    features: ["WiFi", "Smart Board", "Video Conferencing", "AC"],
    tags: ["Executive", "Soundproof", "Refreshments"],
    description: "A premium enclosed space ideal for faculty meetings, thesis defenses, or remote academic collaborations."
  },
  {
    id: "res-5",
    name: "Computer Science Lab 1",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2000&auto=format&fit=crop",
    status: "Available",
    category: "Academic",
    location: "Engineering Block, Room 101",
    capacity: 60,
    features: ["High-End PCs", "Dual Monitors", "WiFi", "AC"],
    tags: ["Development", "AI/ML Ready", "Software Pre-installed"],
    description: "A dedicated computer lab featuring top-tier workstations configured for software engineering, data science, and graphic rendering."
  },
  {
    id: "res-6",
    name: "Sports Complex & Gym",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop",
    status: "Available",
    category: "Facilities",
    location: "Campus West",
    capacity: 200,
    features: ["Lockers", "Showers", "Weight Racks", "Cardio Machines"],
    tags: ["Recreational", "Student Health", "Cardio"],
    description: "Indoor sports complex with a fully equipped gymnasium, basketball court, and shower facilities for student and staff well-being."
  }
];
