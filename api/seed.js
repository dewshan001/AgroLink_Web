const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Crop = require("./models/Crop");
const Disease = require("./models/Disease");
const Article = require("./models/Article");

dotenv.config();

const seedData = async () => {
    try {
        // 1. Connect to Database
        await mongoose.connect(process.env.MONGO_URL);

        console.log("Connected to MongoDB for seeding...");

        // 2. Clear Existing Data
        await Crop.deleteMany({});
        await Disease.deleteMany({});
        await Article.deleteMany({});
        console.log("Cleared existing Crops, Diseases, and Articles.");

        // 3. Create Crops
        const tomato = await new Crop({ name: "Tomato" }).save();
        const paddy = await new Crop({ name: "Paddy" }).save();
        const papaya = await new Crop({ name: "Papaya" }).save();
        console.log("Seeded Crops: Tomato, Paddy, Papaya.");

        // 4. Create Diseases
        const earlyBlight = await new Disease({
            diseaseName: "Early Blight",
            aiModelLabel: "tomato-early-blight",
            cropId: tomato._id,
        }).save();

        const riceBlast = await new Disease({
            diseaseName: "Rice Blast",
            aiModelLabel: "paddy-blast",
            cropId: paddy._id,
        }).save();

        const ringSpot = await new Disease({
            diseaseName: "Papaya Ringspot",
            aiModelLabel: "papaya-ringspot",
            cropId: papaya._id,
        }).save();
        console.log("Seeded Diseases: Early Blight, Rice Blast, Papaya Ringspot.");

        // 5. Create Articles
        await new Article({
            title: "Managing Early Blight in Tomato Crops",
            symptoms: [
                "Dark, concentric spots on older leaves",
                "Foliage yellowing around lesions",
                "Stem lesions near the soil line (collar rot)",
                "Sunken spots on the stem end of fruits",
            ],
            preventionMethods: [
                "Use high-quality, disease-free seeds",
                "Maintain a 3-year crop rotation without Solanaceous crops",
                "Ensure proper spacing for air circulation",
                "Avoid overhead irrigation to keep leaves dry",
            ],
            treatmentPlan: "Remove infected lower leaves immediately. Apply fungicides containing chlorothalonil or copper-based sprays every 7-10 days if environmental conditions favor the disease.",
            imageUrl: "/images/tomato.jpg",
            diseaseId: earlyBlight._id,
        }).save();

        await new Article({
            title: "Combating Rice Blast (Magnaporthe oryzae)",
            symptoms: [
                "Spindle-shaped lesions with brown borders and gray centers",
                "Neck rot leading to sterile or broken panicles",
                "Brownish spots on the nodes of the stem",
                "Reduced grain filling and stunted growth",
            ],
            preventionMethods: [
                "Plant resistant rice varieties",
                "Avoid excessive Nitrogen fertilization",
                "Keep the water level consistent in paddy fields",
                "Treat seeds with recommended fungicides before planting",
            ],
            treatmentPlan: "Apply systemic fungicides like Tricyclazole or Carbendazim at the first sign of leaf blast or before the panicle emergence (booting stage).",
            imageUrl: "/images/Rice.png",
            diseaseId: riceBlast._id,
        }).save();

        await new Article({
            title: "Identifying and Preventing Papaya Ringspot Virus",
            symptoms: [
                "Yellowing and vein clearing in young leaves",
                "Severe mosaic or mottling on foliage",
                "Dark green 'water-soaked' streaks on stems and petioles",
                "Circular C-shaped rings on fruit skin",
            ],
            preventionMethods: [
                "Eradicate infected trees immediately to prevent spread",
                "Control aphid populations using insecticidal soaps",
                "Intercrop with non-host plants to confuse insects",
                "Use PRSV-resistant varieties (like SunUp or Rainbow)",
            ],
            treatmentPlan: "There is no chemical cure for the virus itself. Management focus must be on preventing transmission through aphid control and removing any source of infection from the field.",
            imageUrl: "/images/papaya.jpg",
            diseaseId: ringSpot._id,
        }).save();
        console.log("Seeded Articles successfully with high-res images.");

        console.log("Data seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding Error:", err);
        process.exit(1);
    }
};

seedData();
