import {
  Users,
  Sprout,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const MOCK_STATS = [
  { title: "Total Users", value: "1,240", change: "+12%", icon: Users, color: "bg-blue-500" },
  { title: "Active Listings", value: "856", change: "+5%", icon: Sprout, color: "bg-green-500" },
  { title: "Pending Blogs", value: "24", change: "-2%", icon: FileText, color: "bg-yellow-500" },
  { title: "Disease Reports", value: "142", change: "+18%", icon: AlertTriangle, color: "bg-red-500" },
];

export const MOCK_USERS = [
  { id: "U001", name: "R.D. Dayawansa", role: "Farmer", status: "Active", location: "Malabe", joinDate: "2025-01-15" },
  { id: "U002", name: "Kamal Perera", role: "Expert", status: "Active", location: "Kandy", joinDate: "2025-02-10" },
  { id: "U003", name: "Saman Kumara", role: "Farmer", status: "Inactive", location: "Galle", joinDate: "2025-03-05" },
  { id: "U004", name: "Nimali Silva", role: "Farmer", status: "Active", location: "Kurunegala", joinDate: "2025-03-12" },
  { id: "U005", name: "Dr. A. Banadara", role: "Expert", status: "Active", location: "Colombo", joinDate: "2024-11-20" },
];

export const MOCK_BLOGS = [
  {
    id: "B001",
    title: "Best Practices for Paddy Cultivation",
    excerpt: "Learn the modern techniques for maximizing paddy yield during the Yala season with minimal water usage...",
    author: "R.D. Dayawansa",
    category: "Cultivation",
    status: "Pending",
    date: "2 hrs ago",
    likes: 12,
    comments: 4,
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=150&h=150&fit=crop"
  },
  {
    id: "B002",
    title: "Identifying Blight in Tomatoes",
    excerpt: "Early detection of blight can save your entire harvest. Here are the key symptoms to look for on leaves...",
    author: "Kamal Perera",
    category: "Disease Control",
    status: "Approved",
    date: "1 day ago",
    likes: 45,
    comments: 12,
    image: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e10?w=150&h=150&fit=crop"
  },
  {
    id: "B003",
    title: "Organic Fertilizer Tips",
    excerpt: "Make your own compost at home using kitchen waste and dry leaves. A step-by-step guide for beginners...",
    author: "Nimali Silva",
    category: "Organic",
    status: "Rejected",
    date: "3 days ago",
    likes: 0,
    comments: 0,
    image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=150&h=150&fit=crop"
  },
  {
    id: "B004",
    title: "Water Management in Dry Zones",
    excerpt: "Efficient irrigation systems are crucial for dry zone farming. We explore drip irrigation vs sprinkler systems...",
    author: "Saman Kumara",
    category: "Irrigation",
    status: "Pending",
    date: "5 hrs ago",
    likes: 8,
    comments: 2,
    image: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=150&h=150&fit=crop"
  },
  {
    id: "B005",
    title: "Understanding Soil pH Levels",
    excerpt: "Why your crops might be failing despite good fertilizer. The hidden impact of soil acidity.",
    author: "Dr. A. Banadara",
    category: "Soil Science",
    status: "Pending",
    date: "6 hrs ago",
    likes: 22,
    comments: 8,
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=150&h=150&fit=crop"
  },
];

export const MOCK_DISEASES = [
  { id: "D001", name: "Late Blight", crop: "Potato", severity: "High", reports: 45 },
  { id: "D002", name: "Powdery Mildew", crop: "Cucumber", severity: "Medium", reports: 32 },
  { id: "D003", name: "Leaf Spot", crop: "Spinach", severity: "Low", reports: 12 },
];

export const MOCK_LISTINGS = [
  {
    id: "L001",
    title: "Organic Tomatoes",
    seller: "R.D. Dayawansa",
    category: "Vegetables",
    price: "Rs. 450/kg",
    stock: "50 kg",
    status: "Active",
    date: "2 hrs ago",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=150&h=150&fit=crop"
  },
  {
    id: "L002",
    title: "Samba Rice (Yala Season)",
    seller: "Saman Kumara",
    category: "Grains",
    price: "Rs. 220/kg",
    stock: "500 kg",
    status: "Pending",
    date: "5 hrs ago",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&h=150&fit=crop"
  },
  {
    id: "L003",
    title: "Homemade Compost Fertilizer",
    seller: "Nimali Silva",
    category: "Fertilizer",
    price: "Rs. 1500/bag",
    stock: "20 bags",
    status: "Rejected",
    date: "1 day ago",
    image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=150&h=150&fit=crop"
  },
  {
    id: "L004",
    title: "Fresh Carrot",
    seller: "Kamal Perera",
    category: "Vegetables",
    price: "Rs. 380/kg",
    stock: "100 kg",
    status: "Active",
    date: "2 days ago",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=150&h=150&fit=crop"
  }
];